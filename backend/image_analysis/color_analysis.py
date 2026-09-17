"""Color scheme extraction, dominant palette, and harmony analysis module for LodgeTrust.

Evaluates:
1. Top dominant colors (Hex, RGB, percentage coverage) using K-Means clustering.
2. Color temperature analysis (Warm vs Cool tone percentage and warmth ratio).
3. Color harmony score (1.0 - 10.0 scale) and scheme classification (Monochromatic, Analogous, Complementary, Balanced Neutral).
"""

from pathlib import Path
from typing import Dict, List, Union
import colorsys
import numpy as np
from PIL import Image
from sklearn.cluster import KMeans


def _rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02x}{g:02x}{b:02x}".upper()


def _is_warm_color(r: int, g: int, b: int) -> bool:
    """Determine if an RGB color leans warm (red/orange/yellow/warm brown) vs cool (blue/cyan/cool gray)."""
    # In HSV: hues 0-60 and 300-360 lean warm, hues 120-260 lean cool
    h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
    hue_deg = h * 360.0
    if s < 0.12:  # Neutrals
        return r >= b
    return (hue_deg <= 75) or (hue_deg >= 315) or (r > b + 15)


def analyze_color_scheme(image: Union[Image.Image, str, Path], num_colors: int = 5) -> Dict:
    """Extract dominant color palette and compute color harmony score for an image.

    Args:
        image: PIL Image or file path.
        num_colors: Number of dominant colors to extract (default: 5).

    Returns:
        dict: {
            "color_harmony_score": float,       # 1.0 - 10.0
            "dominant_palette": List[dict],     # [{"hex": "#...", "rgb": [r,g,b], "percentage": float}]
            "color_temperature": str,           # "warm", "cool", "neutral_balanced"
            "warm_tone_pct": float,             # 0.0 - 100.0%
            "cool_tone_pct": float,             # 0.0 - 100.0%
            "harmony_type": str,                # "Analogous", "Monochromatic", "Complementary", "Balanced Neutral"
            "saturation_level": str,            # "muted_elegant", "vibrant", "low_saturation"
        }
    """
    if isinstance(image, (str, Path)):
        img = Image.open(image).convert("RGB")
    elif isinstance(image, Image.Image):
        img = image.convert("RGB")
    else:
        raise ValueError(f"Unsupported image type: {type(image)}")

    # Downsample for fast clustering
    img_small = img.resize((128, 128), Image.Resampling.BILINEAR)
    pixels = np.asarray(img_small, dtype=np.float32).reshape(-1, 3)

    # K-Means clustering
    kmeans = KMeans(n_clusters=num_colors, n_init=3, random_state=42, max_iter=150)
    labels = kmeans.fit_predict(pixels)
    centers = np.round(kmeans.cluster_centers_).astype(int)

    # Compute percentage coverage for each cluster
    counts = np.bincount(labels, minlength=num_colors)
    total_pixels = len(pixels)
    percentages = (counts / total_pixels) * 100.0

    # Sort dominant colors by coverage descending
    sorted_indices = np.argsort(-percentages)

    dominant_palette: List[Dict] = []
    warm_weight = 0.0
    cool_weight = 0.0
    hues = []
    saturations = []

    for idx in sorted_indices:
        r, g, b = int(centers[idx][0]), int(centers[idx][1]), int(centers[idx][2])
        r = max(0, min(255, r))
        g = max(0, min(255, g))
        b = max(0, min(255, b))
        pct = round(float(percentages[idx]), 1)
        hex_code = _rgb_to_hex(r, g, b)

        h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
        hues.append(h * 360.0)
        saturations.append(s)

        if _is_warm_color(r, g, b):
            warm_weight += pct
        else:
            cool_weight += pct

        dominant_palette.append({
            "hex": hex_code,
            "rgb": [r, g, b],
            "percentage": pct,
        })

    warm_pct = round(warm_weight, 1)
    cool_pct = round(cool_weight, 1)

    if warm_pct >= 60.0:
        color_temperature = "warm"
    elif cool_pct >= 60.0:
        color_temperature = "cool"
    else:
        color_temperature = "neutral_balanced"

    avg_saturation = float(np.mean(saturations))
    if avg_saturation < 0.18:
        saturation_level = "low_saturation"
    elif avg_saturation > 0.65:
        saturation_level = "vibrant"
    else:
        saturation_level = "muted_elegant"

    # Color Harmony analysis
    # Measure circular hue spread among non-neutral colors (s > 0.12)
    colored_hues = [h for h, s in zip(hues, saturations) if s > 0.12]

    if len(colored_hues) <= 1 or avg_saturation < 0.15:
        harmony_type = "Monochromatic"
        harmony_score = 9.2  # Monochromatic interior schemes are clean & cohesive
    else:
        hue_diffs = []
        for i in range(len(colored_hues)):
            for j in range(i + 1, len(colored_hues)):
                d = abs(colored_hues[i] - colored_hues[j])
                diff = min(d, 360.0 - d)
                hue_diffs.append(diff)

        max_diff = max(hue_diffs) if hue_diffs else 0.0

        if max_diff <= 45.0:
            harmony_type = "Analogous"
            harmony_score = 9.4  # Analogous palettes are very harmonious in hospitality
        elif 140.0 <= max_diff <= 190.0:
            harmony_type = "Complementary"
            harmony_score = 8.8  # Complementary provides pleasant focal contrast
        elif max_diff > 220.0:
            harmony_type = "Triadic"
            harmony_score = 7.8
        else:
            harmony_type = "Balanced Neutral"
            harmony_score = 8.9

    # Slight penalty for overly aggressive/garish saturation in lodging photography
    if avg_saturation > 0.70:
        harmony_score = max(1.0, harmony_score - 1.5)

    return {
        "color_harmony_score": round(harmony_score, 2),
        "dominant_palette": dominant_palette,
        "color_temperature": color_temperature,
        "warm_tone_pct": warm_pct,
        "cool_tone_pct": cool_pct,
        "harmony_type": harmony_type,
        "saturation_level": saturation_level,
    }
