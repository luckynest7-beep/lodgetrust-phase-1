import socket
socket.setdefaulttimeout(15)  # Drop connection if it hangs for 15s and force retry!
import os
import time
from huggingface_hub import snapshot_download

os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "0"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

models = [
    "prithivMLmods/deepfake-detector-model-v1",
    "cafeai/cafe_aesthetic",
]

for repo_id in models:
    for attempt in range(20):
        try:
            print(f"Attempt {attempt+1} downloading {repo_id}...")
            snapshot_download(repo_id=repo_id)
            print(f"Successfully downloaded {repo_id}!")
            break
        except Exception as e:
            print(f"Failed: {e}. Retrying in 2 seconds...")
            time.sleep(2)
