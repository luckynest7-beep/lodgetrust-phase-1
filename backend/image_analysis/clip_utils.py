"""CLIP model loading and image embedding utilities for LodgeTrust image analysis module."""

import os
from typing import Tuple, Union
from pathlib import Path
import numpy as np
from PIL import Image
import torch
from transformers import CLIPModel, CLIPProcessor

_MODEL = None
_PROCESSOR = None
_DEVICE = None

DEFAULT_MODEL_NAME = "openai/clip-vit-large-patch14"


def get_device() -> str:
    """Return 'cuda' if GPU is available, else 'cpu'."""
    return "cuda" if torch.cuda.is_available() else "cpu"


def load_clip(model_name: str = DEFAULT_MODEL_NAME) -> Tuple[CLIPModel, CLIPProcessor]:
    """Lazy-load and cache the CLIP model and processor.

    Returns:
        Tuple[CLIPModel, CLIPProcessor]: Cached tuple of loaded model and processor.
    """
    global _MODEL, _PROCESSOR, _DEVICE

    if _MODEL is None or _PROCESSOR is None:
        _DEVICE = get_device()
        _MODEL = CLIPModel.from_pretrained(model_name).to(_DEVICE)
        _MODEL.eval()
        _PROCESSOR = CLIPProcessor.from_pretrained(model_name)

    return _MODEL, _PROCESSOR


def embed_image(image: Union[Image.Image, str, Path]) -> np.ndarray:
    """Generate a 1-D L2-normalized numpy embedding vector for an input image.

    Args:
        image: A PIL Image instance or a path to an image file.

    Returns:
        np.ndarray: 1-D L2-normalized embedding vector.
    """
    model, processor = load_clip()
    device = _DEVICE or get_device()

    if isinstance(image, (str, Path)):
        img = Image.open(image).convert("RGB")
    elif isinstance(image, Image.Image):
        img = image.convert("RGB")
    else:
        raise ValueError(f"Unsupported image type: {type(image)}. Expected PIL.Image.Image or file path.")

    inputs = processor(images=img, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        features = model.get_image_features(**inputs)

    if hasattr(features, "image_embeds") and features.image_embeds is not None:
        tensor = features.image_embeds
    elif hasattr(features, "pooler_output") and features.pooler_output is not None:
        tensor = features.pooler_output
    elif isinstance(features, (tuple, list)):
        tensor = features[0]
    else:
        tensor = features

    vec = tensor.squeeze(0).cpu().numpy().astype(np.float32)

    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm

    return vec
