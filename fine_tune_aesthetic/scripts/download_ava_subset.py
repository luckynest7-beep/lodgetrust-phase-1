#!/usr/bin/env python
"""
Download AVA dataset subset and generate aesthetic score training labels.
"""

import os
import sys
import csv
import random
import zipfile
import urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
IMAGES_DIR = DATA_DIR / "images"
TRAIN_CSV = DATA_DIR / "train_labels.csv"
VAL_CSV = DATA_DIR / "val_labels.csv"
ZIP_OUT = DATA_DIR / "ava_images.zip"

AVA_TXT_PATH = Path("ava_downloader-master/ava_downloader-master/AVA_dataset/AVA.txt")
TARGET_COUNT = 2000
NUM_WORKERS = 30


def parse_ava_metadata(txt_path: Path, max_candidates: int = 3000):
    candidates = []
    with open(txt_path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 15:
                continue
            img_id = parts[1]
            cid = int(parts[14])
            crange = f"{(cid // 1000) * 1000}-{(cid // 1000) * 1000 + 999}"

            ratings = [int(p) for p in parts[2:12]]
            tot = sum(ratings)
            if tot == 0:
                continue
            avg_score = sum(idx * count for idx, count in enumerate(ratings, 1)) / tot

            candidates.append({
                "img_id": img_id,
                "cid": cid,
                "crange": crange,
                "score": round(avg_score, 4),
            })
            if len(candidates) >= max_candidates:
                break
    return candidates


def download_single_image(item, output_dir: Path):
    img_id = item["img_id"]
    cid = item["cid"]
    crange = item["crange"]
    target_path = output_dir / f"{img_id}.jpg"

    if target_path.exists() and target_path.stat().st_size > 1000:
        return item, True

    urls = [
        f"https://images.dpchallenge.com/images_challenge/{crange}/{cid}/1200/Copyrighted_Image_Reuse_Prohibited_{img_id}.jpg",
        f"https://images.dpchallenge.com/images_challenge/{crange}/{cid}/500/Copyrighted_Image_Reuse_Prohibited_{img_id}.jpg",
        f"https://images.dpchallenge.com/images_challenge/{crange}/{cid}/120/Copyrighted_Image_Reuse_Prohibited_{img_id}.jpg",
    ]

    for url in urls:
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    "Referer": "https://www.dpchallenge.com/",
                },
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = resp.read()
                if len(data) > 1000:
                    with open(target_path, "wb") as f_out:
                        f_out.write(data)
                    return item, True
        except Exception:
            continue
    return item, False


def write_label_csv(csv_path: Path, items):
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["image_path", "score"])
        for item in items:
            writer.writerow([f"images/{item['img_id']}.jpg", item["score"]])


def main():
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    # Remove old example placeholders if present
    for old_ex in ["example1.jpg", "example2.jpg", "example3.jpg"]:
        old_path = IMAGES_DIR / old_ex
        if old_path.exists():
            old_path.unlink()

    print(f"Reading AVA metadata from {AVA_TXT_PATH}...")
    candidates = parse_ava_metadata(AVA_TXT_PATH, max_candidates=TARGET_COUNT + 500)
    print(f"Found {len(candidates)} candidate images from AVA.txt")

    print(f"Downloading up to {TARGET_COUNT} images using {NUM_WORKERS} workers...")
    successful_items = []
    with ThreadPoolExecutor(max_workers=NUM_WORKERS) as executor:
        future_to_item = {
            executor.submit(download_single_image, item, IMAGES_DIR): item
            for item in candidates
        }
        for future in as_completed(future_to_item):
            item, success = future.result()
            if success:
                successful_items.append(item)
                if len(successful_items) % 200 == 0 or len(successful_items) == TARGET_COUNT:
                    print(f"Progress: {len(successful_items)}/{TARGET_COUNT} images downloaded...")
            if len(successful_items) >= TARGET_COUNT:
                break

    print(f"Total successfully downloaded images: {len(successful_items)}")

    # Shuffle and split 80/20
    random.seed(42)
    random.shuffle(successful_items)
    split_idx = int(0.8 * len(successful_items))
    train_items = successful_items[:split_idx]
    val_items = successful_items[split_idx:]

    write_label_csv(TRAIN_CSV, train_items)
    write_label_csv(VAL_CSV, val_items)
    print(f"Created {TRAIN_CSV} ({len(train_items)} rows)")
    print(f"Created {VAL_CSV} ({len(val_items)} rows)")

    # Create ava_images.zip archive
    print(f"Creating archive {ZIP_OUT}...")
    with zipfile.ZipFile(ZIP_OUT, "w", zipfile.ZIP_DEFLATED) as zipf:
        for item in successful_items:
            img_file = IMAGES_DIR / f"{item['img_id']}.jpg"
            if img_file.exists():
                zipf.write(img_file, arcname=f"images/{item['img_id']}.jpg")

    print(f"Archive saved ({ZIP_OUT.stat().st_size / (1024*1024):.2f} MB)")
    print("Done!")


if __name__ == "__main__":
    main()
