#!/bin/bash

# Coinsphere Deployment Script for Hostinger VPS
# Run this script on your VPS to deploy/update the application

set -e  # Exit on error

echo "=€ Coinsphere Deployment Starting..."

# Configuration
APP_DIR="/home/coinsphere/Coinsphere"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN} $1${NC}"
}

print_info() {
    echo -e "${BLUE}9 $1${NC}"
}

print_error() {
    echo -e "${RED} $1${NC}"
}

# Check if running as coinsphere user
if [ "$USER" != "coinsphere" ]; then
    print_error "This script must be run as the 'coinsphere' user"
    print_info "Run: su - coinsphere"
    exit 1
fi

# Navigate to app directory
cd $APP_DIR

# Step 1: Pull latest code
print_info "Pulling latest code from GitHub..."
git fetch origin
git pull origin master
print_success "Code updated"

# Step 2: Update Backend
print_info "Updating backend..."
cd $BACKEND_DIR

# Install dependencies
npm install
print_success "Backend dependencies installed"

# Run database migrations
print_info "Running database migrations..."
npx prisma generate
npx prisma migrate deploy
print_success "Database migrations complete"

# Step 3: Update Frontend
print_info "Building frontend..."
cd $FRONTEND_DIR

# Install dependencies
npm install
print_success "Frontend dependencies installed"

# Build for production
npm run build
print_success "Frontend built successfully"

# Step 4: Restart Backend with PM2
print_info "Restarting backend..."
pm2 restart coinsphere-backend
print_success "Backend restarted"

# Step 5: Reload Nginx (optional)
print_info "Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx
print_success "Nginx reloaded"

# Step 6: Health Checks
print_info "Running health checks..."
sleep 5  # Wait for backend to start

# Check backend health
BACKEND_HEALTH=$(curl -s http://localhost:3001/health | grep -o "ok" || echo "fail")
if [ "$BACKEND_HEALTH" == "ok" ]; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed"
    exit 1
fi

# Step 7: Display status
print_info "Deployment Summary:"
echo ""
pm2 status
echo ""

print_success "<‰ Deployment completed successfully!"
print_info "Frontend: https://your-domain.com"
print_info "API: https://api.your-domain.com"
print_info "Health: https://api.your-domain.com/health"
