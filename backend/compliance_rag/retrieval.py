import sys
import os
import json
from unittest.mock import MagicMock
mock_grpc = MagicMock()
mock_grpc.__version__ = "1.0.0"
sys.modules['grpc'] = mock_grpc
import chromadb
from chromadb.utils import embedding_functions
from typing import List

CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
CHUNKS_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chunks.json")
COLLECTION_NAME = "hotel_compliance"

def get_criteria_from_chunks_file(star_category: int) -> List[str]:
    """Fallback reader directly from chunks.json when ChromaDB index is unavailable."""
    if not os.path.exists(CHUNKS_JSON_PATH):
        return []
    try:
        with open(CHUNKS_JSON_PATH, "r", encoding="utf-8") as f:
            chunks = json.load(f)
        criteria_list = []
        for chunk in chunks:
            if chunk.get("star_category") == star_category:
                doc = chunk.get("text", "")
                lines = [line.strip() for line in doc.split('\n') if line.strip()]
                for line in lines:
                    clean_line = line.lstrip('*-•#1234567890. ')
                    if clean_line and clean_line not in criteria_list:
                        criteria_list.append(clean_line)
        return criteria_list
    except Exception:
        return []

def get_criteria_for_star(star_category: int) -> List[str]:
    """
    Retrieves criteria chunks for a specific star category.
    Attempts ChromaDB first, and seamlessly falls back to chunks.json if ChromaDB index encounters an error.
    """
    try:
        client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
        embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-mpnet-base-v2")
        collection = client.get_collection(
            name=COLLECTION_NAME, 
            embedding_function=embedding_function
        )
        results = collection.get(where={"star_category": star_category})
        criteria_list = []
        if results and results.get("documents"):
            for doc in results["documents"]:
                lines = [line.strip() for line in doc.split('\n') if line.strip()]
                for line in lines:
                    clean_line = line.lstrip('*-•#1234567890. ')
                    if clean_line and clean_line not in criteria_list:
                        criteria_list.append(clean_line)
        if criteria_list:
            return criteria_list
    except Exception as e:
        print(f"ChromaDB retrieval notice: {e}, using local criteria context")

    return get_criteria_from_chunks_file(star_category)
