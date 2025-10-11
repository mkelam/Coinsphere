# Development Dockerfile for Coinsphere Backend
FROM node:20-slim

# Install OpenSSL, build tools, and other necessary tools for Prisma and native modules
RUN apt-get update -y && \
    apt-get install -y openssl libssl-dev ca-certificates build-essential python3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for development)
# Force rebuild of native modules for Debian (not Alpine)
RUN npm install && npm rebuild bcrypt

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start development server with hot reload
CMD ["npm", "run", "dev"]
