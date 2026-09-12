"""B3c YOLOv8 furniture and amenity detection module."""

from pathlib import Path
from typing import List, Optional, Union
from PIL import Image
from ultralytics import YOLO

DEFAULT_YOLO_MODEL = "yolo11l.pt"

# Default expected amenities for 3-star lodging (can be overridden when Module D criteria land)
DEFAULT_EXPECTED_AMENITIES = ["bed", "chair", "couch", "tv", "dining table"]

_YOLO_MODEL = None


def load_yolo_model(model_name: str = DEFAULT_YOLO_MODEL) -> YOLO:
    """Lazy-load and cache the YOLO model instance."""
    global _YOLO_MODEL
    if _YOLO_MODEL is None:
        _YOLO_MODEL = YOLO(model_name)
    return _YOLO_MODEL


def detect_furniture(
    image: Union[Image.Image, str, Path],
    expected_amenities: Optional[List[str]] = None,
    model_name: str = DEFAULT_YOLO_MODEL,
) -> dict:
    """Run YOLO object detection to identify furniture/amenities and compute a completeness score.

    Args:
        image: A PIL Image instance or file path.
        expected_amenities: List of expected amenity class names (default: 3-star amenity list).
        model_name: YOLO model name or weights path.

    Returns:
        dict: {
            "detected_objects": {"bed": 1, "chair": 2, ...},  # Class -> Count
            "amenity_completeness_score": float               # 0.0 - 1.0 fraction
        }
    """
    if expected_amenities is None:
        expected_amenities = DEFAULT_EXPECTED_AMENITIES

    model = load_yolo_model(model_name)

    if isinstance(image, (str, Path)):
        img = Image.open(image).convert("RGB")
    elif isinstance(image, Image.Image):
        img = image.convert("RGB")
    else:
        raise ValueError(
            f"Unsupported image type: {type(image)}. Expected PIL.Image.Image or file path."
        )

    results = model(img, verbose=False)

    detected_counts = {}
    for result in results:
        if result.boxes is not None and len(result.boxes) > 0:
            for cls_id in result.boxes.cls:
                cls_name = model.names[int(cls_id)].lower()
                detected_counts[cls_name] = detected_counts.get(cls_name, 0) + 1

    if expected_amenities:
        expected_lower = [item.lower() for item in expected_amenities]
        matched_count = sum(
            1 for item in expected_lower if detected_counts.get(item, 0) >= 1
        )
        completeness_score = round(matched_count / len(expected_lower), 4)
    else:
        completeness_score = 0.0

    return {
        "detected_objects": detected_counts,
        "amenity_completeness_score": completeness_score,
    }
