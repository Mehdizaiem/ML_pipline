import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pickle

def prepare_data(train_path, test_path, target_column='Churn'):
    """Load and preprocess the dataset."""
    
    # Load dataset
    df_train = pd.read_csv(train_path)
    df_test = pd.read_csv(test_path)

    # Identify categorical columns
    categorical_cols = df_train.select_dtypes(include=['object']).columns

    # Convert categorical columns to numerical
    label_encoders = {}
    for col in categorical_cols:
        label_encoders[col] = LabelEncoder()
        df_train[col] = label_encoders[col].fit_transform(df_train[col])
        df_test[col] = label_encoders[col].transform(df_test[col])

    # Define features and target variable
    X_train = df_train.drop(columns=[target_column])
    y_train = df_train[target_column]
    X_test = df_test.drop(columns=[target_column])
    y_test = df_test[target_column]
    
    return X_train, X_test, y_train, y_test

def train_model(X_train, y_train, n_estimators=100, max_depth=10):
    """Train a Random Forest classifier model."""
    
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=42,
        n_jobs=-1  # Use all available cores
    )
    
    print("Training Random Forest model...")
    model.fit(X_train, y_train)
    
    # Print feature importance
    feature_importance = pd.DataFrame({
        'feature': X_train.columns,
        'importance': model.feature_importances_
    })
    print("\nTop 5 Most Important Features:")
    print(feature_importance.sort_values('importance', ascending=False).head())
    
    return model

def evaluate_model(model, X_test, y_test):
    """Evaluate the model performance."""
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f'Model Accuracy: {accuracy:.4f}')
    
    return accuracy

def save_model(model, filename="model.pkl"):
    """Save the trained model to a file."""
    
    with open(filename, "wb") as f:
        pickle.dump(model, f)
    print(f'Model saved as {filename}')

def load_model(filename="model.pkl"):
    """Load a saved model from a file."""
    
    with open(filename, "rb") as f:
        model = pickle.load(f)
    print(f'Model loaded from {filename}')
    
    return model
