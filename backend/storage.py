import os
import shutil

# Configuration
UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_file(file_content: bytes, filename: str, folder: str = "pollution_reports") -> str:
    """
    Save file to local storage and return the URL path.
    """
    # Local Storage
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Return URL path (assuming served via static mount)
    return f"/static/uploads/{filename}"

def delete_file(file_url: str) -> bool:
    """
    Delete file from local storage.
    """
    if not file_url:
        return False
        
    try:
        # Extract filename from URL (e.g. /static/uploads/file.jpg)
        filename = os.path.basename(file_url)
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
    except Exception as e:
        print(f"Error deleting file: {e}")
        return False
        
    return False
