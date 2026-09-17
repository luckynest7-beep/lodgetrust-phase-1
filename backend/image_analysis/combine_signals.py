"""Layer 5 Signal Combiner — Aggregates B3a, B3b, B3c quality, style, amenity, lighting, and color signals.

Produces a single feature vector per image or per listing for downstream consumption by:
  - Module C (Price Plausibility Regressor)
  - Module D (Compliance RAG)
  - Frontend Verification Dashboard
"""

from collections import Counter
from pathlib import Path
from typing import Dict, List, Optional, Union
from PIL import Image

from style_tier import classify_style_tier
from aesthetic_score import score_aesthetic, compute_composite_aesthetic_score
from furniture_detector import detect_furniture, DEFAULT_EXPECTED_AMENITIES
from lighting_analysis import analyze_lighting
from color_analysis import analyze_color_scheme


def combine_for_image(
    image: Union[Image.Image, str, Path],
    expected_amenities: Optional[List[str]] = None,
) -> dict:
    """Run B3a, B3b, B3c, lighting analysis, and color analysis on a single image.

    Resilience note:
        If any individual sub-module fails, its fields are set to None and the error
        is captured under an 'errors' key, allowing partial results to be returned safely.

    Args:
        image: A PIL Image instance or file path.
        expected_amenities: Optional list of expected amenity class names.

    Returns:
        dict: feature vector including style, aesthetic, objects, lighting, color, composite.
    """
    errors: List[str] = []

    # 1. B3a Style & Lodging Tier (4-tier spectrum)
    tier_scores = None
    try:
        res_style = classify_style_tier(image)
        style_tier = res_style.get("style_tier")
        style_confidence = res_style.get("style_confidence")
        tier_scores = res_style.get("tier_scores")
    except Exception as e:
        style_tier = None
        style_confidence = None
        errors.append(f"style_tier: {str(e)}")

    # 2. B3b Aesthetic Score (Vision Model)
    try:
        res_aesthetic = score_aesthetic(image)
        aesthetic_score = res_aesthetic.get("aesthetic_score")
    except Exception as e:
        aesthetic_score = None
        errors.append(f"aesthetic_score: {str(e)}")

    # 3. B3c Furniture Detector & Amenity Checklist
    matched_amenities = []
    missing_amenities = []
    exp_list = expected_amenities or DEFAULT_EXPECTED_AMENITIES
    try:
        res_furniture = detect_furniture(image, expected_amenities=exp_list)
        detected_objects = res_furniture.get("detected_objects")
        amenity_completeness_score = res_furniture.get("amenity_completeness_score")
        matched_amenities = res_furniture.get("matched_amenities", [])
        missing_amenities = res_furniture.get("missing_amenities", [])
    except Exception as e:
        detected_objects = None
        amenity_completeness_score = None
        errors.append(f"furniture_detector: {str(e)}")

    # 4. Lighting and Exposure Analysis
    lighting_res = None
    try:
        lighting_res = analyze_lighting(image)
    except Exception as e:
        errors.append(f"lighting_analysis: {str(e)}")

    # 5. Color Scheme and Harmony Analysis
    color_res = None
    try:
        color_res = analyze_color_scheme(image)
    except Exception as e:
        errors.append(f"color_analysis: {str(e)}")

    # 6. Composite Aesthetic Score
    composite_res = None
    try:
        v_score = aesthetic_score if aesthetic_score is not None else 5.0
        l_score = lighting_res["lighting_score"] if lighting_res and "lighting_score" in lighting_res else 5.0
        c_score = color_res["color_harmony_score"] if color_res and "color_harmony_score" in color_res else 5.0
        a_score = amenity_completeness_score if amenity_completeness_score is not None else 0.5
        composite_res = compute_composite_aesthetic_score(
            vision_score=v_score,
            lighting_score=l_score,
            color_harmony_score=c_score,
            amenity_completeness_score=a_score,
        )
    except Exception as e:
        errors.append(f"composite_aesthetic: {str(e)}")

    result = {
        "style_tier": style_tier,
        "style_confidence": style_confidence,
        "tier_scores": tier_scores,
        "aesthetic_score": aesthetic_score,
        "detected_objects": detected_objects,
        "amenity_completeness_score": amenity_completeness_score,
        "expected_amenities": exp_list,
        "matched_amenities": matched_amenities,
        "missing_amenities": missing_amenities,
        "lighting_analysis": lighting_res,
        "color_analysis": color_res,
        "composite_aesthetic": composite_res,
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
      - style_tier: Plurality vote across images.
      - style_confidence: Mean of per-image confidences.
      - tier_scores: Mean probabilities per tier across images.
      - aesthetic_score: Mean of per-image vision scores.
      - detected_objects: Union (sum) of class counts across images.
      - amenity_completeness_score: Re-computed on the aggregated detected_objects dict.
      - lighting_analysis: Mean of lighting scores, brightness, contrast, clipping, and dominant atmosphere.
      - color_analysis: Mean of color harmony scores, warm/cool pct, and representative dominant palette.
      - composite_aesthetic: Computed from aggregated vision, lighting, color, and amenity scores.
    """
    if expected_amenities is None:
        expected_amenities = DEFAULT_EXPECTED_AMENITIES

    if not images:
        default_comp = compute_composite_aesthetic_score(5.0, 5.0, 5.0, 0.0)
        return {
            "style_tier": "luxury",
            "style_confidence": 0.0,
            "tier_scores": {"budget": 0.25, "midscale": 0.25, "upscale": 0.25, "luxury": 0.25},
            "aesthetic_score": 0.0,
            "detected_objects": {},
            "amenity_completeness_score": 0.0,
            "expected_amenities": expected_amenities,
            "matched_amenities": [],
            "missing_amenities": expected_amenities,
            "lighting_analysis": None,
            "color_analysis": None,
            "composite_aesthetic": default_comp,
        }

    style_tiers: List[str] = []
    style_confidences: List[float] = []
    all_tier_scores: List[dict] = []
    aesthetic_scores: List[float] = []
    aggregated_objects: Dict[str, int] = {}
    all_errors: List[str] = []

    lighting_scores: List[float] = []
    brightness_list: List[float] = []
    contrast_list: List[float] = []
    hl_clip_list: List[float] = []
    sh_clip_list: List[float] = []
    atmospheres: List[str] = []
    exposure_cats: List[str] = []

    color_harmony_scores: List[float] = []
    warm_pcts: List[float] = []
    cool_pcts: List[float] = []
    harmony_types: List[str] = []
    saturation_levels: List[str] = []
    all_palettes: List[dict] = []

    for img in images:
        feat = combine_for_image(img, expected_amenities=expected_amenities)

        if feat.get("style_tier") is not None:
            style_tiers.append(feat["style_tier"])
        if feat.get("style_confidence") is not None:
            style_confidences.append(feat["style_confidence"])
        if feat.get("tier_scores") is not None:
            all_tier_scores.append(feat["tier_scores"])
        if feat.get("aesthetic_score") is not None:
            aesthetic_scores.append(feat["aesthetic_score"])

        if feat.get("detected_objects") is not None:
            for cls_name, count in feat["detected_objects"].items():
                aggregated_objects[cls_name] = (
                    aggregated_objects.get(cls_name, 0) + count
                )

        light_obj = feat.get("lighting_analysis")
        if light_obj and isinstance(light_obj, dict):
            lighting_scores.append(light_obj.get("lighting_score", 5.0))
            brightness_list.append(light_obj.get("mean_brightness", 50.0))
            contrast_list.append(light_obj.get("contrast", 20.0))
            hl_clip_list.append(light_obj.get("highlight_clipping_pct", 0.0))
            sh_clip_list.append(light_obj.get("shadow_clipping_pct", 0.0))
            if "lighting_atmosphere" in light_obj:
                atmospheres.append(light_obj["lighting_atmosphere"])
            if "exposure_category" in light_obj:
                exposure_cats.append(light_obj["exposure_category"])

        color_obj = feat.get("color_analysis")
        if color_obj and isinstance(color_obj, dict):
            color_harmony_scores.append(color_obj.get("color_harmony_score", 5.0))
            warm_pcts.append(color_obj.get("warm_tone_pct", 50.0))
            cool_pcts.append(color_obj.get("cool_tone_pct", 50.0))
            if "harmony_type" in color_obj:
                harmony_types.append(color_obj["harmony_type"])
            if "saturation_level" in color_obj:
                saturation_levels.append(color_obj["saturation_level"])
            if "dominant_palette" in color_obj and color_obj["dominant_palette"]:
                all_palettes.extend(color_obj["dominant_palette"])

        if "errors" in feat:
            all_errors.extend(feat["errors"])

    # Aggregate style_tier (plurality vote)
    if style_tiers:
        agg_style_tier = Counter(style_tiers).most_common(1)[0][0]
    else:
        agg_style_tier = "midscale"

    # Aggregate style_confidence (mean)
    agg_style_conf = (
        round(float(sum(style_confidences) / len(style_confidences)), 4)
        if style_confidences
        else 0.0
    )

    # Aggregate tier_scores
    agg_tier_scores = {}
    if all_tier_scores:
        for t_name in ["budget", "midscale", "upscale", "luxury"]:
            vals = [ts.get(t_name, 0.0) for ts in all_tier_scores]
            agg_tier_scores[t_name] = round(float(sum(vals) / len(vals)), 4)

    # Aggregate vision aesthetic_score (mean)
    agg_aesthetic = (
        round(float(sum(aesthetic_scores) / len(aesthetic_scores)), 2)
        if aesthetic_scores
        else 5.0
    )

    # Recompute amenity_completeness_score on aggregated objects
    matched_amenities = []
    missing_amenities = []
    if expected_amenities:
        expected_lower = [item.lower() for item in expected_amenities]
        matched_amenities = [item for item in expected_lower if aggregated_objects.get(item, 0) >= 1]
        missing_amenities = [item for item in expected_lower if aggregated_objects.get(item, 0) == 0]
        agg_completeness = round(len(matched_amenities) / len(expected_lower), 4)
    else:
        agg_completeness = 0.0

    # Aggregate Lighting
    agg_lighting = None
    if lighting_scores:
        dominant_atm = Counter(atmospheres).most_common(1)[0][0] if atmospheres else "Natural Daylight"
        dominant_exp = Counter(exposure_cats).most_common(1)[0][0] if exposure_cats else "well_exposed"
        agg_lighting = {
            "lighting_score": round(float(sum(lighting_scores) / len(lighting_scores)), 2),
            "exposure_category": dominant_exp,
            "mean_brightness": round(float(sum(brightness_list) / len(brightness_list)), 1),
            "contrast": round(float(sum(contrast_list) / len(contrast_list)), 1),
            "highlight_clipping_pct": round(float(sum(hl_clip_list) / len(hl_clip_list)), 1),
            "shadow_clipping_pct": round(float(sum(sh_clip_list) / len(sh_clip_list)), 1),
            "lighting_atmosphere": dominant_atm,
            "is_balanced": dominant_exp == "well_exposed",
        }

    # Aggregate Color
    agg_color = None
    if color_harmony_scores:
        avg_warm = round(float(sum(warm_pcts) / len(warm_pcts)), 1) if warm_pcts else 50.0
        avg_cool = round(float(sum(cool_pcts) / len(cool_pcts)), 1) if cool_pcts else 50.0
        temp = "warm" if avg_warm >= 60 else ("cool" if avg_cool >= 60 else "neutral_balanced")
        dominant_harm = Counter(harmony_types).most_common(1)[0][0] if harmony_types else "Balanced Neutral"
        dominant_sat = Counter(saturation_levels).most_common(1)[0][0] if saturation_levels else "muted_elegant"
        
        # Take first 5 dominant colors across images
        palette_sample = all_palettes[:5] if all_palettes else []

        agg_color = {
            "color_harmony_score": round(float(sum(color_harmony_scores) / len(color_harmony_scores)), 2),
            "dominant_palette": palette_sample,
            "color_temperature": temp,
            "warm_tone_pct": avg_warm,
            "cool_tone_pct": avg_cool,
            "harmony_type": dominant_harm,
            "saturation_level": dominant_sat,
        }

    # Aggregate Composite Aesthetic
    l_val = agg_lighting["lighting_score"] if agg_lighting else 5.0
    c_val = agg_color["color_harmony_score"] if agg_color else 5.0
    agg_composite = compute_composite_aesthetic_score(
        vision_score=agg_aesthetic,
        lighting_score=l_val,
        color_harmony_score=c_val,
        amenity_completeness_score=agg_completeness,
    )

    result = {
        "style_tier": agg_style_tier,
        "style_confidence": agg_style_conf,
        "tier_scores": agg_tier_scores,
        "aesthetic_score": agg_aesthetic,
        "detected_objects": aggregated_objects,
        "amenity_completeness_score": agg_completeness,
        "expected_amenities": expected_amenities,
        "matched_amenities": matched_amenities,
        "missing_amenities": missing_amenities,
        "lighting_analysis": agg_lighting,
        "color_analysis": agg_color,
        "composite_aesthetic": agg_composite,
    }

    if all_errors:
        result["errors"] = all_errors

    return result


