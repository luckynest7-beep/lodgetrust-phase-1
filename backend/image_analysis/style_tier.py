"""B3a CLIP zero-shot style & lodging tier classification module.

Classifies lodging photos across a 4-tier lodging spectrum:
- budget (economy motel, basic low-cost room)
- midscale (standard comfortable hotel room)
- upscale (modern premium boutique hotel)
- luxury (ultra luxury 5-star executive suite)
"""

from pathlib import Path
from typing import Dict, List, Union
import numpy as np
from PIL import Image
import torch
from clip_utils import load_clip, get_device

TIER_PROMPT_MAP = {
    "budget": [
        "a photo of a cheap budget motel room",
        "basic economy lodging with simple worn furnishings",
        "low cost budget hotel room with minimal decor",
    ],
    "midscale": [
        "a photo of a standard comfortable midscale hotel room",
        "typical commercial hotel room with clean simple furniture",
        "standard 3-star lodging accommodation",
    ],
    "upscale": [
        "a photo of a modern stylish boutique hotel room",
        "upscale contemporary hotel room with high quality decor",
        "premium designed guestroom with sleek modern furnishings",
    ],
    "luxury": [
        "a photo of a lavish 5-star luxury hotel suite",
        "ultra luxury penthouse executive suite with bespoke furnishings",
        "high-end luxury hotel room with opulent architectural finishes",
    ],
}


def classify_style_tier(image: Union[Image.Image, str, Path]) -> dict:
    """Classify an image into lodging tiers using zero-shot CLIP embeddings.

    Args:
        image: A PIL Image instance or file path.

    Returns:
        dict: {
            "style_tier": "budget" | "midscale" | "upscale" | "luxury",
            "style_confidence": float,  # 0.0 - 1.0 confidence score
            "tier_scores": {            # Probability distribution
                "budget": float,
                "midscale": float,
                "upscale": float,
                "luxury": float,
            }
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

    tier_sims: Dict[str, float] = {}
    tier_names = list(TIER_PROMPT_MAP.keys())

    for tier_name, prompts in TIER_PROMPT_MAP.items():
        inputs_txt = processor(text=prompts, padding=True, return_tensors="pt")
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

        txt_vecs = txt_feats / txt_feats.norm(dim=-1, keepdim=True)
        # Cosine similarity across prompts for this tier
        sims = (img_vec @ txt_vecs.T).squeeze(0).cpu().numpy()
        tier_sims[tier_name] = float(np.mean(sims))

    # Compute softmax probabilities over tier similarities
    raw_scores = np.array([tier_sims[t] for t in tier_names])
    logits = raw_scores * 12.0  # Temperature scaling
    exp_logits = np.exp(logits - np.max(logits))
    probs = exp_logits / np.sum(exp_logits)

    tier_scores = {
        tier_names[i]: round(float(probs[i]), 4) for i in range(len(tier_names))
    }

    winning_idx = int(np.argmax(probs))
    winning_tier = tier_names[winning_idx]
    confidence = round(float(probs[winning_idx]), 4)

    return {
        "style_tier": winning_tier,
        "style_confidence": confidence,
        "tier_scores": tier_scores,
    }

