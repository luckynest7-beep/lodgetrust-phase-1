# LodgeTrust - Agent Handoff Document

## Project Overview
LodgeTrust is a multimodal AI-powered web application designed to evaluate the authenticity, quality, and compliance of hotel/lodging listings. The system acts as an automated auditor that takes user-uploaded images, descriptions, claimed prices, and claimed star ratings to calculate a unified "Trust Evaluation Score."

The architecture is split into a **Vite + React + TypeScript frontend** and a **FastAPI (Python) backend** that orchestrates various machine learning and LLM pipelines.

## Core Modules & Pipelines

The system is built upon three primary analysis modules that are executed sequentially:

### 1. Module B (Vision & Signal Extraction)
- **Directory**: `backend/image_analysis/`
- **Functionality**: Uses various HuggingFace computer vision models to analyze the uploaded image.
- **Extracts**: 
  - **Aesthetic Score**: Evaluates the image's visual quality out of 10.
  - **Style Tier**: Classifies the room (e.g., budget, midscale, upscale, luxury).
  - **Amenities**: Detects objects in the room using YOLO object detection (e.g., 'tv', 'bed', 'chair').
  - **Lighting & Color**: Analyzes exposure and color palettes.

### 2. Module D (Regulatory Compliance Check / RAG)
- **Directory**: `backend/compliance_rag/`
- **Functionality**: A Retrieval-Augmented Generation (RAG) system powered by ChromaDB.
- **Workflow**: 
  - Retrieves the official HRACC (Hotel & Restaurant Approval & Classification Committee) guidelines for the user's claimed star rating (e.g., 4-star).
  - Prompts a Gemini 3.8-Flash LLM to cross-reference the amenities detected by Module B against the official regulatory requirements.
  - Returns a `compliance_ratio` and a detailed list of *Criteria Met* and *Criteria Missing*.

### 3. Module E (LLM Trust Evaluation)
- **Directory**: `backend/trust_evaluator.py`
- **Functionality**: The final orchestrator that calculates the ultimate Trust Score.
- **Workflow**:
  - Feeds the user's description, claimed price, and food-inclusion details, alongside the Module B visual extraction data and the image itself, into Gemini 3.8-Flash.
  - The LLM acts as a pricing analyst to independently estimate a "reasonable price" for the room.
  - It compares the estimated price to the user's claimed price to generate a **Price Plausibility Score**.
  - It verifies if the user's text description actually matches the visual evidence (e.g., catching exaggerations).
  - Outputs a final **Trust Percentage** and detailed analysis notes explaining the verdict.

## What We Have Done in Recent Sessions

1. **Backend Model Upgrades**: Migrated all LLM endpoints from the deprecated `gemini-1.5-pro` and `gemini-2.5-pro` to the stable `gemini-3.8-flash` to resolve 404 crashes during Module D and E execution.
2. **Pathing Fixes**: Fixed absolute pathing for ChromaDB initialization in `build_index.py` and `retrieval.py` to prevent "Collection does not exist" errors when running the API server from different directories.
3. **API Schema & State Mapping**: 
   - Fixed an issue where the backend was dropping the `met_list` (met HRACC criteria) during the API response.
   - Updated `schemas.py`, `main.py`, and the frontend `api.ts` to properly serialize and pass `met_list` to the frontend.
4. **UI/UX Overhaul (Apple HIG)**: 
   - Rewrote `frontend/src/components/CompliancePanel.tsx` to feature Apple-style glassmorphism, dynamic progress bars, and properly render both missing and *met* regulatory criteria.
   - Overhauled the final Output column in `frontend/src/App.tsx`. Fixed flexbox sizing so the output panel matches the input panel height.
   - Enclosed the Module E LLM Verdict in a prominent blue callout box to make it easily readable.
5. **Data Cleanup**: Purged testing/mock files (`mock_data/`) from the project root and ensured `.env` keys are safely tracked by `.gitignore`.
6. **Compliance RAG Index Repair & Robust Local Fallback**:
   - Rebuilt the corrupted ChromaDB vector index in `compliance_rag/` (indexed all 420 regulatory criteria chunks).
   - Upgraded `compliance_check.py` to support fallback semantic/keyword matching if `GEMINI_API_KEY` is absent or network fails, ensuring the RAG auditor runs reliably in all environments.
7. **RAG-Powered Location Price Range Benchmark**:
   - Implemented `compliance_rag/location_benchmarks.json` and `compliance_rag/location_pricing.py` providing vectorized regional hospitality tariff benchmarks (Goa, Mumbai, Delhi NCR, Bengaluru, Shimla, Rajasthan Heritage, etc.).
   - Exposed `GET /api/location-price` and integrated location price estimation directly into `/api/analyze`.
   - Created Apple-style `LocationPricingPanel.tsx` in the frontend and added Location inputs with quick-selection chips in `TrustEvaluationForm.tsx`.

8. **Phase 2: Hotel & Lodge Discovery Feature (Mapbox Integration)**:
   - Established SQLite database `backend/lodgetrust.db` (`hotel_database.py`) with authentic hotel/lodge records across Indian cities (Goa, Mumbai, Delhi NCR, Bengaluru, Shimla, Jaipur) including exact `[lng, lat]` coordinates, star categories, accommodation types, and Phase 1 verified audit statuses.
   - Implemented FastAPI endpoints `GET /api/cities` and `GET /api/hotels` with filtering (city, accommodation type, star rating, verified audits only) and sorting by trust score.
   - Built `HotelDiscoveryView.tsx` with Mapbox GL interactive map, custom trust score markers (`94%`, `86%`, etc.), interactive popups, side-by-side comparison modal (comparing up to 3 hotels), and direct linking to Phase 1 auditor.
   - Added seamless Phase 1 & Phase 2 segmented navigation bar in `App.tsx`.

## How to Run the Project Locally

**1. Backend (FastAPI)**
```bash
cd project/backend
# Ensure you have your .env file with GEMINI_API_KEY
pip install -r requirements.txt
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```
*Note: Due to environment instability, the backend may occasionally hang or crash. Restart the uvicorn server if API requests hang indefinitely.*

**2. Frontend (Vite/React)**
```bash
cd project/frontend
# Ensure frontend/.env contains VITE_MAPBOX_TOKEN=pk.your_token
npm install
npm run dev
```

## Next Agent Instructions
- Phase 1 (Auditor) and Phase 2 (Mapbox Discovery) are completely interconnected without breaking any existing functionality.
- The UI strictly follows Apple HIG dark mode glassmorphic styling tokens (`App.css`).


