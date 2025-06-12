import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_login_success():
    """Test successful login."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials():
    """Test login with invalid credentials."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "wrong_password"}
    )
    assert response.status_code == 401


def test_login_missing_fields():
    """Test login with missing fields."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin"}
    )
    assert response.status_code == 422


def test_logout():
    """Test logout endpoint."""
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_me_endpoint_without_token():
    """Test /me endpoint without authentication."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 403


def test_me_endpoint_with_token():
    """Test /me endpoint with valid token."""
    # First login to get token
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # Test /me endpoint
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"
    assert data["email"] == "admin@example.com"


def test_me_endpoint_with_invalid_token():
    """Test /me endpoint with invalid token."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401 