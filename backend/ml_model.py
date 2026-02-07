"""
🧠 Coastal Pollution Classifier - Custom Keras Model (Railway-safe)
===================================================
- Robust file paths (expects model + mapping inside backend/)
- No dependency on tensorflow img_to_array (uses pure numpy)
- Safe loading + clear logs
"""

import json
import logging
import os
from pathlib import Path

import numpy as np
from PIL import Image

# -------------------- Logging --------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------- Paths --------------------
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model_best.keras"
CLASS_MAPPING_PATH = BASE_DIR / "class_mapping.json"

# -------------------- Globals --------------------
model = None
class_names = [
    "cardboard", "clean_water", "glass", "marine_trash",
    "metal", "oil_spill", "paper", "plastic"
]

# -------------------- Load TensorFlow + Model --------------------
try:
    import tensorflow as tf  # noqa: F401
    from tensorflow.keras.models import load_model

    logger.info(f"Loading model from: {MODEL_PATH}")

    if MODEL_PATH.exists():
        model = load_model(str(MODEL_PATH))
        logger.info("✅ Custom Keras model loaded successfully!")
    else:
        logger.error(f"❌ Model file not found at {MODEL_PATH}")

    if CLASS_MAPPING_PATH.exists():
        with open(CLASS_MAPPING_PATH, "r", encoding="utf-8") as f:
            mapping = json.load(f)

        # Prefer explicit list if present
        if isinstance(mapping, dict) and "classes" in mapping and isinstance(mapping["classes"], list):
            class_names = mapping["classes"]
        elif isinstance(mapping, dict) and "class_to_idx" in mapping and isinstance(mapping["class_to_idx"], dict):
            # Invert mapping based on index order
            class_to_idx = mapping["class_to_idx"]
            class_names = [k for k, v in sorted(class_to_idx.items(), key=lambda item: item[1])]

        logger.info(f"✅ Class mapping loaded: {class_names}")
    else:
        logger.warning(f"⚠️ Class mapping file not found at {CLASS_MAPPING_PATH}. Using fallback classes.")

except ImportError:
    logger.error("⚠️ TensorFlow not available. Install tensorflow to enable classification.")
except Exception as e:
    logger.error(f"⚠️ Error loading model or mapping: {e}")


# -------------------- Helpers --------------------
def preprocess_image(image_path: str, target_size=(224, 224)) -> np.ndarray:
    """
    Preprocess image for Keras model.
    Uses PIL + numpy only (no TF helpers required).
    Output shape: (1, 224, 224, 3), normalized [0,1]
    """
    img = Image.open(image_path).convert("RGB")
    img = img.resize(target_size)

    arr = np.array(img, dtype=np.float32)  # (224,224,3)
    arr = arr / 255.0
    arr = np.expand_dims(arr, axis=0)      # (1,224,224,3)
    return arr


def _quick_image_verify(image_path: str) -> bool:
    """Fast verify that image is not corrupt."""
    try:
        with Image.open(image_path) as img:
            img.verify()
        return True
    except Exception:
        return False


# -------------------- Core Classification --------------------
def classify_pollution(image_path: str) -> tuple[str, float]:
    """Classify pollution using the loaded Keras model."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    if not _quick_image_verify(image_path):
        return "other_solid_waste", 0.0

    if model is None:
        logger.warning("⚠️ Model not loaded, returning fallback.")
        return "other_solid_waste", 0.0

    try:
        processed = preprocess_image(image_path)
        preds = model.predict(processed, verbose=0)

        confidence = float(np.max(preds))
        idx = int(np.argmax(preds))

        if 0 <= idx < len(class_names):
            label = class_names[idx]
        else:
            label = "unknown"

        logger.info(f"🧠 Model Prediction: {label} ({confidence*100:.1f}%)")
        return label, round(confidence, 4)

    except Exception as e:
        logger.error(f"Prediction Error: {e}")
        return "other_solid_waste", 0.0


def get_pollution_info(ptype: str) -> dict:
    """Maps classes to UI labels/icons/colors."""
    info_map = {
        "plastic": {"name": "Plastic Pollution", "icon": "🥤", "color": "#ef4444"},
        "oil_spill": {"name": "Oil Spill", "icon": "🛢️", "color": "#1f2937"},
        "marine_trash": {"name": "Marine Trash", "icon": "⚓", "color": "#0ea5e9"},
        "cardboard": {"name": "Cardboard Waste", "icon": "📦", "color": "#d97706"},
        "paper": {"name": "Paper Waste", "icon": "📄", "color": "#9ca3af"},
        "metal": {"name": "Metal Waste", "icon": "⚙️", "color": "#6b7280"},
        "glass": {"name": "Glass Waste", "icon": "🍾", "color": "#10b981"},
        "clean_water": {"name": "Clean Water", "icon": "💧", "color": "#3b82f6"},
        "unknown": {"name": "Unknown", "icon": "❓", "color": "#6b7280"},
        "other_solid_waste": {"name": "Solid Waste", "icon": "🗑️", "color": "#92400e"},
    }
    return info_map.get(ptype, info_map["other_solid_waste"])


def analyze_image(image_path: str) -> dict:
    """Wrapper returning a frontend-friendly payload."""
    label, confidence = classify_pollution(image_path)
    info = get_pollution_info(label)
    return {
        "label": label,
        "confidence": confidence,
        "pollution_name": info["name"],
        "pollution_icon": info["icon"],
        "pollution_color": info["color"],
    }


# -------------------- GPS Extraction --------------------
def extract_gps_data(image_path: str) -> dict:
    """
    Extract GPS from EXIF if present.
    Returns: {'has_gps': bool, 'latitude': float?, 'longitude': float?}
    """
    try:
        img = Image.open(image_path)
        exif = img._getexif()
        if not exif:
            return {"has_gps": False}

        gps = exif.get(34853)
        if not gps:
            return {"has_gps": False}

        def to_deg(v):
            # v is usually a tuple of rationals (num/den)
            def as_float(x):
                try:
                    # PIL may give (num, den) or Fraction-like
                    if isinstance(x, tuple) and len(x) == 2:
                        return float(x[0]) / float(x[1])
                    return float(x)
                except Exception:
                    return 0.0

            d = as_float(v[0])
            m = as_float(v[1])
            s = as_float(v[2])
            return d + (m / 60.0) + (s / 3600.0)

        # NOTE: EXIF GPS format varies a lot; this works for common cases.
        lat = to_deg(gps[2])
        lon = to_deg(gps[4])

        # N/S, E/W
        if gps.get(1) in ("S", b"S"):
            lat = -lat
        if gps.get(3) in ("W", b"W"):
            lon = -lon

        return {"has_gps": True, "latitude": lat, "longitude": lon}

    except Exception:
        return {"has_gps": False}
