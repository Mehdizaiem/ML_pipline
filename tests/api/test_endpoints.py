import pytest
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    response = requests.get(f"{BASE_URL}/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert isinstance(data["model_loaded"], bool)

def test_predict_endpoint_success():
    """Test successful prediction"""
    test_data = {
        "features": {
            "State": "NY",
            "Account length": 100,
            "Area code": 408,
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
    
    response = requests.post(f"{BASE_URL}/api/predict", json=test_data)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "churn_probability" in data
    assert "retention_probability" in data

def test_predict_endpoint_invalid_data():
    """Test prediction with invalid data"""
    invalid_data = {
        "features": {
            "Account length": "invalid",  # Should be numeric
            "International plan": "maybe"  # Should be yes/no
        }
    }
    
    response = requests.post(f"{BASE_URL}/api/predict", json=invalid_data)
    assert response.status_code == 400

def test_features_endpoint():
    """Test feature importance endpoint"""
    response = requests.get(f"{BASE_URL}/api/features")
    assert response.status_code == 200
    features = response.json()
    assert isinstance(features, list)
    assert len(features) > 0
    for feature in features:
        assert "name" in feature
        assert "importance" in feature
        assert isinstance(feature["importance"], float)

def test_api_response_time():
    """Test API response time"""
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
    
    start_time = time.time()
    response = requests.post(f"{BASE_URL}/api/predict", json=test_data)
    end_time = time.time()
    
    assert response.status_code == 200
    assert end_time - start_time < 2  # Response should be under 2 seconds
