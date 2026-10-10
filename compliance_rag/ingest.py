import json
import os
import re
from typing import List, Dict, Any
from pypdf import PdfReader

def extract_text_from_pdf(pdf_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text from a PDF, returning a list of pages with their text.
    """
    reader = PdfReader(pdf_path)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            pages.append({"page_num": i + 1, "text": text})
    return pages

def chunk_document(pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Chunks the document preserving star category and criteria type.
    """
    chunks = []
    current_star = 0
    current_criteria = "General"
    
    for page in pages:
        lines = page["text"].split("\n")
        current_chunk_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Naive heuristics for metadata extraction
            if "Star" in line or "star" in line:
                match = re.search(r'(\d)\s*[-]*\s*[Ss]tar', line)
                if match:
                    current_star = int(match.group(1))
            
            if "Facilities" in line or "Criteria" in line or "Safety" in line:
                current_criteria = line[:50]
                
            current_chunk_lines.append(line)
            
            # Simple chunking strategy: chunk by paragraphs/sentences roughly
            if len(current_chunk_lines) >= 10 or line.endswith('.'):
                chunks.append({
                    "text": " ".join(current_chunk_lines),
                    "star_category": current_star,
                    "criteria_type": current_criteria,
                    "source_page": page["page_num"]
                })
                current_chunk_lines = []
                
        if current_chunk_lines:
            chunks.append({
                "text": " ".join(current_chunk_lines),
                "star_category": current_star,
                "criteria_type": current_criteria,
                "source_page": page["page_num"]
            })
            
    return chunks

def save_chunks(chunks: List[Dict[str, Any]], output_path: str = "chunks.json"):
    """Saves chunks to a JSON file."""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=4)

if __name__ == "__main__":
    pdf_dir = os.path.join(os.path.dirname(__file__), "RAG DATA")
    all_chunks = []
    
    if os.path.exists(pdf_dir):
        for filename in os.listdir(pdf_dir):
            if filename.endswith(".pdf"):
                pdf_path = os.path.join(pdf_dir, filename)
                print(f"Processing {pdf_path}...")
                pages = extract_text_from_pdf(pdf_path)
                chunks = chunk_document(pages)
                all_chunks.extend(chunks)
                
    output_file = os.path.join(os.path.dirname(__file__), "chunks.json")
    save_chunks(all_chunks, output_file)
    print(f"Saved {len(all_chunks)} chunks to {output_file}")
