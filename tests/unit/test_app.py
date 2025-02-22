import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_health_endpoint():
    """Test the health check endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "model_loaded" in response.json()

def test_features_endpoint():
    """Test the features endpoint"""
    response = client.get("/api/features")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    for feature in response.json():
        assert "name" in feature
        assert "importance" in feature
        assert isinstance(feature["importance"], float)

def test_predict_endpoint_valid_input():
    """Test prediction endpoint with valid input"""
    test_data = {
        "features": {
            "Account length": 100,
            "International plan": "no",
            "Voice mail plan": "no",
            "Number vmail messages": 0,
            "Total day minutes": 200,
            "Total day calls": 100,
            "Total day charge": 34,
            "Total eve minutes": 200,
            "Total eve calls": 100,
            "Total eve charge": 17,
            "Total night minutes": 200,
            "Total night calls": 100,
            "Total night charge": 9,
            "Total intl minutes": 10,
            "Total intl calls": 4,
            "Total intl charge": 2.7,
            "Customer service calls": 1
        }
    }
    response = client.post("/api/predict", json=test_data)
    assert response.status_code == 200
    assert "prediction" in response.json()
    assert "churn_probability" in response.json()
    assert "retention_probability" in response.json()

def test_predict_endpoint_missing_features():
    """Test prediction endpoint with missing features"""
    test_data = {
        "features": {
            "Account length": 100
            # Missing other required features
        }
    }
    response = client.post("/api/predict", json=test_data)
    assert response.status_code == 400

def test_predict_endpoint_invalid_values():
    """Test prediction endpoint with invalid values"""
    test_data = {
        "features": {
            "Account length": "invalid",  # Should be numeric
            "International plan": "maybe",  # Should be yes/no
            "Voice mail plan": "no",
            "Number vmail messages": 0,
            "Total day minutes": 200,
            "Total day calls": 100,
            "Total day charge": 34,
            "Total eve minutes": 200,
            "Total eve calls": 100,
            "Total eve charge": 17,
            "Total night minutes": 200,
            "Total night calls": 100,
            "Total night charge": 9,
            "Total intl minutes": 10,
            "Total intl calls": 4,
            "Total intl charge": 2.7,
            "Customer service calls": 1
        }
    }
    response = client.post("/api/predict", json=test_data)
    assert response.status_code == 400

def test_predict_endpoint_empty_request():
    """Test prediction endpoint with empty request"""
    response = client.post("/api/predict", json={})
    assert response.status_code == 422  # FastAPI validation error

def test_features_endpoint_model_loaded():
    """Test features endpoint with model loaded"""
    response = client.get("/api/features")
    assert response.status_code == 200
    features = response.json()
    assert len(features) > 0
    # Check if important features are present
    feature_names = [f["name"] for f in features]
    essential_features = ["Total day minutes", "Customer service calls", "International plan"]
    for feature in essential_features:
        assert feature in feature_names

def test_probability_sum():
    """Test if probabilities sum to 1"""
    test_data = {
        "features": {
            "Account length": 100,
            "International plan": "no",
            "Voice mail plan": "no",
            "Number vmail messages": 0,
            "Total day minutes": 200,
            "Total day calls": 100,
            "Total day charge": 34,
            "Total eve minutes": 200,
            "Total eve calls": 100,
            "Total eve charge": 17,
            "Total night minutes": 200,
            "Total night calls": 100,
            "Total night charge": 9,
            "Total intl minutes": 10,
            "Total intl calls": 4,
            "Total intl charge": 2.7,
            "Customer service calls": 1
        }
    }
    response = client.post("/api/predict", json=test_data)
    assert response.status_code == 200
    data = response.json()
    assert abs(data["churn_probability"] + data["retention_probability"] - 1.0) < 1e-6

if __name__ == "__main__":
    pytest.main([__file__])
