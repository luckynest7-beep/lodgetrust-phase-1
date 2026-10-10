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


class ColorSwatch(BaseModel):
    hex: str = Field(..., description="Hexadecimal color string e.g. #EFECE6")
    rgb: List[int] = Field(..., description="[R, G, B] values (0-255)")
    percentage: float = Field(..., description="Percentage of image covered by this cluster")


class ColorPaletteResult(BaseModel):
    color_harmony_score: float = Field(..., description="Overall color harmony score (1.0 - 10.0)")
    dominant_palette: List[ColorSwatch] = Field(default_factory=list, description="Top dominant color swatches")
    color_temperature: str = Field(..., description="warm, cool, or neutral_balanced")
    warm_tone_pct: float = Field(..., description="Percentage of warm tones (0 - 100%)")
    cool_tone_pct: float = Field(..., description="Percentage of cool tones (0 - 100%)")
    harmony_type: str = Field(..., description="Monochromatic, Analogous, Complementary, or Balanced Neutral")
    saturation_level: str = Field(..., description="muted_elegant, vibrant, or low_saturation")


class LightingAnalysisResult(BaseModel):
    lighting_score: float = Field(..., description="Overall lighting quality score (1.0 - 10.0)")
    exposure_category: str = Field(..., description="well_exposed, underexposed, overexposed, high_contrast")
    mean_brightness: float = Field(..., description="Average luminance percentage (0 - 100%)")
    contrast: float = Field(..., description="Standard deviation of luminance (0 - 100)")
    highlight_clipping_pct: float = Field(..., description="Blown white pixel percentage")
    shadow_clipping_pct: float = Field(..., description="Crushed black pixel percentage")
    lighting_atmosphere: str = Field(..., description="Natural Daylight, Warm Ambient, etc.")
    is_balanced: bool = Field(..., description="True if lighting is well-balanced for lodging")


class CompositeWeights(BaseModel):
    vision: float = Field(default=0.40)
    lighting: float = Field(default=0.25)
    color: float = Field(default=0.20)
    amenities: float = Field(default=0.15)


class CompositeAestheticResult(BaseModel):
    composite_score: float = Field(..., description="Multi-factor weighted aesthetic score (1.0 - 10.0)")
    vision_score: float = Field(..., description="Base vision model score (1.0 - 10.0)")
    lighting_score: float = Field(..., description="Lighting quality score (1.0 - 10.0)")
    color_score: float = Field(..., description="Color harmony score (1.0 - 10.0)")
    amenity_score: float = Field(..., description="Scaled amenity score (1.0 - 10.0)")
    weights: Optional[CompositeWeights] = Field(default=None)


class FeatureVector(BaseModel):
    style_tier: Optional[str] = Field(default=None, description="Lodging tier classification: budget, midscale, upscale, luxury")
    style_confidence: Optional[float] = Field(default=None, description="Style classification confidence (0.0 - 1.0)")
    tier_scores: Optional[Dict[str, float]] = Field(default=None, description="Probability distribution across lodging tiers")
    aesthetic_score: Optional[float] = Field(default=None, description="Normalized vision aesthetic quality score (1.0 - 10.0)")
    detected_objects: Optional[Dict[str, int]] = Field(default_factory=dict, description="Detected object class counts")
    amenity_completeness_score: Optional[float] = Field(default=None, description="Fraction of expected amenities present (0.0 - 1.0)")
    expected_amenities: Optional[List[str]] = Field(default_factory=list, description="Target standard amenity list")
    matched_amenities: Optional[List[str]] = Field(default_factory=list, description="Amenities successfully detected")
    missing_amenities: Optional[List[str]] = Field(default_factory=list, description="Expected amenities not detected")
    lighting_analysis: Optional[LightingAnalysisResult] = Field(default=None, description="Lighting & exposure metrics")
    color_analysis: Optional[ColorPaletteResult] = Field(default=None, description="Color palette & harmony metrics")
    composite_aesthetic: Optional[CompositeAestheticResult] = Field(default=None, description="Multi-factor composite aesthetic score")



class AnalyzeImageResult(BaseModel):
    filename: str = Field(..., description="Original filename of uploaded image")
    b1_stolen: Optional[StolenResult] = Field(default=None)
    b2_ai_generated: Optional[AiDetectorResult] = Field(default=None)
    b3_feature_vector: Optional[FeatureVector] = Field(default=None)
    errors: List[str] = Field(default_factory=list, description="Sub-module error messages if any occurred")


class ComplianceResult(BaseModel):
    star_claimed: int = Field(..., description="The star category verified against")
    criteria_total: int = Field(..., description="Total number of criteria evaluated")
    criteria_met: int = Field(..., description="Number of criteria met by the listing")
    missing: List[str] = Field(default_factory=list, description="List of missing criteria")
    met_list: List[str] = Field(default_factory=list, description="List of met criteria")
    compliance_ratio: float = Field(..., description="Ratio of met criteria to total criteria (0.0 - 1.0)")
    error: Optional[str] = Field(default=None, description="Error message if compliance check failed")


class TrustEvaluationResult(BaseModel):
    final_trust_percentage: float
    price_plausibility_score: float
    description_match_score: float
    estimated_price: Optional[float] = None
    analysis_notes: Optional[str] = None


class AnalyzeListingResponse(BaseModel):
    results: List[AnalyzeImageResult] = Field(..., description="Per-image analysis results")
    aggregated: FeatureVector = Field(..., description="Aggregated feature vector across all listing images")
    compliance: Optional[ComplianceResult] = Field(default=None, description="Module D HRACC compliance RAG results")
    trust_evaluation: Optional[TrustEvaluationResult] = Field(default=None, description="Module E LLM evaluation")


class StolenAddResponse(BaseModel):
    status: str = Field(default="added")
    listing_id: str
    image_id: str


class StolenResetResponse(BaseModel):
    status: str = Field(default="reset")
    message: str

