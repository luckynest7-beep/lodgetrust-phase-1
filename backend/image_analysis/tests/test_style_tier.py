"""Unit tests for B3a style tier classification module (style_tier.py)."""

import sys
from pathlib import Path
from PIL import Image

# Ensure image_analysis package directory is on Python path
CURRENT_DIR = Path(__file__).resolve().parent
MODULE_DIR = CURRENT_DIR.parent
if str(MODULE_DIR) not in sys.path:
    sys.path.insert(0, str(MODULE_DIR))

from style_tier import classify_style_tier  # noqa: E402


def test_classify_style_tier_runs():
    """Verify classify_style_tier outputs valid schema and is deterministic."""
    img = Image.new("RGB", (224, 224), color=(150, 180, 220))
    result = classify_style_tier(img)

    assert isinstance(result, dict), "Result should be a dictionary"
    assert "style_tier" in result, "Result dictionary should contain 'style_tier'"
    assert "style_confidence" in result, "Result dictionary should contain 'style_confidence'"

    assert result["style_tier"] in {"luxury", "budget"}
    assert 0.0 <= result["style_confidence"] <= 1.0

    # Determinism check
    result2 = classify_style_tier(img)
    assert result["style_tier"] == result2["style_tier"]
    assert result["style_confidence"] == result2["style_confidence"]
