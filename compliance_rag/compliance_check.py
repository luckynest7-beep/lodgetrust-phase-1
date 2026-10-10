import os
import json
import requests
from typing import List, Dict, Any
from retrieval import get_criteria_for_star

def check_compliance(star_category: int, claimed_amenities: List[str]) -> Dict[str, Any]:
    """
    Compares claimed amenities against official HRACC criteria using an LLM for semantic matching.
    """
    # 1. Fetch criteria for the star category
    criteria = get_criteria_for_star(star_category)
    
    if not criteria:
        return {
            'star_claimed': star_category,
            'criteria_total': 0,
            'criteria_met': 0,
            'missing': [],
            'compliance_ratio': 0.0,
            'error': 'No criteria found for this star category.'
        }
    
    # 2. Check for API key
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY not found in environment. Please set it to run LLM evaluation.")
        return {'error': 'GEMINI_API_KEY environment variable not set.'}
        
    prompt = f"""
You are a strict but fair hotel compliance auditor.
A hotel claims a {star_category}-Star rating and lists the following amenities: {json.dumps(claimed_amenities)}

Here are the official government regulatory rules for a {star_category}-Star hotel:
{json.dumps(criteria, indent=2)}

Evaluate which criteria are MET by the claimed amenities and which are MISSING.
- A criterion is met if the claimed amenities semantically satisfy the requirement (e.g., 'AC' satisfies 'Air Conditioning').
- If a criterion covers something completely unrelated to the amenities (like a HRACC committee role or building plan approval process), ignore it and do not list it in missing_list or criteria_met_list.

Return a JSON object strictly matching this schema:
{{
  "criteria_met_list": ["criterion string", ...],
  "missing_list": ["criterion string", ...]
}}
"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": "application/json"}
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        # Extract text from Gemini REST response
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        result = json.loads(text)
        
        met_list = result.get("criteria_met_list", [])
        missing_list = result.get("missing_list", [])
        
        total_actionable = len(met_list) + len(missing_list)
        met_count = len(met_list)
        compliance_ratio = round(met_count / total_actionable, 2) if total_actionable > 0 else 0.0
        
        return {
            'star_claimed': star_category, 
            'criteria_total': total_actionable, 
            'criteria_met': met_count, 
            'missing': missing_list, 
            'compliance_ratio': compliance_ratio,
            'met_list': met_list
        }
    except Exception as e:
        print(f"Error during LLM evaluation: {e}")
        return {'error': f'Failed to evaluate compliance via LLM: {str(e)}'}
