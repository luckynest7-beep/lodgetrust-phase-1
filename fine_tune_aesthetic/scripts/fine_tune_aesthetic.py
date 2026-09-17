#!/usr/bin/env python
"""
Fine‑tune the `cafeai/cafe_aesthetic` model on a user‑provided dataset of images
+ numeric aesthetic scores.

Usage (run from the workspace root):
    python scripts/fine_tune_aesthetic.py
"""

import argparse
import csv
import os
from pathlib import Path
import numpy as np
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
# 1️⃣  Paths & Arguments
# ------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parents[1]   # workspace root
DATA_DIR = ROOT_DIR / "data"
IMG_DIR  = DATA_DIR / "images"
OUT_DIR  = ROOT_DIR / "model"

TRAIN_CSV = DATA_DIR / "train_labels.csv"
VAL_CSV   = DATA_DIR / "val_labels.csv"


def parse_args():
    parser = argparse.ArgumentParser(description="Fine-tune aesthetic regression model")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=16, help="Train batch size")
    parser.add_argument("--lr", type=float, default=5e-5, help="Learning rate")
    parser.add_argument("--base_model", type=str, default="cafeai/cafe_aesthetic", help="Base model checkpoint")
    return parser.parse_args()


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


# ------------------------------------------------------------------
# 3️⃣  Evaluation Metrics (MSE, MAE)
# ------------------------------------------------------------------
def compute_metrics(eval_pred):
    predictions, labels = eval_pred
    if isinstance(predictions, tuple):
        predictions = predictions[0]
    predictions = np.squeeze(predictions)
    labels = np.squeeze(labels)
    mse = float(np.mean((predictions - labels) ** 2))
    mae = float(np.mean(np.abs(predictions - labels)))
    return {"mse": round(mse, 4), "mae": round(mae, 4)}


def main():
    args = parse_args()
    print("=" * 60)
    print(f" Lodgetrust Aesthetic Fine-Tuning ")
    print(f" Base model:   {args.base_model}")
    print(f" Dataset dir:  {DATA_DIR}")
    print(f" Output dir:   {OUT_DIR}")
    print(f" Epochs:       {args.epochs}")
    print(f" Batch size:   {args.batch_size}")
    print(f" Learning rate: {args.lr}")
    print(f" Device:       {'CUDA (' + torch.cuda.get_device_name(0) + ')' if torch.cuda.is_available() else 'CPU'}")
    print("=" * 60)

    train_ds = load_csv(TRAIN_CSV)
    val_ds   = load_csv(VAL_CSV)
    print(f"Loaded {len(train_ds)} training samples and {len(val_ds)} validation samples.")

    # Model & Processor
    processor = AutoImageProcessor.from_pretrained(args.base_model)
    model = AutoModelForImageClassification.from_pretrained(
        args.base_model,
        num_labels=1,               # Regression head
        problem_type="regression",
        ignore_mismatched_sizes=True,
    )

    def preprocess(example):
        img_path = DATA_DIR / example["image_path"]
        img = Image.open(img_path).convert("RGB")
        pix = processor(images=img, return_tensors="pt")["pixel_values"][0]
        return {"pixel_values": pix, "labels": float(example["label"])}

    print("Preprocessing datasets...")
    train_ds = train_ds.map(preprocess, remove_columns=["image_path", "label"])
    val_ds   = val_ds.map(preprocess,   remove_columns=["image_path", "label"])

    # Training Arguments
    training_kwargs = {
        "output_dir": str(OUT_DIR),
        "per_device_train_batch_size": args.batch_size,
        "per_device_eval_batch_size": args.batch_size * 2,
        "num_train_epochs": args.epochs,
        "learning_rate": args.lr,
        "weight_decay": 0.01,
        "fp16": torch.cuda.is_available(),
        "logging_steps": 10,
        "save_total_limit": 2,
        "report_to": [],
    }

    try:
        training_args = TrainingArguments(
            eval_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="mse",
            greater_is_better=False,
            **training_kwargs,
        )
    except TypeError:
        training_args = TrainingArguments(
            evaluation_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="mse",
            greater_is_better=False,
            **training_kwargs,
        )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics,
    )

    print("🚀 Starting fine-tuning...")
    trainer.train()
    print(f"✅ Training complete! Saving final model checkpoint to: {OUT_DIR}")

    # Save model, processor and config
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(OUT_DIR))
    processor.save_pretrained(str(OUT_DIR))
    print("✨ Model weights and processor successfully saved. Ready for inference!")


if __name__ == "__main__":
    main()

