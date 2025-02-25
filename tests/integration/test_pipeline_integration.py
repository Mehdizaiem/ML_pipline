import pytest
import requests
import pandas as pd
from model_pipeline import prepare_data, train_model

def test_full_pipeline_integration():
    """Test the entire pipeline from data preparation to API prediction"""
    # 1. Prepare data and train model
    X_train, X_test, y_train, y_test = prepare_data("churn-bigml-80.csv", "churn-bigml-20.csv")
    model = train_model(X_train, y_train)
    
    # 2. Test prediction through API
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
    
    response = requests.post("http://localhost:8000/api/predict", json=test_data)
    assert response.status_code == 200
    
    prediction_data = response.json()
    assert "prediction" in prediction_data
    assert "churn_probability" in prediction_data
    assert "retention_probability" in prediction_data
    
    # 3. Verify prediction format
    assert isinstance(prediction_data["prediction"], int)
    assert isinstance(prediction_data["churn_probability"], float)
    assert isinstance(prediction_data["retention_probability"], float)
    
    # 4. Verify probability constraints
    assert 0 <= prediction_data["churn_probability"] <= 1
    assert 0 <= prediction_data["retention_probability"] <= 1
    assert abs(prediction_data["churn_probability"] + prediction_data["retention_probability"] - 1.0) < 1e-6

def test_model_api_consistency():
    """Test if direct model predictions match API predictions"""
    # Get a test sample from the dataset
    df_test = pd.read_csv("churn-bigml-20.csv")
    test_row = df_test.iloc[0]
    
    # Format the data for API request
    api_data = {
        "features": test_row.drop('Churn').to_dict()
    }
    
    # Get prediction from API
    response = requests.post("http://localhost:8000/api/predict", json=api_data)
    assert response.status_code == 200, f"API request failed: {response.text}"
    api_prediction = response.json()["prediction"]
    
    # Get prediction directly from model (using the same preprocessing as the API)
    X_train, X_test, y_train, y_test = prepare_data("churn-bigml-80.csv", "churn-bigml-20.csv")
    model = train_model(X_train, y_train)
    
    # Get the preprocessed row from X_test that corresponds to the test_row
    test_row_index = 0
    direct_prediction = model.predict(X_test.iloc[test_row_index:test_row_index+1])[0]
    
    # Compare predictions
    assert api_prediction == direct_prediction, f"API prediction {api_prediction} != direct prediction {direct_prediction}"
