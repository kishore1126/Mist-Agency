FROM node:22-slim

# Install Puppeteer & Chromium Linux system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libsqlite3-dev \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install npm packages
RUN npm ci --no-audit

# Copy source files
COPY . .

# Build production bundle
RUN npm run build

# Expose port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Start Node server
CMD ["npm", "start"]
