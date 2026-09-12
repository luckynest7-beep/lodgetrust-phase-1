#!/usr/bin/env python
"""
Fine‑tune the `cafeai/cafe_aesthetic` model on a user‑provided dataset of images
+ numeric aesthetic scores.

Usage (run from the workspace root):
    python scripts/fine_tune_aesthetic.py
"""

import os
import csv
from pathlib import Path
from PIL import Image
from datasets import Dataset
import torch
from transformers import (
    AutoImageProcessor,
    AutoModelForImageClassification,
    TrainingArguments,
    Trainer,
)

# ------------------------------------------------------------------
# 1️⃣  Paths – edit only if you moved the workspace
# ------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parents[1]   # workspace root
DATA_DIR = ROOT_DIR / "data"
IMG_DIR  = DATA_DIR / "images"
OUT_DIR  = ROOT_DIR / "model"

TRAIN_CSV = DATA_DIR / "train_labels.csv"
VAL_CSV   = DATA_DIR / "val_labels.csv"

# ------------------------------------------------------------------
# 2️⃣  Load CSVs → HuggingFace Datasets
# ------------------------------------------------------------------
def load_csv(csv_path: Path) -> Dataset:
    img_paths = []
    labels = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            img_paths.append(row["image_path"])
            labels.append(float(row["score"]))
    return Dataset.from_dict({"image_path": img_paths, "label": labels})

train_ds = load_csv(TRAIN_CSV)
val_ds   = load_csv(VAL_CSV)

# ------------------------------------------------------------------
# 3️⃣  Model & processor (regression head)
# ------------------------------------------------------------------
BASE_MODEL = "cafeai/cafe_aesthetic"
processor  = AutoImageProcessor.from_pretrained(BASE_MODEL)
model      = AutoModelForImageClassification.from_pretrained(
    BASE_MODEL,
    num_labels=1,               # regression output
    problem_type="regression",
)

# ------------------------------------------------------------------
# 4️⃣  Pre‑process each example (read raw image bytes → tensor)
# ------------------------------------------------------------------
def preprocess(example):
    img_path = DATA_DIR / example["image_path"]
    img = Image.open(img_path).convert("RGB")
    pix = processor(images=img, return_tensors="pt")["pixel_values"][0]
    return {"pixel_values": pix, "labels": float(example["label"])}

train_ds = train_ds.map(preprocess, remove_columns=["image_path", "label"])
val_ds   = val_ds.map(preprocess,   remove_columns=["image_path", "label"])

# ------------------------------------------------------------------
# 5️⃣  Training arguments (fast defaults for a small dataset)
# ------------------------------------------------------------------
try:
    training_args = TrainingArguments(
        output_dir=str(OUT_DIR),
        per_device_train_batch_size=16,
        per_device_eval_batch_size=32,
        num_train_epochs=3,                # increase if you have more data
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=5e-5,
        weight_decay=0.01,
        fp16=torch.cuda.is_available(),
        report_to=[],                       # no wandb/MLflow logs
    )
except TypeError:
    training_args = TrainingArguments(
        output_dir=str(OUT_DIR),
        per_device_train_batch_size=16,
        per_device_eval_batch_size=32,
        num_train_epochs=3,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        learning_rate=5e-5,
        weight_decay=0.01,
        fp16=torch.cuda.is_available(),
        report_to=[],
    )

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_ds,
    eval_dataset=val_ds,
)

if __name__ == "__main__":
    print("🚀 Starting fine‑tuning …")
    trainer.train()
    print("✅ Training finished – checkpoint saved in:", OUT_DIR)

    # Save both model and processor in the same directory (required for loading later)
    trainer.save_model(str(OUT_DIR))
    processor.save_pretrained(str(OUT_DIR))
