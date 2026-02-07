"""
Database operations for Coastal Pollution Monitor
Uses SQLite for simple, file-based database storage

Updated with Users and NGOs tables for authentication
"""

import sqlite3
from datetime import datetime
from typing import List, Dict, Optional
import os
from passlib.context import CryptContext

# Configuration for initial admin creation (to avoid circular import with auth.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database file path
DATABASE_PATH = os.path.join(os.path.dirname(__file__), "pollution.db")


def get_connection():
    """Create a database connection with row factory for dict-like access"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """
    Initialize the database and create all tables if they don't exist.
    Call this on application startup.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            phone TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            points INTEGER DEFAULT 0
        )
    """)
    
    # NGOs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ngos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            specialization TEXT,
            description TEXT,
            website TEXT,
            logo_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Reports table (updated with user_id and status)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            image_path TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            pollution_type TEXT NOT NULL,
            confidence REAL NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            ngo_id INTEGER,
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (ngo_id) REFERENCES ngos(id)
        )
    """)
    
    # Check if user points column exists
    try:
        cursor.execute("SELECT points FROM users LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0")

    # Check if columns exist, add them if not (for migration)
    try:
        cursor.execute("SELECT user_id FROM reports LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE reports ADD COLUMN user_id INTEGER")
    
    try:
        cursor.execute("SELECT status FROM reports LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE reports ADD COLUMN status TEXT DEFAULT 'pending'")
    
    try:
        cursor.execute("SELECT ngo_id FROM reports LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE reports ADD COLUMN ngo_id INTEGER")
    
    try:
        cursor.execute("SELECT admin_notes FROM reports LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE reports ADD COLUMN admin_notes TEXT")
    
    try:
        cursor.execute("SELECT updated_at FROM reports LIMIT 1")
    except sqlite3.OperationalError:
        # SQLite doesn't allow CURRENT_TIMESTAMP for ADD COLUMN DEFAULT
        cursor.execute("ALTER TABLE reports ADD COLUMN updated_at TIMESTAMP")

    # NGO table migrations (add columns individually)
    for col in ["address", "specialization", "description", "website", "logo_url", "created_at"]:
        try:
            cursor.execute(f"SELECT {col} FROM ngos LIMIT 1")
        except sqlite3.OperationalError:
            cursor.execute(f"ALTER TABLE ngos ADD COLUMN {col} TEXT")
            if col == "created_at":
                cursor.execute(f"UPDATE ngos SET {col} = CURRENT_TIMESTAMP WHERE {col} IS NULL")
    
    # Create default admin user if not exists
    cursor.execute("SELECT id FROM users WHERE email = ?", ("admin@coastal.com",))
    if cursor.fetchone() is None:
        admin_hash = pwd_context.hash("admin123")
        cursor.execute("""
            INSERT INTO users (full_name, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        """, ("System Admin", "admin@coastal.com", admin_hash, "admin"))
        print("[OK] Default admin user created (admin@coastal.com / admin123)")
    
    # Insert sample NGOs if none exist
    cursor.execute("SELECT COUNT(*) FROM ngos")
    if cursor.fetchone()[0] == 0:
        sample_ngos = [
            ("Ocean Guardians India", "contact@oceanguardians.org", "+91-9876543210", 
             "Mumbai, Maharashtra", "Ocean Cleanup", "Leading marine conservation NGO focused on coastal cleanup drives",
             "https://oceanguardians.org", None),
            ("Clean Seas Foundation", "info@cleanseas.in", "+91-8765432109",
             "Chennai, Tamil Nadu", "Plastic Pollution", "Fighting plastic pollution through community action and policy advocacy",
             "https://cleanseas.in", None),
            ("Marine Life Trust", "hello@marinelifetrust.org", "+91-7654321098",
             "Kochi, Kerala", "Wildlife Protection", "Protecting marine wildlife and their habitats along Indian coastline",
             "https://marinelifetrust.org", None),
            ("Coastal Conservation Society", "team@coastalconservation.org", "+91-6543210987",
             "Goa", "Ecosystem Restoration", "Restoring coastal ecosystems through scientific research and community engagement",
             "https://coastalconservation.org", None),
            ("Blue Planet Initiative", "contact@blueplanet.org.in", "+91-5432109876",
             "Visakhapatnam, Andhra Pradesh", "Oil Spill Response", "Rapid response team for oil spill cleanup and environmental disasters",
             "https://blueplanet.org.in", None),
        ]
        
        cursor.executemany("""
            INSERT INTO ngos (name, email, phone, address, specialization, description, website, logo_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_ngos)
        print("[OK] Sample NGOs inserted")
    
    conn.commit()
    conn.close()
    print("[OK] Database initialized successfully!")


# ==================== USER OPERATIONS ====================

def create_user(full_name: str, email: str, password_hash: str, phone: Optional[str] = None, role: str = "user") -> int:
    """Create a new user and return their ID"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO users (full_name, email, password_hash, phone, role)
        VALUES (?, ?, ?, ?, ?)
    """, (full_name, email, password_hash, phone, role))
    
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return user_id


def get_user_by_email(email: str) -> Optional[Dict]:
    """Get user by email address"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, full_name, email, password_hash, phone, role, points, created_at, updated_at
        FROM users WHERE email = ?
    """, (email,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row is None:
        return None
    
    return dict(row)


def get_user_by_id(user_id: int) -> Optional[Dict]:
    """Get user by ID"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, full_name, email, password_hash, phone, role, points, created_at, updated_at
        FROM users WHERE id = ?
    """, (user_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row is None:
        return None
    
    return dict(row)


def update_user(user_id: int, full_name: Optional[str] = None, phone: Optional[str] = None) -> bool:
    """Update user profile"""
    conn = get_connection()
    cursor = conn.cursor()
    
    updates = []
    params = []
    
    if full_name:
        updates.append("full_name = ?")
        params.append(full_name)
    if phone is not None:
        updates.append("phone = ?")
        params.append(phone)
    
    if not updates:
        conn.close()
        return False
    
    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(user_id)
    
    cursor.execute(f"""
        UPDATE users SET {', '.join(updates)} WHERE id = ?
    """, params)
    
    updated = cursor.rowcount > 0
    conn.commit()
    conn.close()
    
    return updated


def update_user_password(user_id: int, password_hash: str) -> bool:
    """Update user password"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (password_hash, user_id))
    
    updated = cursor.rowcount > 0
    conn.commit()
    conn.close()
    
    return updated


# ==================== REPORT OPERATIONS ====================

def insert_report(
    image_path: str,
    latitude: float,
    longitude: float,
    pollution_type: str,
    confidence: float,
    description: Optional[str] = None,
    user_id: Optional[int] = None
) -> int:
    """
    Insert a new pollution report into the database.
    
    Args:
        image_path: Path to the uploaded image
        latitude: GPS latitude coordinate
        longitude: GPS longitude coordinate
        pollution_type: Type of pollution detected (plastic, oil_spill, etc.)
        confidence: ML model confidence score (0-1)
        description: Optional user description
        user_id: Optional ID of the user who submitted the report
    
    Returns:
        The ID of the newly inserted report
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO reports (image_path, latitude, longitude, pollution_type, confidence, description, user_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    """, (image_path, latitude, longitude, pollution_type, confidence, description, user_id))
    
    report_id = cursor.lastrowid
    
    # Increment user points if authenticated
    if user_id:
        cursor.execute("UPDATE users SET points = points + 1 WHERE id = ?", (user_id,))
        
    conn.commit()
    conn.close()
    
    return report_id


