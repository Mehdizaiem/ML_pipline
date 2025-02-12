import argparse
import os
from pathlib import Path
from model_pipeline import prepare_data, train_model, evaluate_model, save_model, load_model

# File paths for data
train_file = "churn-bigml-80.csv"
test_file = "churn-bigml-20.csv"

# Setup argument parser
parser = argparse.ArgumentParser(description="Random Forest Model Pipeline Controller")
parser.add_argument(
    "action",
    type=str,
    nargs="?",  # This makes the argument optional
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

# Parse arguments
args = parser.parse_args()

# Function to run the full pipeline
def run_full_pipeline():
    print("Running full Random Forest pipeline...")
    
    print("\n🔹 Preparing data...")
    X_train, X_test, y_train, y_test = prepare_data(train_file, test_file)

    print(f"\n🔹 Training Random Forest model (trees: {args.n_estimators}, max_depth: {args.max_depth})...")
    model = train_model(X_train, y_train, n_estimators=args.n_estimators, max_depth=args.max_depth)

    print("\n🔹 Evaluating model...")
    evaluate_model(model, X_test, y_test)

    print("\n🔹 Saving model...")
    save_model(model)

    print("\n🔹 Loading and re-evaluating model...")
    loaded_model = load_model()
    evaluate_model(loaded_model, X_test, y_test)

# Execute based on argument
try:
    if args.action == "prepare_data":
        print("\n🔹 Preparing data...")
        X_train, X_test, y_train, y_test = prepare_data(train_file, test_file)

    elif args.action == "train_model":
        print(f"\n🔹 Training Random Forest model (trees: {args.n_estimators}, max_depth: {args.max_depth})...")
        X_train, X_test, y_train, y_test = prepare_data(train_file, test_file)
        model = train_model(X_train, y_train, n_estimators=args.n_estimators, max_depth=args.max_depth)

    elif args.action == "evaluate_model":
        print("\n🔹 Evaluating model...")
        X_train, X_test, y_train, y_test = prepare_data(train_file, test_file)
        model = train_model(X_train, y_train, n_estimators=args.n_estimators, max_depth=args.max_depth)
        evaluate_model(model, X_test, y_test)

    elif args.action == "save_model":
        print("\n🔹 Saving model...")
        X_train, X_test, y_train, y_test = prepare_data(train_file, test_file)
        model = train_model(X_train, y_train, n_estimators=args.n_estimators, max_depth=args.max_depth)
        save_model(model)

    elif args.action == "load_model":
        print("\n🔹 Loading model and re-evaluating...")
        X_train, X_test, y_train, y_test = prepare_data(train_file, test_file)
        loaded_model = load_model()
        evaluate_model(loaded_model, X_test, y_test)

    elif args.action == "all":
        run_full_pipeline()

    else:
        print("\n❌ Invalid action! Choose from: prepare_data, train_model, evaluate_model, save_model, load_model, or leave blank to run all.")

except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    exit(1)