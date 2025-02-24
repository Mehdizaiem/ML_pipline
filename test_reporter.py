# test_reporter.py

import json
import requests
import sys
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

def send_results(results):
    try:
        response = requests.post(
            "http://localhost:8000/api/test-results",
            json=results,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        print("Successfully sent test results")
        return True
    except Exception as e:
        print(f"Error sending results: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_reporter.py <pytest_output_file>")
        sys.exit(1)
    
    try:
        with open(sys.argv[1], 'r') as f:
            pytest_output = f.read()
        
        results = parse_pytest_output(pytest_output)
        success = send_results(results)
        
        if not success:
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
