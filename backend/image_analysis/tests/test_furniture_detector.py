"""Unit tests for B3c furniture detector module (furniture_detector.py)."""

import sys
from pathlib import Path
from PIL import Image

# Ensure image_analysis package directory is on Python path
CURRENT_DIR = Path(__file__).resolve().parent
MODULE_DIR = CURRENT_DIR.parent
if str(MODULE_DIR) not in sys.path:
    sys.path.insert(0, str(MODULE_DIR))

from furniture_detector import detect_furniture, DEFAULT_EXPECTED_AMENITIES  # noqa: E402


def test_detect_furniture_runs():
    """Verify detect_furniture returns valid dictionary schema and completeness score."""
    img = Image.new("RGB", (224, 224), color=(220, 220, 220))
    result = detect_furniture(img)

    assert isinstance(result, dict), "Result should be a dictionary"
    assert "detected_objects" in result, "Result should contain 'detected_objects'"
    assert "amenity_completeness_score" in result, "Result should contain 'amenity_completeness_score'"

    assert isinstance(result["detected_objects"], dict)
    score = result["amenity_completeness_score"]
    assert isinstance(score, float)
    assert 0.0 <= score <= 1.0


def test_handles_empty_detection():
    """Verify solid color image returns empty detection count and 0.0 completeness score."""
    blank_img = Image.new("RGB", (224, 224), color=(128, 128, 128))
    result = detect_furniture(blank_img, expected_amenities=DEFAULT_EXPECTED_AMENITIES)

    # Solid gray image should detect 0 furniture items
    assert result["detected_objects"] == {}
    assert result["amenity_completeness_score"] == 0.0


def test_custom_expected_amenities():
    """Verify completeness score uses custom parameterizable expected amenity list."""
    img = Image.new("RGB", (224, 224), color=(200, 200, 200))
    custom_list = ["chair", "desk"]
    result = detect_furniture(img, expected_amenities=custom_list)

    assert result["amenity_completeness_score"] in {0.0, 0.5, 1.0}
