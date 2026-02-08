"""
🧠 Coastal Pollution Classifier - Powered by OpenAI CLIP
=======================================================
Uses CLIP (Contrastive Language-Image Pre-training) for high-accuracy 
zero-shot classification. No training required.
"""

from PIL import Image
import numpy as np
import os
from pathlib import Path

# Try to import CLIP
try:
    from transformers import CLIPProcessor, CLIPModel
    import torch
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    USE_CLIP = True
    print("✅ CLIP model loaded successfully!")
except ImportError:
    USE_CLIP = False
    print("⚠️ CLIP not available.")



CATEGORIES = ['plastic', 'oil_spill', 'other_solid_waste', 'marine_debris', 'no_waste']

# Master Mapping: detailed_label -> app_category
# This ensures both models map granular detections to the same 5 core categories
UNIFIED_CLASS_MAP = {
    # Keras specific
    'cardboard': 'other_solid_waste',
    'clean_water': 'no_waste',
    'glass': 'other_solid_waste',
    'marine_trash': 'marine_debris',
    'metal': 'other_solid_waste',
    'oil_spill': 'oil_spill',
    'paper': 'other_solid_waste',
    'plastic': 'plastic',
    
    # CLIP specific / General
    'trash': 'other_solid_waste',
    'debris': 'marine_debris',
    'oil': 'oil_spill',
    'clean': 'no_waste'
}

def classify_pollution(image_path: str) -> tuple:
    """Classify pollution using both CLIP and Keras models (Champion logic)."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    
    # Validation check
    try:
        with Image.open(image_path) as img:
            img.verify()
    except:
        return {
            "final_label": "other_solid_waste",
            "final_confidence": 0.0,
            "model_used": "Error",
            "details": None
        }




def predict_clip(image_path: str):
    """Predict using OpenAI CLIP model."""
    if not USE_CLIP:
        return None, 0.0
        
    try:
        image = Image.open(image_path).convert("RGB")
        
        # Extended labels to match Keras granularity
        # We start with the specific prompts, then map their indices to categories
        prompts = [
            "plastic bottles and plastic bags littering a beach",       # 0: plastic
            "oil spill petroleum contamination on water",               # 1: oil_spill
            "cardboard boxes and paper waste on beach",                 # 2: cardboard -> other_solid_waste
            "glass bottles and broken glass shards on sand",            # 3: glass -> other_solid_waste
            "metal cans and rusty metal scrap on beach",                # 4: metal -> other_solid_waste
            "fishing nets and ropes tangled in water",                  # 5: marine_debris
            "garbage pile mixed trash rubbish dump",                    # 6: trash -> other_solid_waste
            "natural clean ocean water waves sea view"                  # 7: no_waste
        ]
        
        # Map prompt index to App Category
        prompt_to_category = {
            0: "plastic",
            1: "oil_spill",
            2: "other_solid_waste",
            3: "other_solid_waste",
            4: "other_solid_waste",
            5: "marine_debris",
            6: "other_solid_waste",
            7: "no_waste"
        }
        
        inputs = processor(text=prompts, images=image, return_tensors="pt", padding=True)
        
        with torch.no_grad():
            outputs = model(**inputs)
            probs = outputs.logits_per_image.softmax(dim=1)[0]
        
        # Get all probabilities
        all_probs = probs.tolist()
        idx = probs.argmax().item()
        confidence = probs[idx].item()
        no_waste_prob = all_probs[7]  # no_waste is index 7 now
        
        predicted = prompt_to_category[idx]
        
        # Confidence penalties
        if predicted != "no_waste" and confidence < 0.85:
            if no_waste_prob > 0.15:
                predicted = "no_waste"
                confidence = no_waste_prob
        
        original_prompt_concept = ["plastic", "oil", "cardboard", "glass", "metal", "debris", "trash", "clean"][idx]
        print(f"🧠 CLIP Prediction: {original_prompt_concept} -> {predicted} ({confidence*100:.1f}%)")
        return predicted, confidence

    except Exception as e:
        print(f"❌ CLIP Error: {e}")
        return None, 0.0

def classify_pollution(image_path: str) -> dict:
    """Classify pollution using CLIP model."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    
    # Get predictions from CLIP
    clip_label, clip_conf = predict_clip(image_path)
    
    # Default fallback
    final_label = clip_label if clip_label else "other_solid_waste"
    final_conf = clip_conf if clip_conf else 0.0
    model_used = "CLIP" if clip_label else "None"

    print(f"🏆 MODEL: {model_used} | {final_label} ({final_conf*100:.1f}%)")
    
    # Return structured result
    return {
        "final_label": final_label,
        "final_confidence": round(final_conf, 4),
        "model_used": model_used,
        "details": {
            "clip": {"label": clip_label, "confidence": round(clip_conf, 4) if clip_conf else 0}
        }
    }


def extract_gps_from_exif(image_path: str) -> dict:
    """Extract GPS from EXIF."""
    try:
        img = Image.open(image_path)
        exif = img._getexif()
        if not exif: return {'has_gps': False}
        
        gps = exif.get(34853)
        if not gps: return {'has_gps': False}
        
        def to_deg(v): return float(v[0]) + float(v[1])/60 + float(v[2])/3600
        
        lat = to_deg(gps[2])
        lon = to_deg(gps[4])
        
        if gps.get(1) == 'S': lat = -lat
        if gps.get(3) == 'W': lon = -lon
        
        return {'has_gps': True, 'latitude': lat, 'longitude': lon}
    except:
        return {'has_gps': False}


def validate_image(image_path: str) -> dict:
    """Validate image."""
    try:
        img = Image.open(image_path)
        w, h = img.size
        
        if min(w, h) < 100:
            return {
                'is_valid': False, 
                'is_suspicious': True, 
                'confidence_penalty': 0.5, 
                'warnings': ['Too small']
            }
        
        return {
            'is_valid': True,
            'is_suspicious': False, 
            'confidence_penalty': 0.0,
            'warnings': []
        }
    except Exception as e:
        return {
            'is_valid': False, 
            'is_suspicious': True,
            'confidence_penalty': 0.5, 
            'warnings': [str(e)]
        }


def get_pollution_info(ptype: str) -> dict:
    info = {
        "plastic": {"name": "Plastic Pollution", "icon": "🥤", "color": "#ef4444"},
        "oil_spill": {"name": "Oil Spill", "icon": "🛢️", "color": "#1f2937"},
        "other_solid_waste": {"name": "Solid Waste", "icon": "🗑️", "color": "#92400e"},
        "marine_debris": {"name": "Marine Debris", "icon": "🎣", "color": "#0ea5e9"},
        "no_waste": {"name": "No Waste Detected", "icon": "✅", "color": "#22c55e"}
    }
    return info.get(ptype, info["other_solid_waste"])


def analyze_image(image_path: str) -> dict:
    """Wrapper for main classification logic."""
    result = classify_pollution(image_path)
    
    label = result["final_label"]
    confidence = result["final_confidence"]
    
    info = get_pollution_info(label)
    return {
        "label": label,
        "confidence": confidence,
        "pollution_name": info["name"],
        "pollution_icon": info["icon"],
        "pollution_color": info["color"],
        "analysis_details": result["details"],
        "model_used": result["model_used"]
    }


def extract_gps_data(image_path: str) -> dict:
    """Wrapper for GPS extraction."""
    return extract_gps_from_exif(image_path)

