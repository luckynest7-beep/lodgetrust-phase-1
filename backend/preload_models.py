import os
import sys
from pathlib import Path
from PIL import Image

CURRENT_DIR = Path(__file__).resolve().parent
IMAGE_ANALYSIS_DIR = CURRENT_DIR / "image_analysis"
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))
if str(IMAGE_ANALYSIS_DIR) not in sys.path:
    sys.path.insert(0, str(IMAGE_ANALYSIS_DIR))

print("--> [1/4] Pre-loading and caching CLIP model (openai/clip-vit-large-patch14)...")
try:
    from clip_utils import load_clip, embed_image
    load_clip()
    dummy = Image.new("RGB", (224, 224), color=(200, 100, 50))
    emb = embed_image(dummy)
    print(f"✅ CLIP loaded successfully. Embedding shape: {emb.shape}")
except Exception as e:
    print(f"❌ Error loading CLIP: {e}")

print("\n--> [2/4] Pre-loading AI Deepfake Detector (prithivMLmods/deepfake-detector-model-v1)...")
try:
    from ai_image_detector import load_ai_detector, detect_ai_generated
    load_ai_detector()
    res = detect_ai_generated(dummy)
    print(f"✅ AI detector loaded successfully. Dummy result: {res}")
except Exception as e:
    print(f"❌ Error loading AI detector: {e}")

print("\n--> [3/4] Pre-loading Aesthetic Predictor (cafeai/cafe_aesthetic)...")
try:
    from aesthetic_score import load_aesthetic_predictor, score_aesthetic
    load_aesthetic_predictor()
    res = score_aesthetic(dummy)
    print(f"✅ Aesthetic predictor loaded successfully. Dummy score: {res}")
except Exception as e:
    print(f"❌ Error loading Aesthetic predictor: {e}")

print("\n--> [4/4] Pre-loading YOLO amenity detector (yolo11l.pt)...")
try:
    from furniture_detector import load_yolo_model, detect_furniture
    load_yolo_model()
    res = detect_furniture(dummy)
    print(f"✅ YOLO detector loaded successfully. Dummy detected: {res}")
except Exception as e:
    print(f"❌ Error loading YOLO: {e}")

print("\n--> Seeding FAISS index...")
try:
    from api.seed_index import seed_dummy_index
    count = seed_dummy_index()
    print(f"✅ Seeded FAISS index with {count} images.")
except Exception as e:
    print(f"❌ Error seeding FAISS index: {e}")

print("\n🎉 ALL MODELS & DEPENDENCIES FULLY INITIALIZED AND READY!")
