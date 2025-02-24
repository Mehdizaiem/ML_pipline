import pytest
import time
import requests
import pandas as pd
import numpy as np
from model_pipeline import prepare_data, train_model
import psutil
import os
import concurrent.futures

def test_model_prediction_latency():
    """Test model prediction latency"""
    # Load model and prepare test data
    X_train, X_test, y_train, y_test = prepare_data("churn-bigml-80.csv", "churn-bigml-20.csv")
    model = train_model(X_train, y_train)
    
    # Measure prediction time for single samples
    single_sample = X_test.iloc[0:1]
    times = []
    
    # Warm-up predictions
    for _ in range(5):
        _ = model.predict(single_sample)
    
    # Actual timing measurements
    for _ in range(100):
        start_time = time.time()
        _ = model.predict(single_sample)
        end_time = time.time()
        times.append(end_time - start_time)
    
    avg_time = np.mean(times)
    p95_time = np.percentile(times, 95)
    p99_time = np.percentile(times, 99)
    
    print(f"\nLatency Statistics:")
    print(f"Average: {avg_time*1000:.2f}ms")
    print(f"95th percentile: {p95_time*1000:.2f}ms")
    print(f"99th percentile: {p99_time*1000:.2f}ms")
    
    assert avg_time < 0.1  # Average prediction should be under 100ms
    assert p95_time < 0.2  # 95% of predictions should be under 200ms
    assert p99_time < 0.3  # 99% of predictions should be under 300ms

def test_api_throughput():
    """Test API throughput under load"""
    test_data = {
        "features": {
            "State": "NY",
            "Account length": 100,
            "Area code": 408,
            "International plan": "no",
            "Voice mail plan": "no",
            "Number vmail messages": 0,
            "Total day minutes": 200,
            "Total day calls": 100,
            "Total day charge": 34,
            "Total eve minutes": 200,
            "Total eve calls": 100,
            "Total eve charge": 17,
            "Total night minutes": 200,
            "Total night calls": 100,
            "Total night charge": 9,
            "Total intl minutes": 10,
            "Total intl calls": 4,
            "Total intl charge": 2.7,
            "Customer service calls": 1
        }
    }
    
    def make_request():
        return requests.post("http://localhost:8000/api/predict", json=test_data)
    
    # Test concurrent requests
    n_requests = 50
    start_time = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_request) for _ in range(n_requests)]
        responses = [f.result() for f in concurrent.futures.as_completed(futures)]
    
    end_time = time.time()
    
    # Calculate statistics
    successful_requests = sum(1 for r in responses if r.status_code == 200)
    total_time = end_time - start_time
    requests_per_second = n_requests / total_time
    
    print(f"\nThroughput Statistics:")
    print(f"Total requests: {n_requests}")
    print(f"Successful requests: {successful_requests}")
    print(f"Total time: {total_time:.2f} seconds")
    print(f"Requests per second: {requests_per_second:.2f}")
    
    # Assertions
    assert successful_requests == n_requests  # All requests should succeed
    assert total_time < 30  # Should complete within 30 seconds
    assert requests_per_second > 1  # Should handle at least 1 request per second

def test_model_memory_usage():
    """Test model memory usage"""
    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss / 1024 / 1024  # Memory in MB
    
    # Load model and make predictions
    X_train, X_test, y_train, y_test = prepare_data("churn-bigml-80.csv", "churn-bigml-20.csv")
    model = train_model(X_train, y_train)
    
    # Make some predictions
    for _ in range(100):
        model.predict(X_test)
    
    final_memory = process.memory_info().rss / 1024 / 1024
    memory_increase = final_memory - initial_memory
    
    print(f"\nMemory Usage Statistics:")
    print(f"Initial memory: {initial_memory:.2f} MB")
    print(f"Final memory: {final_memory:.2f} MB")
    print(f"Memory increase: {memory_increase:.2f} MB")
    
    assert memory_increase < 1000  # Memory increase should be less than 1GB

def test_model_load_time():
    """Test model loading time"""
    start_time = time.time()
    
    # Load the model
    with open('model.pkl', 'rb') as f:
        import pickle
        model = pickle.load(f)
    
    load_time = time.time() - start_time
    
    print(f"\nModel Load Time: {load_time*1000:.2f}ms")
    assert load_time < 5  # Model should load in less than 5 seconds

def test_api_response_size():
    """Test API response size"""
    test_data = {
        "features": {
            "Account length": 100,
            "International plan": "no",
            "Voice mail plan": "no",
            "Number vmail messages": 0,
            "Total day minutes": 200,
            "Total day calls": 100,
            "Total day charge": 34,
            "Total eve minutes": 200,
            "Total eve calls": 100,
            "Total eve charge": 17,
            "Total night minutes": 200,
            "Total night calls": 100,
            "Total night charge": 9,
            "Total intl minutes": 10,
            "Total intl calls": 4,
            "Total intl charge": 2.7,
            "Customer service calls": 1
        }
    }
    
    response = requests.post("http://localhost:8000/api/predict", json=test_data)
    response_size = len(response.content)
    
    print(f"\nAPI Response Size: {response_size/1024:.2f}KB")
    assert response_size < 10 * 1024  # Response should be less than 10KB

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
