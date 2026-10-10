# Task — Regulatory Compliance Module (LodgeTrust Module D)

## Overview

Build the compliance-checking module for LodgeTrust. Given a listing's claimed
star category (and, later, its detected amenities from Module B), this module
retrieves the official HRACC criteria for that star level and reports which
criteria are satisfied vs. missing.

**Source document:** Ministry of Tourism, Government of India — Guidelines for
Hotel and Resort Star Classification (HRACC).
https://tourism.gov.in/sites/default/files/2020-02/Hotel_Guidelines_From%2019-01-2018.pdf

**Scope caveat to keep in mind while building this:** this classification
scheme is voluntary and mainly covers formally classified hotels — many
budget lodges fall outside it entirely. Frame this module's output as
"checking claims against official criteria where a star-category claim is
made," not as a universal certification of every property. Don't build logic
that assumes every listing has a star rating.

---

## Layer 1 — Document Ingestion & Chunking

**Goal:** turn the HRACC PDF into clean, structured text chunks ready for embedding.

- Download/load the HRACC PDF.
- Extract text (watch for tables — HRACC criteria are often presented in
  tabular format by star category, which plain text extraction can mangle).
- Chunk the document in a way that keeps each chunk's **star category** and
  **criteria type** (e.g. "facilities," "staffing," "safety," "room size")
  identifiable — either by chunking along the document's own section
  boundaries, or by tagging each chunk with metadata (`star_category`,
  `criteria_type`) extracted from surrounding headers.
- Avoid chunking mid-criterion (e.g. splitting "minimum room size: 120 sq ft"
  across two chunks) — prefer slightly larger chunks over broken ones.

**Deliverable:** `chunks.json` (or similar) — a list of
`{text, star_category, criteria_type, source_page}` objects.

**Test:** manually spot-check ~10 chunks against the source PDF — confirm
text wasn't garbled and star-category tagging is correct.

---

## Layer 2 — Embedding & Indexing

**Goal:** embed every chunk and store it in a vector index for retrieval.

- **Model:** `sentence-transformers/all-mpnet-base-v2`
- **Vector store:** ChromaDB
- Embed each chunk's text, store alongside its metadata (star_category,
  criteria_type, source_page) so retrieval results stay traceable back to
  the original document.

**Deliverable:** a populated ChromaDB collection + a simple
`build_index(chunks) -> None` function to (re)build it from `chunks.json`.

**Test:** query the index directly with a plain-text question like "what
amenities are required for a 3-star hotel" and manually confirm the top
results are actually relevant HRACC sections, not noise.

---

## Layer 3 — Retrieval Logic

**Goal:** given a star-category claim, retrieve the right criteria chunks.

- `get_criteria_for_star(star_category: int) -> list[Criterion]`
- Filter/retrieve chunks matching that star category specifically (use the
  metadata from Layer 1/2, not just semantic similarity alone — a pure
  similarity search risks pulling in adjacent star levels' criteria too).
- Return a clean, deduplicated list of individual criteria (not raw chunks)
  — e.g. `["24-hour reception", "en-suite bathroom in every room", "elevator
  for buildings over 4 floors", ...]`. This may require an extra parsing step
  to split a chunk's prose into discrete criteria items.

**Deliverable:** `retrieval.py` with the function above.

**Test:** call `get_criteria_for_star(4)` and confirm the returned list
matches what's actually in the PDF for 4-star hotels (manual cross-check).

---

## Layer 4 — Claim-Checking Logic

**Goal:** compare what a listing claims/shows against the retrieved criteria.

- Input: a listing's claimed star category + whatever amenity/claim data is
  available (initially: a simple list of amenity strings the listing claims
  to have, e.g. from listing text or Module B's detected objects).
- For each retrieved criterion, determine satisfied / not satisfied / unclear
  — simplest first pass: substring/keyword matching between claimed amenities
  and criteria text; a stretch improvement later is using the embedding
  model itself to semantically match ("AC" should match "air conditioning").
- Output: `{star_claimed: int, criteria_total: int, criteria_met: int,
  missing: [...], compliance_ratio: float}`

**Deliverable:** `compliance_check.py` with a
`check_compliance(star_category, claimed_amenities) -> ComplianceResult`
function.

**Test:** run against 2-3 hand-built test listings (one that should mostly
pass, one that should clearly fail) and confirm the output matches your own
manual reading of the PDF for that star level.

---

## Layer 5 — Integration with Module B

**Goal:** close the loop Module B left open — `furniture_detector.py`
currently uses a hardcoded 3-star default amenity list; it should instead
pull the expected amenity list from this module.

- Expose a clean function Module B can call:
  `get_expected_amenities(star_category: int) -> list[str]`
  (this can reuse Layer 3's retrieval logic, filtered down to just the
  "facilities" criteria type).
- Update Module B's `furniture_detector.py` to call this instead of its
  hardcoded default list, when a star category is known for the listing.
- Keep the hardcoded 3-star list as a **fallback** for listings with no
  stated star category — don't break Module B for unclassified/budget lodges
  (see the scope caveat at the top of this doc).

**Deliverable:** updated `furniture_detector.py` + a short integration test
confirming Module B's amenity completeness score changes correctly when a
different star category is passed in.

---

## Suggested project structure

```
compliance_rag/
├── ingest.py              # Layer 1: PDF loading + chunking
├── build_index.py          # Layer 2: embedding + ChromaDB indexing
├── retrieval.py             # Layer 3: star-category criteria retrieval
├── compliance_check.py      # Layer 4: claim-checking logic
├── chunks.json               # Layer 1 output (generated)
├── chroma_db/                  # Layer 2 output (generated, vector store)
├── tests/
│   ├── test_ingest.py
│   ├── test_retrieval.py
│   └── test_compliance_check.py
└── requirements.txt
```

## Suggested requirements.txt starting point
```
sentence-transformers
chromadb
pypdf
```

## Definition of done
- [ ] HRACC PDF successfully chunked with star-category metadata intact
- [ ] ChromaDB index built and returns relevant results for test queries
- [ ] `get_criteria_for_star()` returns accurate, manually-verified criteria lists
- [ ] `check_compliance()` produces sensible pass/fail results on hand-built test listings
- [ ] Module B's `furniture_detector.py` successfully pulls amenity lists from this module, with the old hardcoded list kept only as a fallback
