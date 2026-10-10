import os
import time

os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

from huggingface_hub import snapshot_download

models = [
    "openai/clip-vit-large-patch14",
    "prithivMLmods/deepfake-detector-model-v1",
    "cafeai/cafe_aesthetic",
]

for repo_id in models:
    print(f"\n==========================================")
    print(f"Downloading {repo_id} with hf-transfer ...")
    print(f"==========================================")
    try:
        path = snapshot_download(repo_id=repo_id)
        print(f"✅ Successfully downloaded {repo_id} to {path}")
    except Exception as e:
        print(f"⚠️ Failed with hf-transfer: {e}, falling back to standard...")
        os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "0"
        path = snapshot_download(repo_id=repo_id)
        print(f"✅ Downloaded with standard downloader: {path}")

print("\n🎉 ALL MODEL SNAPSHOTS FULLY DOWNLOADED AND CACHED!")
