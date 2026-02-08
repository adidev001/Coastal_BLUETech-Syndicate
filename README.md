# 🌊 Coastal Guardian

**Coastal Guardian** is a modern web platform designed to empower communities in the fight against marine pollution. By combining AI vision with gamification, we turn every citizen into an active protector of our coastlines.

## 🚀 Key Features

### 🧠 AI-Powered Detection
Uses **OpenAI's CLIP Model** to intelligently analyze uploaded images. It doesn't just guess; it understands the context to identify:

- **Plastic Waste** (Bottles, bags)
- **Oil Spills** (Surface contamination)
- **Marine Debris** (Nets, ghost gear)
- **Solid Waste** (General trash)

### 📸 Smart Reporting
- **Dual-Mode Upload**: Snap a photo directly via camera or drag-and-drop from your gallery.
- **Auto-Geolocation**: Automatically extracts GPS data from images to pinpoint pollution hotspots on the global map.
- **Real-Time Analysis**: Get instant feedback on the type of pollution and confidence level.

### 🎮 Gamification & Rewards
- **Earn Points**: Get rewarded for every verified report.
- **Rank Up**: Progress from "New Recruit" to "Gold Guardian".
- **Eco-Store**: Redeem points for real-world sustainable gear like metal straws, solar power banks, and ocean-friendly apparel.

### 🌍 Social Impact
- **Share Your Badge**: Generate dynamic "Impact Cards" showcasing your rank and contribution.
- **Inspire Others**: One-click sharing to Twitter, LinkedIn, and WhatsApp to spread awareness.

### 🗺️ Live Pollution Map
- **Interactive Visualization**: See all reported incidents on a clustered map.
- **Filterable Data**: Sort reports by pollution type or status (Resolved/Pending).

---

## 🛠️ Tech Stack

### Frontend
- **React 18**
- **Tailwind CSS**
- **Lucide React**
- **React Leaflet**
- **HTML2Canvas**

### Backend
- **FastAPI**
- **OpenAI CLIP**
- **SQLite**
- **Pillow (PIL)**
- **JWT** & **BCrypt**

### Hybrid AI Research Pipeline
The `tech/` folder contains an advanced experimental pipeline that combines a **CNN classifier** with **CLIP** in a series architecture.

Instead of relying on a single model, this system merges the strengths of both:

- CNN handles detailed visual feature extraction
- CLIP provides contextual and semantic understanding
- Final predictions are derived from the strongest combined signal

This hybrid setup improves accuracy in real coastal environments where lighting, angles, and clutter can vary dramatically. It represents our best-performing research model and serves as a foundation for future upgrades.

---

## 📂 Project Structure

```bash
coastal-guardian/
│
├── backend/
│   ├── main.py
│   ├── ml_model.py
│   ├── database.py
│   ├── auth.py
│   ├── requirements.txt
│   └── uploads/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── index.css
│   └── package.json
│
├── tech/
│   └── hybrid_pipeline.ipynb
│
├── .env.example
└── README.md
```

---

## ⚡ Getting Started

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

Server runs at: `http://localhost:8000`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```

App opens at: `http://localhost:3000`

### 3. Admin Access
Default admin credentials:

- **Email**: admin@coastal.com
- **Password**: admin123

---

## 🔒 Privacy & Security
- **Local-First Processing**: Images are processed securely
- **Data Minimization**: Only essential location data is stored
- **Role-Based Access**: Clear separation between user and admin permissions

---

## 🏆 Credits & Acknowledgments

- OpenAI CLIP  
  https://github.com/openai/CLIP

- Processed Coastal Pollutant Dataset  
  https://www.kaggle.com/datasets/adidev001/procesed-again-costal-polutant  
  *Dataset Credit: Garbage Classification V2 by sumn2u. Adapted and retrained using MobileNetV2.*

- Beach Litter Research  
  https://www.seanoe.org/data/00858/96963/  
  *Used for understanding beach litter composition and dataset structuring.*

---

**Team mate--**  
Jahnavi Singh  
Devansh Rai  
Krish Gupta  
Kartikey Jaiswal

---

**Built for a Cleaner Future.** 🐋