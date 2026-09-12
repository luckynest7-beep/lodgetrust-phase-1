"""B2 AI-Generated Image Detection module using Hugging Face image classification models."""

from pathlib import Path
from typing import Dict, Tuple, Union
import numpy as np
from PIL import Image
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification

DEFAULT_MODEL_NAME = "prithivMLmods/deepfake-detector-model-v1"
BACKUP_MODEL_NAME = "buildborderless/CommunityForensics-DeepfakeDet-ViT"

_MODELS: Dict[str, AutoModelForImageClassification] = {}
_PROCESSORS: Dict[str, AutoImageProcessor] = {}
_DEVICE: str = None


def get_device() -> str:
    """Return 'cuda' if GPU is available, else 'cpu'."""
    return "cuda" if torch.cuda.is_available() else "cpu"


def load_ai_detector(
    model_name: str = DEFAULT_MODEL_NAME,
) -> Tuple[AutoModelForImageClassification, AutoImageProcessor]:
    """Lazy-load and cache the AI detector model and image processor.

    Args:
        model_name: Hugging Face model identifier.

    Returns:
        Tuple[AutoModelForImageClassification, AutoImageProcessor]: Loaded model and processor.
    """
    global _MODELS, _PROCESSORS, _DEVICE

    if model_name not in _MODELS or model_name not in _PROCESSORS:
        _DEVICE = get_device()
        model = AutoModelForImageClassification.from_pretrained(model_name).to(_DEVICE)
        model.eval()
        processor = AutoImageProcessor.from_pretrained(model_name)

        _MODELS[model_name] = model
        _PROCESSORS[model_name] = processor

    return _MODELS[model_name], _PROCESSORS[model_name]


def detect_ai_generated(
    image: Union[Image.Image, str, Path],
    model_name: str = DEFAULT_MODEL_NAME,
) -> dict:
    """Run the AI-generated image classifier on an input image.

    Args:
        image: A PIL Image instance or file path.
        model_name: Hugging Face model identifier to use (default: CommunityForensics ViT).

    Returns:
        dict: {
            "label": str,         # Top label (e.g., "Real", "Artificial", "Deepfake")
            "confidence": float,  # Probability of the top label (0.0 - 1.0)
            "scores": dict        # Class label -> probability mapping for all classes
        }
    """
    model, processor = load_ai_detector(model_name)
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

    logits = outputs.logits.squeeze(0)

    # Handle binary single-output classification (e.g., CommunityForensics ViT)
    if logits.ndim == 0 or (logits.ndim == 1 and logits.shape[0] == 1):
        logit_val = float(logits.cpu().item())
        prob_ai = float(torch.sigmoid(torch.tensor(logit_val)).item())
        prob_real = float(1.0 - prob_ai)

        scores = {
            "Real": round(prob_real, 4),
            "Artificial": round(prob_ai, 4),
        }
        if prob_ai >= 0.5:
            top_label = "Artificial"
            top_confidence = round(prob_ai, 4)
        else:
            top_label = "Real"
            top_confidence = round(prob_real, 4)
    else:
        probs = torch.softmax(logits, dim=-1).cpu().numpy()
        id2label = getattr(model.config, "id2label", None)
        if id2label is None:
            id2label = {i: f"class_{i}" for i in range(len(probs))}

        scores = {id2label[i]: float(probs[i]) for i in range(len(probs))}
        top_idx = int(np.argmax(probs))
        top_label = str(id2label[top_idx])
        top_confidence = float(probs[top_idx])

    return {
        "label": top_label,
        "confidence": top_confidence,
        "scores": scores,
    }
