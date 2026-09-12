# Graph Report - project  (2026-08-16)

## Corpus Check
- 15 files · ~5,334 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 160 nodes · 220 edges · 7 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `921ebc0b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- embed_image
- Layer 5 — Combine B3 Signals
- score_aesthetic
- detect_ai_generated
- combine_for_image
- detect_furniture
- test_stolen_image.py

## God Nodes (most connected - your core abstractions)
1. `embed_image()` - 12 edges
2. `detect_ai_generated()` - 11 edges
3. `combine_for_image()` - 11 edges
4. `detect_furniture()` - 11 edges
5. `score_aesthetic()` - 10 edges
6. `load_clip()` - 10 edges
7. `check_stolen()` - 10 edges
8. `classify_style_tier()` - 10 edges
9. `add_image()` - 9 edges
10. `combine_for_listing()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `combine_for_image()` --calls--> `score_aesthetic()`  [EXTRACTED]
  project/backend/image_analysis/combine_signals.py → project/backend/image_analysis/aesthetic_score.py
- `add_image()` --calls--> `embed_image()`  [EXTRACTED]
  project/backend/image_analysis/stolen_image.py → project/backend/image_analysis/clip_utils.py
- `check_stolen()` --calls--> `embed_image()`  [EXTRACTED]
  project/backend/image_analysis/stolen_image.py → project/backend/image_analysis/clip_utils.py
- `combine_for_image()` --calls--> `detect_furniture()`  [EXTRACTED]
  project/backend/image_analysis/combine_signals.py → project/backend/image_analysis/furniture_detector.py
- `combine_for_image()` --calls--> `classify_style_tier()`  [EXTRACTED]
  project/backend/image_analysis/combine_signals.py → project/backend/image_analysis/style_tier.py

## Import Cycles
- None detected.

## Communities (7 total, 0 thin omitted)

### Community 1 - "embed_image"
Cohesion: 0.10
Nodes (23): embed_image(), get_device(), load_clip(), Image, Path, CLIP model loading and image embedding utilities for LodgeTrust image analysis…, Return 'cuda' if GPU is available, else 'cpu'., Lazy-load and cache the CLIP model and processor. Returns: Tuple[CLIPModel,… (+15 more)

### Community 2 - "Layer 5 — Combine B3 Signals"
Cohesion: 0.07
Nodes (27): B3a — Style Tier (`style_tier.py`), B3b — Aesthetic Score (`aesthetic_score.py`), B3c — Furniture & Amenity Detector (`furniture_detector.py`), Cosine Similarity Threshold Tuning, Downstream Integration Handoff, Error Resilience, Features & Key Functions, File Overview (+19 more)

### Community 3 - "score_aesthetic"
Cohesion: 0.16
Nodes (14): get_device(), load_aesthetic_predictor(), AutoImageProcessor, AutoModelForImageClassification, Image, Path, B3b Aesthetic score module. Note & Caveat: This aesthetic predictor reflects…, Return 'cuda' if GPU is available, else 'cpu'. (+6 more)

### Community 4 - "detect_ai_generated"
Cohesion: 0.12
Nodes (20): detect_ai_generated(), get_device(), load_ai_detector(), AutoImageProcessor, AutoModelForImageClassification, Image, Path, B2 AI-Generated Image Detection module using Hugging Face image classification… (+12 more)

### Community 5 - "combine_for_image"
Cohesion: 0.16
Nodes (16): combine_for_image(), combine_for_listing(), Image, Path, Layer 5 Signal Combiner — Aggregates B3a, B3b, and B3c quality, style, and…, Run B3a, B3b, B3c on a single image and merge into a feature vector. Resilience…, Run combine_for_image on each image and aggregate signals across a listing.…, Unit tests for Layer 5 signal combiner module (combine_signals.py). (+8 more)

### Community 6 - "detect_furniture"
Cohesion: 0.15
Nodes (15): detect_furniture(), load_yolo_model(), Image, Path, B3c YOLOv8 furniture and amenity detection module., Lazy-load and cache the YOLO model instance., Run YOLO object detection to identify furniture/amenities and compute a…, Unit tests for B3c furniture detector module (furniture_detector.py). (+7 more)

### Community 9 - "test_stolen_image.py"
Cohesion: 0.11
Nodes (30): add_image(), add_images(), check_stolen(), clear_index(), _get_or_create_index(), load_index(), Image, Path (+22 more)

## Knowledge Gaps
- **21 isolated node(s):** `Requirements & Installation`, `Running Layer 1 Smoke Test`, `Features & Key Functions`, `Cosine Similarity Threshold Tuning`, `Usage Example` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `classify_style_tier()` connect `embed_image` to `combine_for_image`?**
  _High betweenness centrality (0.265) - this node is a cross-community bridge._
- **Why does `embed_image()` connect `embed_image` to `test_stolen_image.py`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Why does `combine_for_image()` connect `combine_for_image` to `embed_image`, `score_aesthetic`, `detect_furniture`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **What connects `Requirements & Installation`, `Running Layer 1 Smoke Test`, `Features & Key Functions` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `embed_image` be split into smaller, more focused modules?**
  _Cohesion score 0.10256410256410256 - nodes in this community are weakly interconnected._
- **Should `Layer 5 — Combine B3 Signals` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `detect_ai_generated` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._