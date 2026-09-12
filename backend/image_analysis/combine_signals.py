"""Layer 5 Signal Combiner — Aggregates B3a, B3b, and B3c quality, style, and amenity signals.

Produces a single feature vector per image or per listing for downstream consumption by:
  - Module C (Price Plausibility Regressor)
  - Module D (Compliance RAG)
"""

from pathlib import Path
from typing import Dict, List, Optional, Union
from PIL import Image

from style_tier import classify_style_tier
from aesthetic_score import score_aesthetic
from furniture_detector import detect_furniture, DEFAULT_EXPECTED_AMENITIES


def combine_for_image(
    image: Union[Image.Image, str, Path],
    expected_amenities: Optional[List[str]] = None,
) -> dict:
    """Run B3a, B3b, B3c on a single image and merge into a feature vector.

    Resilience note:
        If any individual sub-module fails, its fields are set to None and the error
        is captured under an 'errors' key, allowing partial results to be returned safely.

    Args:
        image: A PIL Image instance or file path.
        expected_amenities: Optional list of expected amenity class names.

    Returns:
        dict: {
            "style_tier": "luxury" | "budget" | None,
            "style_confidence": float | None,
            "aesthetic_score": float | None,
            "detected_objects": {"bed": 1, ...} | None,
            "amenity_completeness_score": float | None,
            "errors": [str] (only present if errors occurred)
        }
    """
    errors: List[str] = []

    # 1. B3a Style Tier
    try:
        res_style = classify_style_tier(image)
        style_tier = res_style.get("style_tier")
        style_confidence = res_style.get("style_confidence")
    except Exception as e:
        style_tier = None
        style_confidence = None
        errors.append(f"style_tier: {str(e)}")

    # 2. B3b Aesthetic Score
    try:
        res_aesthetic = score_aesthetic(image)
        aesthetic_score = res_aesthetic.get("aesthetic_score")
    except Exception as e:
        aesthetic_score = None
        errors.append(f"aesthetic_score: {str(e)}")

    # 3. B3c Furniture Detector
    try:
        res_furniture = detect_furniture(image, expected_amenities=expected_amenities)
        detected_objects = res_furniture.get("detected_objects")
        amenity_completeness_score = res_furniture.get("amenity_completeness_score")
    except Exception as e:
        detected_objects = None
        amenity_completeness_score = None
        errors.append(f"furniture_detector: {str(e)}")

    result = {
        "style_tier": style_tier,
        "style_confidence": style_confidence,
        "aesthetic_score": aesthetic_score,
        "detected_objects": detected_objects,
        "amenity_completeness_score": amenity_completeness_score,
    }

    if errors:
        result["errors"] = errors

    return result


def combine_for_listing(
    images: List[Union[Image.Image, str, Path]],
    expected_amenities: Optional[List[str]] = None,
) -> dict:
    """Run combine_for_image on each image and aggregate signals across a listing.

    Aggregation Rules:
      - style_tier: Majority vote across images (ties resolve to 'luxury').
      - style_confidence: Mean of per-image confidences.
      - aesthetic_score: Mean of per-image scores.
      - detected_objects: Union (sum) of class counts across images.
      - amenity_completeness_score: Re-computed on the aggregated detected_objects dict
                                   using the expected_amenities list.

    Args:
        images: List of PIL Image instances or file paths.
        expected_amenities: Optional list of expected amenity class names.

    Returns:
        dict: Aggregated 5-key feature vector dict across the listing.
    """
    if expected_amenities is None:
        expected_amenities = DEFAULT_EXPECTED_AMENITIES

    if not images:
        return {
            "style_tier": "luxury",
            "style_confidence": 0.0,
            "aesthetic_score": 0.0,
            "detected_objects": {},
            "amenity_completeness_score": 0.0,
        }

    style_tiers: List[str] = []
    style_confidences: List[float] = []
    aesthetic_scores: List[float] = []
    aggregated_objects: Dict[str, int] = {}
    all_errors: List[str] = []

    for img in images:
        feat = combine_for_image(img, expected_amenities=expected_amenities)

        if feat.get("style_tier") is not None:
            style_tiers.append(feat["style_tier"])
        if feat.get("style_confidence") is not None:
            style_confidences.append(feat["style_confidence"])
        if feat.get("aesthetic_score") is not None:
            aesthetic_scores.append(feat["aesthetic_score"])

        if feat.get("detected_objects") is not None:
            for cls_name, count in feat["detected_objects"].items():
                aggregated_objects[cls_name] = (
                    aggregated_objects.get(cls_name, 0) + count
                )

        if "errors" in feat:
            all_errors.extend(feat["errors"])

    # Aggregate style_tier (majority vote, tie -> luxury)
    if style_tiers:
        lux_count = style_tiers.count("luxury")
        bud_count = style_tiers.count("budget")
        agg_style_tier = "luxury" if lux_count >= bud_count else "budget"
    else:
        agg_style_tier = "luxury"

    # Aggregate style_confidence (mean)
    agg_style_conf = (
        round(float(sum(style_confidences) / len(style_confidences)), 4)
        if style_confidences
        else 0.0
    )

    # Aggregate aesthetic_score (mean)
    agg_aesthetic = (
        round(float(sum(aesthetic_scores) / len(aesthetic_scores)), 2)
        if aesthetic_scores
        else 0.0
    )

    # Recompute amenity_completeness_score on aggregated objects
    if expected_amenities:
        expected_lower = [item.lower() for item in expected_amenities]
        matched = sum(
            1 for item in expected_lower if aggregated_objects.get(item, 0) >= 1
        )
        agg_completeness = round(matched / len(expected_lower), 4)
    else:
        agg_completeness = 0.0

    result = {
        "style_tier": agg_style_tier,
        "style_confidence": agg_style_conf,
        "aesthetic_score": agg_aesthetic,
        "detected_objects": aggregated_objects,
        "amenity_completeness_score": agg_completeness,
    }

    if all_errors:
        result["errors"] = all_errors

    return result
