# 🌊 Coastal Pollution Monitor - Backend

FastAPI backend for the Coastal Pollution Monitoring application.

## 📋 Features

- **Image Upload**: Accept pollution images with GPS coordinates
- **ML Classification**: Automatically classify pollution type using AI
- **SQLite Database**: Simple, file-based storage (no setup required)
- **RESTful API**: Clean, documented API endpoints
- **Static File Serving**: Serve uploaded images

## 🛠️ Tech Stack

- **FastAPI** - Modern Python web framework
- **SQLite** - Lightweight database
- **Pillow** - Image processing
- **NumPy** - Array operations for ML
- **CLIP (Optional)** - AI-based classification

## 📁 File Structure

```
backend/
├── main.py           # FastAPI application (all endpoints)
├── database.py       # SQLite database operations
├── ml_model.py       # Pollution classification (rule-based + CLIP)
├── test_data.py      # Generate sample test data
├── requirements.txt  # Python dependencies
├── pollution.db      # SQLite database (auto-created)
└── uploads/          # Uploaded images storage
```

## 🚀 Quick Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Server

```bash
uvicorn main:app --reload --port 8000
```

Or simply:

```bash
python main.py
```

Server will start at: **http://localhost:8000**

### 4. Generate Test Data (Optional)

```bash
python test_data.py
```

This creates 10 sample reports with images for testing.

## 📡 API Endpoints

### Upload Report

```bash
POST /api/upload
```

**Form Data:**
- `image` (file): Pollution image (JPEG, PNG, WebP)
- `latitude` (float): GPS latitude
- `longitude` (float): GPS longitude
- `description` (string, optional): Description

**Example with curl:**

```bash
curl -X POST "http://localhost:8000/api/upload" \
  -F "image=@pollution.jpg" \
  -F "latitude=13.0500" \
  -F "longitude=80.2824" \
  -F "description=Plastic waste on beach"
```

### Get All Reports

```bash
GET /api/reports
```

Returns all pollution reports.

### Get Single Report

```bash
GET /api/reports/{id}
```

### Get Statistics

```bash
GET /api/stats
```

Returns counts and percentages by pollution type.

### Health Check

```bash
GET /api/health
```

## 🧪 API Documentation

Interactive API documentation available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤖 ML Classification

The system supports two classification methods:

### Option 1: Rule-Based (Default)
- Fast, no additional dependencies
- Uses color analysis to detect pollution type
- Works offline

### Option 2: CLIP AI (Better Accuracy)
To enable AI classification:

```bash
pip install transformers torch
```

The system automatically uses CLIP if available.

## 🗄️ Database

SQLite database is automatically created on first run.

**Schema:**
```sql
CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_path TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    pollution_type TEXT NOT NULL,
    confidence REAL NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🐛 Troubleshooting

### Port already in use
```bash
uvicorn main:app --reload --port 8001
```

### Database issues
Delete `pollution.db` and restart - it will be recreated.

### Image upload fails
- Check file is JPEG, PNG, or WebP
- Ensure file size < 10MB
- Check disk space in uploads/ folder

## 📝 Environment Variables

None required! The backend works out of the box.

Optional for production:
```bash
export API_HOST=0.0.0.0
export API_PORT=8000
```
