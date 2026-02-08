
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
- [**React 18**](https://react.dev/)
- [**Tailwind CSS**](https://tailwindcss.com/)
- [**Lucide React**](https://lucide.dev/)
- [**React Leaflet**](https://react-leaflet.js.org/)
- [**HTML2Canvas**](https://html2canvas.hertzen.com/)

### Backend
- [**FastAPI**](https://fastapi.tiangolo.com/)
- [**OpenAI CLIP**](https://github.com/openai/CLIP)
- [**SQLite**](https://www.sqlite.org/index.html)
- [**Pillow (PIL)**](https://python-pillow.org/)
- [**JWT**](https://jwt.io/) & [**BCrypt**](https://pypi.org/project/bcrypt/)

---

## 📂 Project Structure

```bash
coastal-guardian/
│
├── 📁 backend/
│   ├── main.py              # FastAPI app & endpoints
│   ├── ml_model.py          # AI classification logic (CLIP)
│   ├── database.py          # Database models & connection
│   ├── auth.py              # Authentication handler
│   ├── requirements.txt     # Python dependencies
│   └── 📁 uploads/          # Image storage
│
├── 📁 frontend/
│   ├── 📁 public/
│   ├── 📁 src/
│   │   ├── 📁 components/   # Reusable UI components
│   │   ├── 📁 context/      # Auth & global state
│   │   ├── 📁 pages/        # Application routes
│   │   │   ├── Home.jsx
│   │   │   ├── Map.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── ...
│   │   ├── App.js           # Main component
│   │   └── index.css        # Global styles
│   └── package.json         # Node dependencies
│
├── .env.example             # Environment template
└── README.md                # Project documentation
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
*Server starts at `http://localhost:8000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```
*App opens at `http://localhost:3000`*

### 3. Admin Access
Default admin credentials for dashboard access:
- **Email**: `admin@coastal.com`
- **Password**: `admin123`

---

## 🔒 Privacy & Security
- **Local-First Processing**: Images are processed securely.
- **Data Minimization**: Only essential location data is stored for mapping purposes.
- **Role-Based Access**: Strict separation between user and admin capabilities.

---

## 🏆 Credits & Acknowledgments

- **OpenAI CLIP**: [https://github.com/openai/CLIP](https://github.com/openai/CLIP)
- **Processed Coastal Pollutant Dataset**: [https://www.kaggle.com/datasets/adidev001/procesed-again-costal-polutant](https://www.kaggle.com/datasets/adidev001/procesed-again-costal-polutant)
  > *Dataset Credit: This project uses the public Kaggle dataset Garbage Classification V2 by sumn2u. I adapted the dataset structure/labels for my use case and trained a MobileNetV2-based model on it. The model file is compressed for easier distribution.*
- **Beach Litter Research**: [https://www.seanoe.org/data/00858/96963/](https://www.seanoe.org/data/00858/96963/)
  > *Research utilized for understanding beach litter composition and structuring our target dataset.*

---
**Team mate--**
**Jahnavi Singh**
**Devansh Rai**
**Krish Gupta**
**Kartikey Jaiswal**


**Built for a Cleaner Future.** 🐋
