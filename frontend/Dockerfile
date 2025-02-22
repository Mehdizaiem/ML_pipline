FROM node:18-alpine as build

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source and set permissions
COPY . .
RUN chown -R node:node /usr/src/app
RUN chmod -R 755 /usr/src/app

# Use node user for subsequent commands
USER node

# Create production build with environment variables
ENV DISABLE_ESLINT_PLUGIN=true
ENV SKIP_PREFLIGHT_CHECK=true
ENV CI=true
RUN npm run build

# Production environment
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /usr/src/app/build ./build
