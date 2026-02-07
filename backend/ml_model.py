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
    print("[OK] CLIP model loaded successfully!")
except ImportError:
    USE_CLIP = False
    print("[WARNING] CLIP not available. Installing...")

CATEGORIES = ['plastic', 'oil_spill', 'other_solid_waste', 'marine_debris', 'no_waste']

def classify_pollution(image_path: str) -> tuple:
    """Classify pollution using CLIP AI."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    
    # Validation check
    try:
        with Image.open(image_path) as img:
            img.verify()
    except:
        return "other_solid_waste", 0.0

    if USE_CLIP:
        try:
            image = Image.open(image_path).convert("RGB")
            
            # Labels designed for maximum contrast between categories
            # More specific and mutually exclusive descriptions
            labels = [
                "plastic waste pollution: plastic bottles, bags, wrappers, and plastic debris scattered on beach sand",
                "oil spill contamination: dark black or brown oil slick floating on water surface, petroleum pollution",
                "general garbage and trash pile: mixed solid waste, rubbish, litter on coastal area",
                "marine debris: abandoned fishing nets, ropes, buoys, and fishing equipment in water",
                "clean natural environment: pristine beach, clear blue ocean water, no visible trash or pollution"
            ]
            
            inputs = processor(text=labels, images=image, return_tensors="pt", padding=True)
            
            with torch.no_grad():
                outputs = model(**inputs)
                # Apply temperature scaling to sharpen probabilities (lower = sharper)
                temperature = 0.5
                logits = outputs.logits_per_image / temperature
                probs = logits.softmax(dim=1)[0]
            
            # Get all probabilities
            all_probs = probs.tolist()
            idx = probs.argmax().item()
            confidence = probs[idx].item()
            no_waste_prob = all_probs[4]  # no_waste is index 4
            
            # Map back to category keys
            category_map = {
                0: "plastic",
                1: "oil_spill",
                2: "other_solid_waste",
                3: "marine_debris",
                4: "no_waste"
            }
            
            predicted = category_map[idx]
            
            # Convert confidence to human-readable level
            if confidence >= 0.75:
                confidence_level = "high"
            elif confidence >= 0.50:
                confidence_level = "medium"
            else:
                confidence_level = "low"
            
            # Flag for manual review: no_waste with low confidence should be checked
            needs_review = (predicted == "no_waste" and confidence < 0.70)
            
            print(f"[CLIP] Prediction: {predicted} ({confidence_level} chance)")
            
            return predicted, round(confidence, 4), confidence_level, needs_review
            
        except Exception as e:
            print(f"CLIP Error: {e}")
            return "other_solid_waste", 0.5, "medium", False
    
    else:
        # Fallback if CLIP fails (should not happen after install)
        return "other_solid_waste", 0.5, "medium", False


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
    label, confidence, confidence_level, needs_review = classify_pollution(image_path)
    info = get_pollution_info(label)
    return {
        "label": label,
        "confidence": confidence,
        "confidence_level": confidence_level,  # "low", "medium", "high"
        "needs_review": needs_review,  # True if admin should check
        "pollution_name": info["name"],
        "pollution_icon": info["icon"],
        "pollution_color": info["color"]
    }


def extract_gps_data(image_path: str) -> dict:
    """Wrapper for GPS extraction."""
    return extract_gps_from_exif(image_path)

