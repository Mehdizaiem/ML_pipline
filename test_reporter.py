# test_reporter.py

import json
import requests
import sys
import time
import os
from datetime import datetime

def parse_pytest_output(output):
    results = []
    current_test = None
    
    for line in output.split('\n'):
        if 'PASSED' in line or 'FAILED' in line:
            # Extract test name and status
            parts = line.split('::')
            if len(parts) >= 2:
                test_name = parts[1].split()[0]
                status = 'passed' if 'PASSED' in line else 'failed'
                error_message = None
                duration = 0.0  # Default duration
                
                # Try to extract duration if available
                try:
                    duration_str = line.split('[')[-1].split(']')[0]
                    if 's' in duration_str:
                        duration = float(duration_str.replace('s', ''))
                except:
                    pass
                
                # If failed, look for error message
                if status == 'failed':
                    error_start = output.find(line) + len(line)
                    error_end = output.find('\n===', error_start)
                    if error_end > error_start:
                        error_message = output[error_start:error_end].strip()
                
                results.append({
                    "name": test_name,
                    "status": status,
                    "duration": duration,
                    "error_message": error_message
                })
    
    return {
        "total": len(results),
        "passed": sum(1 for r in results if r["status"] == "passed"),
        "failed": sum(1 for r in results if r["status"] == "failed"),
        "results": results,
        "timestamp": datetime.now().isoformat()
    }

def save_to_file(results, fallback_file):
    """Save results to a local file"""
    try:
        # Create parent directories if they don't exist
        os.makedirs(os.path.dirname(fallback_file), exist_ok=True)
        
        with open(fallback_file, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"Results saved to {fallback_file}")
        return True
    except Exception as file_error:
        print(f"Failed to save results to file: {file_error}")
        return False

def send_results(results):
    try:
        # Try multiple times with a backoff strategy
        max_attempts = 3
        endpoints = [
            "http://host.docker.internal:8000/api/test-results",  # Docker internal DNS
            "http://localhost:8000/api/test-results",             # Local address
            "http://ml-backend:8000/api/test-results"             # Service name in docker-compose
        ]
        
        # Save to file first as backup
        fallback_file = "/app/test_results/test_results.json"
        save_to_file(results, fallback_file)
        
        # Try endpoints with retries
        for endpoint in endpoints:
            for attempt in range(max_attempts):
                try:
                    print(f"Trying endpoint {endpoint}, attempt {attempt+1}...")
                    response = requests.post(
                        endpoint,
                        json=results,
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                    response.raise_for_status()
                    print(f"Successfully sent test results to {endpoint}")
                    return True
                except requests.exceptions.ConnectionError:
                    if attempt < max_attempts - 1:
                        # Wait and retry
                        wait_time = 2 ** attempt  # Exponential backoff
                        print(f"Connection error. Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                    else:
                        print(f"Failed to connect to {endpoint} after {max_attempts} attempts.")
                except Exception as e:
                    print(f"Error sending results to {endpoint}: {e}")
                    break  # Try next endpoint
        
        print("All endpoints failed. Results are saved to file.")        
        return True  # Return success since we already saved to file
        
    except Exception as e:
        print(f"Error in send_results function: {e}")
        return True  # Don't fail the pipeline

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_reporter.py <pytest_output_file>")
        sys.exit(1)
    
    try:
        with open(sys.argv[1], 'r') as f:
            pytest_output = f.read()
        
        results = parse_pytest_output(pytest_output)
        success = send_results(results)
        
        # Never fail the pipeline
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(0)  # Don't fail the pipeline