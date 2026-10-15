# LodgeTrust - Comprehensive Agent Handoff Document

## Project Overview
**LodgeTrust** is a multimodal AI-powered web platform designed to evaluate the authenticity, quality, and regulatory compliance of hotel and lodging listings, as well as enable map-based lodging discovery across India. The application operates in two interconnected phases:

1. **Phase 1: Property Trust Auditor** — An automated auditing engine that ingests listing room photos, descriptions, claimed prices, claimed star ratings, and geographical locations to evaluate visual authenticity, detect stolen/reused photos, detect AI-generated deepfakes, assess room aesthetic quality & amenity completeness, cross-reference against official government compliance standards (HRACC), evaluate regional pricing reasonableness, and output an overall **Trust Evaluation Score**.
2. **Phase 2: Hotel & Lodge Discovery (Mapbox)** — An interactive geospatial exploration portal that plots authentic hotel and lodging properties across major Indian destinations (Chennai, Goa, Mumbai, Delhi NCR, Bengaluru, Shimla, Jaipur, Ooty) with custom trust score markers, multi-basemap styling (Streets, Dark, Satellite), side-by-side comparison of up to 3 properties, and a direct one-click bridge to the Phase 1 auditor.

The architecture is split into a **Vite + React + TypeScript frontend** (styled with Apple Human Interface Guidelines dark-mode glassmorphism) and a **FastAPI (Python) backend** orchestrating specialized machine learning pipelines, ChromaDB vector RAG, FAISS visual search, and Google Gemini LLMs.

---

## Core Modules & Pipelines

### 1. Module B (Vision & Signal Extraction)
- **Directory**: `backend/image_analysis/`
- **Sub-components**:
  - **B1 (Stolen / Reused Image Detection)** (`stolen_image.py`):
    - Generates 768-dimensional normalized embeddings using OpenAI CLIP (`openai/clip-vit-large-patch14`).
    - Performs sub-millisecond cosine similarity search across an indexed FAISS database.
    - Endpoints: `POST /api/stolen/add` (add image to index), `POST /api/stolen/reset` (reset and re-seed index).
    - Pre-seeded on startup (`seed_index.py`) with 10 duplicate test listings from `backend/demo_images/duplicate_1000.jpg` to `duplicate_1009.jpg`.
  - **B2 (AI-Generated Image Detection)** (`ai_image_detector.py`):
    - Uses a fine-tuned SigLIP2 vision transformer (`prithivMLmods/deepfake-detector-model-v1`).
    - Classifies images as `Real` or `Artificial` with confidence percentage and detailed probability distribution to catch synthetic or AI-rendered hotel rooms.
  - **B3 (Listing Feature Vector & Room Quality)**:
    - **B3a Style Tier** (`style_tier.py`): Zero-shot CLIP classification into 4 lodging tiers (*Luxury, Modern, Rustic, Budget*).
    - **B3b Aesthetic Score** (`aesthetic_score.py`): Predicts visual presentation and photographic quality on a 1.0–10.0 scale using a fine-tuned BEiT model trained on the AVA aesthetic benchmark dataset.
    - **B3c Amenity Completeness** (`furniture_detector.py`): Runs Ultralytics YOLO11 Large (`yolo11l.pt`) to detect objects (e.g., bed, tv, couch, chair, dining table, refrigerator, sink) and evaluates them against star-tier expected amenity checklists.
    - **Lighting & Color Analysis** (`lighting_analysis.py`, `color_analysis.py`): Evaluates exposure, brightness, contrast, and color palette temperature.
  - **Multi-Image Listing Aggregator** (`combine_signals.py`):
    - Function `combine_for_listing(images)` aggregates detections, pools amenities, averages aesthetic scores, and produces a single unified listing feature vector across multi-photo uploads.

---

### 2. Module D (Regulatory Compliance Check / RAG)
- **Directory**: `backend/compliance_rag/`
- **Functionality**: A Retrieval-Augmented Generation (RAG) system auditing listings against the Ministry of Tourism (Government of India) HRACC (*Hotel & Restaurant Approval & Classification Committee*) star-classification guidelines.
- **Knowledge Base & Vector Store**:
  - ChromaDB persistent collection (`backend/compliance_rag/chroma_db/`) containing 420+ indexed semantic chunks derived from HRACC guidelines.
  - Embeddings generated via `sentence-transformers/all-mpnet-base-v2`.
  - Covers structural requirements, safety/fire standards, FSSAI food hygiene licensing, room dimensions, bathroom fittings, and consumer protection provisions.
