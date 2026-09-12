"""Pre-seeds the FAISS index with demo images on startup."""

import logging
import sys
from pathlib import Path
from PIL import Image

# Ensure image_analysis module is on sys.path
IMAGE_ANALYSIS_DIR = Path(__file__).resolve().parent.parent / "image_analysis"
if str(IMAGE_ANALYSIS_DIR) not in sys.path:
    sys.path.insert(0, str(IMAGE_ANALYSIS_DIR))

from stolen_image import add_images, clear_index  # noqa: E402

logger = logging.getLogger("lodgetrust.api")


def seed_dummy_index() -> int:
    """Pre-seed FAISS index with demo images so B1 queries return meaningful similarity scores."""
    clear_index()

    demo_colors = [
        ((230, 50, 50), "L_demo_1", "img_demo_red"),
        ((50, 200, 50), "L_demo_2", "img_demo_green"),
        ((50, 100, 230), "L_demo_3", "img_demo_blue"),
        ((240, 220, 50), "L_demo_4", "img_demo_yellow"),
        ((200, 80, 220), "L_demo_5", "img_demo_purple"),
    ]

    images_to_add = []
    for color, listing_id, image_id in demo_colors:
        img = Image.new("RGB", (224, 224), color=color)
        images_to_add.append((img, listing_id, image_id))

    add_images(images_to_add)
    count = len(images_to_add)
    logger.info(f"FAISS index successfully seeded with {count} demo listing images.")
    return count