def get_all_reports() -> List[Dict]:
    """
    Retrieve all pollution reports from the database.
    
    Returns:
        List of report dictionaries ordered by creation date (newest first)
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT r.id, r.image_path, r.latitude, r.longitude, r.pollution_type, 
               r.confidence, r.description, r.created_at, r.user_id, r.status,
               r.ngo_id, r.admin_notes, r.updated_at,
               u.full_name as user_name, u.email as user_email,
               n.name as ngo_name
        FROM reports r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN ngos n ON r.ngo_id = n.id
        ORDER BY r.created_at DESC
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_reports_by_user(user_id: int) -> List[Dict]:
    """Get all reports submitted by a specific user"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT r.id, r.image_path, r.latitude, r.longitude, r.pollution_type, 
               r.confidence, r.description, r.created_at, r.status,
               r.ngo_id, r.admin_notes, r.updated_at,
               n.name as ngo_name
        FROM reports r
        LEFT JOIN ngos n ON r.ngo_id = n.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
    """, (user_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_report_by_id(report_id: int) -> Optional[Dict]:
    """
    Retrieve a single report by its ID.
    
    Args:
        report_id: The unique ID of the report
    
    Returns:
        Report dictionary or None if not found
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT r.id, r.image_path, r.latitude, r.longitude, r.pollution_type,
               r.confidence, r.description, r.created_at, r.user_id, r.status,
               r.ngo_id, r.admin_notes, r.updated_at,
               u.full_name as user_name, u.email as user_email,
               n.name as ngo_name, n.email as ngo_email
        FROM reports r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN ngos n ON r.ngo_id = n.id
        WHERE r.id = ?
    """, (report_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row is None:
        return None
    
    return dict(row)


def update_report_status(report_id: int, status: str, ngo_id: Optional[int] = None, admin_notes: Optional[str] = None) -> bool:
    """Update report status (pending, forwarded, resolved)"""
    conn = get_connection()
    cursor = conn.cursor()
    
    if ngo_id is not None:
        cursor.execute("""
            UPDATE reports 
            SET status = ?, ngo_id = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, ngo_id, admin_notes, report_id))
    else:
        cursor.execute("""
            UPDATE reports 
            SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, admin_notes, report_id))
    
    updated = cursor.rowcount > 0
    conn.commit()
    conn.close()
    
    return updated


def get_stats() -> Dict:
    """
    Get pollution statistics from the database.
    
    Returns:
        Dictionary containing total count and count by pollution type
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get total count
    cursor.execute("SELECT COUNT(*) as total FROM reports")
    total = cursor.fetchone()["total"]
    
    # Get count by pollution type
    cursor.execute("""
        SELECT pollution_type, COUNT(*) as count
        FROM reports
        GROUP BY pollution_type
    """)
    
    type_counts = {}
    for row in cursor.fetchall():
        type_counts[row["pollution_type"]] = row["count"]
    
    # Get count by status
    cursor.execute("""
        SELECT status, COUNT(*) as count
        FROM reports
        GROUP BY status
    """)
    
    status_counts = {}
    for row in cursor.fetchall():
        status_counts[row["status"] or "pending"] = row["count"]
    
    conn.close()
    
    return {
        "total": total,
        "by_type": {
            "plastic": type_counts.get("plastic", 0),
            "oil_spill": type_counts.get("oil_spill", 0),
            "other_solid_waste": type_counts.get("other_solid_waste", 0) + type_counts.get("general_waste", 0),
            "marine_debris": type_counts.get("marine_debris", 0),
            "no_waste": type_counts.get("no_waste", 0)
        },
        "by_status": {
            "pending": status_counts.get("pending", 0),
            "forwarded": status_counts.get("forwarded", 0),
            "resolved": status_counts.get("resolved", 0)
        }
    }


def delete_report(report_id: int) -> bool:
    """
    Delete a report by its ID.
    
    Args:
        report_id: The unique ID of the report to delete
    
    Returns:
        True if deleted, False if not found
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    
    return deleted


# ==================== NGO OPERATIONS ====================

def get_all_ngos() -> List[Dict]:
    """Get all NGOs"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, name, email, phone, address, specialization, description, website, logo_url, created_at
        FROM ngos
        ORDER BY name
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_ngo_by_id(ngo_id: int) -> Optional[Dict]:
    """Get NGO by ID"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, name, email, phone, address, specialization, description, website, logo_url, created_at
        FROM ngos WHERE id = ?
    """, (ngo_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row is None:
        return None
    
    return dict(row)


def create_ngo(name: str, email: str, phone: Optional[str] = None, address: Optional[str] = None,
               specialization: Optional[str] = None, description: Optional[str] = None,
               website: Optional[str] = None) -> int:
    """Create a new NGO"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO ngos (name, email, phone, address, specialization, description, website)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (name, email, phone, address, specialization, description, website))
    
    ngo_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return ngo_id


# Initialize database when module is imported
if __name__ == "__main__":
    init_database()
    print("Database setup complete!")
