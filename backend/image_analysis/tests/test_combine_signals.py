"""Unit tests for Layer 5 signal combiner module (combine_signals.py)."""

import sys
from pathlib import Path
from PIL import Image
import pytest

# Ensure image_analysis package directory is on Python path
CURRENT_DIR = Path(__file__).resolve().parent
MODULE_DIR = CURRENT_DIR.parent
if str(MODULE_DIR) not in sys.path:
    sys.path.insert(0, str(MODULE_DIR))

from combine_signals import (  # noqa: E402
    combine_for_image,
    combine_for_listing,
)


def test_combine_for_image_runs():
    """Verify combine_for_image returns full 5-key feature vector schema."""
    img = Image.new("RGB", (224, 224), color=(180, 160, 200))
    result = combine_for_image(img)

    assert isinstance(result, dict), "Result should be a dictionary"
    expected_keys = {
        "style_tier",
        "style_confidence",
        "aesthetic_score",
        "detected_objects",
        "amenity_completeness_score",
    }
    assert expected_keys.issubset(result.keys())

    assert result["style_tier"] in {"luxury", "budget"}
    assert 0.0 <= result["style_confidence"] <= 1.0
    assert 1.0 <= result["aesthetic_score"] <= 10.0
    assert isinstance(result["detected_objects"], dict)
    assert 0.0 <= result["amenity_completeness_score"] <= 1.0


def test_combine_for_listing_aggregates():
    """Verify combine_for_listing aggregates features deterministically across multiple images."""
    img1 = Image.new("RGB", (224, 224), color=(100, 120, 140))
    img2 = Image.new("RGB", (224, 224), color=(200, 180, 160))

    res1 = combine_for_listing([img1, img2])
    res2 = combine_for_listing([img1, img2])

    assert res1["style_tier"] == res2["style_tier"]
    assert res1["style_confidence"] == res2["style_confidence"]
    assert res1["aesthetic_score"] == res2["aesthetic_score"]
    assert res1["detected_objects"] == res2["detected_objects"]
    assert res1["amenity_completeness_score"] == res2["amenity_completeness_score"]


def test_combine_handles_file_paths(tmp_path):
    """Verify combiner handles mixed PIL images and string/Path file paths."""
    img_path = tmp_path / "listing_room.jpg"
    img = Image.new("RGB", (224, 224), color=(150, 150, 150))
    img.save(img_path)

    result = combine_for_listing([img, str(img_path), img_path])

    assert result["style_tier"] in {"luxury", "budget"}
    assert 0.0 <= result["style_confidence"] <= 1.0
    assert 1.0 <= result["aesthetic_score"] <= 10.0


def test_combine_resilience(monkeypatch):
    """Verify partial failure in a sub-module records error under 'errors' key and returns remaining signals."""

    def mock_classify_style_tier(image):
        raise RuntimeError("Simulated style_tier model failure")

    monkeypatch.setattr("combine_signals.classify_style_tier", mock_classify_style_tier)

    img = Image.new("RGB", (224, 224), color=(120, 120, 120))
    result = combine_for_image(img)

    # style_tier should be None due to mock failure
    assert result["style_tier"] is None
    assert result["style_confidence"] is None

    # Other sub-modules should still succeed
    assert result["aesthetic_score"] is not None
    assert result["detected_objects"] is not None

    # Error should be recorded under 'errors' key
    assert "errors" in result
    assert any("style_tier" in err for err in result["errors"])
