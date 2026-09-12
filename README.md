# LodgeTrust Module B — Image Analysis & Signal Verification System

Full end-to-end system for LodgeTrust listing image verification, combining a 5-layer Python ML signal extraction library (`backend/image_analysis/`), an AVA aesthetic fine-tuning workspace (`fine_tune_aesthetic/`), a FastAPI HTTP REST backend service (`backend/api/`), and a React + Vite + TypeScript web interface (`frontend/`).

---

## Repository Structure

```text
project/
├── backend/                             # Python FastAPI Service & ML Signal Pipeline
│   ├── api/                             # FastAPI HTTP REST Service
│   │   ├── main.py                      # Application routes & CORS middleware
│   │   ├── schemas.py                   # Pydantic request/response schemas
│   │   └── seed_index.py                # Startup FAISS pre-seeding helper
│   ├── image_analysis/                  # 5-Layer ML Signal Pipeline
│   │   ├── clip_utils.py                # CLIP loader & 768-dim embedding generator
│   │   ├── stolen_image.py              # B1 Stolen photo FAISS cosine search
│   │   ├── ai_image_detector.py         # B2 Deepfake Detector (prithivMLmods)
│   │   ├── style_tier.py                # B3a Zero-shot luxury/budget tier classifier
│   │   ├── aesthetic_score.py           # B3b Fine-tuned aesthetic score predictor
│   │   ├── furniture_detector.py        # B3c YOLO11l furniture/amenity detector
│   │   ├── combine_signals.py           # Layer 5 Signal aggregator & feature combiner
│   │   └── tests/                       # Complete Pytest test suite (18 unit tests)
│   └── requirements.txt                 # Backend Python dependencies
├── fine_tune_aesthetic/                 # Aesthetic Model Fine-Tuning Workspace
│   ├── data/                            # 2,000 AVA dataset images & train/val labels
│   ├── scripts/                         # Training & dataset download scripts
│   ├── model/                           # Fine-tuned BEiT checkpoint & processor
│   ├── requirements.txt                 # Fine-tuning dependencies
│   └── README.md                        # Fine-tuning guide (Local & Google Colab)
├── frontend/                            # React + Vite + TypeScript Web UI
│   ├── src/                             # Dashboard, signal cards, uploader, & index manager
│   ├── vite.config.ts                   # Vite dev proxy configuration
│   └── package.json
└── README.md
```

---

## Machine Learning Models Overview

| Signal Layer | Model / Architecture | Checkpoint / Source | Description |
| :--- | :--- | :--- | :--- |
| **B1 Stolen Image Detection** | OpenAI CLIP (ViT-L/14) + FAISS | `openai/clip-vit-large-patch14` | Generates 768-dim embeddings indexed in FAISS for sub-millisecond duplicate detection. |
| **B2 AI-Generated Detection** | SigLIP2 Deepfake Detector | `prithivMLmods/deepfake-detector-model-v1` | Fine-tuned SigLIP2 vision transformer detecting AI-generated, synthetic, and deepfaked imagery. |
| **B3a Style Tier** | OpenAI CLIP (Zero-Shot) | `openai/clip-vit-large-patch14` | Zero-shot visual style categorization (*Luxury, Modern, Rustic, Budget*). |
| **B3b Aesthetic Score** | BEiT Regression | `fine_tune_aesthetic/model/` | Predicts aesthetic presentation score (1.0–10.0 scale) fine-tuned on AVA dataset. |
| **B3c Amenity Completeness** | Ultralytics YOLO11 Large | `yolo11l.pt` (~54 MB) | SOTA object detector with C3k2/C2PSA attention for precise amenity & furniture detection. |

---

## Quick Start & Running Locally

### 1. Start Backend API Service (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

* API Service: `http://127.0.0.1:8000`
* Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### 2. Start Frontend Web Interface (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

* Web Dashboard: `http://localhost:5173` (proxies `/api/*` to `http://localhost:8000`)

### 3. Run Backend Test Suite

```bash
python -m pytest backend/image_analysis/tests/
```

---

## 6-Step End-to-End Demo Flow

1. Open `http://localhost:5173` in your browser.
2. Drag and drop any listing photo into the upload dropzone.
3. Click **"Analyze"**. The inference pipeline processes the image across all 5 signal layers.
4. Review the rendered results:
   - **B1 (Stolen Detection)**: Shows similarity score against demo listings with `✅ Original Photo` badge.
   - **B2 (AI Detection)**: Displays predicted label (`Real` vs `Artificial`), confidence, and probability distribution.
   - **B3 (Feature Vector)**: Renders `Style Tier` badge, `Aesthetic Score` meter, detected furniture tags, and `Amenity Completeness` bar.
5. Scroll to the **FAISS Index Manager** panel, select the **same** photo, enter `Listing ID: L_my_test` and `Image ID: img_test_1`, and click **"Add Image to Index"**.
6. Upload the photo **again** and click **"Analyze"**. B1 will now immediately flag: **`🚨 FLAGGED (Reused) — Matched Listing L_my_test (Similarity 100%)`**.
