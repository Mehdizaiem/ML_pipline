import pandas as pd
import numpy as np
import json
import time
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import os
from datetime import datetime

class ModelMonitor:
    def __init__(self, log_dir="monitoring_logs"):
        self.log_dir = log_dir
        os.makedirs(log_dir, exist_ok=True)
        self.metrics_file = os.path.join(log_dir, "model_metrics.json")
        self.initialize_metrics_file()
        
    def initialize_metrics_file(self):
        if not os.path.exists(self.metrics_file):
            initial_data = {
                "timestamps": [],
                "accuracy": [],
                "precision": [],
                "recall": [],
                "f1_score": [],
                "prediction_count": [],
                "data_drift_score": []
            }
            with open(self.metrics_file, 'w') as f:
                json.dump(initial_data, f)
    
    def log_prediction(self, features, prediction, actual=None):
        """Log a single prediction for monitoring"""
        timestamp = datetime.now().isoformat()
        log_entry = {
            "timestamp": timestamp,
            "features": features,
            "prediction": prediction,
            "actual": actual
        }
        
        # Log to predictions file
        with open(os.path.join(self.log_dir, "predictions.jsonl"), "a") as f:
            f.write(json.dumps(log_entry) + "\n")
        
        # Update summary metrics for real-time monitoring
        self._update_summary_metrics()
    
    def log_batch_metrics(self, y_true, y_pred, X_test=None):
        """Log metrics from a batch evaluation"""
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "accuracy": accuracy_score(y_true, y_pred),
            "precision": precision_score(y_true, y_pred),
            "recall": recall_score(y_true, y_pred),
            "f1_score": f1_score(y_true, y_pred),
            "prediction_count": len(y_pred),
            "data_drift_score": self._calculate_data_drift(X_test) if X_test is not None else None
        }
        
        with open(self.metrics_file, 'r') as f:
            data = json.load(f)
        
        # Append new metrics
        data["timestamps"].append(metrics["timestamp"])
        data["accuracy"].append(metrics["accuracy"])
        data["precision"].append(metrics["precision"])
        data["recall"].append(metrics["recall"])
        data["f1_score"].append(metrics["f1_score"])
        data["prediction_count"].append(metrics["prediction_count"])
        data["data_drift_score"].append(metrics["data_drift_score"])
        
        # Save updated metrics
        with open(self.metrics_file, 'w') as f:
            json.dump(data, f)
            
        # Generate visualizations
        self.generate_metrics_visualizations()
        
        return metrics
    
    def _calculate_data_drift(self, X_test):
        """
        Calculate a simple data drift score
        In a real implementation, this would use statistical tests to detect drift
        """
        # Placeholder for data drift calculation
        # A real implementation would compare distributions
        return 0.0
    
    def _update_summary_metrics(self):
        """Update summary metrics based on recent predictions"""
        # This is a placeholder that would be implemented to update 
        # real-time monitoring metrics from recent predictions
        pass
    
    def generate_metrics_visualizations(self):
        """Generate visualizations of model metrics over time"""
        with open(self.metrics_file, 'r') as f:
            data = json.load(f)
        
        if len(data["timestamps"]) < 2:
            return  # Not enough data points
            
        # Convert timestamps to datetime objects
        timestamps = [datetime.fromisoformat(ts) for ts in data["timestamps"]]
        
        # Create visualization directory
        vis_dir = os.path.join(self.log_dir, "visualizations")
        os.makedirs(vis_dir, exist_ok=True)
        
        # Plot accuracy over time
        plt.figure(figsize=(10, 6))
        plt.plot(timestamps, data["accuracy"], marker='o', linestyle='-')
        plt.title('Model Accuracy Over Time')
        plt.xlabel('Date')
        plt.ylabel('Accuracy')
        plt.grid(True)
        plt.tight_layout()
        plt.savefig(os.path.join(vis_dir, "accuracy_trend.png"))
        plt.close()
        
        # Plot all metrics together
        plt.figure(figsize=(12, 8))
        plt.plot(timestamps, data["accuracy"], marker='o', label='Accuracy')
        plt.plot(timestamps, data["precision"], marker='s', label='Precision')
        plt.plot(timestamps, data["recall"], marker='^', label='Recall')
        plt.plot(timestamps, data["f1_score"], marker='d', label='F1 Score')
        plt.title('Model Performance Metrics Over Time')
        plt.xlabel('Date')
        plt.ylabel('Score')
        plt.legend()
        plt.grid(True)
        plt.tight_layout()
        plt.savefig(os.path.join(vis_dir, "metrics_trend.png"))
        plt.close()
