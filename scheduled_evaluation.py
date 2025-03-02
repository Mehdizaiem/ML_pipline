import pandas as pd
import logging
import time
import schedule
from model_pipeline import prepare_data, load_model, evaluate_model
from model_monitoring import ModelMonitor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def evaluate_current_model():
    """Scheduled task to evaluate model on latest data"""
    try:
        logger.info("Running scheduled model evaluation")
        
        # Load test data
        X_train, X_test, y_train, y_test = prepare_data("churn-bigml-80.csv", "churn-bigml-20.csv")
        
        # Load current model
        model = load_model()
        
        # Evaluate model
        evaluate_model(model, X_test, y_test)
        
        # Log metrics for monitoring
        monitor = ModelMonitor()
        y_pred = model.predict(X_test)
        metrics = monitor.log_batch_metrics(y_test, y_pred, X_test)
        
        logger.info(f"Scheduled evaluation complete. Accuracy: {metrics['accuracy']:.4f}")
        
    except Exception as e:
        logger.error(f"Scheduled evaluation failed: {str(e)}")

def start_scheduled_evaluation(interval_hours=24):
    """Start the scheduled evaluation jobs"""
    schedule.every(interval_hours).hours.do(evaluate_current_model)
    
    logger.info(f"Scheduled model evaluation every {interval_hours} hours")
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    # Run immediately once
    evaluate_current_model()
    
    # Then schedule recurring
    start_scheduled_evaluation()
