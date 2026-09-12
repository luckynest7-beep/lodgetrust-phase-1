"""Pydantic schemas for LodgeTrust Module B API."""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="ok", example="ok")


class ExpectedAmenitiesResponse(BaseModel):
    expected_amenities: List[str] = Field(
        default_factory=list,
        example=["bed", "chair", "couch", "tv", "dining table"],
    )


class StolenResult(BaseModel):
    is_flagged: bool = Field(..., description="True if near-duplicate found in another listing")
    matched_listing_id: Optional[str] = Field(default=None, description="Listing ID of duplicate source")
    matched_image_id: Optional[str] = Field(default=None, description="Image ID of duplicate source")
    similarity_score: float = Field(default=0.0, description="Cosine similarity score (0.0 - 1.0)")


class AiDetectorResult(BaseModel):
    label: str = Field(..., description="Top predicted class label (e.g. Real, Artificial, Deepfake)")
    confidence: float = Field(..., description="Probability of top class label (0.0 - 1.0)")
    scores: Dict[str, float] = Field(default_factory=dict, description="Probabilities for all classes")


class FeatureVector(BaseModel):
    style_tier: Optional[str] = Field(default=None, description="Luxury or budget style classification")
    style_confidence: Optional[float] = Field(default=None, description="Style classification confidence (0.0 - 1.0)")
    aesthetic_score: Optional[float] = Field(default=None, description="Normalized aesthetic quality score (1.0 - 10.0)")
    detected_objects: Optional[Dict[str, int]] = Field(default_factory=dict, description="Detected object class counts")
    amenity_completeness_score: Optional[float] = Field(default=None, description="Fraction of expected amenities present (0.0 - 1.0)")


class AnalyzeImageResult(BaseModel):
    filename: str = Field(..., description="Original filename of uploaded image")
    b1_stolen: Optional[StolenResult] = Field(default=None)
    b2_ai_generated: Optional[AiDetectorResult] = Field(default=None)
    b3_feature_vector: Optional[FeatureVector] = Field(default=None)
    errors: List[str] = Field(default_factory=list, description="Sub-module error messages if any occurred")


class AnalyzeListingResponse(BaseModel):
    results: List[AnalyzeImageResult] = Field(..., description="Per-image analysis results")
    aggregated: FeatureVector = Field(..., description="Aggregated feature vector across all listing images")


class StolenAddResponse(BaseModel):
    status: str = Field(default="added")
    listing_id: str
    image_id: str


class StolenResetResponse(BaseModel):
    status: str = Field(default="reset")
    message: str
