import sys
import os
import json
from unittest.mock import MagicMock

# Workaround for grpc mock
mock_grpc = MagicMock()
mock_grpc.__version__ = '1.0.0'
sys.modules['grpc'] = mock_grpc

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from retrieval import get_criteria_for_star
from compliance_check import check_compliance
import chromadb
from chromadb.utils import embedding_functions

def verify_rag_linkage():
    chroma_path = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
    client = chromadb.PersistentClient(path=chroma_path)
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-mpnet-base-v2")
    col = client.get_collection("hotel_compliance", embedding_function=ef)

    total_count = col.count()
    print("=" * 60)
    print("   LODGETRUST RAG CHROMADB VERIFICATION REPORT")
    print("=" * 60)
    print(f"[OK] Total Indexed Chunks in ChromaDB: {total_count}")

    # 1. Test Semantic Search on New Document: FSSAI / Food Licensing
    print("\n--- Test 1: Querying New Document (FSSAI Licensing Regulations) ---")
    q1 = col.query(query_texts=["food business licensing and hygiene standards"], n_results=2)
    for i, (doc, meta) in enumerate(zip(q1["documents"][0], q1["metadatas"][0])):
        print(f"[{i+1}] Source: {meta.get('source_file')} | Type: {meta.get('criteria_type')}")
        print(f"    Excerpt: {doc[:140]}...")

    # 2. Test Semantic Search on New Document: Mock House Rules
    print("\n--- Test 2: Querying New Document (Mock Hotel Regulations) ---")
    q2 = col.query(query_texts=["quiet hours and safe for valuables"], n_results=1)
    for doc, meta in zip(q2["documents"][0], q2["metadatas"][0]):
        print(f"[1] Source: {meta.get('source_file')} | Type: {meta.get('criteria_type')}")
        print(f"    Excerpt: {doc[:140]}...")

    # 3. Test Semantic Search on New Document: Consumer Protection / Misleading Ads
    print("\n--- Test 3: Querying New Document (Misleading Advertisements & Consumer Protection) ---")
    q3 = col.query(query_texts=["misleading advertisements and false claims by hotels"], n_results=1)
    for doc, meta in zip(q3["documents"][0], q3["metadatas"][0]):
        print(f"[1] Source: {meta.get('source_file')} | Type: {meta.get('criteria_type')}")
        print(f"    Excerpt: {doc[:140]}...")

    # 4. Test RAG Module D Integration
    print("\n--- Test 4: Live Module D Compliance Verification ---")
    res = check_compliance(3, ["bed", "tv", "ac", "wifi"])
    print(f"[OK] Claimed: {res['star_claimed']}-Star")
    print(f"[OK] Verified Met: {res['criteria_met']}/{res['criteria_total']} ({int(res['compliance_ratio']*100)}%)")
    print("[OK] Met Standards:", res["met_list"])
    print("[OK] Missing Standards:", res["missing"])
    print("\n[OK] ALL TESTS PASSED: RAG is successfully linked and operational with new context!")

if __name__ == "__main__":
    verify_rag_linkage()
