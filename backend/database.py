"""
Database operations for Coastal Pollution Monitor (Local SQLite)
"""

import os
import sqlite3
from typing import List, Dict, Optional
from passlib.context import CryptContext

# -------------------- Config --------------------
DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "pollution.db"))
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _log_mode():
    print(f"🗄️ Database Mode: SQLite")

_log_mode()

# -------------------- Connection wrappers --------------------
class DBConnection:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self):
        self.conn.row_factory = sqlite3.Row
        return DBCursor(self.conn.cursor())

    def commit(self):
        self.conn.commit()

    def close(self):
        try:
            self.conn.close()
        except Exception:
            pass

class DBCursor:
    def __init__(self, cursor):
        self.cursor = cursor
        self.lastrowid = None

    def execute(self, query: str, params: tuple = ()):
        try:
            self.cursor.execute(query, params)
            self.lastrowid = self.cursor.lastrowid
        except Exception as e:
            print(f"❌ Query Error: {e}\n➡️ Query: {query}\n➡️ Params: {params}")
            raise

    def executemany(self, query: str, params_list: List[tuple]):
        self.cursor.executemany(query, params_list)

    def fetchone(self):
        row = self.cursor.fetchone()
        if row is None:
            return None
        return dict(row)

    def fetchall(self):
        rows = self.cursor.fetchall()
        return [dict(r) for r in rows]

    @property
    def rowcount(self):
        return self.cursor.rowcount

def get_connection() -> DBConnection:
    """Create a database connection."""
    conn = sqlite3.connect(DB_PATH)
    return DBConnection(conn)

# -------------------- Init / Schema --------------------
def init_database():
    """Initialize tables for local SQLite."""
    conn = get_connection()
    cur = conn.cursor()

    pk_type = "INTEGER PRIMARY KEY AUTOINCREMENT"
    text_type = "TEXT"
    timestamp_default = "DEFAULT CURRENT_TIMESTAMP"

    # USERS
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS users (
            id {pk_type},
            full_name {text_type} NOT NULL,
            email {text_type} UNIQUE NOT NULL,
            password_hash {text_type} NOT NULL,
            phone {text_type},
            role {text_type} DEFAULT 'user',
            points INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ {timestamp_default},
            updated_at TIMESTAMPTZ {timestamp_default}
        )
    """)

    # NGOS
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS ngos (
            id {pk_type},
            name {text_type} NOT NULL,
            email {text_type} NOT NULL,
            phone {text_type},
            address {text_type},
            specialization {text_type},
            description {text_type},
            website {text_type},
            logo_url {text_type},
            created_at TIMESTAMPTZ {timestamp_default}
        )
    """)

    # REPORTS
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS reports (
            id {pk_type},
            user_id INTEGER,
            image_path {text_type} NOT NULL,
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            pollution_type {text_type} NOT NULL,
            confidence DOUBLE PRECISION NOT NULL,
            description {text_type},
            status {text_type} DEFAULT 'pending',
            ngo_id INTEGER,
            admin_notes {text_type},
            created_at TIMESTAMPTZ {timestamp_default},
            updated_at TIMESTAMPTZ {timestamp_default}
        )
    """)

    # Basic indexes
    try:
        cur.execute("CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_reports_location ON reports(latitude, longitude)")
    except Exception:
        pass

    # Seed admin user
    cur.execute("SELECT id FROM users WHERE email = ?", ("admin@coastal.com",))
    if cur.fetchone() is None:
        admin_hash = pwd_context.hash("admin123")
        cur.execute("""
            INSERT INTO users (full_name, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        """, ("System Admin", "admin@coastal.com", admin_hash, "admin"))

    # Seed NGOs
    cur.execute("SELECT COUNT(*) AS count FROM ngos")
    res = cur.fetchone()
    count = int(res["count"]) if res and res.get("count") is not None else 0
    if count == 0:
        sample_ngos = [
            ("Ocean Guardians India", "contact@oceanguardians.org", "+91-9876543210",
             "Mumbai, Maharashtra", "Ocean Cleanup", "Leading marine conservation NGO",
             "https://oceanguardians.org", None),
            ("Clean Seas Foundation", "info@cleanseas.in", "+91-8765432109",
             "Chennai, Tamil Nadu", "Plastic Pollution", "Fighting plastic pollution",
             "https://cleanseas.in", None),
        ]
        cur.executemany("""
            INSERT INTO ngos (name, email, phone, address, specialization, description, website, logo_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_ngos)

    conn.commit()
    conn.close()
    print("✅ Database initialized successfully!")

# -------------------- USER operations --------------------
def create_user(full_name: str, email: str, password_hash: str, phone: Optional[str] = None, role: str = "user") -> int:
    conn = get_connection()
    cur = conn.cursor()

    q = """
        INSERT INTO users (full_name, email, password_hash, phone, role)
        VALUES (?, ?, ?, ?, ?)
    """
    params = (full_name, email, password_hash, phone, role)

    cur.execute(q, params)
    user_id = cur.lastrowid

    conn.commit()
    conn.close()
    return int(user_id)

def get_user_by_email(email: str) -> Optional[Dict]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cur.fetchone()
    conn.close()
    return row

def get_user_by_id(user_id: int) -> Optional[Dict]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    return row

def update_user(user_id: int, full_name: Optional[str] = None, phone: Optional[str] = None) -> bool:
    conn = get_connection()
    cur = conn.cursor()

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

    cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", tuple(params))
    ok = cur.rowcount > 0
    conn.commit()
    conn.close()
    return ok

# -------------------- REPORT operations --------------------
def insert_report(
    image_path: str,
    latitude: float,
    longitude: float,
    pollution_type: str,
    confidence: float,
    description: Optional[str] = None,
    user_id: Optional[int] = None
) -> int:
    conn = get_connection()
    cur = conn.cursor()

    q = """
        INSERT INTO reports (image_path, latitude, longitude, pollution_type, confidence, description, user_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    """
    params = (image_path, latitude, longitude, pollution_type, confidence, description, user_id)

    cur.execute(q, params)
    report_id = cur.lastrowid

    if user_id is not None:
        cur.execute("UPDATE users SET points = points + 1 WHERE id = ?", (user_id,))

    conn.commit()
    conn.close()
    return int(report_id)

def get_all_reports() -> List[Dict]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT r.*, u.full_name AS user_name, u.email AS user_email, n.name AS ngo_name
        FROM reports r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN ngos n ON r.ngo_id = n.id
        ORDER BY r.created_at DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return rows

def get_reports_by_user(user_id: int) -> List[Dict]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT r.*, n.name AS ngo_name
        FROM reports r
        LEFT JOIN ngos n ON r.ngo_id = n.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
    """, (user_id,))
    rows = cur.fetchall()
    conn.close()
    return rows

def get_report_by_id(report_id: int) -> Optional[Dict]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT r.*, u.full_name AS user_name, u.email AS user_email, n.name AS ngo_name
        FROM reports r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN ngos n ON r.ngo_id = n.id
        WHERE r.id = ?
    """, (report_id,))
    row = cur.fetchone()
    conn.close()
    return row

