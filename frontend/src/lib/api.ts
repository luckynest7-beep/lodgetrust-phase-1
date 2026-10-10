/**
 * Strongly typed API client for LodgeTrust Module B backend HTTP API.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '';

export interface StolenResult {
  is_flagged: boolean;
  matched_listing_id: string | null;
  matched_image_id: string | null;
  similarity_score: number;
}

export interface AiDetectorResult {
  label: string;
  confidence: number;
  scores: Record<string, number>;
}

export interface ColorSwatch {
  hex: string;
  rgb: [number, number, number];
  percentage: number;
}

export interface ColorPaletteResult {
  color_harmony_score: number;
  dominant_palette: ColorSwatch[];
  color_temperature: string;
  warm_tone_pct: number;
  cool_tone_pct: number;
  harmony_type: string;
  saturation_level: string;
}

export interface LightingAnalysisResult {
  lighting_score: number;
  exposure_category: string;
  mean_brightness: number;
  contrast: number;
  highlight_clipping_pct: number;
  shadow_clipping_pct: number;
  lighting_atmosphere: string;
  is_balanced: boolean;
}

export interface CompositeWeights {
  vision: number;
  lighting: number;
  color: number;
  amenities: number;
}

export interface CompositeAestheticResult {
  composite_score: number;
  vision_score: number;
  lighting_score: number;
  color_score: number;
  amenity_score: number;
  weights?: CompositeWeights;
}

export interface FeatureVector {
  style_tier: string | null;
  style_confidence: number | null;
  tier_scores?: Record<string, number> | null;
  aesthetic_score: number | null;
  detected_objects: Record<string, number> | null;
  amenity_completeness_score: number | null;
  expected_amenities?: string[] | null;
  matched_amenities?: string[] | null;
  missing_amenities?: string[] | null;
  lighting_analysis?: LightingAnalysisResult | null;
  color_analysis?: ColorPaletteResult | null;
  composite_aesthetic?: CompositeAestheticResult | null;
}


export interface AnalyzeImageResult {
  filename: string;
  b1_stolen: StolenResult | null;
  b2_ai_generated: AiDetectorResult | null;
  b3_feature_vector: FeatureVector | null;
  errors: string[];
}

export interface ComplianceResult {
  star_claimed: number;
  criteria_total: number;
  criteria_met: number;
  missing: string[];
  met_list: string[];
  compliance_ratio: number;
  error?: string | null;
}

export interface AnalyzeListingResponse {
  results: AnalyzeImageResult[];
  aggregated: FeatureVector;
  compliance?: ComplianceResult | null;
}


export interface StolenAddResponse {
  status: string;
  listing_id: string;
  image_id: string;
}

export interface StolenResetResponse {
  status: string;
  message: string;
}

export interface ExpectedAmenitiesResponse {
  expected_amenities: string[];
}

export async function analyzeImages(
  files: File[], 
  starCategory: number = 3,
  description: string = '',
  price: number = 0,
  foodIncluded: boolean = false,
  foodDescription: string = ''
): Promise<AnalyzeListingResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('star_category', starCategory.toString());
  formData.append('description', description);
  formData.append('price', price.toString());
  formData.append('food_included', foodIncluded.toString());
  formData.append('food_description', foodDescription);

  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(errorData.detail || `Server returned error ${response.status}`);
  }

  return response.json();
}

export async function addStolenImage(
  file: File,
  listingId: string,
  imageId: string
): Promise<StolenAddResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('listing_id', listingId);
  formData.append('image_id', imageId);

  const response = await fetch(`${API_BASE}/api/stolen/add`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to add image to index' }));
    throw new Error(errorData.detail || `Server returned error ${response.status}`);
  }

  return response.json();
}

export async function resetStolenIndex(): Promise<StolenResetResponse> {
  const response = await fetch(`${API_BASE}/api/stolen/reset`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to reset index' }));
    throw new Error(errorData.detail || `Server returned error ${response.status}`);
  }

  return response.json();
}

export async function getExpectedAmenities(): Promise<ExpectedAmenitiesResponse> {
  const response = await fetch(`${API_BASE}/api/expected-amenities`);
  if (!response.ok) {
    throw new Error('Failed to fetch expected amenities list');
  }
  return response.json();
}
