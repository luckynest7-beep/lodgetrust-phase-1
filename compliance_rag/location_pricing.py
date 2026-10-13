import os
import json
import sys
from typing import Dict, Any, Optional

# Mock grpc if not already mocked to avoid Windows grpcio mismatch
from unittest.mock import MagicMock
if 'grpc' not in sys.modules:
    mock_grpc = MagicMock()
    mock_grpc.__version__ = "1.0.0"
    sys.modules['grpc'] = mock_grpc

import chromadb
from chromadb.utils import embedding_functions

CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
LOCATION_DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "location_benchmarks.json")
COLLECTION_NAME = "location_pricing"

_collection_cache = None

def get_location_collection():
    """Returns the ChromaDB collection for location benchmarks, initializing if necessary."""
    global _collection_cache
    if _collection_cache is not None:
        return _collection_cache

    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-mpnet-base-v2")
    
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_function
    )

    # Check if collection is empty, and seed it if needed
    if collection.count() == 0 and os.path.exists(LOCATION_DATA_PATH):
        try:
            with open(LOCATION_DATA_PATH, "r", encoding="utf-8") as f:
                benchmarks = json.load(f)
            
            docs = []
            metadatas = []
            ids = []

            for item in benchmarks:
                text_repr = f"Region: {item['region']}. Aliases and areas: {', '.join(item.get('aliases', []))}. Tier: {item['market_tier']}. Context: {item['description']}"
                docs.append(text_repr)
                metadatas.append({
                    "region": item["region"],
                    "market_tier": item["market_tier"],
                    "description": item["description"],
                    "pricing_json": json.dumps(item.get("pricing_by_star", {}))
                })
                ids.append(item["id"])

            if docs:
                collection.upsert(documents=docs, metadatas=metadatas, ids=ids)
        except Exception as e:
            print(f"Warning: Failed to seed location benchmarks collection: {e}")

    _collection_cache = collection
    return _collection_cache


def get_location_price_range(
    location: str, 
    star_category: int = 3,
    claimed_price: Optional[float] = None
) -> Dict[str, Any]:
    """
    RAG-powered location price range estimation.
    Queries ChromaDB with semantic search to identify the local hospitality market,
    then returns the official/market expected price range (in INR) for that star rating.
    """
    clean_loc = (location or "").strip()
    star_key = str(max(1, min(5, star_category or 3)))

    if not clean_loc:
        # Fallback to Pan-India baseline
        return {
            "location": "Unspecified",
            "matched_location": "National Standard (All-India Benchmark)",
            "star_category": int(star_key),
            "min_price": 2500.0,
            "max_price": 5000.0,
            "currency": "INR",
            "market_tier": "Pan-India Baseline",
            "notes": f"Standard benchmark tariffs for {star_key}-star lodging across India.",
            "source": "LodgeTrust Regional Hospitality Benchmark (RAG Indexed)"
        }

    matched_region = None
    market_tier = "Standard Market"
    description = ""
    pricing_data = {}

    # 1. First check via direct alias/keyword match in location_benchmarks.json for instantaneous speed
    if os.path.exists(LOCATION_DATA_PATH):
        try:
            with open(LOCATION_DATA_PATH, "r", encoding="utf-8") as f:
                benchmarks = json.load(f)
            
            lower_loc = clean_loc.lower()
            for b in benchmarks:
                for alias in b.get("aliases", []):
                    if alias.lower() in lower_loc or lower_loc in alias.lower():
                        matched_region = b["region"]
                        market_tier = b["market_tier"]
                        description = b["description"]
                        pricing_data = b.get("pricing_by_star", {})
                        break
                if matched_region:
                    break
        except Exception:
            pass

    # 2. If no direct keyword match, use ChromaDB Semantic Retrieval
    if not matched_region:
        try:
            collection = get_location_collection()
            results = collection.query(
                query_texts=[clean_loc],
                n_results=1
            )
            if results and results.get("metadatas") and len(results["metadatas"][0]) > 0:
                top_meta = results["metadatas"][0][0]
                matched_region = top_meta.get("region", "Regional Market")
                market_tier = top_meta.get("market_tier", "Standard Hospitality Zone")
                description = top_meta.get("description", "")
                pricing_data = json.loads(top_meta.get("pricing_json", "{}"))
        except Exception as e:
            print(f"Location ChromaDB retrieval error: {e}")

    # Fallback if both retrieval modes didn't match
    if not pricing_data:
        pricing_data = {
            "1": {"min": 1000, "max": 2000},
            "2": {"min": 1500, "max": 3000},
            "3": {"min": 2500, "max": 5000},
            "4": {"min": 4500, "max": 9500},
            "5": {"min": 8500, "max": 20000}
        }
        matched_region = matched_region or "National Standard (All-India Benchmark)"
        market_tier = market_tier or "Pan-India Baseline"

    star_prices = pricing_data.get(star_key, {"min": 2500, "max": 5000})
    min_price = float(star_prices.get("min", 2500))
    max_price = float(star_prices.get("max", 5000))

    notes = f"In {matched_region} ({market_tier}), verified {star_key}-Star accommodations typically range between ₹{int(min_price):,} and ₹{int(max_price):,} per night."
    if description:
        notes += f" {description}"

    result = {
        "location": clean_loc,
        "matched_location": matched_region,
        "star_category": int(star_key),
        "min_price": min_price,
        "max_price": max_price,
        "currency": "INR",
        "market_tier": market_tier,
        "notes": notes,
        "source": "LodgeTrust Regional Hospitality Benchmark (RAG Indexed)"
    }

    if claimed_price is not None and claimed_price > 0:
        if claimed_price < min_price * 0.7:
            result["price_assessment"] = "SUSPICIOUSLY_LOW"
            result["price_assessment_label"] = "Abnormally Low for Market"
        elif claimed_price > max_price * 1.5:
            result["price_assessment"] = "PREMIUM_PRICED"
            result["price_assessment_label"] = "Significantly Higher than Regional Baseline"
        else:
            result["price_assessment"] = "IN_RANGE"
            result["price_assessment_label"] = "Within Expected Market Tariff"

    return result

if __name__ == "__main__":
    test_locs = ["Baga Beach, North Goa", "Connaught Place, Delhi", "Koramangala, Bangalore", "Old Manali Riverside", "Coimbatore"]
    for l in test_locs:
        res = get_location_price_range(l, 4)
        print(f"Query: '{l}' -> Matched: '{res['matched_location']}' [{res['market_tier']}]: INR {res['min_price']} - {res['max_price']}")
