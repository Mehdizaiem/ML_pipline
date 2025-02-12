# Makefile for ML Project Pipeline

.PHONY: all lint train test format security check

# Default target
all: lint train test

# Code quality checks
lint:
	pip install pylint
	pylint *.py || true

# Code formatting
format:
	pip install black
	black *.py || true

# Security check
security:
	pip install bandit
	bandit -r . || true

# Run the full training pipeline
train:
	python3 main.py
	@echo "Training completed"

# Run tests
test:
	python -m pytest tests/ || true

# Combined code quality checks
check: lint format security

# Watch for changes and run pipeline
watch:
	while true; do \
		inotifywait -e modify,create,delete -r . --exclude '\.git/|__pycache__/|\.pyc$$'; \
		make all; \
	done

# Help target
help:
	@echo "Available targets:"
	@echo "  all      : Run complete pipeline (lint, train, test)"
	@echo "  lint     : Run code quality checks"
	@echo "  format   : Format code using black"
	@echo "  security : Run security checks"
	@echo "  train    : Run the training pipeline"
	@echo "  test     : Run tests"
	@echo "  check    : Run all code quality checks"
	@echo "  watch    : Watch for file changes and run pipeline"
	@echo "  help     : Show this help message"
