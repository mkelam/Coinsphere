#!/bin/bash

# Coinsphere Docker Deployment Script for Hostinger VPS
# This script automates the deployment of Coinsphere using Docker containers

set -e  # Exit on error

echo "🚀 Coinsphere Docker Deployment Starting..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/coinsphere/Coinsphere"
ENV_FILE="$APP_DIR/.env.production"

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if running as coinsphere user
if [ "$USER" != "coinsphere" ]; then
    print_error "This script must be run as the 'coinsphere' user"
    print_info "Run: su - coinsphere"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    print_info "Please install Docker first: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed"
    print_info "Please install Docker Compose first"
    exit 1
fi

# Navigate to app directory
cd $APP_DIR

# Step 1: Pull latest code
print_info "Pulling latest code from GitHub..."
git fetch origin
git pull origin master
print_success "Code updated"

# Step 2: Check for .env.production file
if [ ! -f "$ENV_FILE" ]; then
    print_error ".env.production file not found"
    print_info "Please create $ENV_FILE with required environment variables"
    print_info "See backend/.env.production.example for reference"
    exit 1
fi

# Step 3: Load environment variables
print_info "Loading environment variables..."
set -a
source $ENV_FILE
set +a
print_success "Environment variables loaded"

# Step 4: Stop existing containers
print_info "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true
print_success "Containers stopped"

# Step 5: Build Docker images
print_info "Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache
print_success "Docker images built"

# Step 6: Run database migrations
print_info "Running database migrations..."
docker-compose -f docker-compose.prod.yml up -d postgres redis
sleep 10  # Wait for PostgreSQL to be ready

# Run migrations using temporary backend container
docker-compose -f docker-compose.prod.yml run --rm backend sh -c "npx prisma migrate deploy && npx prisma db seed"
print_success "Database migrations completed"

# Step 7: Start all services
print_info "Starting all services..."
docker-compose -f docker-compose.prod.yml up -d
print_success "Services started"

# Step 8: Wait for services to be healthy
print_info "Waiting for services to be healthy..."
sleep 15

# Step 9: Health Checks
print_info "Running health checks..."

# Check backend health
BACKEND_HEALTH=$(docker-compose -f docker-compose.prod.yml exec -T backend wget -qO- http://localhost:3001/health 2>/dev/null || echo "fail")
if echo "$BACKEND_HEALTH" | grep -q "ok"; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# Check frontend health
FRONTEND_HEALTH=$(docker-compose -f docker-compose.prod.yml exec -T frontend wget -qO- http://localhost:80/health 2>/dev/null || echo "fail")
if echo "$FRONTEND_HEALTH" | grep -q "healthy"; then
    print_success "Frontend health check passed"
else
    print_warning "Frontend health check failed (this may be normal if using nginx proxy)"
fi

# Check PostgreSQL
POSTGRES_HEALTH=$(docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U coinsphere 2>/dev/null || echo "fail")
if echo "$POSTGRES_HEALTH" | grep -q "accepting connections"; then
    print_success "PostgreSQL health check passed"
else
    print_error "PostgreSQL health check failed"
    exit 1
fi

# Check Redis
REDIS_HEALTH=$(docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping 2>/dev/null || echo "fail")
if echo "$REDIS_HEALTH" | grep -q "PONG"; then
    print_success "Redis health check passed"
else
    print_error "Redis health check failed"
    exit 1
fi

# Step 10: Display status
print_info "Deployment Summary:"
echo ""
docker-compose -f docker-compose.prod.yml ps
echo ""

# Step 11: Display logs (last 20 lines)
print_info "Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20

print_success "🎉 Deployment completed successfully!"
print_info "Frontend: http://your-vps-ip (or https://your-domain.com)"
print_info "API: http://your-vps-ip/api (or https://api.your-domain.com)"
print_info "Health: http://your-vps-ip/api/health"
echo ""
print_info "Useful commands:"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  Restart: docker-compose -f docker-compose.prod.yml restart"
echo "  Stop: docker-compose -f docker-compose.prod.yml down"
echo "  View status: docker-compose -f docker-compose.prod.yml ps"
