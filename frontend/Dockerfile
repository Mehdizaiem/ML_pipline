FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Install react-scripts globally
RUN npm install -g react-scripts

# Copy the rest of the application
COPY . .

# Build the application using global react-scripts
RUN react-scripts build

# Install serve to run the application
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]
