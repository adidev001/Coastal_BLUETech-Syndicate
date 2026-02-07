def test_signup(client):
    response = client.post("/api/auth/signup", json={
        "email": "newuser@example.com",
        "password": "password123",
        "full_name": "New User"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"

def test_signup_duplicate_email(client):
    # Register first time
    client.post("/api/auth/signup", json={
        "email": "duplicate@example.com",
        "password": "password123",
        "full_name": "Duplicate User"
    })
    
    # Register second time
    response = client.post("/api/auth/signup", json={
        "email": "duplicate@example.com",
        "password": "password123",
        "full_name": "Duplicate User"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_login_success(client):
    # Register
    client.post("/api/auth/signup", json={
        "email": "loginuser@example.com",
        "password": "password123",
        "full_name": "Login User"
    })
    
    # Login
    response = client.post("/api/auth/login", data={
        "username": "loginuser@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_failure(client):
    response = client.post("/api/auth/login", data={
        "username": "nonexistent@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_read_me(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "tier" in data
