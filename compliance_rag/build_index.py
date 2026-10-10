import json
import sys
from unittest.mock import MagicMock
mock_grpc = MagicMock()
mock_grpc.__version__ = "1.0.0"
sys.modules['grpc'] = mock_grpc
import chromadb
from chromadb.utils import embedding_functions

import os
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
COLLECTION_NAME = "hotel_compliance"

def build_index(chunks_path: str = "chunks.json"):
    """
    Reads chunks.json, generates embeddings using sentence-transformers, 
    and stores them in ChromaDB.
    """
    try:
        with open(chunks_path, "r", encoding="utf-8") as f:
            chunks = json.load(f)
    except FileNotFoundError:
        print(f"Error: {chunks_path} not found. Please run ingest.py first.")
        return

    # 1. Initialize ChromaDB client pointing to CHROMA_DB_DIR
    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    
    # 2. Set up embedding function: all-mpnet-base-v2
    embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-mpnet-base-v2")
    
    # 3. Create or get collection
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_function
    )
    
    # 4. Read chunks and add to collection (with metadata)
    documents = []
    metadatas = []
    ids = []

    for i, chunk in enumerate(chunks):
        # We only add chunks that have text content
        if "text" in chunk and chunk["text"].strip():
            documents.append(chunk["text"])
            metadatas.append({
                "star_category": chunk.get("star_category", 0),
                "criteria_type": chunk.get("criteria_type", "general"),
                "source_page": chunk.get("source_page", 0)
            })
            ids.append(f"chunk_{i}")

    if documents:
        # Batch add to ChromaDB (updates if IDs already exist)
        collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        print(f"Successfully added/updated {len(documents)} chunks in ChromaDB collection '{COLLECTION_NAME}'.")
    else:
        print("No valid text chunks found to add.")

if __name__ == "__main__":
    build_index()
