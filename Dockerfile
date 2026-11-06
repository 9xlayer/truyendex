# Use the official Node.js 20 slim image (Debian Bookworm with glibc for better-sqlite3 and native modules)
FROM node:20-slim

# Install system dependencies (curl for healthcheck, build tools for native addons)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable

# Build arguments for Coolify & Next.js public environment variables
ARG PORT=3000
ARG NEXT_PUBLIC_CORS_URL
ARG NEXT_PUBLIC_CORS_V2_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_APP_IMAGE_URL
ARG NEXT_PUBLIC_MAINTENANCE_MODE

# Set build environment options
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Copy package management files
COPY package.json yarn.lock .yarnrc.yml ./

# Install all dependencies (ensuring devDependencies are installed for build)
RUN yarn install

# Copy application code
COPY . .

# Ensure environment file is available for build
RUN test -f .env || cp .env.example .env

# Build the Next.js application
RUN yarn build

# Expose port (default 3000)
EXPOSE 3000

# Start server on dynamic port
CMD ["sh", "-c", "yarn start -p ${PORT:-3000}"]
