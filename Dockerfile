# Use an official Node.js runtime as a base image
FROM node:16-slim

# Install necessary dependencies for Puppeteer
WORKDIR /usr/app
COPY ./ /usr/app

RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends

# Install Puppeteer (it'll automatically install Chromium)
RUN npm install puppeteer

# Install Google Cloud client libraries
RUN npm install @google-cloud/firestore @google-cloud/storage

# Set the working directory
WORKDIR /usr/src/app

# Copy the script into the container
COPY . .

# Expose the port for the service to listen on
EXPOSE 8080

# Start the Node.js app
CMD ["node", "index.js"]
