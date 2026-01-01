# Use Node.js as base image
FROM node:18-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy local code to container
COPY . .

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

# Start server
CMD [ "node", "server.js" ]
