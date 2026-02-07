import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from database import get_connection, init_database

# Use a separate test database
TEST_DB_PATH = "test_pollution.db"
os.environ["DB_PATH"] = TEST_DB_PATH

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Initialize the test database before tests run."""
    # Ensure clean slate
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    
    init_database()
    
    yield
    
    # Cleanup
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

@pytest.fixture(scope="module")
def client():
    """Create a TestClient instance."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def auth_headers(client):
    """Register a user and return auth headers."""
    # Register
    client.post("/api/auth/signup", json={
        "email": "test@example.com",
        "password": "testpassword",
        "full_name": "Test User"
    })
    
    # Login
    response = client.post("/api/auth/login", data={
        "username": "test@example.com",
        "password": "testpassword"
    })
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
