from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pickle
import pandas as pd
import numpy as np
from pydantic import BaseModel
from typing import List, Dict, Union, Optional
import os
from model_pipeline import prepare_data

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

# Load the model
def load_model():
    try:
        with open('model.pkl', 'rb') as f:
            model = pickle.load(f)
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

# Get column names from the training data
def get_feature_names():
    try:
        df_train = pd.read_csv("churn-bigml-80.csv")
        # Remove target column
        return list(df_train.drop(columns=['Churn']).columns)
    except Exception as e:
        print(f"Error loading column names: {e}")
        return []

# Pydantic models for API requests/responses
class FeatureInput(BaseModel):
    # Dictionary of feature name to value
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

@app.post("/api/predict", response_model=PredictionOutput)
async def predict(data: FeatureInput):
    model = load_model()
    if not model:
        raise HTTPException(status_code=500, detail="Model failed to load")
    
    try:
        # Convert input dict to DataFrame
        input_df = pd.DataFrame([data.features])
        
        # Handle categorical features
        categorical_cols = input_df.select_dtypes(include=['object']).columns
        label_encoders = {}
        
        # Get training data to fit label encoders
        df_train = pd.read_csv("churn-bigml-80.csv")
        
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
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/features", response_model=List[FeatureImportance])
async def get_features():
    model = load_model()
    if not model:
        raise HTTPException(status_code=500, detail="Model failed to load")
    
    try:
        # Get feature importances
        feature_importances = model.feature_importances_
        
        # Get feature names - we can get these from the model or by loading the training data
        feature_names = get_feature_names()
        if not feature_names or len(feature_names) != len(feature_importances):
            # Fallback to generic feature names
            feature_names = [f"feature_{i}" for i in range(len(feature_importances))]
        
        features = [
            {"name": name, "importance": float(importance)}
            for name, importance in zip(feature_names, feature_importances)
        ]
        
        # Sort by importance
        features.sort(key=lambda x: x["importance"], reverse=True)
        
        return features
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/health", response_model=HealthStatus)
async def health_check():
    model = load_model()
    return {"status": "healthy", "model_loaded": model is not None}

# Add import for LabelEncoder
from sklearn.preprocessing import LabelEncoder

# If run directly
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
