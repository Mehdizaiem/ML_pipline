import argparse
import os
from pathlib import Path
from model_pipeline import prepare_data, train_model, evaluate_model, save_model, load_model
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# File paths for data
train_file = "churn-bigml-80.csv"
test_file = "churn-bigml-20.csv"

# Setup argument parser
parser = argparse.ArgumentParser(description="Random Forest Model Pipeline Controller")
parser.add_argument(
    "action",
    type=str,
    nargs="?",
    default="all",
    help="Action to perform: prepare_data, train_model, evaluate_model, save_model, load_model, or run all steps by default."
)
parser.add_argument(
    "--n_estimators",
    type=int,
    default=100,
    help="Number of trees in the Random Forest (default: 100)"
)
parser.add_argument(
    "--max_depth",
    type=int,
    default=10,
    help="Maximum depth of trees (default: 10)"
)

def run_full_pipeline():
    """Run the complete ML pipeline."""
    try:
        logger.info("Running full Random Forest pipeline...")
        
        logger.info("🔹 Preparing data...")
        X_train, X_test, y_train, y_test = prepare_data(train_file, test_file)

        logger.info(f"🔹 Training Random Forest model (trees: {args.n_estimators}, max_depth: {args.max_depth})...")
        model = train_model(X_train, y_train, n_estimators=args.n_estimators, max_depth=args.max_depth)

        logger.info("🔹 Evaluating model...")
        evaluate_model(model, X_test, y_test)

        logger.info("🔹 Saving model...")
        save_model(model)

        logger.info("🔹 Loading and re-evaluating model...")
        loaded_model = load_model()
        evaluate_model(loaded_model, X_test, y_test)
        
        logger.info("Pipeline completed successfully!")
        
    except Exception as e:
        logger.error(f"Pipeline error: {str(e)}")
        raise

if __name__ == "__main__":
    args = parser.parse_args()
    
    try:
        if args.action == "prepare_data":
            logger.info("🔹 Preparing data...")
            X_train, X_test, y_train, y_test = prepare_data(train_file, test_file)

        elif args.action == "train_model":
            logger.info(f"🔹 Training Random Forest model...")
            X_train, X_test, y_train, y_test = prepare_data(train_file, test_file)
            model = train_model(X_train, y_train, n_estimators=args.n_estimators, max_depth=args.max_depth)

        elif args.action == "evaluate_model":
            logger.info("🔹 Evaluating model...")
            X_train, X_test, y_train, y_test = prepare_data(train_file, test_file)
            model = train_model(X_train, y_train, n_estimators=args.n_estimators, max_depth=args.max_depth)
            evaluate_model(model, X_test, y_test)

        elif args.action == "save_model":
            logger.info("🔹 Saving model...")
            X_train, X_test, y_train, y_test = prepare_data(train_file, test_file)
            model = train_model(X_train, y_train, n_estimators=args.n_estimators, max_depth=args.max_depth)
            save_model(model)

        elif args.action == "load_model":
            logger.info("🔹 Loading model and re-evaluating...")
            X_train, X_test, y_train, y_test = prepare_data(train_file, test_file)
            loaded_model = load_model()
            evaluate_model(loaded_model, X_test, y_test)

        elif args.action == "all":
            run_full_pipeline()

        else:
            logger.error("Invalid action! Choose from: prepare_data, train_model, evaluate_model, save_model, load_model, or leave blank to run all.")
            exit(1)

    except Exception as e:
        logger.error(f"\n❌ Error: {str(e)}")
        exit(1)
