"""FastAPI HTTP Service for LodgeTrust Module B (Image Analysis).

How to run locally:
    cd project/backend
    pip install -r requirements.txt
    uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
"""

from contextlib import asynccontextmanager
import io
import logging
import os
import sys
from pathlib import Path
from typing import List, Optional

from PIL import Image
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

# Ensure image_analysis module directory is on sys.path
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
IMAGE_ANALYSIS_DIR = BACKEND_DIR / "image_analysis"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(IMAGE_ANALYSIS_DIR) not in sys.path:
    sys.path.insert(0, str(IMAGE_ANALYSIS_DIR))

COMPLIANCE_RAG_DIR = BACKEND_DIR.parent / "compliance_rag"
if str(COMPLIANCE_RAG_DIR) not in sys.path:
    sys.path.insert(0, str(COMPLIANCE_RAG_DIR))

try:
    from compliance_check import check_compliance
except ImportError:
    check_compliance = None

from ai_image_detector import detect_ai_generated  # noqa: E402
from combine_signals import combine_for_image, combine_for_listing  # noqa: E402
from furniture_detector import DEFAULT_EXPECTED_AMENITIES  # noqa: E402
from stolen_image import add_image, check_stolen, clear_index  # noqa: E402

# Import the refactored evaluator
from trust_evaluator import analyze_hotel_review

from api.schemas import (  # noqa: E402
    AiDetectorResult,
    AnalyzeImageResult,
    AnalyzeListingResponse,
    ComplianceResult,
    ExpectedAmenitiesResponse,
    FeatureVector,
    HealthResponse,
    StolenAddResponse,
    StolenResetResponse,
    StolenResult,
    TrustEvaluationResult,
)
from api.seed_index import seed_dummy_index  # noqa: E402
import tempfile

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("lodgetrust.api")

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup hook to seed the FAISS index with demo images."""
    import asyncio
    logger.info("Initializing LodgeTrust API service...")

    def _seed():
        try:
            count = seed_dummy_index()
            logger.info(f"Startup complete. Seeded {count} demo images in FAISS index.")
        except Exception as e:
            logger.warning(f"Demo FAISS index seeding status: {e}")

    asyncio.create_task(asyncio.to_thread(_seed))
    yield
    logger.info("Shutting down LodgeTrust API service.")


app = FastAPI(
    title="LodgeTrust Image Analysis API",
    description="HTTP API wrapping B1 stolen detection, B2 AI classification, and B3 quality/amenity feature vectors.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
frontend_origins_raw = os.environ.get(
    "FRONTEND_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
allowed_origins = [origin.strip() for origin in frontend_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _validate_image_file(file: UploadFile, contents: bytes) -> None:
    """Validate file content type and size limits."""
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File '{file.filename}' exceeds maximum allowed size of 10 MB.",
        )

    if file.content_type and file.content_type.lower() not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File '{file.filename}' has unsupported media type '{file.content_type}'. Allowed types: PNG, JPEG, WEBP.",
        )


@app.get("/api/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint."""
    return HealthResponse(status="ok")


@app.get("/api/expected-amenities", response_model=ExpectedAmenitiesResponse)
def get_expected_amenities():
    """Return the default expected amenities list for 3-star lodging."""
    return ExpectedAmenitiesResponse(expected_amenities=DEFAULT_EXPECTED_AMENITIES)


@app.post("/api/stolen/add", response_model=StolenAddResponse)
async def add_image_to_stolen_index(
    file: UploadFile = File(...),
    listing_id: str = Form(...),
    image_id: str = Form(...),
):
    """Add an uploaded image to the FAISS index under a listing_id + image_id."""
    contents = await file.read()
    _validate_image_file(file, contents)

    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        add_image(img, listing_id=listing_id, image_id=image_id)
        logger.info(f"Added image {image_id} under listing {listing_id} to FAISS index.")
        return StolenAddResponse(status="added", listing_id=listing_id, image_id=image_id)
    except Exception as e:
        logger.error(f"Error adding image {file.filename} to FAISS index: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process image: {str(e)}",
        )


