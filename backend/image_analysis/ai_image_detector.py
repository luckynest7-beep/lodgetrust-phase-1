"""B2 AI-Generated Image Detection module using Hugging Face image classification models."""

from pathlib import Path
from typing import Dict, Tuple, Union
import numpy as np
from PIL import Image
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification

DEFAULT_MODEL_NAME = "prithivMLmods/AI-vs-Deepfake-vs-Real-v2.0"
BACKUP_MODEL_NAME = "Smogy/SMOGY-Ai-images-detector"

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
        model_name: Hugging Face model identifier to use (default: primary SigLIP2 model).

    Returns:
        dict: {
            "label": str,         # Top label (e.g., "Artificial", "Deepfake", "Real")
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

    logits = outputs.logits
    probs = torch.softmax(logits, dim=-1).squeeze(0).cpu().numpy()

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