def update_report_status(report_id: int, status: str, ngo_id: Optional[int] = None, admin_notes: Optional[str] = None) -> bool:
    conn = get_connection()
    cur = conn.cursor()

    ts = "CURRENT_TIMESTAMP"

    if ngo_id is not None:
        cur.execute(
            f"UPDATE reports SET status = ?, ngo_id = ?, admin_notes = ?, updated_at = {ts} WHERE id = ?",
            (status, ngo_id, admin_notes, report_id)
        )
    else:
        cur.execute(
            f"UPDATE reports SET status = ?, admin_notes = ?, updated_at = {ts} WHERE id = ?",
            (status, admin_notes, report_id)
        )

    ok = cur.rowcount > 0
    conn.commit()
    conn.close()
    return ok

def delete_report(report_id: int) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    ok = cur.rowcount > 0
    conn.commit()
    conn.close()
    return ok

def get_stats() -> Dict:
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) AS total FROM reports")
    res = cur.fetchone()
    total = int(res["total"]) if res and res.get("total") is not None else 0

    cur.execute("SELECT pollution_type, COUNT(*) AS count FROM reports GROUP BY pollution_type")
    type_counts = {r["pollution_type"]: int(r["count"]) for r in cur.fetchall()}

    cur.execute("SELECT status, COUNT(*) AS count FROM reports GROUP BY status")
    status_counts = {(r["status"] or "pending"): int(r["count"]) for r in cur.fetchall()}

    conn.close()

    return {
        "total": total,
        "by_type": type_counts,
        "by_status": status_counts
    }

# -------------------- NGO operations --------------------
def get_all_ngos() -> List[Dict]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM ngos ORDER BY name")
    rows = cur.fetchall()
    conn.close()
    return rows

def get_ngo_by_id(ngo_id: int) -> Optional[Dict]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, name, email, phone, address, specialization, description, website, logo_url, created_at
        FROM ngos WHERE id = ?
    """, (ngo_id,))
    row = cur.fetchone()
    conn.close()
    return row

def create_ngo(
    name: str,
    email: str,
    phone: Optional[str] = None,
    address: Optional[str] = None,
    specialization: Optional[str] = None,
    description: Optional[str] = None,
    website: Optional[str] = None,
    logo_url: Optional[str] = None
) -> int:
    conn = get_connection()
    cur = conn.cursor()

    q = """
        INSERT INTO ngos (name, email, phone, address, specialization, description, website, logo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """
    params = (name, email, phone, address, specialization, description, website, logo_url)

    cur.execute(q, params)
    new_id = cur.lastrowid

    conn.commit()
    conn.close()
    return int(new_id)

if __name__ == "__main__":
    init_database()
    print("Database setup complete!")
