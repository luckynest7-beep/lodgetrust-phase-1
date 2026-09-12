"""Unit tests for B2 AI-generated image detection module (ai_image_detector.py)."""

import sys
from pathlib import Path
from PIL import Image
import numpy as np
import pytest

# Ensure image_analysis package directory is on Python path
CURRENT_DIR = Path(__file__).resolve().parent
MODULE_DIR = CURRENT_DIR.parent
if str(MODULE_DIR) not in sys.path:
    sys.path.insert(0, str(MODULE_DIR))

from ai_image_detector import (  # noqa: E402
    detect_ai_generated,
    DEFAULT_MODEL_NAME,
    BACKUP_MODEL_NAME,
)


def test_loads_and_runs():
    """Verify primary model runs on PIL image input and outputs expected schema."""
    dummy_img = Image.new("RGB", (224, 224), color=(128, 128, 128))
    result = detect_ai_generated(dummy_img)

    assert isinstance(result, dict), "Result should be a dictionary"
    assert "label" in result, "Result dictionary should contain 'label'"
    assert "confidence" in result, "Result dictionary should contain 'confidence'"
    assert "scores" in result, "Result dictionary should contain 'scores'"

    assert isinstance(result["label"], str) and len(result["label"]) > 0
    assert 0.0 <= result["confidence"] <= 1.0
    assert isinstance(result["scores"], dict)

    # Sanity check for softmax probability sum
    score_sum = sum(result["scores"].values())
    assert np.isclose(score_sum, 1.0, atol=1e-4), f"Scores should sum to ~1.0, got {score_sum}"


def test_consistent_output():
    """Verify inference is deterministic for identical input images."""
    dummy_img = Image.new("RGB", (224, 224), color=(200, 100, 50))
    res1 = detect_ai_generated(dummy_img)
    res2 = detect_ai_generated(dummy_img)

    assert res1["label"] == res2["label"]
    assert np.isclose(res1["confidence"], res2["confidence"], atol=1e-5)
    for k in res1["scores"]:
        assert np.isclose(res1["scores"][k], res2["scores"][k], atol=1e-5)


def test_handles_file_path_input(tmp_path):
    """Verify detector accepts file path strings and Path objects."""
    img_path = tmp_path / "sample_test.png"
    img = Image.new("RGB", (224, 224), color=(50, 150, 250))
    img.save(img_path)

    # Test with string path
    res_str = detect_ai_generated(str(img_path))
    assert res_str["label"] in res_str["scores"]
    assert 0.0 <= res_str["confidence"] <= 1.0

    # Test with Path object
    res_path = detect_ai_generated(img_path)
    assert res_path["label"] == res_str["label"]


def test_backup_candidate_model():
    """Verify secondary candidate model (Smogy/SMOGY-Ai-images-detector) also loads and runs."""
    dummy_img = Image.new("RGB", (224, 224), color=(100, 200, 100))
    result = detect_ai_generated(dummy_img, model_name=BACKUP_MODEL_NAME)

    assert result["label"] in result["scores"]
    assert 0.0 <= result["confidence"] <= 1.0
    score_sum = sum(result["scores"].values())
    assert np.isclose(score_sum, 1.0, atol=1e-4)
