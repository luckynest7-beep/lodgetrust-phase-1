import json
import os
import chromadb
from chromadb.utils import embedding_functions

def build_index(chunks_path: str = "chunks.json", db_path: str = "chroma_db"):
    """
    Reads chunks from JSON and builds a ChromaDB index.
    """
    if not os.path.exists(chunks_path):
        print(f"Error: {chunks_path} not found.")
        return

    # Load chunks
    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)
        
    print(f"Loaded {len(chunks)} chunks.")

    # Initialize ChromaDB
    client = chromadb.PersistentClient(path=db_path)
    
    # Use sentence-transformers/all-mpnet-base-v2
    sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-mpnet-base-v2")
    
    # Create or get collection
    collection = client.get_or_create_collection(
        name="hotel_compliance", 
        embedding_function=sentence_transformer_ef
    )
    
    # Prepare data for insertion
    ids = []
    documents = []
    metadatas = []
    
    for i, chunk in enumerate(chunks):
        ids.append(f"chunk_{i}")
        documents.append(chunk["text"])
        metadatas.append({
            "star_category": chunk.get("star_category", 0),
            "criteria_type": chunk.get("criteria_type", "General")[:50], # Ensure string is short
            "source_page": chunk.get("source_page", 0)
        })
        
    print("Adding chunks to ChromaDB collection... This might take a moment as it downloads the model.")
    # Add to collection
    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )
    
    print(f"Index built successfully at {db_path}.")

def test_query(db_path: str = "chroma_db", query: str = "what amenities are required for a 3-star hotel"):
    client = chromadb.PersistentClient(path=db_path)
    sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-mpnet-base-v2")
    collection = client.get_collection(name="hotel_compliance", embedding_function=sentence_transformer_ef)
    
    results = collection.query(
        query_texts=[query],
        n_results=3
    )
    
    print(f"\n--- Query Results for: '{query}' ---")
    for i in range(len(results['documents'][0])):
        print(f"\nResult {i+1} (Distance: {results['distances'][0][i]:.4f}):")
        print(f"Metadata: {results['metadatas'][0][i]}")
        print(f"Text: {results['documents'][0][i][:300]}...")

if __name__ == "__main__":
    chunks_file = os.path.join(os.path.dirname(__file__), "chunks.json")
    db_dir = os.path.join(os.path.dirname(__file__), "chroma_db")
    
    # Build index
    build_index(chunks_path=chunks_file, db_path=db_dir)
    
    # Test query
    test_query(db_path=db_dir)
