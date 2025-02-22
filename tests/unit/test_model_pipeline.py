import pytest
import pandas as pd
import numpy as np
from model_pipeline import prepare_data, train_model, evaluate_model, save_model, load_model

def test_prepare_data():
    X_train, X_test, y_train, y_test = prepare_data("churn-bigml-80.csv", "churn-bigml-20.csv")
    assert isinstance(X_train, pd.DataFrame)
    assert isinstance(X_test, pd.DataFrame)
    assert isinstance(y_train, pd.Series)
    assert isinstance(y_test, pd.Series)
    assert not X_train.empty
    assert not X_test.empty

def test_train_model():
    X_train, X_test, y_train, y_test = prepare_data("churn-bigml-80.csv", "churn-bigml-20.csv")
    model = train_model(X_train, y_train)
    assert hasattr(model, 'predict')
    assert hasattr(model, 'predict_proba')

def test_evaluate_model():
    X_train, X_test, y_train, y_test = prepare_data("churn-bigml-80.csv", "churn-bigml-20.csv")
    model = train_model(X_train, y_train)
    accuracy = evaluate_model(model, X_test, y_test)
    assert isinstance(accuracy, float)
    assert 0 <= accuracy <= 1

def test_model_save_load():
    X_train, X_test, y_train, y_test = prepare_data("churn-bigml-80.csv", "churn-bigml-20.csv")
    model = train_model(X_train, y_train)
    
    # Test save
    save_model(model, "test_model.pkl")
    
    # Test load
    loaded_model = load_model("test_model.pkl")
    assert hasattr(loaded_model, 'predict')
    
    # Compare predictions
    original_pred = model.predict(X_test)
    loaded_pred = loaded_model.predict(X_test)
    assert np.array_equal(original_pred, loaded_pred)