- **Hybrid Multi-Modal Compliance Matching**:
  - In `backend/api/main.py`, visual YOLO detections are augmented with text-extracted claims parsed from the listing description (e.g., *Free WiFi, Air Conditioning, Breakfast Service, Swimming Pool, Fitness Center / Gym, Television, Electric Kettle, In-room Safe, Parking Facility*). This ensures off-camera facilities are not erroneously flagged as missing when explicitly claimed in the listing.
  - Prompts Google Gemini (primary: `gemini-3.8-flash`, fallback: `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`) to cross-reference claimed and detected features against retrieved HRACC requirements.
  - Built-in offline fallback: If `GEMINI_API_KEY` is not configured or network requests fail, `compliance_check.py` falls back to deterministic heuristic/semantic keyword matching.
- **Output Schema**:
  - `star_claimed`, `criteria_total`, `criteria_met`, `compliance_ratio` (percentage), `met_list` (standards satisfied), and `missing` (standards unconfirmed in photo/description).
  - UI copy specifically frames missing criteria as *"Not Observed in Photo(s) / Unconfirmed"* to avoid false assertions when listings only provide partial room photography.

---

### 3. Module E (LLM Trust Evaluation Orchestrator)
- **Directory**: `backend/trust_evaluator.py`
- **Functionality**: The supreme orchestrator that synthesizes visual signals, compliance data, and listing claims into a unified trust verdict.
- **Workflow**:
  - Feeds the listing description, claimed price, food inclusion, claimed star rating, and room image directly into Gemini 3.8-Flash.
  - Acts as an independent hospitality pricing analyst to formulate a fair market price estimate for the room.
  - Evaluates **Price Plausibility Score** (comparing claimed tariff vs estimated fair price).
  - Evaluates **Description Match Score** (catching exaggerations, mismatch between photo evidence and textual claims).
  - Generates a holistic **Final Trust Percentage** (0–100%) and analytical audit notes.
- **Pipeline Latency & Zero-Redundancy Optimization (Commit `c3aecb7`)**:
  - `analyze_hotel_review()` accepts `precomputed_mod_b` and `precomputed_mod_d`.
  - In `/api/analyze`, the already-computed visual signals from Module B and compliance results from Module D are passed directly into Module E. This completely eliminates redundant duplicate executions of heavy vision models and RAG lookups.
  - Direct in-memory JPEG streaming: The uploaded image is converted to a JPEG byte stream via `io.BytesIO` rather than writing and unlinking temporary files on disk.

---

### 4. Regional Location Pricing Benchmark (RAG Module)
- **Files**: `backend/compliance_rag/location_pricing.py`, `backend/compliance_rag/location_benchmarks.json`
- **Functionality**:
  - Maintains regional tariff reference data across major Indian hospitality markets (*Goa, Mumbai, Delhi NCR, Bengaluru, Shimla, Rajasthan Heritage / Jaipur, Chennai, Ooty / Hill Stations, National Tier-2/3*).
  - Computes star-specific min/median/max baseline price ranges and calculates deviation from national/regional hospitality indices.
  - Categorizes tariffs: `IN_RANGE` (*Within Expected National Tariff*), `PREMIUM_PRICED` (*Significantly Higher than National Benchmark*), `HIGHLY_INFLATED`, or `LOW_VALUE`.
  - Exposed via `GET /api/location-price` and integrated automatically into `POST /api/analyze`.
  - Rendered in frontend via the Apple-styled `LocationPricingPanel.tsx`.

---

