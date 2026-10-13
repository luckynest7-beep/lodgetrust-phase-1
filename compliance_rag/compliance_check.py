import os
import json
import re
import requests
from pathlib import Path
from typing import List, Dict, Any

try:
    from dotenv import load_dotenv
    load_dotenv()
    parent_env = Path(__file__).resolve().parent.parent / "backend" / ".env"
    if parent_env.exists():
        load_dotenv(parent_env)
    root_env = Path(__file__).resolve().parent.parent / ".env"
    if root_env.exists():
        load_dotenv(root_env)
except ImportError:
    pass

from retrieval import get_criteria_for_star

# Standardized, clean HRACC regulatory standards for lodging room classification
CANONICAL_STAR_CRITERIA: Dict[int, List[Dict[str, Any]]] = {
    1: [
        {"name": "Clean Bed & Fresh Bedding", "synonyms": ["bed", "mattress", "linen", "bedroom", "cot"]},
        {"name": "Attached Bathroom with Hot/Cold Water", "synonyms": ["bath", "toilet", "washroom", "shower", "geyser", "bathroom"]},
        {"name": "Adequate Climate Ventilation / Fan", "synonyms": ["fan", "ventilation", "ac", "window"]},
        {"name": "Proper Room Lighting & Power Sockets", "synonyms": ["lamp", "light", "socket", "outlet", "switch"]},
        {"name": "Daily Housekeeping & Hygiene Standards", "synonyms": ["clean", "tidy", "housekeeping", "towel"]}
    ],
    2: [
        {"name": "Quality Bed & Clean Linen", "synonyms": ["bed", "mattress", "linen", "bedroom", "cot"]},
        {"name": "Attached Bathroom with Hot/Cold Shower", "synonyms": ["bath", "toilet", "washroom", "shower", "geyser", "sanitary", "bathroom"]},
        {"name": "Air Conditioning or Adequate Cooling", "synonyms": ["ac", "air condition", "air-condition", "climate control", "cooling", "fan"]},
        {"name": "Television with Cable Entertainment", "synonyms": ["tv", "television", "entertainment", "cable", "screen"]},
        {"name": "Wardrobe / Clothes Hanging Space", "synonyms": ["wardrobe", "closet", "hanger", "cupboard", "luggage"]},
        {"name": "Daily Housekeeping & Fresh Towels", "synonyms": ["clean", "towel", "linen", "housekeeping"]}
    ],
    3: [
        {"name": "Air Conditioning / Climate Control", "synonyms": ["ac", "air condition", "air-condition", "climate control", "cooling"]},
        {"name": "Private Bathroom with Hot Water & Toiletries", "synonyms": ["bath", "toilet", "washroom", "shower", "geyser", "sanitary", "hot water", "bathroom"]},
        {"name": "Quality Bed & Fresh Premium Linen", "synonyms": ["bed", "mattress", "linen", "bedroom", "cushion", "cot"]},
        {"name": "Flat-Screen Television with Cable/Satellite", "synonyms": ["tv", "television", "entertainment", "screen", "monitor"]},
        {"name": "Complimentary High-Speed Wi-Fi", "synonyms": ["wifi", "wi-fi", "internet", "broadband", "connectivity"]},
        {"name": "Work Desk & Seating Chair", "synonyms": ["chair", "seating", "table", "desk", "armchair", "sofa"]},
        {"name": "Wardrobe, Clothes Hangers & Luggage Space", "synonyms": ["wardrobe", "closet", "hanger", "cupboard", "luggage", "rack"]},
        {"name": "Electric Kettle with Tea & Coffee Amenities", "synonyms": ["kettle", "tea", "coffee", "maker", "water", "beverage"]}
    ],
    4: [
        {"name": "Central Air Conditioning / Climate Control", "synonyms": ["ac", "air condition", "air-condition", "climate control", "cooling"]},
        {"name": "Premium Bathroom with Shower & Luxury Toiletries", "synonyms": ["bath", "toilet", "washroom", "shower", "geyser", "sanitary", "hot water", "bathroom"]},
        {"name": "Luxury Bedding & High-Thread Linen", "synonyms": ["bed", "mattress", "linen", "bedroom", "cushion", "headboard"]},
        {"name": "Flat-Screen Smart TV & Entertainment Hub", "synonyms": ["tv", "television", "entertainment", "screen"]},
        {"name": "High-Speed Wi-Fi Internet Access", "synonyms": ["wifi", "wi-fi", "internet", "broadband"]},
        {"name": "Dedicated Work Desk & Ergonomic Chair", "synonyms": ["chair", "seating", "table", "desk", "armchair", "sofa"]},
        {"name": "Spacious Wardrobe & Luggage Rack", "synonyms": ["wardrobe", "closet", "hanger", "cupboard", "luggage"]},
        {"name": "In-Room Electronic Safe / Locker", "synonyms": ["safe", "locker", "security", "vault"]},
        {"name": "Electric Kettle & Beverage Station", "synonyms": ["kettle", "tea", "coffee", "maker", "water"]},
        {"name": "Mini-Fridge / In-Room Refrigerator", "synonyms": ["fridge", "refrigerator", "mini-bar", "minibar", "cooler"]}
    ],
    5: [
        {"name": "Individually Controlled Air Conditioning", "synonyms": ["ac", "air condition", "climate control"]},
        {"name": "Luxury Marble Bathroom with Bathtub & Rain Shower", "synonyms": ["bath", "bathtub", "toilet", "washroom", "shower", "hot water", "bathroom"]},
        {"name": "Plush King/Queen Bedding with Pillow Menu", "synonyms": ["bed", "mattress", "linen", "bedroom", "cushion"]},
        {"name": "Large Smart Television / Entertainment Hub", "synonyms": ["tv", "television", "screen"]},
        {"name": "High-Speed Seamless Wi-Fi Access", "synonyms": ["wifi", "wi-fi", "internet"]},
        {"name": "Executive Work Desk & Designer Seating", "synonyms": ["chair", "table", "desk", "armchair", "sofa", "seating"]},
        {"name": "Walk-In / Full Wardrobe with Electronic Safe", "synonyms": ["wardrobe", "closet", "safe", "locker", "luggage"]},
        {"name": "In-Room Mini-Bar & Espresso / Kettle Amenities", "synonyms": ["kettle", "coffee", "tea", "fridge", "minibar", "refrigerator"]},
        {"name": "Bathrobes, Slippers & Luxury Toiletries", "synonyms": ["bath", "towel", "robe", "toiletries", "amenities"]}
    ]
}

