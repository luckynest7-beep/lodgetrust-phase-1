# Image Analysis Module (LodgeTrust Module B)

Image analysis and verification module for LodgeTrust listing photos.

## Layer 1 — Setup & CLIP Loading

This directory contains the core CLIP loader utility (`clip_utils.py`) and module stubs for subsequent layers.

### Requirements & Installation

Dependencies are listed in `requirements.txt`:

```bash
pip install -r requirements.txt
```

### Running Layer 1 Smoke Test

Run pytest to verify that CLIP (`openai/clip-vit-large-patch14`) loads correctly via Hugging Face and produces L2-normalized image embeddings:

```bash
python -m pytest tests/test_clip_loads.py
```

---

## Layer 2 — B1 Stolen / Reused Image Detection

The `stolen_image.py` module uses CLIP image embeddings and FAISS (`IndexFlatIP`) for fast inner-product (cosine similarity) nearest-neighbor lookup to identify stolen or reused photos across listings.

### Features & Key Functions

- **`add_image(image, listing_id, image_id)`**: Embeds an image and indexes it under `(listing_id, image_id)`.
- **`add_images(images_with_meta)`**: Bulk indexes multiple images with metadata.
- **`check_stolen(image, listing_id, top_k=5, threshold=0.95)`**: Queries FAISS index for near duplicates. Automatically ignores matches from the **same** `listing_id` (self-match guard).
- **`save_index(path)` / `load_index(path)`**: Persists index (`.faiss`) and metadata sidecar (`.meta.json`) to disk.
- **`clear_index()`**: Resets in-memory index state.

### Cosine Similarity Threshold Tuning

- `DEFAULT_SIM_THRESHOLD = 0.95` (cosine similarity).
- Vectors are L2-normalized, making inner product equal to cosine similarity.
- Near-identical or copied photos typically achieve cosine similarity $\ge 0.95$. Threshold can be passed explicitly to `check_stolen(...)` if empirical tuning is desired.

### Usage Example

```python
from PIL import Image
from stolen_image import add_image, check_stolen

# 1. Index an existing listing image
photo1 = Image.open("listing1_bedroom.jpg")
add_image(photo1, listing_id="L101", image_id="img001")

# 2. Check a new image submitted under a different listing
photo2 = Image.open("listing2_bedroom.jpg")
result = check_stolen(photo2, listing_id="L202", threshold=0.95)

if result["is_flagged"]:
    print(f"Warning: Image copied from listing {result['matched_listing_id']} (Score: {result['similarity_score']:.4f})")
else:
    print("Image appears original.")
```

### Running Layer 2 Unit Tests

```bash
python -m pytest tests/test_stolen_image.py
```

---

## Layer 3 — B2 AI-Generated Image Detection

The `ai_image_detector.py` module detects synthetic/AI-generated listing images using Hugging Face image classification models.

### Primary vs. Backup Model Evaluation

- **Primary Model**: `prithivMLmods/AI-vs-Deepfake-vs-Real-v2.0` (SigLIP2-based 3-way classifier).
  - Selected as primary because of its modern SigLIP2 architecture and rich 3-way classification (`Artificial`, `Deepfake`, `Real`).
- **Backup Model**: `Smogy/SMOGY-Ai-images-detector` (ViT-based 2-way classifier).
  - Both candidates load cleanly out-of-the-box via `transformers.AutoModelForImageClassification` without custom code dependencies.

### Usage Example

```python
from PIL import Image
from ai_image_detector import detect_ai_generated

img = Image.open("hotel_room.jpg")
result = detect_ai_generated(img)

print(f"Predicted Label: {result['label']}")
print(f"Confidence: {result['confidence']:.4f}")
print(f"Full Scores: {result['scores']}")
```

### Known Limitation: Concept Drift

> [!WARNING]
> Public AI image detectors suffer concept drift as new generative architectures evolve (e.g., Flux, Midjourney v6, SD3). Classifier output must be treated as a **probabilistic signal** rather than an absolute truth. For trust scoring, lower the decision threshold if high recall (over-flagging) is preferred.

### Running Layer 3 Unit Tests

```bash
python -m pytest tests/test_ai_detector.py
```

---

## Layer 4 — B3 Quality, Style & Amenity Signals

Layer 4 implements three independent single-image scoring sub-modules feeding into the synthesis layer:

### B3a — Style Tier (`style_tier.py`)

- **Model**: Reuses `openai/clip-vit-large-patch14` via `clip_utils.load_clip()`.
- **Approach**: Multi-prompt zero-shot classification comparing image embeddings against text prompt pairs (`luxury` vs `budget` hotel room, `modern` vs `worn-out` furniture, `upscale suite` vs `basic motel`).
- **Output**: `{"style_tier": "luxury" | "budget", "style_confidence": float}`

```python
from style_tier import classify_style_tier
res_style = classify_style_tier("hotel_photo.jpg")
# => {"style_tier": "luxury", "style_confidence": 0.82}
```

### B3b — Aesthetic Score (`aesthetic_score.py`)

