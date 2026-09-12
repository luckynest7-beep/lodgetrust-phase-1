"""Smoke test for Layer 1 - proving CLIP downloads, loads, and generates L2-normalized image embeddings."""

import sys
from pathlib import Path
import numpy as np
from PIL import Image

# Ensure image_analysis package directory is on Python path
CURRENT_DIR = Path(__file__).resolve().parent
MODULE_DIR = CURRENT_DIR.parent
if str(MODULE_DIR) not in sys.path:
    sys.path.insert(0, str(MODULE_DIR))

from clip_utils import load_clip, embed_image  # noqa: E402


def test_clip_loads_and_embeds():
    """Verify load_clip loads model/processor and embed_image returns normalized 1D vector."""
    model, processor = load_clip()
    assert model is not None, "CLIPModel instance should not be None"
    assert processor is not None, "CLIPProcessor instance should not be None"

    # Create dummy in-memory 224x224 RGB image
    dummy_img = Image.new("RGB", (224, 224), color=(128, 128, 128))

    # Generate embedding
    embedding = embed_image(dummy_img)

    # Check type and dimension
    assert isinstance(embedding, np.ndarray), "Embedding should be a numpy ndarray"
    assert embedding.ndim == 1, f"Expected 1-D embedding vector, got shape {embedding.shape}"

    # Verify vector dimension matches model projection_dim
    expected_dim = getattr(model.config, "projection_dim", 768)
    assert (
        embedding.shape[0] == expected_dim
    ), f"Expected embedding dimension {expected_dim}, got {embedding.shape[0]}"

    # Verify L2 normalization
    norm = np.linalg.norm(embedding)
    assert np.isclose(
        norm, 1.0, atol=1e-4
    ), f"Embedding vector should be L2-normalized to 1.0, got norm {norm}"
