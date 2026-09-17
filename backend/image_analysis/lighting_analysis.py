"""Lighting and exposure analysis module for LodgeTrust listing verification.

Evaluates:
1. Relative luminance distribution and exposure quality (under/over-exposure detection).
2. Dynamic range, contrast balance, and highlight/shadow clipping.
3. Semantic lighting atmosphere classification via CLIP zero-shot text matching.
4. Normalized 1.0 - 10.0 lighting quality score for lodging presentation.
"""

from pathlib import Path
from typing import Dict, Union, Optional
import numpy as np
from PIL import Image
import torch

from clip_utils import load_clip, get_device

LIGHTING_PROMPTS = [
    "soft natural daylight filling the room",
    "warm cozy ambient interior lighting",
    "bright clean architectural lighting",
    "dimly lit underexposed dark room",
    "harsh artificial overexposed flash lighting",
]

LIGHTING_LABELS = [
    "Natural Daylight",
    "Warm Ambient",
    "Clean Architectural",
    "Dim / Low Light",
    "Harsh / Overexposed",
]


def analyze_lighting(image: Union[Image.Image, str, Path], use_clip_atmosphere: bool = True) -> Dict:
    """Analyze lighting, exposure, and illumination quality of an image.

    Args:
        image: PIL Image or file path.
        use_clip_atmosphere: Whether to use CLIP for semantic lighting atmosphere.

    Returns:
        dict: {
            "lighting_score": float,            # 1.0 - 10.0
            "exposure_category": str,           # "well_exposed", "underexposed", "overexposed", "high_contrast"
            "mean_brightness": float,           # 0 - 100%
            "contrast": float,                  # Standard deviation of luminance (0 - 100)
            "highlight_clipping_pct": float,     # % pixels near blown white (>245)
            "shadow_clipping_pct": float,        # % pixels near crushed black (<15)
            "lighting_atmosphere": str,         # e.g. "Natural Daylight", "Warm Ambient"
            "is_balanced": bool,                # True if lighting is optimal for lodging
        }
    """
    if isinstance(image, (str, Path)):
        img = Image.open(image).convert("RGB")
    elif isinstance(image, Image.Image):
        img = image.convert("RGB")
    else:
        raise ValueError(f"Unsupported image type: {type(image)}")

    # Downsample slightly for fast deterministic pixel math
    img_small = img.resize((256, 256), Image.Resampling.BILINEAR)
    arr = np.asarray(img_small, dtype=np.float32)

    # Standard ITU-R BT.709 relative luminance
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b  # 0 to 255

    mean_lum = float(np.mean(luminance))
    mean_brightness = round((mean_lum / 255.0) * 100.0, 1)

    std_lum = float(np.std(luminance))
    contrast = round((std_lum / 255.0) * 100.0, 1)

    # Clipping analysis
    total_pixels = 256 * 256
    highlight_clipped = float(np.sum(luminance > 245)) / total_pixels * 100.0
    shadow_clipped = float(np.sum(luminance < 15)) / total_pixels * 100.0

    # Categorization
    if mean_brightness < 30.0:
        exposure_category = "underexposed"
    elif mean_brightness > 82.0 or highlight_clipped > 12.0:
        exposure_category = "overexposed"
    elif contrast > 30.0 and (highlight_clipped > 5.0 or shadow_clipped > 10.0):
        exposure_category = "high_contrast"
    else:
        exposure_category = "well_exposed"

    # Compute 1.0 - 10.0 lighting quality score
    # Optimal lodging brightness target: 50% - 70% with low clipping and healthy contrast (15-25)
    brightness_penalty = abs(mean_brightness - 60.0) / 40.0  # 0.0 at 60%, 1.0 at 20% or 100%
    clipping_penalty = (highlight_clipped * 0.4 + shadow_clipped * 0.3) / 10.0
    contrast_penalty = 0.0
    if contrast < 10.0:
        contrast_penalty = (10.0 - contrast) / 10.0 * 0.5  # too washed out / flat
    elif contrast > 32.0:
        contrast_penalty = (contrast - 32.0) / 20.0 * 0.5  # too harsh

    raw_lighting_score = 10.0 - (brightness_penalty * 4.0 + clipping_penalty * 3.0 + contrast_penalty * 3.0)
    lighting_score = round(max(1.0, min(10.0, raw_lighting_score)), 2)

    # Semantic atmosphere detection with CLIP zero-shot
    lighting_atmosphere = "Natural Daylight"
    if use_clip_atmosphere:
        try:
            model, processor = load_clip()
            device = get_device()
            inputs = processor(text=LIGHTING_PROMPTS, images=img, return_tensors="pt", padding=True)
            inputs = {k: v.to(device) for k, v in inputs.items()}
            with torch.no_grad():
                outputs = model(**inputs)
                logits_per_image = outputs.logits_per_image
                best_idx = int(logits_per_image.argmax(dim=-1).cpu().item())
                lighting_atmosphere = LIGHTING_LABELS[best_idx]
        except Exception:
            # Fallback if CLIP not loaded
            if exposure_category == "underexposed":
                lighting_atmosphere = "Dim / Low Light"
            elif exposure_category == "overexposed":
                lighting_atmosphere = "Harsh / Overexposed"
            else:
                lighting_atmosphere = "Warm Ambient" if mean_brightness > 55 else "Natural Daylight"

    is_balanced = exposure_category == "well_exposed" and highlight_clipped < 6.0 and shadow_clipped < 8.0

    return {
        "lighting_score": lighting_score,
        "exposure_category": exposure_category,
        "mean_brightness": mean_brightness,
        "contrast": contrast,
        "highlight_clipping_pct": round(highlight_clipped, 1),
        "shadow_clipping_pct": round(shadow_clipped, 1),
        "lighting_atmosphere": lighting_atmosphere,
        "is_balanced": is_balanced,
    }
