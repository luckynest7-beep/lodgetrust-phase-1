import json
import os
import re
from typing import List, Dict, Any
from pypdf import PdfReader

def clean_text(text: str) -> str:
    """Cleans up unprintable symbols, excess whitespace, and formatting ligatures."""
    if not text:
        return ""
    text = re.sub(r'[\uf0d8\uf0a7\u2022\u2013\u2014\*\#]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_text_from_pdf(pdf_path: str, max_pages: int = 100) -> List[Dict[str, Any]]:
    """
    Extracts text from a PDF up to max_pages, returning a list of pages with their text.
    """
    reader = PdfReader(pdf_path)
    pages = []
    total = min(len(reader.pages), max_pages)
    for i in range(total):
        try:
            text = reader.pages[i].extract_text()
            if text and len(text.strip()) > 20:
                pages.append({"page_num": i + 1, "text": clean_text(text)})
        except Exception as e:
            print(f"  Warning: failed to extract page {i+1} of {pdf_path}: {e}")
    return pages

def chunk_pdf_document(pages: List[Dict[str, Any]], filename: str) -> List[Dict[str, Any]]:
    """
    Chunks a PDF document, extracting star category and criteria type heuristics.
    """
    chunks = []
    current_star = 0
    current_criteria = "General Regulations"
    
    for page in pages:
        lines = page["text"].split("\n")
        current_chunk_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if "star" in line.lower():
                match = re.search(r'(\d)\s*[-]*\s*[Ss]tar', line)
                if match:
                    current_star = int(match.group(1))
            
            if any(k in line for k in ["Facilities", "Criteria", "Safety", "Mandatory", "Desirable", "Amenities"]):
                current_criteria = line[:60]
                
            current_chunk_lines.append(line)
            
            if len(current_chunk_lines) >= 8 or line.endswith('.'):
                text_block = " ".join(current_chunk_lines)
                if len(text_block) > 30:
                    chunks.append({
                        "text": text_block,
                        "star_category": current_star,
                        "criteria_type": current_criteria,
                        "source_file": filename,
                        "source_page": page["page_num"]
                    })
                current_chunk_lines = []
                
        if current_chunk_lines:
            text_block = " ".join(current_chunk_lines)
            if len(text_block) > 30:
                chunks.append({
                    "text": text_block,
                    "star_category": current_star,
                    "criteria_type": current_criteria,
                    "source_file": filename,
                    "source_page": page["page_num"]
                })
            
    return chunks

def ingest_jsonl_cards(jsonl_path: str) -> List[Dict[str, Any]]:
    """
    Parses structured retrieval cards from Hotel_Hospitality_RAG_Corpus-3.jsonl.
    """
    chunks = []
    if not os.path.exists(jsonl_path):
        return chunks

    with open(jsonl_path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            if not line.strip():
                continue
            try:
                card = json.loads(line)
                title = card.get("title") or card.get("source_name") or card.get("short_name", "")
                passage = card.get("source_passage") or card.get("text", "")
                abstract = card.get("abstract", "")
                doc_key = card.get("doc_key") or card.get("source_key", "hospitality_regulations")
                card_id = card.get("card_id") or f"TRANSCRIPT_{idx}"
                source_file = card.get("source_file") or card.get("file") or "Hotel_Hospitality_RAG_Corpus.jsonl"
                
                # Combine title, abstract, and passage into a rich retrieval block
                if abstract and abstract != passage:
                    combined_text = f"{title}\n{abstract}\n{passage}"
                elif title and title not in passage:
                    combined_text = f"{title}\n{passage}"
                else:
                    combined_text = passage

                cleaned = clean_text(combined_text)
                if len(cleaned) < 30:
                    continue
                
                # Detect star categories mentioned in the card
                text_low = cleaned.lower()
                star_matches = set(re.findall(r'(\d)\s*[- ]*(?:star|\*)', text_low))
                valid_stars = [int(s) for s in star_matches if 1 <= int(s) <= 5]
                
                if valid_stars:
                    for star in valid_stars:
                        chunks.append({
                            "text": cleaned[:1200],
                            "star_category": star,
                            "criteria_type": doc_key,
                            "source_file": source_file,
                            "card_id": card_id,
                            "title": title
                        })
                else:
                    # General / cross-cutting hospitality, consumer protection, or FSSAI guidelines
                    chunks.append({
                        "text": cleaned[:1200],
                        "star_category": 0,
                        "criteria_type": doc_key,
                        "source_file": source_file,
                        "card_id": card_id,
                        "title": title
                    })
            except Exception as e:
                continue

    return chunks

def ingest_markdown_files(md_path: str) -> List[Dict[str, Any]]:
    """
    Ingests markdown rule files like Mock_Hotel_Regulations.md.
    """
    chunks = []
    if not os.path.exists(md_path):
        return chunks

    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()

    sections = content.split("##")
    filename = os.path.basename(md_path)
    for sec in sections:
        sec = sec.strip()
        if not sec:
            continue
        cleaned = clean_text(sec)
        if len(cleaned) > 20:
            chunks.append({
                "text": cleaned,
                "star_category": 0,
                "criteria_type": "Hotel House Rules & Policies",
                "source_file": filename
            })

    return chunks

def save_chunks(chunks: List[Dict[str, Any]], output_path: str = "chunks.json"):
    """Saves chunks to a JSON file."""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=4)

if __name__ == "__main__":
    rag_data_dir = os.path.join(os.path.dirname(__file__), "RAG DATA")
    all_chunks = []
    
    print(f"Starting ingestion from: {rag_data_dir}")

    # 1. Ingest structured JSONL corpus (Hotel_Hospitality_RAG_Corpus-3.jsonl)
    jsonl_files = [f for f in os.listdir(rag_data_dir) if f.endswith(".jsonl")]
    for jf in jsonl_files:
        p = os.path.join(rag_data_dir, jf)
        print(f"Ingesting structured corpus: {jf}...")
        cards = ingest_jsonl_cards(p)
        print(f"  -> Extracted {len(cards)} chunks from {jf}")
        all_chunks.extend(cards)

    # 2. Ingest Markdown files (Mock_Hotel_Regulations.md)
    md_files = [f for f in os.listdir(rag_data_dir) if f.endswith(".md")]
    for mf in md_files:
        p = os.path.join(rag_data_dir, mf)
        print(f"Ingesting markdown regulations: {mf}...")
        md_chunks = ingest_markdown_files(p)
        print(f"  -> Extracted {len(md_chunks)} chunks from {mf}")
        all_chunks.extend(md_chunks)

    # 3. Ingest PDFs (1659456723.pdf, 1667476361.pdf)
    pdf_files = [f for f in os.listdir(rag_data_dir) if f.endswith(".pdf") and not f.startswith("Hotel_Hospitality_RAG_Knowledge_Base_500p")]
    for pf in pdf_files:
        p = os.path.join(rag_data_dir, pf)
        print(f"Ingesting PDF: {pf}...")
        pages = extract_text_from_pdf(p, max_pages=60)
        pdf_chunks = chunk_pdf_document(pages, pf)
        print(f"  -> Extracted {len(pdf_chunks)} chunks from {pf}")
        all_chunks.extend(pdf_chunks)

    output_file = os.path.join(os.path.dirname(__file__), "chunks.json")
    save_chunks(all_chunks, output_file)
    print(f"\nCompleted! Total saved chunks: {len(all_chunks)} to {output_file}")
