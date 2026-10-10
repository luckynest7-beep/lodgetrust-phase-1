import os
import json
import base64
import requests
import sys
from pathlib import Path
from PIL import Image

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, will rely on system environment variables

# Add directories to path to allow importing from other modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'image_analysis'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../compliance_rag'))

from image_analysis.combine_signals import combine_for_image
from compliance_check import check_compliance

def analyze_hotel_review(image_path: str, description: str, claimed_price: float, claimed_star_rating: int):
    """
    Evaluates a hotel room review by cross-referencing visual signals, LLM estimations, 
    and compliance checks.
    """
    print(f"--- Starting Trust Evaluation for: {image_path} ---")
    print("1. Running Module B (Visual Signals Extraction)...")
    
    # 1. Module B Output
    try:
        mod_b_output = combine_for_image(image_path)
    except Exception as e:
        print(f"Failed to run Module B: {e}")
        return {"error": str(e)}

    # Extract key elements from Module B
    style_tier = mod_b_output.get('style_tier', 'Unknown')
    aesthetic_score = mod_b_output.get('aesthetic_score', 0)
    detected_amenities = list(mod_b_output.get('detected_objects', {}).keys())
    lighting_info = mod_b_output.get('lighting_analysis', {})
    
    print(f"   Detected Tier: {style_tier}")
    print(f"   Aesthetic Score: {aesthetic_score}")
    print(f"   Detected Amenities: {detected_amenities}")

    print("2. Running Module D (Regulatory Compliance Check)...")
    # 2. Module D Output
    # We pass the detected amenities combined with the description (or just detected) 
    # as the 'claimed_amenities' to check if the visuals + claims meet the star rating.
    # We'll pass the detected_amenities for a stricter visual check.
    mod_d_output = check_compliance(claimed_star_rating, detected_amenities)
    compliance_ratio = mod_d_output.get('compliance_ratio', 0.0)
    print(f"   Compliance Ratio: {compliance_ratio * 100}%")

    print("3. Querying LLM (Cost Estimation & Description Matching)...")
    # 3. LLM Analysis
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not found in environment.")
        return {
            "final_trust_percentage": 0,
            "error": "GEMINI_API_KEY not found",
            "mod_b_output": mod_b_output,
            "mod_d_output": mod_d_output
        }
        
    # Read and encode image for Gemini
    with open(image_path, "rb") as img_file:
        img_data = base64.b64encode(img_file.read()).decode('utf-8')
        
    # Construct LLM Prompt
    prompt = f"""
    You are an expert hotel auditor and pricing analyst.
    
    Here is the user-provided description for a hotel room:
    "{description}"
    
    The claimed price per day is: ₹{claimed_price}
    
    I have run a visual analysis module (Module B) on the room image and got these results:
    - Detected Style Tier: {style_tier}
    - Aesthetic Score: {aesthetic_score} / 10
    - Lighting/Exposure: {lighting_info.get('exposure_category', 'Unknown')}
    - Visible Amenities: {', '.join(detected_amenities) if detected_amenities else 'None detected'}
    
    I have also attached the image of the room.
    
    Tasks:
    1. Estimate the reasonable price per day for this room (in INR) based on the image and the Module B outputs.
    2. Compare your estimated price with the claimed price (₹{claimed_price}).
    3. Evaluate if the aesthetic score, lighting, and style tier match the user's description. Does the description exaggerate or accurately reflect the image?
    4. Provide a "match_score" (0 to 1) representing how well the visual evidence + Module B output aligns with the user description.
    
    Respond in STRICT JSON format:
    {{
        "estimated_price": float,
        "price_plausibility_score": float,  // 0 to 1 (1 if claimed price is very close to estimated)
        "description_match_score": float,  // 0 to 1 (1 if description is completely accurate to visuals)
        "analysis_notes": "Brief explanation of your findings"
    }}
    """

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inlineData": {
                        "mimeType": "image/jpeg",
                        "data": img_data
                    }
                }
            ]
        }],
        "generationConfig": {"response_mime_type": "application/json"}
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        llm_result = json.loads(text)
    except Exception as e:
        print(f"Failed to get LLM response: {e}")
        return {
            "final_trust_percentage": 0,
            "error": str(e),
            "mod_b_output": mod_b_output,
            "mod_d_output": mod_d_output
        }

    print(f"   Estimated Price: ₹{llm_result.get('estimated_price')}")
    print(f"   Analysis Notes: {llm_result.get('analysis_notes')}")

    print("4. Calculating Final Trust Score...")
    # 4. Final Trust Calculation
    # Weights for the final score:
    # 35% Price Plausibility
    # 35% Description Match
    # 30% Regulatory Compliance
    
    price_score = llm_result.get('price_plausibility_score', 0)
    desc_score = llm_result.get('description_match_score', 0)
    
    final_trust = (price_score * 0.35) + (desc_score * 0.35) + (compliance_ratio * 0.30)
    final_trust_percentage = round(final_trust * 100, 2)
    
    print("\n" + "="*50)
    print("      FINAL TRUST REPORT      ")
    print("="*50)
    print(f"Claimed Rating: {claimed_star_rating}-Star")
    print(f"Claimed Price: ₹{claimed_price}/day")
    print("-" * 50)
    print(f"LLM Estimated Price: ₹{llm_result.get('estimated_price')}")
    print(f"Price Plausibility Score: {price_score:.2f}")
    print(f"Description Match Score: {desc_score:.2f}")
    print(f"Regulatory Compliance Score (Module D): {compliance_ratio:.2f}")
    print("-" * 50)
    print(f"FINAL TRUST PERCENTAGE: {final_trust_percentage}%")
    print("="*50)
    print(f"Notes: {llm_result.get('analysis_notes')}")

    return {
        "final_trust_percentage": final_trust_percentage,
        "price_plausibility_score": price_score,
        "description_match_score": desc_score,
        "estimated_price": llm_result.get('estimated_price'),
        "analysis_notes": llm_result.get('analysis_notes'),
        "compliance_ratio": compliance_ratio,
        "mod_d_output": mod_d_output,
        "mod_b_output": mod_b_output
    }

    return {
        "final_trust_percentage": final_trust_percentage,
        "price_plausibility_score": price_score,
        "description_match_score": desc_score,
        "estimated_price": llm_result.get('estimated_price'),
        "analysis_notes": llm_result.get('analysis_notes'),
        "compliance_ratio": compliance_ratio,
        "mod_d_output": mod_d_output,
        "mod_b_output": mod_b_output
    }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Evaluate Hotel Review Trust Score')
    parser.add_argument('--image', type=str, required=True, help='Path to room image')
    parser.add_argument('--desc', type=str, required=True, help='User description of the room')
    parser.add_argument('--price', type=float, required=True, help='Claimed price per day')
    parser.add_argument('--stars', type=int, required=True, help='Claimed star rating')
    
    args = parser.parse_args()
    analyze_hotel_review(args.image, args.desc, args.price, args.stars)
