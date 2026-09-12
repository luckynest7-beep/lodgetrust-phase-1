# Fine‑tune Aesthetic Score Model

This workspace contains everything needed to fine‑tune the
`cafeai/cafe_aesthetic` model on your own labeled images.

1. Put your JPEG/PNG images inside `data/images/`.
2. Edit `data/train_labels.csv` and `data/val_labels.csv`:
   - Columns: `image_path,score`
   - `image_path` is **relative** to the `data/` folder, e.g. `images/img001.jpg`.
   - `score` is a float (e.g. `7.5`) representing your aesthetic rating.
3. Run the script:
   ```bash
   python scripts/fine_tune_aesthetic.py
   ```
   The script writes the fine‑tuned checkpoint to `model/`.
4. In the main repository set:
   ```python
   DEFAULT_MODEL_NAME = "<absolute‑path‑to>/model"
   ```
   (e.g. `/content/drive/MyDrive/fine_tune_aesthetic/model`).
