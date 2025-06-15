# Use an official Node.js runtime as a base image
FROM node:16-slim

# Set the working directory
WORKDIR /usr/src/app

# Install system dependencies required for Puppeteer
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
  --no-install-recommends \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy package files separately to leverage Docker cache
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Puppeteer requires a non-root user to run Chromium
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser && \
  mkdir -p /home/pptruser/Downloads && \
  chown -R pptruser:pptruser /home/pptruser && \
  chown -R pptruser:pptruser /usr/src/app

# Switch to non-root user
USER pptruser

# Expose the port your app listens on (Cloud Run uses 8080)
EXPOSE 8080

# Run your app
CMD ["node", "index.js"]
