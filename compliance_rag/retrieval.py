import sys
from unittest.mock import MagicMock
mock_grpc = MagicMock()
mock_grpc.__version__ = "1.0.0"
sys.modules['grpc'] = mock_grpc
import chromadb
from chromadb.utils import embedding_functions
from typing import List

import os
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
COLLECTION_NAME = "hotel_compliance"

def get_criteria_for_star(star_category: int) -> List[str]:
    """
    Retrieves criteria chunks for a specific star category from ChromaDB.
    Uses metadata filtering to grab only chunks for this star rating.
    Returns a clean, deduplicated list of individual criteria.
    """
    # 1. Initialize ChromaDB client
    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    
    # 2. Get collection with embedding function
    embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-mpnet-base-v2")
    
    try:
        collection = client.get_collection(
            name=COLLECTION_NAME, 
            embedding_function=embedding_function
        )
    except ValueError:
        print(f"Error: Collection '{COLLECTION_NAME}' does not exist. Please build the index first.")
        return []

    # 3. Query collection filtering by metadata {'star_category': star_category}
    # We use .get() instead of .query() because we are filtering entirely by metadata, 
    # not by semantic similarity to a text query.
    results = collection.get(
        where={"star_category": star_category}
    )
    
    # 4. Parse/split chunks into discrete criteria items
    criteria_list = []
    if results and results.get("documents"):
        for doc in results["documents"]:
            # Basic parsing: split the chunk's text by newlines
            lines = [line.strip() for line in doc.split('\n') if line.strip()]
            for line in lines:
                # Strip common bullet points and formatting artifacts
                clean_line = line.lstrip('*-•#1234567890. ')
                if clean_line and clean_line not in criteria_list:
                    criteria_list.append(clean_line)
                    
    return criteria_list