@app.post("/api/stolen/reset", response_model=StolenResetResponse)
def reset_stolen_index():
    """Reset the FAISS index and re-seed default demo images."""
    try:
        count = seed_dummy_index()
        return StolenResetResponse(
            status="reset",
            message=f"Index successfully reset and re-seeded with {count} demo images.",
        )
    except Exception as e:
        logger.error(f"Failed to reset FAISS index: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset index: {str(e)}",
        )


@app.post("/api/analyze", response_model=AnalyzeListingResponse)
async def analyze_images(
    files: List[UploadFile] = File(...),
    star_category: Optional[int] = Form(3),
    description: Optional[str] = Form(""),
    price: Optional[float] = Form(0.0),
    food_included: Optional[bool] = Form(False),
    food_description: Optional[str] = Form("")
):
    """Analyze one or more uploaded listing images across B1, B2, B3, and Module D."""
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files were provided for analysis.",
        )

    pil_images: List[Image.Image] = []
    per_image_results: List[AnalyzeImageResult] = []

    for file in files:
        contents = await file.read()
        _validate_image_file(file, contents)

        try:
            img = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception as e:
            logger.warning(f"Could not decode image file '{file.filename}': {e}")
            per_image_results.append(
                AnalyzeImageResult(
                    filename=file.filename or "unknown",
                    errors=[f"Image decode error: {str(e)}"],
                )
            )
            continue

        pil_images.append(img)
        img_errors: List[str] = []

        # 1. B1 Stolen Image Detection (using listing_id="query" placeholder)
        b1_res: Optional[StolenResult] = None
        try:
            raw_b1 = check_stolen(img, listing_id="query", threshold=0.95)
            b1_res = StolenResult(
                is_flagged=raw_b1.get("is_flagged", False),
                matched_listing_id=raw_b1.get("matched_listing_id"),
                matched_image_id=raw_b1.get("matched_image_id"),
                similarity_score=raw_b1.get("similarity_score", 0.0),
            )
        except Exception as e:
            logger.warning(f"B1 stolen detection failed for '{file.filename}': {e}")
            img_errors.append(f"b1_stolen: {str(e)}")

        # 2. B2 AI-Generated Image Detection
        b2_res: Optional[AiDetectorResult] = None
        try:
            raw_b2 = detect_ai_generated(img)
            b2_res = AiDetectorResult(
                label=raw_b2.get("label", "Unknown"),
                confidence=raw_b2.get("confidence", 0.0),
                scores=raw_b2.get("scores", {}),
            )
        except Exception as e:
            logger.warning(f"B2 AI detection failed for '{file.filename}': {e}")
            img_errors.append(f"b2_ai_generated: {str(e)}")

        # 3. B3 Combined Feature Vector
        b3_res: Optional[FeatureVector] = None
        try:
            raw_b3 = combine_for_image(img)
            if "errors" in raw_b3:
                img_errors.extend(raw_b3["errors"])

            b3_res = FeatureVector(
                style_tier=raw_b3.get("style_tier"),
                style_confidence=raw_b3.get("style_confidence"),
                tier_scores=raw_b3.get("tier_scores"),
                aesthetic_score=raw_b3.get("aesthetic_score"),
                detected_objects=raw_b3.get("detected_objects", {}),
                amenity_completeness_score=raw_b3.get("amenity_completeness_score"),
                expected_amenities=raw_b3.get("expected_amenities", []),
                matched_amenities=raw_b3.get("matched_amenities", []),
                missing_amenities=raw_b3.get("missing_amenities", []),
                lighting_analysis=raw_b3.get("lighting_analysis"),
                color_analysis=raw_b3.get("color_analysis"),
                composite_aesthetic=raw_b3.get("composite_aesthetic"),
            )
        except Exception as e:
            logger.warning(f"B3 feature combination failed for '{file.filename}': {e}")
            img_errors.append(f"b3_feature_vector: {str(e)}")

        per_image_results.append(
            AnalyzeImageResult(
                filename=file.filename or "uploaded_image",
                b1_stolen=b1_res,
                b2_ai_generated=b2_res,
                b3_feature_vector=b3_res,
                errors=img_errors,
            )
        )

    # Compute listing-level aggregated feature vector
    if pil_images:
        try:
            raw_agg = combine_for_listing(pil_images)
            aggregated = FeatureVector(
                style_tier=raw_agg.get("style_tier"),
                style_confidence=raw_agg.get("style_confidence"),
                tier_scores=raw_agg.get("tier_scores"),
                aesthetic_score=raw_agg.get("aesthetic_score"),
                detected_objects=raw_agg.get("detected_objects", {}),
                amenity_completeness_score=raw_agg.get("amenity_completeness_score"),
                expected_amenities=raw_agg.get("expected_amenities", []),
                matched_amenities=raw_agg.get("matched_amenities", []),
                missing_amenities=raw_agg.get("missing_amenities", []),
                lighting_analysis=raw_agg.get("lighting_analysis"),
                color_analysis=raw_agg.get("color_analysis"),
                composite_aesthetic=raw_agg.get("composite_aesthetic"),
            )
        except Exception as e:
            logger.warning(f"Listing-level aggregation failed: {e}")
            aggregated = FeatureVector()
    else:
        aggregated = FeatureVector()


    # Run Compliance RAG on aggregated detected amenities
    compliance_res = None
    if check_compliance and aggregated.detected_objects and star_category is not None:
        try:
            claimed = list(aggregated.detected_objects.keys())
            comp_data = check_compliance(star_category, claimed)
            if "error" not in comp_data:
                compliance_res = ComplianceResult(**comp_data)
            else:
                logger.warning(f"Compliance RAG returned error: {comp_data['error']}")
                compliance_res = ComplianceResult(
                    star_claimed=star_category,
                    criteria_total=0,
                    criteria_met=0,
                    missing=[],
                    met_list=[],
                    compliance_ratio=0.0,
                    error=comp_data["error"]
                )
        except Exception as e:
            logger.error(f"Compliance RAG failed: {e}")
            compliance_res = ComplianceResult(
                star_claimed=star_category,
                criteria_total=0,
                criteria_met=0,
                missing=[],
                met_list=[],
                compliance_ratio=0.0,
                error=str(e)
            )

    # Trust Evaluation (Module E - LLM Integration)
    trust_eval_res = None
    if len(files) > 0 and description:
        try:
            # We need to save the first file temporarily for the evaluator
            first_file = files[0]
            await first_file.seek(0)
            file_bytes = await first_file.read()
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
                tmp_file.write(file_bytes)
                tmp_file_path = tmp_file.name

            # Call the evaluator
            # Note: We can append food_description to description if food is included
            full_desc = description
            if food_included and food_description:
                full_desc += f"\nFood included: {food_description}"

            eval_data = analyze_hotel_review(
                image_path=tmp_file_path,
                description=full_desc,
                claimed_price=price or 0.0,
                claimed_star_rating=star_category or 3
            )

            # Cleanup
            if os.path.exists(tmp_file_path):
                os.remove(tmp_file_path)

            if eval_data and "final_trust_percentage" in eval_data:
                trust_eval_res = TrustEvaluationResult(
                    final_trust_percentage=eval_data["final_trust_percentage"],
                    price_plausibility_score=eval_data.get("price_plausibility_score", 0.0),
                    description_match_score=eval_data.get("description_match_score", 0.0),
                    estimated_price=eval_data.get("estimated_price"),
                    analysis_notes=eval_data.get("analysis_notes")
                )
        except Exception as e:
            logger.error(f"Trust Evaluation failed: {e}")

    return AnalyzeListingResponse(
        results=per_image_results, 
        aggregated=aggregated, 
        compliance=compliance_res,
        trust_evaluation=trust_eval_res
    )

