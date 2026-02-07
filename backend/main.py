"""
Coastal Pollution Monitor - Backend API
FastAPI application for handling pollution reports with Authentication & RBAC

Endpoints:
- POST /api/auth/signup - Register new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user profile
- POST /api/upload - Upload pollution report (Authenticated)
- GET /api/reports - Get all reports (Public, for map)
- GET /api/reports/my - Get user's reports (Authenticated)
- GET /api/ngos - List NGOs (Public)
- GET /api/admin/reports - Get all reports with details (Admin)
- PATCH /api/admin/reports/{id}/status - Update report status (Admin)
"""

import os
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr

# Custom modules
import database
import auth
import storage
from ml_model import analyze_image, extract_gps_data

app = FastAPI(
    title="Coastal Pollution Monitor API",
    description="Backend API for Coastal Pollution Monitor with Auth & RBAC",
    version="2.0.0"
)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files for serving uploaded images
if os.getenv("ENV", "dev") == "dev":
    app.mount("/static/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Initialize database on application startup
@app.on_event("startup")
def startup_event():
    database.init_database()

# Pydantic models for request/response bodies
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ReportStatusUpdate(BaseModel):
    status: str
    ngo_id: Optional[int] = None
    admin_notes: Optional[str] = None

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/api/auth/signup", response_model=Token)
async def signup(user: UserCreate):
    """Register a new user"""
    # Check if user already exists
    if database.get_user_by_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = auth.get_password_hash(user.password)
    
    # Create user
    user_id = database.create_user(
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password,
        phone=user.phone
    )
    
    # Get created user
    new_user = database.get_user_by_id(user_id)
    
    # Create access token
    return auth.create_user_token_response(new_user)

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with username (email) and password"""
    user = database.get_user_by_email(form_data.username)
    
    if not user or not auth.verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return auth.create_user_token_response(user)

@app.get("/api/auth/me")
async def read_users_me(current_user: dict = Depends(auth.get_current_user)):
    """Get current logged in user profile with points and tier"""
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "role": current_user["role"],
        "points": current_user.get("points", 0),
        "tier": auth.get_user_tier(current_user.get("points", 0))
    }

# ==================== USER REPORTING ENDPOINTS ====================

@app.post("/api/upload")
async def upload_report(
    image: UploadFile = File(..., description="Image file of the pollution"),
    latitude: float = Form(..., description="GPS latitude"),
    longitude: float = Form(..., description="GPS longitude"),
    description: Optional[str] = Form(None, description="Optional description"),
    current_user: dict = Depends(auth.get_current_user)
):
    """
    Upload a pollution report (Authenticated Users only).
    """
    import uuid
    import tempfile
    
    temp_path = None
    try:
        # Read content
        content = await image.read()
        
        # Generate unique filename
        file_extension = os.path.splitext(image.filename)[1]
        filename = f"{uuid.uuid4()}{file_extension}"
        
        # Save to temp file for ML analysis (local file required)
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp:
            temp.write(content)
            temp_path = temp.name
            
        # Analyze image with AI model
        detection_result = analyze_image(temp_path)
        
        # Upload using Storage Engine (Cloudinary or Local)
        image_url = storage.save_file(content, filename)
        
        # Store in database
        report_id = database.insert_report(
            image_path=image_url,
            latitude=latitude,
            longitude=longitude,
            pollution_type=detection_result["label"],
            confidence=float(detection_result["confidence"]),
            description=description,
            user_id=current_user["id"]
        )
        
        # Get the full report object to return to frontend
        report = database.get_report_by_id(report_id)
        
        # Merge detection visual metadata for frontend
        if report:
            report.update(detection_result)
            
        # Return result with enriched report
        return {
            "success": True,
            "report_id": report_id,
            "message": "Report submitted successfully",
            "report": report,
            "status": "pending"
        }
        
    except Exception as e:
        print(f"Error processing upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing upload: {str(e)}")
    finally:
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass

@app.post("/api/extract-gps")
async def extract_gps_endpoint(
    image: UploadFile = File(..., description="Image file to extract GPS from")
):
    """Extract GPS coordinates from image EXIF metadata (Helper endpoint)"""
    try:
        # Save strictly to memory for extraction, but since extract_gps_data expects path or bytes
        # let's read bytes
        content = await image.read()
        
        # We need to save to a temp file because our helper uses PIL.Image.open
        # or we can modify helper. For now let's save to temp
        import tempfile
        
        with tempfile.NamedTemporaryFile(delete=False) as temp:
            temp.write(content)
            temp_path = temp.name
            
        gps_data = extract_gps_data(temp_path)
        
        # Clean up
        try:
            os.unlink(temp_path)
        except:
            pass
            
        return gps_data or {"latitude": None, "longitude": None}
        
    except Exception as e:
        print(f"Error extracting GPS: {str(e)}")
        return {"latitude": None, "longitude": None, "error": str(e)}

@app.get("/api/reports/my")
async def get_my_reports(current_user: dict = Depends(auth.get_current_user)):
    """Get reports submitted by current user"""
    return database.get_reports_by_user(current_user["id"])

# ==================== PUBLIC ENDPOINTS ====================

@app.get("/api/reports")
async def list_reports():
    """Get all reports (Public access for Map)"""
    return database.get_all_reports()

@app.get("/api/reports/{report_id}")
async def get_single_report(report_id: int):
    """Get single report details"""
    report = database.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@app.get("/api/ngos")
async def list_ngos():
    """List all NGOs"""
    return database.get_all_ngos()

@app.get("/api/stats")
async def get_statistics():
    """Get pollution statistics"""
    return database.get_stats()

# ==================== ADMIN ENDPOINTS ====================

@app.get("/api/admin/reports")
async def list_admin_reports(current_user: dict = Depends(auth.get_current_admin)):
    """Get all reports (Admin access - same as public list for now but could include more fields)"""
    return database.get_all_reports()

@app.patch("/api/admin/reports/{report_id}/status")
async def update_report_status(
    report_id: int, 
    status_update: ReportStatusUpdate,
    current_user: dict = Depends(auth.get_current_admin)
):
    """Update report status (Forward to NGO, Resolve, etc.)"""
    updated = database.update_report_status(
        report_id=report_id,
        status=status_update.status,
        ngo_id=status_update.ngo_id,
        admin_notes=status_update.admin_notes
    )
    
    if not updated:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {"success": True, "message": f"Report status updated to {status_update.status}"}


@app.delete("/api/admin/reports/{report_id}")
async def delete_report(
    report_id: int,
    current_user: dict = Depends(auth.get_current_admin)
):
    """Delete a report (Admin only)"""
    deleted = database.delete_report(report_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "message": "Report deleted successfully"}


@app.get("/")
async def root():
    return {
        "name": "Coastal Pollution Monitor API",
        "version": "2.0.0",
        "status": "Online",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
