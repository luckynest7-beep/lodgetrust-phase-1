import json
import sys
import os
from unittest.mock import MagicMock

# Workaround for grpc version warnings in opentelemetry/chroma
mock_grpc = MagicMock()
mock_grpc.__version__ = "1.0.0"
sys.modules['grpc'] = mock_grpc

import chromadb
from chromadb.utils import embedding_functions

CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
COLLECTION_NAME = "hotel_compliance"

def build_index(chunks_path: str = None, batch_size: int = 50):
    """
    Reads chunks.json, generates embeddings using sentence-transformers (all-mpnet-base-v2), 
    and stores them in ChromaDB in robust batches.
    """
    if chunks_path is None:
        chunks_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chunks.json")
        
    try:
        with open(chunks_path, "r", encoding="utf-8") as f:
            chunks = json.load(f)
    except FileNotFoundError:
        print(f"Error: {chunks_path} not found. Please run ingest.py first.")
        return

    print(f"Loaded {len(chunks)} chunks from {chunks_path}.")
    print(f"Initializing ChromaDB PersistentClient at: {CHROMA_DB_DIR}")

    # 1. Initialize ChromaDB client pointing to CHROMA_DB_DIR
    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    
    # 2. Set up embedding function: all-mpnet-base-v2
    embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-mpnet-base-v2")
    
    # 3. Create or get collection
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_function
    )

    documents = []
    metadatas = []
    ids = []

    for i, chunk in enumerate(chunks):
        text = chunk.get("text", "")
        if text and len(text.strip()) > 10:
            documents.append(text[:2000])
            
            # Format clean ChromaDB metadata (primitive types only)
            metadata = {
                "star_category": int(chunk.get("star_category", 0)),
                "criteria_type": str(chunk.get("criteria_type", "general"))[:80],
                "source_file": str(chunk.get("source_file", "unknown"))[:80]
            }
            if "card_id" in chunk and chunk["card_id"]:
                metadata["card_id"] = str(chunk["card_id"])[:40]
            if "title" in chunk and chunk["title"]:
                metadata["title"] = str(chunk["title"])[:80]

            metadatas.append(metadata)
            ids.append(f"chunk_{i}")

    total_docs = len(documents)
    print(f"Prepared {total_docs} valid documents for indexing. Upserting in batches of {batch_size}...")

    # Upsert in clean batches to prevent memory spikes / payload limits
    for start in range(0, total_docs, batch_size):
        end = min(start + batch_size, total_docs)
        collection.upsert(
            documents=documents[start:end],
            metadatas=metadatas[start:end],
            ids=ids[start:end]
        )
        print(f"  Indexed [{end}/{total_docs}] chunks...")

    print(f"\nSuccessfully indexed all {total_docs} chunks in ChromaDB collection '{COLLECTION_NAME}'!")
    print(f"Total count in Chroma collection: {collection.count()}")

if __name__ == "__main__":
    build_index()
