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

# Path to fine-tuned model checkpoint (local workspace or project directory)
_CANDIDATE_MODEL_PATHS = [
    Path(__file__).resolve().parents[2] / "fine_tune_aesthetic" / "model",
    Path(__file__).resolve().parents[1] / "fine_tune_aesthetic" / "model",
    Path(__file__).resolve().parents[3] / "images" / "model",
    Path(__file__).resolve().parents[2] / "images" / "model",
]

DEFAULT_MODEL_NAME = "cafeai/cafe_aesthetic"
for candidate in _CANDIDATE_MODEL_PATHS:
    if candidate.exists() and (
        (candidate / "model.safetensors").exists()
        or (candidate / "pytorch_model.bin").exists()
    ):
        DEFAULT_MODEL_NAME = str(candidate)
        break

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

    logits = outputs.logits.squeeze()
    if logits.ndim == 0 or (logits.ndim == 1 and logits.shape[0] == 1):
        raw_val = float(logits.cpu().item())
        score = round(max(1.0, min(10.0, raw_val)), 2)
    else:
        probs = torch.softmax(outputs.logits, dim=-1).squeeze(0).cpu().numpy()
        # Model id2label: {0: 'not_aesthetic', 1: 'aesthetic'}
        prob_aesthetic = float(probs[1]) if len(probs) > 1 else float(probs[0])
        # Normalize 0.0 - 1.0 probability range to 1.0 - 10.0 scale
        score = round(1.0 + 9.0 * prob_aesthetic, 2)

    return {
        "aesthetic_score": score,
    }


def compute_composite_aesthetic_score(
    vision_score: float,
    lighting_score: float,
    color_harmony_score: float,
    amenity_completeness_score: float,
) -> dict:
    """Calculate the multi-factor weighted composite aesthetic score.

    Formula:
        Composite = 0.40 * Vision + 0.25 * Lighting + 0.20 * Color + 0.15 * Amenity_Scale
        where Amenity_Scale = 1.0 + 9.0 * amenity_completeness_score (1.0 to 10.0)

    Returns:
        dict with composite_score and detailed sub-score breakdown.
    """
    # Scale amenity completeness (0.0 - 1.0) to 1.0 - 10.0
    amenity_score_10 = round(1.0 + 9.0 * max(0.0, min(1.0, amenity_completeness_score)), 2)

    v_score = max(1.0, min(10.0, float(vision_score)))
    l_score = max(1.0, min(10.0, float(lighting_score)))
    c_score = max(1.0, min(10.0, float(color_harmony_score)))

    composite = (
        0.40 * v_score
        + 0.25 * l_score
        + 0.20 * c_score
        + 0.15 * amenity_score_10
    )
    composite_score = round(max(1.0, min(10.0, composite)), 2)

    return {
        "composite_score": composite_score,
        "vision_score": round(v_score, 2),
        "lighting_score": round(l_score, 2),
        "color_score": round(c_score, 2),
        "amenity_score": amenity_score_10,
        "weights": {
            "vision": 0.40,
            "lighting": 0.25,
            "color": 0.20,
            "amenities": 0.15,
        },
    }

