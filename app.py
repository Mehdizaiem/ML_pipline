from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pickle
import pandas as pd
import numpy as np
from pydantic import BaseModel
from typing import List, Dict, Union, Optional
import os
from model_pipeline import prepare_data
import logging
from sklearn.preprocessing import LabelEncoder
import json
from model_monitoring import ModelMonitor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI application
app = FastAPI(title="ML Pipeline API", description="API for telecom customer churn prediction")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize monitoring
monitor = ModelMonitor()

# Pydantic models for API requests/responses
class FeatureInput(BaseModel):
    features: Dict[str, Union[float, int, str]]

class PredictionOutput(BaseModel):
    prediction: int
    churn_probability: float
    retention_probability: float

class FeatureImportance(BaseModel):
    name: str
    importance: float

class HealthStatus(BaseModel):
    status: str
    model_loaded: bool

class TestResult(BaseModel):
    name: str
    status: str
    duration: float
    error_message: Optional[str] = None

class TestResults(BaseModel):
    total: int
    passed: int
    failed: int
    results: List[TestResult]

# Load the model
def load_model():
    try:
        with open('model.pkl', 'rb') as f:
            model = pickle.load(f)
        return model
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return None

# Get column names from the training data
def get_feature_names():
    try:
        df_train = pd.read_csv("churn-bigml-80.csv")
        return list(df_train.drop(columns=['Churn']).columns)
    except Exception as e:
        logger.error(f"Error loading column names: {e}")
        return []

@app.post("/api/predict", response_model=PredictionOutput)
async def predict(data: FeatureInput):
    model = load_model()
    if not model:
        raise HTTPException(status_code=500, detail="Model failed to load")
    
    try:
        # Get training data to understand expected features
        df_train = pd.read_csv("churn-bigml-80.csv")
        expected_features = list(df_train.drop(columns=['Churn']).columns)
        
        # Create a new dictionary with features in the same order as training data
        processed_features = {}
        
        # Check if all required features are present
        for feature in expected_features:
            if feature in data.features:
                processed_features[feature] = data.features[feature]
            else:
                # Fill missing features with default values
                if feature in df_train.select_dtypes(include=['object']).columns:
                    # For categorical features, use the most common value
                    processed_features[feature] = df_train[feature].mode()[0]
                else:
                    # For numerical features, use the mean
                    processed_features[feature] = float(df_train[feature].mean())
        
        # Convert input dict to DataFrame with features in the expected order
        input_df = pd.DataFrame([processed_features])
        
        # Ensure column order matches what the model expects
        input_df = input_df[expected_features]
        
        # Handle boolean columns
        boolean_cols = ['International plan', 'Voice mail plan']
        for col in boolean_cols:
            if col in input_df.columns:
                input_df[col] = (input_df[col].str.lower() == 'yes').astype(int)
        
        # Handle other categorical features
        categorical_cols = input_df.select_dtypes(include=['object']).columns
        categorical_cols = [col for col in categorical_cols 
                          if col not in boolean_cols]
        
        # Use training data to fit label encoders
        label_encoders = {}
        for col in categorical_cols:
            if col in df_train.columns:
                label_encoders[col] = LabelEncoder()
                # Fit on training data
                label_encoders[col].fit(df_train[col])
                # Transform input data
                input_df[col] = label_encoders[col].transform(input_df[col])
        
        # Make prediction
        prediction = model.predict(input_df)
        probability = model.predict_proba(input_df)
        
        result = {
            "prediction": int(prediction[0]),
            "churn_probability": float(probability[0][1]),
            "retention_probability": float(probability[0][0])
        }
        
        # Log prediction for monitoring
        monitor.log_prediction(
            features=data.features,
            prediction=int(prediction[0])
        )
        
        return result
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    
@app.get("/api/features", response_model=List[FeatureImportance])
async def get_features():
    model = load_model()
    if not model:
        raise HTTPException(status_code=500, detail="Model failed to load")
    
    try:
        feature_importances = model.feature_importances_
        feature_names = get_feature_names()
        
        if not feature_names or len(feature_names) != len(feature_importances):
            feature_names = [f"feature_{i}" for i in range(len(feature_importances))]
        
        features = [
            {"name": name, "importance": float(importance)}
            for name, importance in zip(feature_names, feature_importances)
        ]
        
        features.sort(key=lambda x: x["importance"], reverse=True)
        return features
        
    except Exception as e:
        logger.error(f"Feature importance error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/health", response_model=HealthStatus)
async def health_check():
    model = load_model()
    return {"status": "healthy", "model_loaded": model is not None}

@app.get("/api/test-results")
async def get_test_results():
    try:
        # Try multiple paths for test results
        paths_to_try = [
            "test_results.json",  # Original path
            "test_results/test_results.json",  # Directory path
            "test_results/test_results_fallback.json"  # Fallback path
        ]
        
        for path in paths_to_try:
            if os.path.exists(path) and os.path.isfile(path):
                with open(path, "r") as f:
                    return json.load(f)
                    
        # If no file found, return empty results
        return {
            "total": 0,
            "passed": 0,
            "failed": 0,
            "results": []
        }
    except Exception as e:
        logger.error(f"Error getting test results: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/test-results")
async def save_test_results(results: TestResults):
    try:
        with open("test_results.json", "w") as f:
            json.dump(results.dict(), f)
        return {"message": "Test results saved successfully"}
    except Exception as e:
        logger.error(f"Error saving test results: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# New monitoring endpoints
@app.get("/api/monitoring/metrics")
async def get_monitoring_metrics():
    try:
        with open("monitoring_logs/model_metrics.json") as f:
            metrics = json.load(f)
        return metrics
    except Exception as e:
        logger.error(f"Error fetching monitoring metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/monitoring/history")
async def get_monitoring_history():
    try:
        with open("monitoring_logs/model_metrics.json") as f:
            metrics_history = json.load(f)
        return metrics_history
    except Exception as e:
        logger.error(f"Error fetching monitoring history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/monitoring/alerts")
async def get_alerts():
    try:
        alerts = []
        if os.path.exists("monitoring_logs/alerts.log"):
            with open("monitoring_logs/alerts.log", "r") as f:
                for line in f:
                    alerts.append(line.strip())
        return {"alerts": alerts}
    except Exception as e:
        logger.error(f"Error fetching alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)