- **Model**: `cafeai/cafe_aesthetic` (loads via `AutoModelForImageClassification`).
- **Approach**: Outputs 1.0–10.0 aesthetic quality score derived from visual presentation probability.
- **Output**: `{"aesthetic_score": float}`

```python
from aesthetic_score import score_aesthetic
res_aesthetic = score_aesthetic("hotel_photo.jpg")
# => {"aesthetic_score": 7.45}
```

> [!NOTE]
> Aesthetic predictor scores reflect soft photo staging/lighting presentation quality. They are NOT a direct proxy for actual property market value.

### B3c — Furniture & Amenity Detector (`furniture_detector.py`)

- **Model**: COCO-pretrained `yolov8l.pt` via `ultralytics.YOLO` (large checkpoint for high detection accuracy).
- **Approach**: Object detection counting detected furniture classes and computing `amenity_completeness_score` against parameterizable expected amenities (default 3-star list: `["bed", "chair", "couch", "tv", "dining table"]`).
- **Output**: `{"detected_objects": {"bed": 1, "chair": 2}, "amenity_completeness_score": 0.40}`

```python
from furniture_detector import detect_furniture
res_furniture = detect_furniture("bedroom.jpg", expected_amenities=["bed", "chair", "tv"])
# => {"detected_objects": {"bed": 1, "chair": 2}, "amenity_completeness_score": 0.67}
```

### Running Layer 4 Unit Tests

```bash
python -m pytest tests/test_style_tier.py
python -m pytest tests/test_aesthetic_score.py
python -m pytest tests/test_furniture_detector.py
```

---

## Layer 5 — Combine B3 Signals

The `combine_signals.py` module aggregates B3a, B3b, and B3c quality, style, and amenity signals into a unified feature vector per image or per listing.

### Target Feature Vector Schema

```json
{
  "style_tier": "luxury",
  "style_confidence": 0.85,
  "aesthetic_score": 7.80,
  "detected_objects": {"bed": 1, "chair": 2, "tv": 1},
  "amenity_completeness_score": 0.60
}
```

### Key Functions & Listing Aggregation Rules

- **`combine_for_image(image, expected_amenities=None)`**: Evaluates B3a, B3b, and B3c on a single image and produces the 5-key feature vector.
- **`combine_for_listing(images, expected_amenities=None)`**: Aggregates signals across multiple listing photos:
  - `style_tier`: Majority vote across photos (ties resolve to `"luxury"`).
  - `style_confidence`: Mean of per-photo confidences.
  - `aesthetic_score`: Mean of per-photo aesthetic scores.
  - `detected_objects`: Class count summation (union) across all photos.
  - `amenity_completeness_score`: Re-computed on the aggregated `detected_objects` count dictionary.

### Error Resilience

If any sub-module encounters an error during execution, `combine_signals.py` captures the error under an `"errors"` list key and returns all remaining available feature signals without crashing.

### Downstream Integration Handoff

The output feature vector produced by `combine_signals.py` is consumed directly by:
- **Module C (Price Plausibility Regressor)**: Uses `style_tier`, `aesthetic_score`, and `detected_objects` as input features for price estimation.
- **Module D (Compliance RAG)**: Cross-checks `amenity_completeness_score` against retrieved HRACC compliance criteria.

### Usage Example

```python
from combine_signals import combine_for_listing

listing_photos = ["bedroom.jpg", "bathroom.jpg", "living_room.jpg"]
feature_vector = combine_for_listing(listing_photos)

print(f"Style Tier: {feature_vector['style_tier']} (Conf: {feature_vector['style_confidence']:.2f})")
print(f"Aesthetic Score: {feature_vector['aesthetic_score']}")
print(f"Detected Amenities: {feature_vector['detected_objects']}")
print(f"Amenity Completeness Score: {feature_vector['amenity_completeness_score']:.2f}")
```

### Running Layer 5 & Full Module Test Suite

```bash
# Run Layer 5 unit tests
python -m pytest tests/test_combine_signals.py

# Run full module test suite across all 5 layers
python -m pytest tests/ -v
```

---

### File Overview

- `clip_utils.py`: Shared CLIP model loader (`load_clip()`) with singleton caching and `embed_image()` utility.
- `stolen_image.py`: B1 FAISS near-duplicate stolen image detection.
- `ai_image_detector.py`: B2 AI-generated image classification wrapper.
- `style_tier.py`: B3a zero-shot luxury/budget style tier classification.
- `aesthetic_score.py`: B3b aesthetic quality predictor.
- `furniture_detector.py`: B3c YOLOv8 furniture/amenity detector.
- `combine_signals.py`: Layer 5 signal aggregation orchestrator.
- `tests/test_clip_loads.py`: Layer 1 smoke test.
- `tests/test_stolen_image.py`: Layer 2 unit tests.
- `tests/test_ai_detector.py`: Layer 3 unit tests.
- `tests/test_style_tier.py`: Layer 4 B3a unit tests.
- `tests/test_aesthetic_score.py`: Layer 4 B3b unit tests.
- `tests/test_furniture_detector.py`: Layer 4 B3c unit tests.
- `tests/test_combine_signals.py`: Layer 5 unit tests.
