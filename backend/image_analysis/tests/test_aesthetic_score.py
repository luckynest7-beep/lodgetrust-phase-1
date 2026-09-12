"""Unit tests for B3b aesthetic score module (aesthetic_score.py)."""

import sys
from pathlib import Path
from PIL import Image

# Ensure image_analysis package directory is on Python path
CURRENT_DIR = Path(__file__).resolve().parent
MODULE_DIR = CURRENT_DIR.parent
if str(MODULE_DIR) not in sys.path:
    sys.path.insert(0, str(MODULE_DIR))

from aesthetic_score import score_aesthetic  # noqa: E402


def test_score_aesthetic_runs():
    """Verify score_aesthetic outputs float in 1.0 - 10.0 range and is consistent."""
    img = Image.new("RGB", (224, 224), color=(100, 150, 200))
    result = score_aesthetic(img)

    assert isinstance(result, dict), "Result should be a dictionary"
    assert "aesthetic_score" in result, "Result dictionary should contain 'aesthetic_score'"

    score = result["aesthetic_score"]
    assert isinstance(score, float)
    assert 1.0 <= score <= 10.0, f"Aesthetic score {score} outside [1.0, 10.0] range"

    # Consistency check
    result2 = score_aesthetic(img)
    assert result["aesthetic_score"] == result2["aesthetic_score"]