def clean_text_item(text: str) -> str:
    """Removes weird unicode artifacts, bullet characters, and trims cleanly."""
    clean = re.sub(r'[\uf0d8\uf0a7\u2022\u2013\u2014\*\-\#]', ' ', text)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

def check_compliance(star_category: int, claimed_amenities: List[str]) -> Dict[str, Any]:
    """
    Compares claimed amenities against official HRACC criteria using an LLM for semantic matching,
    with curated, clean standards to avoid bureaucratic noise.
    """
    star_norm = max(1, min(5, star_category or 3))
    
    # Baseline canonical standards for this star category
    canonical_standards = CANONICAL_STAR_CRITERIA.get(star_norm, CANONICAL_STAR_CRITERIA[3])
    canonical_names = [item["name"] for item in canonical_standards]

    # 1. Fetch criteria from RAG index and filter out non-amenity bureaucratic text
    raw_criteria = get_criteria_for_star(star_norm)
    curated_rag_criteria = []
    
    # Exclude bureaucratic keywords from regulatory texts
    bureaucratic_blacklist = [
        "fee", "committee", "indiatourism", "regional director", "hotelcloud.nic.in",
        "annexure", "application format", "signatories", "code of conduct", "time share",
        "undertaking", "valid for two years", "promoter", "physically residing", "lettable room",
        "registration", "inspection by", "guidelines will supersede"
    ]

    for crit in (raw_criteria or []):
        c_clean = clean_text_item(crit)
        c_lower = c_clean.lower()
        if any(bad in c_lower for bad in bureaucratic_blacklist):
            continue
        if len(c_clean) > 15:
            curated_rag_criteria.append(c_clean[:140])

    # 2. Check for API key and attempt LLM evaluation with clean prompt
    api_key = os.environ.get("GEMINI_API_KEY")
    llm_success = False
    met_list = []
    missing_list = []

    if api_key and api_key != "YOUR_GEMINI_API_KEY_HERE":
        rag_context_text = "\n".join([f"- {c}" for c in curated_rag_criteria[:12]]) if curated_rag_criteria else "Official HRACC Classification Guidelines indexed in ChromaDB."

        prompt = f"""
You are an expert hotel compliance auditor verifying property listings according to official HRACC (Hotel & Restaurant Approval & Classification Committee) standards.

Target Rating: {star_norm}-Star Lodging
Detected Amenities from Property Photos & Listing: {json.dumps(claimed_amenities)}

Official Required Standards for {star_norm}-Star Hotels:
{json.dumps(canonical_names, indent=2)}

RAG-Retrieved HRACC Regulatory Context from Ministry of Tourism Knowledge Base:
{rag_context_text}

TASK:
1. Cross-reference the detected amenities against the {star_norm}-Star standards and retrieved HRACC regulatory context.
2. For each standard in the list, evaluate if it is MET (detected in the listing/photos/description) or MISSING.
3. Keep the output clean, professional, and free of bureaucratic legal text.
4. Output concise, human-readable amenity labels matching the official standards.

Return STRICT JSON matching this schema:
{{
  "criteria_met_list": ["Amenity Standard", ...],
  "missing_list": ["Amenity Standard", ...]
}}
"""
        models_to_try = [
            os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
            "gemini-3.8-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash"
        ]
        
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            try:
                response = requests.post(url, headers=headers, json=payload, timeout=12)
                if response.status_code == 200:
                    data = response.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    result = json.loads(text)
                    raw_met = result.get("criteria_met_list", [])
                    raw_missing = result.get("missing_list", [])
                    
                    if raw_met or raw_missing:
                        met_list = [clean_text_item(str(item)) for item in raw_met if clean_text_item(str(item))]
                        missing_list = [clean_text_item(str(item)) for item in raw_missing if clean_text_item(str(item))]
                        llm_success = True
                        break
            except Exception:
                continue

    # 3. If LLM is unavailable or unconfigured, execute structured local semantic matching
    if not llm_success:
        claimed_lower = [a.lower().strip() for a in claimed_amenities]
        met_list = []
        missing_list = []

        for crit in canonical_standards:
            name = crit["name"]
            synonyms = crit["synonyms"]
            
            # Check if any detected visual amenity matches this standard
            matched = False
            for claim in claimed_lower:
                if claim in name.lower():
                    matched = True
                    break
                if any(syn in claim or claim in syn for syn in synonyms):
                    matched = True
                    break
            
            if matched:
                met_list.append(name)
            else:
                missing_list.append(name)

    # Clean & deduplicate lists, prioritizing clean presentation
    clean_met = []
    for item in met_list:
        if item not in clean_met and len(item) < 80:
            clean_met.append(item)

    clean_missing = []
    for item in missing_list:
        if item not in clean_missing and item not in clean_met and len(item) < 80:
            clean_missing.append(item)

    total_actionable = len(clean_met) + len(clean_missing)
    met_count = len(clean_met)
    compliance_ratio = round(met_count / total_actionable, 2) if total_actionable > 0 else 0.0

    return {
        'star_claimed': star_norm,
        'criteria_total': total_actionable,
        'criteria_met': met_count,
        'missing': clean_missing,
        'compliance_ratio': compliance_ratio,
        'met_list': clean_met
    }
