# Use an official Python runtime as a parent image
FROM python:3.12.3

# Set the working directory in the container
WORKDIR /app

# Copy just the requirements file first
COPY requirements.txt .

# Install dependencies - this layer will be cached as long as requirements.txt doesn't change
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Run main.py when the container launches
CMD ["python", "main.py"]