### 5. Phase 2: Hotel & Lodge Discovery (Mapbox Integration)
- **Directory**: `backend/hotel_database.py`, `frontend/src/components/HotelDiscoveryView.tsx`, `frontend/src/components/HotelMap.tsx`
- **Database & Data Sources**:
  - SQLite database at `backend/lodgetrust.db` storing verified hotels across Indian travel hubs with exact `[longitude, latitude]` coordinates, star categories, accommodation types (Hotel, Resort, Heritage Palace, Boutique Lodge), pricing, and benchmark audit statuses (`DEMO_BENCHMARK`).
  - Authentic OpenStreetMap/government GeoJSON datasets stored in `data/Map_Data/` (`chennai_hotels.geojson`, `chennai_data.geojson`, `chennai_guest.geojson`) and served via `GET /api/geojson/chennai`.
- **Interactive Map Experience**:
  - Built with Mapbox GL JS (`mapbox-gl`, `@mapbox/search-js-react`).
  - Supports 3 basemap layer styles: Streets, Dark, and Satellite.
  - Custom trust score map badges (`94%`, `86%`, etc.) with hover animations and isolated inner badge scaling to prevent map marker snapping bugs.
  - Interactive popups showing hotel thumbnail, star badge, price per night, and direct buttons to compare or audit.
- **Comparison Matrix & Phase 1 Bridge**:
  - Side-by-side comparison modal allowing users to select and compare up to 3 properties simultaneously across star rating, price, amenities, and trust score.
  - "Audit Listing" button transfers selected hotel properties (prefilling location, description, price, star rating, and coordinates) straight into the Phase 1 Auditor form without manual re-entry.

---

## What Has Been Done in Recent Sessions

1. **Backend Model Migration**:
   - Upgraded all LLM prompts from deprecated `gemini-1.5-pro` and `gemini-2.5-pro` to the stable `gemini-3.8-flash` across `backend/trust_evaluator.py` and `compliance_rag/compliance_check.py`.
2. **Pathing & ChromaDB Fixes**:
   - Converted ChromaDB initialization to dynamic absolute path resolution in `build_index.py`, `retrieval.py`, and `compliance_check.py` to prevent "Collection does not exist" errors regardless of working directory.
3. **API Schema & State Serialization**:
   - Ensured `met_list` (satisfied HRACC criteria) is serialized across `backend/api/schemas.py`, `backend/api/main.py`, and `frontend/src/lib/api.ts`.
4. **Apple HIG Frontend UI/UX Overhaul**:
   - Implemented Apple-style glassmorphism with dark-mode tokens (`#1c1c1e`, `#2c2c2e`, `#0a84ff`, `#34c759`, `#ff9f0a`).
   - Created dynamic progress bars, glassmorphic metric cards, and responsive side-by-side flex layouts.
5. **Data Cleanup & Security**:
   - Purged testing artifacts and ensured `.env` and SQLite cache files remain safely tracked by `.gitignore`.
6. **Compliance RAG Index Repair & Offline Fallback**:
   - Rebuilt ChromaDB vector index in `compliance_rag/` with all 420 regulatory criteria chunks.
   - Added robust local semantic/heuristic fallback so compliance checking never crashes if `GEMINI_API_KEY` is missing or offline.
7. **RAG-Powered Regional Location Price Benchmarking**:
   - Implemented `location_benchmarks.json` and `location_pricing.py`.
   - Exposed `GET /api/location-price` and integrated `LocationPricingPanel.tsx` in frontend.
8. **Phase 2: Hotel & Lodge Discovery Feature**:
   - Implemented `hotel_database.py` with SQLite backing (`lodgetrust.db`).
   - Added FastAPI endpoints `GET /api/cities`, `GET /api/hotels`, and `GET /api/geojson/chennai`.
   - Built `HotelDiscoveryView.tsx` with Mapbox GL, basemap switcher, custom trust markers, popups, and 3-hotel comparison modal.
9. **Multi-Image Upload Gallery Grid**:
   - Upgraded Phase 1 uploader in `TrustEvaluationForm.tsx` to support multiple file uploads with a preview thumbnail grid and individual photo removal.
10. **Pipeline Latency & Zero-Redundancy Optimization (Commit `c3aecb7`)**:
    - Eliminated duplicate execution of Module B and Module D by passing `precomputed_mod_b` and `precomputed_mod_d` into `analyze_hotel_review()`.
    - Switched image serialization to in-memory `io.BytesIO` buffers, removing temporary disk I/O latency.
