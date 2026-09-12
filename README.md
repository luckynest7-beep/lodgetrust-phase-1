# LodgeTrust Module B — Image Analysis & Signal Verification System

Full end-to-end system for LodgeTrust listing image verification, combining a 5-layer Python ML signal extraction library (`project/backend/image_analysis/`), a FastAPI HTTP REST backend service (`project/backend/api/`), and a React + Vite + TypeScript web interface (`project/frontend/`).

---

## Architecture Overview

```text
project/
├── backend/
│   ├── api/                     # FastAPI HTTP API Service (Part 1)
│   │   ├── main.py              # Application routes & CORS middleware
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   └── seed_index.py        # Startup FAISS pre-seeding helper
│   ├── image_analysis/          # Core ML Signal Library (Layers 1–5)
│   │   ├── clip_utils.py        # CLIP loader & embedding generator
│   │   ├── stolen_image.py      # B1 Stolen photo FAISS search
│   │   ├── ai_image_detector.py # B2 SigLIP2 AI image classifier
│   │   ├── style_tier.py        # B3a Zero-shot luxury/budget tier
│   │   ├── aesthetic_score.py   # B3b Aesthetic score predictor
│   │   ├── furniture_detector.py# B3c YOLOv8 furniture/amenity detector
│   │   └── combine_signals.py   # Feature vector combiner & aggregator
│   └── requirements.txt         # Backend API dependencies
└── frontend/                    # React + Vite + TypeScript Web UI (Part 2)
    ├── src/
    │   ├── App.tsx              # Main dashboard application
    │   ├── components/          # Signal panels, uploader, & index manager
    │   └── lib/api.ts           # Strongly typed API client
    ├── vite.config.ts           # Vite dev proxy configuration
    └── package.json
```

---

## Quick Start & Running Locally

### 1. Start Backend API Service (FastAPI)

```bash
cd project/backend
pip install -r requirements.txt
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

The HTTP API service will start on `http://127.0.0.1:8000`. You can inspect interactive OpenAPI docs at `http://127.0.0.1:8000/docs`.

### 2. Start Frontend Web Interface (React + Vite)

In a separate terminal window:

```bash
cd project/frontend
npm install
npm run dev
```

The web dashboard will open on `http://localhost:5173`. In development, Vite automatically proxies `/api/*` requests to `http://localhost:8000`.

---

## 6-Step End-to-End Demo Flow

To demonstrate the full capability of the system:

1. Open `http://localhost:5173` in your browser.
2. Drag and drop any listing photo into the upload dropzone.
3. Click **"Analyze"**. A spinner will indicate in-flight inference while CLIP, SigLIP2, and YOLOv8 models process the image.
4. Review the rendered results:
   - **B1 (Stolen Detection)**: Shows similarity score against demo listings (e.g. `L_demo_3`) with `✅ Original Photo` badge.
   - **B2 (AI Detection)**: Displays predicted label (e.g. `Real` vs `Artificial`), confidence, and probability distribution.
   - **B3 (Feature Vector)**: Renders `Style Tier` badge, `Aesthetic Score` meter, detected furniture tags, and `Amenity Completeness` bar.
5. Scroll down to the **FAISS Index Manager** panel, select the **same** photo, enter `Listing ID: L_my_test` and `Image ID: img_test_1`, and click **"Add Image to Index"**.
6. Upload the photo **again** and click **"Analyze"**. B1 will now immediately flag: **`🚨 FLAGGED (Reused) — Matched Listing L_my_test (Similarity 100%)`**.

---

## Environment Variables

### Backend (`project/backend/`)
- `FRONTEND_ORIGINS`: Comma-separated list of allowed CORS origins.
  - Default: `http://localhost:5173,http://localhost:3000`

### Frontend (`project/frontend/`)
- `VITE_API_BASE`: Base URL for HTTP API requests.
  - Default: `""` (empty string for same-origin dev proxy).

---

## Model Download & Caching Notes

On first execution, Hugging Face and Ultralytics auto-download required model weights into local caches (`~/.cache/huggingface/` and `~/.cache/ultralytics/`):
- `openai/clip-vit-large-patch14` (~1.71 GB)
- `prithivMLmods/AI-vs-Deepfake-vs-Real-v2.0` (~800 MB)
- `cafeai/cafe_aesthetic` (~350 MB)
- `yolov8l.pt` (~87 MB)

**Performance Note**: Initial model loading occurs during backend startup and first inference. All models use singleton caching in memory, making subsequent requests significantly faster.
