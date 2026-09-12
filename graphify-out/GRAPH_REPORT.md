# Graph Report - project  (2026-09-12)

## Corpus Check
- 34 files · ~9,765 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 296 nodes · 422 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `921ebc0b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api.ts
- embed_image
- Layer 5 — Combine B3 Signals
- score_aesthetic
- detect_ai_generated
- combine_for_image
- detect_furniture
- main.py
- package.json
- test_stolen_image.py
- compilerOptions
- LodgeTrust Module B — Image Analysis & Signal Verification System
- __init__.py

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `analyze_images()` - 14 edges
3. `detect_ai_generated()` - 12 edges
4. `embed_image()` - 12 edges
5. `combine_for_image()` - 12 edges
6. `detect_furniture()` - 11 edges
7. `check_stolen()` - 11 edges
8. `score_aesthetic()` - 10 edges
9. `load_clip()` - 10 edges
10. `add_image()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `add_image_to_stolen_index()` --calls--> `add_image()`  [INFERRED]
  project/backend/api/main.py → project/backend/image_analysis/stolen_image.py
- `analyze_images()` --calls--> `detect_ai_generated()`  [INFERRED]
  project/backend/api/main.py → project/backend/image_analysis/ai_image_detector.py
- `analyze_images()` --calls--> `combine_for_image()`  [INFERRED]
  project/backend/api/main.py → project/backend/image_analysis/combine_signals.py
- `analyze_images()` --calls--> `combine_for_listing()`  [INFERRED]
  project/backend/api/main.py → project/backend/image_analysis/combine_signals.py
- `analyze_images()` --calls--> `check_stolen()`  [INFERRED]
  project/backend/api/main.py → project/backend/image_analysis/stolen_image.py

## Import Cycles
- None detected.

## Communities (15 total, 1 thin omitted)

### Community 0 - "api.ts"
Cohesion: 0.10
Nodes (27): App(), AiGenPanel(), AiGenPanelProps, AnalyzeResults(), AnalyzeResultsProps, ErrorBanner(), ErrorBannerProps, FeatureVectorPanel() (+19 more)

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

### Community 7 - "main.py"
Cohesion: 0.13
Nodes (30): add_image_to_stolen_index(), analyze_images(), get_expected_amenities(), health_check(), lifespan(), FastAPI HTTP Service for LodgeTrust Module B (Image Analysis). How to run…, Health check endpoint., Return the default expected amenities list for 3-star lodging. (+22 more)

### Community 8 - "package.json"
Cohesion: 0.08
Nodes (24): dependencies, react, react-dom, devDependencies, @types/react, @types/react-dom, typescript, vite (+16 more)

### Community 9 - "test_stolen_image.py"
Cohesion: 0.10
Nodes (33): Pre-seeds the FAISS index with demo images on startup., Pre-seed FAISS index with demo images so B1 queries return meaningful…, seed_dummy_index(), add_image(), add_images(), check_stolen(), clear_index(), _get_or_create_index() (+25 more)

### Community 10 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+13 more)

### Community 11 - "LodgeTrust Module B — Image Analysis & Signal Verification System"
Cohesion: 0.18
Nodes (10): 1. Start Backend API Service (FastAPI), 2. Start Frontend Web Interface (React + Vite), 6-Step End-to-End Demo Flow, Architecture Overview, Backend (`project/backend/`), Environment Variables, Frontend (`project/frontend/`), LodgeTrust Module B — Image Analysis & Signal Verification System (+2 more)

## Knowledge Gaps
- **68 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+63 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `analyze_images()` connect `main.py` to `test_stolen_image.py`, `detect_ai_generated`, `combine_for_image`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **Why does `combine_for_image()` connect `combine_for_image` to `embed_image`, `score_aesthetic`, `detect_furniture`, `main.py`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `check_stolen()` connect `test_stolen_image.py` to `embed_image`, `main.py`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `analyze_images()` (e.g. with `detect_ai_generated()` and `combine_for_image()`) actually correct?**
  _`analyze_images()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _68 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `api.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0953058321479374 - nodes in this community are weakly interconnected._
- **Should `embed_image` be split into smaller, more focused modules?**
  _Cohesion score 0.10256410256410256 - nodes in this community are weakly interconnected._