"""B3b Aesthetic score module.

Note & Caveat:
    This aesthetic predictor reflects soft photo staging/visual presentation quality signals.
    It is NOT a direct proxy for actual property market value.
"""

from pathlib import Path
from typing import Tuple, Union
import numpy as np
from PIL import Image
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification

DEFAULT_MODEL_NAME = "cafeai/cafe_aesthetic"

_MODEL = None
_PROCESSOR = None
_DEVICE = None


def get_device() -> str:
    """Return 'cuda' if GPU is available, else 'cpu'."""
    return "cuda" if torch.cuda.is_available() else "cpu"


def load_aesthetic_predictor(
    model_name: str = DEFAULT_MODEL_NAME,
) -> Tuple[AutoModelForImageClassification, AutoImageProcessor]:
    """Lazy-load and cache the aesthetic predictor model and processor.

    Args:
        model_name: Hugging Face model repository identifier.

    Returns:
        Tuple[AutoModelForImageClassification, AutoImageProcessor]: Loaded model and processor.
    """
    global _MODEL, _PROCESSOR, _DEVICE

    if _MODEL is None or _PROCESSOR is None:
        _DEVICE = get_device()
        _MODEL = AutoModelForImageClassification.from_pretrained(model_name).to(_DEVICE)
        _MODEL.eval()
        _PROCESSOR = AutoImageProcessor.from_pretrained(model_name)

    return _MODEL, _PROCESSOR


def score_aesthetic(image: Union[Image.Image, str, Path]) -> dict:
    """Compute normalized 1.0 - 10.0 aesthetic quality score for an image.

    Args:
        image: A PIL Image instance or file path.

    Returns:
        dict: {
            "aesthetic_score": float  # 1.0 - 10.0 aesthetic score
        }
    """
    model, processor = load_aesthetic_predictor()
    device = _DEVICE or get_device()

    if isinstance(image, (str, Path)):
        img = Image.open(image).convert("RGB")
    elif isinstance(image, Image.Image):
        img = image.convert("RGB")
    else:
        raise ValueError(
            f"Unsupported image type: {type(image)}. Expected PIL.Image.Image or file path."
        )

    inputs = processor(images=img, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)

    probs = torch.softmax(outputs.logits, dim=-1).squeeze(0).cpu().numpy()

    # Model id2label: {0: 'not_aesthetic', 1: 'aesthetic'}
    prob_aesthetic = float(probs[1]) if len(probs) > 1 else float(probs[0])

    # Normalize 0.0 - 1.0 probability range to 1.0 - 10.0 scale
    score = round(1.0 + 9.0 * prob_aesthetic, 2)

    return {
        "aesthetic_score": score,
    }
