import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import pickle
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def prepare_data(train_path, test_path, target_column='Churn'):
    """Load and preprocess the dataset."""
    try:
        # Load dataset
        logger.info(f"Loading data from {train_path} and {test_path}")
        df_train = pd.read_csv(train_path)
        df_test = pd.read_csv(test_path)

        # Identify categorical columns (excluding target and boolean columns)
        categorical_cols = df_train.select_dtypes(include=['object']).columns
        categorical_cols = [col for col in categorical_cols 
                          if col != target_column 
                          and col not in ['International plan', 'Voice mail plan']]

        # Handle yes/no columns specifically
        boolean_cols = ['International plan', 'Voice mail plan']
        for col in boolean_cols:
            df_train[col] = (df_train[col].str.lower() == 'yes').astype(int)
            df_test[col] = (df_test[col].str.lower() == 'yes').astype(int)

        # Convert other categorical columns to numerical
        label_encoders = {}
        for col in categorical_cols:
            label_encoders[col] = LabelEncoder()
            df_train[col] = label_encoders[col].fit_transform(df_train[col])
            df_test[col] = label_encoders[col].transform(df_test[col])

        # Handle target column - ensure it's boolean/binary
        df_train[target_column] = df_train[target_column].astype(int)
        df_test[target_column] = df_test[target_column].astype(int)

        # Define features and target variable
        X_train = df_train.drop(columns=[target_column])
        y_train = df_train[target_column]
        X_test = df_test.drop(columns=[target_column])
        y_test = df_test[target_column]
        
        logger.info("Data preparation completed successfully")
        return X_train, X_test, y_train, y_test
        
    except Exception as e:
        logger.error(f"Error in data preparation: {str(e)}")
        raise

def train_model(X_train, y_train, n_estimators=100, max_depth=10):
    """Train a Random Forest classifier model."""
    try:
        model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=42,
            n_jobs=-1  # Use all available cores
        )
        
        logger.info("Training Random Forest model...")
        model.fit(X_train, y_train)
        
        # Print feature importance
        feature_importance = pd.DataFrame({
            'feature': X_train.columns,
            'importance': model.feature_importances_
        })
        logger.info("\nTop 5 Most Important Features:")
        logger.info(feature_importance.sort_values('importance', ascending=False).head())
        
        return model
        
    except Exception as e:
        logger.error(f"Error in model training: {str(e)}")
        raise

def evaluate_model(model, X_test, y_test):
    """Evaluate the model performance."""
    try:
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        logger.info(f'Model Accuracy: {accuracy:.4f}')
        
        # Print detailed classification report
        report = classification_report(y_test, y_pred)
        logger.info(f"\nClassification Report:\n{report}")
        
        return accuracy
        
    except Exception as e:
        logger.error(f"Error in model evaluation: {str(e)}")
        raise

def save_model(model, filename="model.pkl"):
    """Save the trained model to a file."""
    try:
        with open(filename, "wb") as f:
            pickle.dump(model, f)
        logger.info(f'Model saved as {filename}')
        
    except Exception as e:
        logger.error(f"Error saving model: {str(e)}")
        raise

def load_model(filename="model.pkl"):
    """Load a saved model from a file."""
    try:
        with open(filename, "rb") as f:
            model = pickle.load(f)
        logger.info(f'Model loaded from {filename}')
        return model
        
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise
