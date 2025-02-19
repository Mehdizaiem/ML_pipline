FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci && \
    find node_modules -type f -name "*.js" -exec chmod +x {} \; && \
    chmod -R +x node_modules/.bin/

# Copy the rest of the application
COPY . .

# Build the application using npx instead of relying on node_modules/.bin path
RUN npx react-scripts build

# Install serve to run the application
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]
