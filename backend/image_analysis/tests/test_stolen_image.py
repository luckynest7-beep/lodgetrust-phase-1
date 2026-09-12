"""Unit tests for B1 stolen image detection module (stolen_image.py)."""

import sys
from pathlib import Path
from PIL import Image
import pytest

# Ensure image_analysis package directory is on Python path
CURRENT_DIR = Path(__file__).resolve().parent
MODULE_DIR = CURRENT_DIR.parent
if str(MODULE_DIR) not in sys.path:
    sys.path.insert(0, str(MODULE_DIR))

from stolen_image import (  # noqa: E402
    add_image,
    add_images,
    check_stolen,
    clear_index,
    save_index,
    load_index,
)


@pytest.fixture(autouse=True)
def reset_faiss_index():
    """Ensure a clean FAISS index state for each test."""
    clear_index()
    yield
    clear_index()


def test_empty_index_returns_no_flag():
    """Test querying an empty index cleanly returns no flag dict."""
    dummy_img = Image.new("RGB", (224, 224), color=(100, 100, 100))
    result = check_stolen(dummy_img, listing_id="L1")

    assert result["is_flagged"] is False
    assert result["matched_listing_id"] is None
    assert result["matched_image_id"] is None
    assert result["similarity_score"] == 0.0


def test_stolen_image_detection():
    """Test duplicate image under a different listing is flagged."""
    red_img = Image.new("RGB", (224, 224), color=(255, 0, 0))
    green_img = Image.new("RGB", (224, 224), color=(0, 255, 0))
    blue_img = Image.new("RGB", (224, 224), color=(0, 0, 255))

    # Add images under listing L1
    add_images(
        [
            (red_img, "L1", "img_red"),
            (green_img, "L1", "img_green"),
            (blue_img, "L1", "img_blue"),
        ]
    )

    # Check a duplicate of green_img submitted under listing L2
    dup_green = Image.new("RGB", (224, 224), color=(0, 255, 0))
    result = check_stolen(dup_green, listing_id="L2", threshold=0.95)

    assert result["is_flagged"] is True
    assert result["matched_listing_id"] == "L1"
    assert result["matched_image_id"] == "img_green"
    assert result["similarity_score"] >= 0.95


def test_self_match_guard_and_negative_case():
    """Test self-match guard ignores images from the same listing, and new images are not flagged."""
    red_img = Image.new("RGB", (224, 224), color=(255, 0, 0))
    green_img = Image.new("RGB", (224, 224), color=(0, 255, 0))

    # Add images under listing L1 only
    add_images(
        [
            (red_img, "L1", "img_red"),
            (green_img, "L1", "img_green"),
        ]
    )

    # Query green_img under listing L1 — should NOT flag itself or L1 images
    result_self = check_stolen(green_img, listing_id="L1", threshold=0.95)
    assert result_self["is_flagged"] is False

    # Query a completely unseen image under L2
    white_img = Image.new("RGB", (224, 224), color=(255, 255, 255))
    result_new = check_stolen(white_img, listing_id="L2", threshold=0.95)
    assert result_new["is_flagged"] is False


def test_index_persistence(tmp_path):
    """Test save_index and load_index persist index and metadata cleanly across reloads."""
    img = Image.new("RGB", (224, 224), color=(120, 50, 200))
    add_image(img, listing_id="L_ORIG", image_id="img_orig")

    save_prefix = tmp_path / "stolen_idx"
    save_index(save_prefix)

    # Clear memory state
    clear_index()

    # Load from disk
    load_index(save_prefix)

    # Query duplicate from another listing
    dup_img = Image.new("RGB", (224, 224), color=(120, 50, 200))
    result = check_stolen(dup_img, listing_id="L_NEW", threshold=0.95)

    assert result["is_flagged"] is True
    assert result["matched_listing_id"] == "L_ORIG"
    assert result["matched_image_id"] == "img_orig"
    assert result["similarity_score"] >= 0.95