11. **Compliance 0-Amenities False-Negative Bug Fix**:
    - Added description text parsing in `main.py` for standard hotel amenities (wifi, ac, pool, breakfast, gym, etc.) so that off-camera features mentioned in listings are merged with YOLO detections.
    - Updated UI copy in `CompliancePanel.tsx` to read *"Not Observed in Photo(s)"* instead of misleading *"Missing"* labels.
12. **Mapbox Marker Snapping Fix & Offline Token Safety**:
    - Isolated CSS transformations to the inner badge in `HotelMap.tsx` / `HotelDiscoveryView.tsx` to eliminate hover jitter.
    - Handled empty Mapbox token fallback gracefully (`token || ''`) to avoid console error spam when offline or without an active API key.
13. **Dynamic City Coordinates & Benchmark Labeling Refinement**:
    - Replaced hardcoded city coordinates in `TrustEvaluationForm.tsx` with dynamic coordinates fetched directly from `GET /api/cities`.
    - Updated hotel database and UI labels from "Phase 1 Verified" to "◈ Benchmark Score (Sample)" to clearly distinguish pre-seeded benchmark data from live auditor sessions.

---

## API Surface Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check returning service status. |
| `GET` | `/api/expected-amenities` | Retrieves default expected amenity checklist (3-star standard). |
| `POST` | `/api/analyze` | Multimodal analysis endpoint: executes B1, B2, B3, Module D (RAG), Module E (LLM Trust Score), and Location Price Benchmark. |
| `POST` | `/api/stolen/add` | Adds an uploaded image to the FAISS index with `listing_id` and `image_id`. |
| `POST` | `/api/stolen/reset` | Resets FAISS index and re-seeds with 10 demo reference images. |
| `GET` | `/api/location-price` | Evaluates price plausibility against regional hospitality tariff benchmarks. |
| `GET` | `/api/cities` | Returns list of supported cities with center `[lng, lat]` coordinates and property counts. |
| `GET` | `/api/hotels` | Queries hotel database with filters (city, accommodation type, star rating, verified benchmark status) and sorting. |
| `GET` | `/api/geojson/chennai` | Returns authentic GeoJSON feature collection for Chennai hotels from `Map_Data/`. |

---

## How to Run the Project Locally

### Prerequisites
- Python 3.10+ with `pip`
- Node.js 18+ with `npm`
- Valid `GEMINI_API_KEY` (configured in `backend/.env` or project root `.env`)
- (Optional) `VITE_MAPBOX_TOKEN` (configured in `frontend/.env` for interactive satellite/vector Mapbox layers)

### 1. Backend Service (FastAPI)
```bash
cd project/backend

# Activate virtual environment if configured
# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```
- API root: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Web Interface (Vite + React)
```bash
cd project/frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```
- Web Application: `http://localhost:5173` (proxies `/api/*` to `http://localhost:8000`)

### 3. Running Verification & Test Suites
```bash
# Run Module B image analysis test suite (18 unit tests)
python -m pytest project/backend/image_analysis/tests/

# Run Module D Compliance RAG & ChromaDB verification script
python project/backend/compliance_rag/tests/verify_rag.py
```

---

## Engineering Guidelines for Next Agent

1. **Strict Type Safety Across HTTP Boundary**:
   - Whenever updating API payloads or state, synchronize both `backend/api/schemas.py` and `frontend/src/lib/api.ts`.
2. **Preserve Apple HIG Aesthetics**:
   - The UI strictly adheres to Apple HIG dark-mode tokens (`App.css`). Use glassmorphic card containers (`rgba(28, 28, 30, 0.7)`), subtle borders (`rgba(255, 255, 255, 0.08)`), SF Pro / Inter typography, and curated semantic badges (`#0a84ff`, `#34c759`, `#ff9f0a`, `#ff453a`).
3. **Keep Latency Optimization Intact**:
   - Do **not** re-invoke `combine_for_image` or `check_compliance` inside `trust_evaluator.py`. Always pass through the precomputed feature dictionaries (`precomputed_mod_b` and `precomputed_mod_d`) from `/api/analyze`.
4. **Environment Fallbacks**:
   - Ensure the application remains fully bootable and operable even if API keys (Gemini, Mapbox) are temporarily unset. Always maintain graceful fallback states.
