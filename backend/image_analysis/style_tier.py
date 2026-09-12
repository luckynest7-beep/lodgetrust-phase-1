"""B3a CLIP zero-shot style/luxury tier classification module."""

from pathlib import Path
from typing import Union
import numpy as np
from PIL import Image
import torch
from clip_utils import load_clip, get_device

PROMPT_PAIRS = [
    ("a photo of a luxury hotel room", "a photo of a budget hotel room"),
    ("modern high-end furnishings", "old worn-out furniture"),
    ("a photo of an upscale suite", "a photo of a basic motel room"),
]


def classify_style_tier(image: Union[Image.Image, str, Path]) -> dict:
    """Classify an image into 'luxury' vs 'budget' style tier using zero-shot CLIP.

    Args:
        image: A PIL Image instance or file path.

    Returns:
        dict: {
            "style_tier": "luxury" | "budget",
            "style_confidence": float  # 0.0 - 1.0 confidence score
        }
    """
    model, processor = load_clip()
    device = get_device()

    if isinstance(image, (str, Path)):
        img = Image.open(image).convert("RGB")
    elif isinstance(image, Image.Image):
        img = image.convert("RGB")
    else:
        raise ValueError(
            f"Unsupported image type: {type(image)}. Expected PIL.Image.Image or file path."
        )

    # Encode image
    inputs_img = processor(images=img, return_tensors="pt")
    inputs_img = {k: v.to(device) for k, v in inputs_img.items()}

    with torch.no_grad():
        img_out = model.get_image_features(**inputs_img)

    if hasattr(img_out, "image_embeds") and img_out.image_embeds is not None:
        img_feats = img_out.image_embeds
    elif hasattr(img_out, "pooler_output") and img_out.pooler_output is not None:
        img_feats = img_out.pooler_output
    elif isinstance(img_out, (tuple, list)):
        img_feats = img_out[0]
    else:
        img_feats = img_out

    img_vec = img_feats / img_feats.norm(dim=-1, keepdim=True)

    lux_scores = []
    bud_scores = []

    for lux_prompt, bud_prompt in PROMPT_PAIRS:
        inputs_txt = processor(
            text=[lux_prompt, bud_prompt], padding=True, return_tensors="pt"
        )
        inputs_txt = {k: v.to(device) for k, v in inputs_txt.items()}

        with torch.no_grad():
            txt_out = model.get_text_features(**inputs_txt)

        if hasattr(txt_out, "text_embeds") and txt_out.text_embeds is not None:
            txt_feats = txt_out.text_embeds
        elif hasattr(txt_out, "pooler_output") and txt_out.pooler_output is not None:
            txt_feats = txt_out.pooler_output
        elif isinstance(txt_out, (tuple, list)):
            txt_feats = txt_out[0]
        else:
            txt_feats = txt_out

        txt_vec = txt_feats / txt_feats.norm(dim=-1, keepdim=True)
        sims = (img_vec @ txt_vec.T).squeeze(0).cpu().numpy()

        lux_scores.append(float(sims[0]))
        bud_scores.append(float(sims[1]))

    avg_lux = float(np.mean(lux_scores))
    avg_bud = float(np.mean(bud_scores))

    winning_tier = "luxury" if avg_lux >= avg_bud else "budget"

    # Softmax over average similarities for defensible 0.0–1.0 confidence score
    logits = np.array([avg_lux, avg_bud]) * 10.0  # Scale factor for softmax temperature
    exp_logits = np.exp(logits - np.max(logits))
    probs = exp_logits / np.sum(exp_logits)

    confidence = float(probs[0] if winning_tier == "luxury" else probs[1])

    return {
        "style_tier": winning_tier,
        "style_confidence": confidence,
    }
