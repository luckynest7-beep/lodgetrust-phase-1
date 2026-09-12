# Graph Report - project  (2026-08-16)

## Corpus Check
- 14 files · ~4,163 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 137 nodes · 183 edges · 7 communities (6 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `921ebc0b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- embed_image
- Layer 4 — B3 Quality, Style & Amenity Signals
- score_aesthetic
- detect_ai_generated
- combine_signals.py
- detect_furniture
- test_stolen_image.py

## God Nodes (most connected - your core abstractions)
1. `embed_image()` - 12 edges
2. `detect_ai_generated()` - 11 edges
3. `load_clip()` - 10 edges
4. `check_stolen()` - 10 edges
5. `detect_furniture()` - 9 edges
6. `add_image()` - 9 edges
7. `score_aesthetic()` - 8 edges
8. `add_images()` - 8 edges
9. `classify_style_tier()` - 8 edges
10. `test_index_persistence()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `add_image()` --calls--> `embed_image()`  [EXTRACTED]
  project/backend/image_analysis/stolen_image.py → project/backend/image_analysis/clip_utils.py
- `check_stolen()` --calls--> `embed_image()`  [EXTRACTED]
  project/backend/image_analysis/stolen_image.py → project/backend/image_analysis/clip_utils.py
- `test_score_aesthetic_runs()` --calls--> `score_aesthetic()`  [EXTRACTED]
  project/backend/image_analysis/tests/test_aesthetic_score.py → project/backend/image_analysis/aesthetic_score.py
- `test_backup_candidate_model()` --calls--> `detect_ai_generated()`  [EXTRACTED]
  project/backend/image_analysis/tests/test_ai_detector.py → project/backend/image_analysis/ai_image_detector.py
- `test_consistent_output()` --calls--> `detect_ai_generated()`  [EXTRACTED]
  project/backend/image_analysis/tests/test_ai_detector.py → project/backend/image_analysis/ai_image_detector.py

## Import Cycles
- None detected.

## Communities (7 total, 1 thin omitted)

### Community 1 - "embed_image"
Cohesion: 0.10
Nodes (23): embed_image(), get_device(), load_clip(), Image, Path, CLIP model loading and image embedding utilities for LodgeTrust image analysis…, Return 'cuda' if GPU is available, else 'cpu'., Lazy-load and cache the CLIP model and processor. Returns: Tuple[CLIPModel,… (+15 more)

### Community 2 - "Layer 4 — B3 Quality, Style & Amenity Signals"
Cohesion: 0.10
Nodes (20): B3a — Style Tier (`style_tier.py`), B3b — Aesthetic Score (`aesthetic_score.py`), B3c — Furniture & Amenity Detector (`furniture_detector.py`), Cosine Similarity Threshold Tuning, Features & Key Functions, File Overview, Image Analysis Module (LodgeTrust Module B), Known Limitation: Concept Drift (+12 more)

### Community 3 - "score_aesthetic"
Cohesion: 0.16
Nodes (14): get_device(), load_aesthetic_predictor(), AutoImageProcessor, AutoModelForImageClassification, Image, Path, B3b Aesthetic score module. Note & Caveat: This aesthetic predictor reflects…, Return 'cuda' if GPU is available, else 'cpu'. (+6 more)

### Community 4 - "detect_ai_generated"
Cohesion: 0.12
Nodes (20): detect_ai_generated(), get_device(), load_ai_detector(), AutoImageProcessor, AutoModelForImageClassification, Image, Path, B2 AI-Generated Image Detection module using Hugging Face image classification… (+12 more)

### Community 6 - "detect_furniture"
Cohesion: 0.15
Nodes (15): detect_furniture(), load_yolo_model(), Image, Path, B3c YOLOv8 furniture and amenity detection module., Lazy-load and cache the YOLO model instance., Run YOLO object detection to identify furniture/amenities and compute a…, Unit tests for B3c furniture detector module (furniture_detector.py). (+7 more)

### Community 9 - "test_stolen_image.py"
Cohesion: 0.11
Nodes (30): add_image(), add_images(), check_stolen(), clear_index(), _get_or_create_index(), load_index(), Image, Path (+22 more)

## Knowledge Gaps
- **15 isolated node(s):** `Requirements & Installation`, `Running Layer 1 Smoke Test`, `Features & Key Functions`, `Cosine Similarity Threshold Tuning`, `Usage Example` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `embed_image()` connect `embed_image` to `test_stolen_image.py`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **What connects `Requirements & Installation`, `Running Layer 1 Smoke Test`, `Features & Key Functions` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `embed_image` be split into smaller, more focused modules?**
  _Cohesion score 0.10256410256410256 - nodes in this community are weakly interconnected._
- **Should `Layer 4 — B3 Quality, Style & Amenity Signals` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `detect_ai_generated` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._
- **Should `detect_furniture` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._
- **Should `test_stolen_image.py` be split into smaller, more focused modules?**
  _Cohesion score 0.11290322580645161 - nodes in this community are weakly interconnected._