# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy app files
COPY . .

# Expose port (Expo default)
EXPOSE 8081

# Start the app
CMD ["npm", "start"]

