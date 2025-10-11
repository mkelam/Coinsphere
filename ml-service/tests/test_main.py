"""Test cases for ML Service main application."""
import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path to import main
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)


def test_health_endpoint():
    """Test that health endpoint returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ml-service"


def test_root_endpoint():
    """Test that root endpoint returns service info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert data["service"] == "Coinsphere ML Service"
    assert data["version"] == "1.0.0"


def test_predict_endpoint_validation():
    """Test that predict endpoint validates input."""
    response = client.post("/predict", json={})
    # Should return 422 Unprocessable Entity for missing fields
    assert response.status_code == 422


def test_predict_with_invalid_data():
    """Test predict endpoint with invalid symbol."""
    response = client.post("/predict", json={
        "symbol": "",
        "timeframe": "7d"
    })
    assert response.status_code in [400, 422]


def test_list_models_endpoint():
    """Test that models endpoint returns a list."""
    response = client.get("/models")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))


def test_invalid_endpoint():
    """Test that invalid endpoints return 404."""
    response = client.get("/invalid/endpoint")
    assert response.status_code == 404
