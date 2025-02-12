from fastapi import FastAPI
import pickle
import numpy as np
from pydantic import BaseModel

# Charger le modèle
with open("model.pkl", "rb") as f:
    model = pickle.load(f)

# Initialiser l’application FastAPI
app = FastAPI()

# Définir un modèle de données pour la requête
class PredictionInput(BaseModel):
    features: list[float]

# Route pour faire une prédiction
@app.post("/predict")
def predict(data: PredictionInput):
    try:
        input_data = np.array(data.features).reshape(1, -1)
        prediction = model.predict(input_data)
        return {"prediction": prediction.tolist()}
    except Exception as e:
        return {"error": str(e)}
