import os

def test_create_report_unauthorized(client):
    response = client.post("/api/upload")
    assert response.status_code == 401

def test_create_report_authorized(client, auth_headers):
    # Create a dummy image file
    with open("test_image.jpg", "wb") as f:
        f.write(b"dummy image content")
        
    try:
        with open("test_image.jpg", "rb") as f:
            response = client.post(
                "/api/upload",
                files={"image": ("test_image.jpg", f, "image/jpeg")},
                data={
                    "latitude": 12.345,
                    "longitude": 67.890,
                    "description": "Test pollution report"
                },
                headers=auth_headers
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["report"]["pollution_type"] is not None
        assert data["report"]["latitude"] == 12.345
        
    finally:
        if os.path.exists("test_image.jpg"):
            os.remove("test_image.jpg")

def test_get_reports(client):
    response = client.get("/api/reports")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_my_reports(client, auth_headers):
    response = client.get("/api/reports/my", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
