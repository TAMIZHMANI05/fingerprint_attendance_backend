# Base image
FROM node:22-alpine AS base

# Set working directory
WORKDIR /usr/src/app

# Copy package files 
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application in production mode
CMD [ "npm", "start" ]