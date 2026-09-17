# 🚀 Google Colab Fine-Tuning Guide for LodgeTrust Aesthetic Model

This guide walks you through fine-tuning the **`cafeai/cafe_aesthetic`** vision model on your 500 room images using a free GPU on Google Colab in under 5 minutes.

---

## 📁 What You Have Ready

1. **`fine_tune_aesthetic/data/`**:
   - `images/`: 500 real room photos (`room_0001.jpg` – `room_0500.jpg`)
   - `train_labels.csv`: 400 training images with numeric aesthetic scores
   - `val_labels.csv`: 100 validation images
2. **`fine_tune_aesthetic/scripts/fine_tune_aesthetic.py`**:
   - Training script using Hugging Face `Trainer`, regression head, MSE/MAE evaluation, and GPU mixed precision.
3. **`fine_tune_aesthetic/fine_tune_aesthetic_colab.ipynb`**:
   - Pre-configured Jupyter Notebook for Google Colab.
4. **`project/fine_tune_aesthetic.zip`** (~7.3 MB):
   - Standalone zipped archive containing the entire workspace.

---

## 🛠️ Step-by-Step Instructions

### Option A: Direct Notebook Upload to Google Colab (Recommended & Easiest)

1. **Upload Zip to Google Drive**:
   - Go to [Google Drive](https://drive.google.com).
   - Upload `fine_tune_aesthetic.zip` (located in `project/fine_tune_aesthetic.zip`) to the root of your Google Drive (`MyDrive`).

2. **Open Google Colab**:
   - Go to [colab.research.google.com](https://colab.research.google.com).
   - Click **File > Upload Notebook** and select `fine_tune_aesthetic_colab.ipynb` (from `project/fine_tune_aesthetic/fine_tune_aesthetic_colab.ipynb`).

3. **Enable Free GPU**:
   - In Colab top menu, click **Runtime > Change runtime type**.
   - Under **Hardware accelerator**, select **T4 GPU** and click **Save**.

4. **Run the Notebook Cells**:
   - **Cell 1**: Mount Google Drive (`from google.colab import drive; drive.mount('/content/drive')`).
   - **Cell 2**: Unzip workspace if not extracted:
     ```python
     !unzip -q /content/drive/MyDrive/fine_tune_aesthetic.zip -d /content/drive/MyDrive/
     ```
   - **Cell 3**: Install requirements:
     ```python
     !pip install -q transformers datasets accelerate pillow torchvision evaluate
     ```
   - **Cell 4**: Run training:
     ```python
     %cd /content/drive/MyDrive/fine_tune_aesthetic
     !python scripts/fine_tune_aesthetic.py --epochs 5 --batch_size 16 --lr 5e-5
     ```
   - **Cell 5**: Test inference on a sample room image.

---

## 💾 What Gets Saved

When training completes, the model weights and processor are automatically saved to:
- **`fine_tune_aesthetic/model/`** in your Google Drive, containing:
  - `model.safetensors`
  - `config.json`
  - `preprocessor_config.json`

---

## 🔄 Using Your Fine-Tuned Model Locally

1. Download the `model/` folder from Google Drive into your local:
   `project/fine_tune_aesthetic/model/`
2. That's it! The LodgeTrust backend (`aesthetic_score.py`) automatically detects the local checkpoint in `fine_tune_aesthetic/model/` and uses your fine-tuned model for all aesthetic score predictions.
