"""B1 Stolen / Reused Image Detection module using CLIP embeddings and FAISS similarity search."""

import json
from pathlib import Path
from typing import List, Tuple, Union, Optional
import numpy as np
from PIL import Image
import faiss

from clip_utils import embed_image

DEFAULT_SIM_THRESHOLD = 0.95
DEFAULT_EMBED_DIM = 768

_INDEX: Optional[faiss.IndexFlatIP] = None
_METADATA: List[Tuple[str, str]] = []  # List of (listing_id, image_id)


def _get_or_create_index(dim: int = DEFAULT_EMBED_DIM) -> faiss.IndexFlatIP:
    """Return the global FAISS index instance, initializing it if necessary."""
    global _INDEX
    if _INDEX is None:
        _INDEX = faiss.IndexFlatIP(dim)
    return _INDEX


def clear_index() -> None:
    """Reset the module-level FAISS index and metadata storage."""
    global _INDEX, _METADATA
    _INDEX = None
    _METADATA = []


def add_image(image: Union[Image.Image, str, Path], listing_id: str, image_id: str) -> None:
    """Embed an image and add it to the FAISS index with its (listing_id, image_id) metadata.

    Args:
        image: A PIL Image instance or file path.
        listing_id: Identifier of the listing owning the image.
        image_id: Unique identifier for the image.
    """
    global _METADATA
    vec = embed_image(image)
    dim = vec.shape[0]
    index = _get_or_create_index(dim)

    # FAISS expects 2D float32 array
    vec_2d = vec.reshape(1, -1).astype(np.float32)
    index.add(vec_2d)
    _METADATA.append((listing_id, image_id))


def add_images(images_with_meta: List[Tuple[Union[Image.Image, str, Path], str, str]]) -> None:
    """Bulk add images to the index.

    Args:
        images_with_meta: List of (image, listing_id, image_id) tuples.
    """
    for img, listing_id, image_id in images_with_meta:
        add_image(img, listing_id, image_id)


def check_stolen(
    image: Union[Image.Image, str, Path],
    listing_id: str,
    top_k: int = 5,
    threshold: float = DEFAULT_SIM_THRESHOLD,
) -> dict:
    """Embed input image and query FAISS for near-duplicate images from other listings.

    Args:
        image: A PIL Image or image file path.
        listing_id: Listing ID of the image being checked (used for self-match guard).
        top_k: Number of nearest neighbors to retrieve.
        threshold: Cosine similarity threshold for flagging stolen images.

    Returns:
        dict: {
            "is_flagged": bool,
            "matched_listing_id": str | None,
            "matched_image_id": str | None,
            "similarity_score": float
        }
    """
    if _INDEX is None or _INDEX.ntotal == 0:
        return {
            "is_flagged": False,
            "matched_listing_id": None,
            "matched_image_id": None,
            "similarity_score": 0.0,
        }

    vec = embed_image(image)
    vec_2d = vec.reshape(1, -1).astype(np.float32)

    # Search for top-k neighbors
    search_k = min(top_k, _INDEX.ntotal)
    distances, indices = _INDEX.search(vec_2d, search_k)

    best_cross_listing = None
    best_cross_sim = 0.0

    for sim, idx in zip(distances[0], indices[0]):
        if idx < 0 or idx >= len(_METADATA):
            continue

        matched_listing, matched_img = _METADATA[idx]

        # Self-match guard: skip images belonging to the exact same listing
        if matched_listing == listing_id:
            continue

        sim_float = float(sim)
        if sim_float > best_cross_sim:
            best_cross_sim = sim_float
            best_cross_listing = (matched_listing, matched_img)

        # Return immediately if cross-listing match meets or exceeds threshold
        if sim_float >= threshold:
            return {
                "is_flagged": True,
                "matched_listing_id": matched_listing,
                "matched_image_id": matched_img,
                "similarity_score": sim_float,
            }

    if best_cross_listing is not None:
        return {
            "is_flagged": False,
            "matched_listing_id": best_cross_listing[0],
            "matched_image_id": best_cross_listing[1],
            "similarity_score": best_cross_sim,
        }

    return {
        "is_flagged": False,
        "matched_listing_id": None,
        "matched_image_id": None,
        "similarity_score": 0.0,
    }


def save_index(file_path: Union[str, Path]) -> None:
    """Save the current FAISS index and metadata to disk.

    Args:
        file_path: Base path or filepath for saved index (.faiss + .meta.json).
    """
    path_obj = Path(file_path)
    if path_obj.suffix == ".faiss":
        faiss_path = path_obj
        meta_path = path_obj.with_suffix(".meta.json")
    else:
        faiss_path = Path(f"{file_path}.faiss")
        meta_path = Path(f"{file_path}.meta.json")

    index = _get_or_create_index()
    faiss.write_index(index, str(faiss_path))

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(_METADATA, f, indent=2)


def load_index(file_path: Union[str, Path]) -> None:
    """Load a FAISS index and metadata sidecar from disk.

    Args:
        file_path: Base path or filepath for saved index.
    """
    global _INDEX, _METADATA

    path_obj = Path(file_path)
    if path_obj.suffix == ".faiss":
        faiss_path = path_obj
        meta_path = path_obj.with_suffix(".meta.json")
    else:
        faiss_path = Path(f"{file_path}.faiss")
        meta_path = Path(f"{file_path}.meta.json")

    if not faiss_path.exists() or not meta_path.exists():
        raise FileNotFoundError(f"Index or metadata file not found at {faiss_path} / {meta_path}")

    _INDEX = faiss.read_index(str(faiss_path))
    with open(meta_path, "r", encoding="utf-8") as f:
        _METADATA = [tuple(item) for item in json.load(f)]
