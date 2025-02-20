FROM node:18-alpine

WORKDIR /app

# Copy entire app at once to reduce layers
COPY . .

# Install dependencies with production flag
RUN npm install --production=false

# Build using direct node executable path to node_modules
ENV DISABLE_ESLINT_PLUGIN=true
ENV CI=true
RUN node /app/node_modules/.bin/react-scripts build

# Install serve
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]
