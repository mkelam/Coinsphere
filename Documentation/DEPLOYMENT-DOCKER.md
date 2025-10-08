# Coinsphere - Docker Deployment Guide for Hostinger VPS

## 🚀 Complete Docker Deployment Guide for Hostinger VPS

This guide covers deploying the Coinsphere platform using Docker containers on a Hostinger VPS.

**Why Docker?**
- ✅ Consistent environment across development and production
- ✅ Easy scaling and updates
- ✅ Simplified dependency management
- ✅ Container isolation for better security
- ✅ Simple rollback capabilities
- ✅ Zero-downtime deployments

---

## 📋 Prerequisites

### VPS Requirements
- **Hostinger VPS Plan**: KVM 2 or higher recommended
- **RAM**: Minimum 4GB (8GB recommended for production)
- **Storage**: Minimum 40GB SSD
- **OS**: Ubuntu 22.04 LTS (recommended)
- **Docker**: Version 24.0+
- **Docker Compose**: Version 2.20+

### Domain Setup
- Domain pointed to VPS IP address
- DNS A record: `your-domain.com` → `VPS_IP`
- DNS A record: `www.your-domain.com` → `VPS_IP`
- DNS A record: `api.your-domain.com` → `VPS_IP` (recommended)

---

## 🔧 Step 1: Initial VPS Setup

### 1.1 Connect to VPS
```bash
ssh root@your-vps-ip
```

### 1.2 Update System
```bash
apt update && apt upgrade -y
```

### 1.3 Create Deploy User
```bash
adduser coinsphere
usermod -aG sudo coinsphere
su - coinsphere
```

### 1.4 Install Docker
```bash
# Remove old Docker versions (if any)
sudo apt remove docker docker-engine docker.io containerd runc

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker coinsphere

# Log out and back in for group changes to take effect
exit
su - coinsphere

# Verify Docker installation
docker --version
docker run hello-world
```

### 1.5 Install Docker Compose
```bash
# Docker Compose v2 is included with Docker Desktop
# Verify installation
docker compose version

# If not installed, install manually
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### 1.6 Install Git
```bash
sudo apt install -y git
```

---

## 📦 Step 2: Clone Repository

### 2.1 Clone from GitHub
```bash
cd /home/coinsphere
git clone https://github.com/mkelam/Coinsphere.git
cd Coinsphere
```

### 2.2 Set Up SSH Keys (for future deployments)
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Add this key to your GitHub account (Settings → SSH Keys)
```

---

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Create Production Environment File
```bash
cd /home/coinsphere/Coinsphere
cp .env.production.example .env.production
nano .env.production
```

### 3.2 Fill in Required Variables
```bash
# Database Configuration
DB_PASSWORD=your-super-secure-database-password-change-me

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secure-jwt-secret-min-32-characters

# CoinGecko API
COINGECKO_API_KEY=your-coingecko-api-key

# Frontend URLs (replace with your actual domain)
VITE_API_URL=https://api.your-domain.com/api/v1
VITE_WS_URL=wss://api.your-domain.com/api/v1/ws

# Node Environment
NODE_ENV=production
```

**Important Security Notes:**
- Never commit `.env.production` to version control
- Use strong passwords (minimum 32 characters)
- Generate JWT secret with: `openssl rand -base64 32`
- Get CoinGecko API key from: https://www.coingecko.com/api

---

## 🐳 Step 4: Build and Deploy with Docker

### 4.1 Build Docker Images
```bash
cd /home/coinsphere/Coinsphere

# Build all images
docker-compose -f docker-compose.prod.yml build
```

### 4.2 Start Database First
```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Wait for database to be ready (about 10 seconds)
sleep 10
```

### 4.3 Run Database Migrations
```bash
# Run migrations using temporary backend container
docker-compose -f docker-compose.prod.yml run --rm backend sh -c "npx prisma migrate deploy"

# Seed initial data
docker-compose -f docker-compose.prod.yml run --rm backend sh -c "npx prisma db seed"
```

### 4.4 Start All Services
```bash
# Start all containers
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4.5 Verify Services are Running
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Should show all containers as "Up" and healthy
```

---

## 🔒 Step 5: SSL Certificate (Let's Encrypt)

### 5.1 Install Certbot
```bash
sudo apt install -y certbot
```

### 5.2 Stop Nginx Container Temporarily
```bash
docker-compose -f docker-compose.prod.yml stop nginx
```

### 5.3 Obtain SSL Certificate
```bash
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com -d api.your-domain.com --email your-email@example.com --agree-tos
```

### 5.4 Copy Certificates to Docker Volume
```bash
sudo mkdir -p /home/coinsphere/Coinsphere/deployment/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /home/coinsphere/Coinsphere/deployment/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /home/coinsphere/Coinsphere/deployment/ssl/
sudo chown -R coinsphere:coinsphere /home/coinsphere/Coinsphere/deployment/ssl
```

### 5.5 Update Nginx Configuration
Edit `deployment/nginx-docker.conf` and uncomment SSL lines:

```bash
nano deployment/nginx-docker.conf

# Uncomment these lines:
# listen 443 ssl http2;
# listen [::]:443 ssl http2;
# ssl_certificate /etc/nginx/ssl/fullchain.pem;
# ssl_certificate_key /etc/nginx/ssl/privkey.pem;
```

### 5.6 Restart Nginx
```bash
docker-compose -f docker-compose.prod.yml up -d nginx
```

### 5.7 Auto-Renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job for auto-renewal
sudo crontab -e

# Add this line (runs twice daily):
0 0,12 * * * certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/your-domain.com/*.pem /home/coinsphere/Coinsphere/deployment/ssl/ && docker-compose -f /home/coinsphere/Coinsphere/docker-compose.prod.yml restart nginx"
```

---

## 🔥 Step 6: Firewall Setup

### 6.1 Configure UFW
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 🔍 Step 7: Health Checks & Monitoring

### 7.1 Test Endpoints
```bash
# Backend health
curl http://localhost/api/health

# Frontend health
curl http://localhost/health

# With SSL (after Step 5)
curl https://your-domain.com/health
curl https://api.your-domain.com/health
```

### 7.2 View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f postgres

# Last 50 lines
docker-compose -f docker-compose.prod.yml logs --tail=50
```

### 7.3 Monitor Resource Usage
```bash
# Real-time resource usage
docker stats

# Container status
docker ps -a
```

---

## 🔄 Step 8: Automated Deployment Script

### 8.1 Make Deployment Script Executable
```bash
chmod +x deployment/deploy-docker.sh
```

### 8.2 Run Automated Deployment
```bash
cd /home/coinsphere/Coinsphere
./deployment/deploy-docker.sh
```

The script will:
- Pull latest code from GitHub
- Build new Docker images
- Stop old containers
- Run database migrations
- Start new containers
- Run health checks
- Display deployment status

---

## 📊 Step 9: Database Management

### 9.1 Access PostgreSQL
```bash
# Via Docker
docker-compose -f docker-compose.prod.yml exec postgres psql -U coinsphere -d coinsphere

# Common commands:
\dt              # List tables
\d+ tokens       # Describe tokens table
SELECT * FROM users LIMIT 10;
\q               # Quit
```

### 9.2 Database Backup
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U coinsphere coinsphere > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20250108.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U coinsphere -d coinsphere
```

### 9.3 Redis Management
```bash
# Access Redis CLI
docker-compose -f docker-compose.prod.yml exec redis redis-cli

# Common commands:
PING             # Check connection
KEYS *           # List all keys
GET key_name     # Get value
FLUSHALL         # Clear all data (use with caution!)
```

---

## 🛠️ Step 10: Maintenance & Troubleshooting

### 10.1 Update Application
```bash
cd /home/coinsphere/Coinsphere

# Pull latest code
git pull origin master

# Rebuild and restart (automated)
./deployment/deploy-docker.sh
```

### 10.2 Restart Services
```bash
# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### 10.3 Stop All Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### 10.4 Clean Up Docker Resources
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes (BE CAREFUL!)
docker volume prune

# Remove unused networks
docker network prune

# Complete cleanup
docker system prune -a --volumes
```

### 10.5 Common Issues

#### Backend Not Starting
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Common fixes:
# 1. Check .env.production file
# 2. Verify database connection
# 3. Rebuild image: docker-compose -f docker-compose.prod.yml build backend
```

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Restart database
docker-compose -f docker-compose.prod.yml restart postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

#### Frontend 502 Bad Gateway
```bash
# Check if backend is running
docker-compose -f docker-compose.prod.yml ps backend

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

#### SSL Certificate Issues
```bash
# Check certificate expiry
sudo certbot certificates

# Renew manually
sudo certbot renew

# Copy new certificates
sudo cp /etc/letsencrypt/live/your-domain.com/*.pem /home/coinsphere/Coinsphere/deployment/ssl/
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## 📈 Step 11: Performance Optimization

### 11.1 PostgreSQL Tuning
Edit `docker-compose.prod.yml` and add PostgreSQL environment variables:

```yaml
postgres:
  environment:
    # ... existing vars ...
    POSTGRES_SHARED_BUFFERS: 1GB
    POSTGRES_EFFECTIVE_CACHE_SIZE: 3GB
    POSTGRES_MAINTENANCE_WORK_MEM: 256MB
    POSTGRES_CHECKPOINT_COMPLETION_TARGET: 0.9
    POSTGRES_WAL_BUFFERS: 16MB
```

### 11.2 Redis Memory Limit
```bash
# Edit docker-compose.prod.yml
nano docker-compose.prod.yml

# Add memory limit to redis service:
redis:
  deploy:
    resources:
      limits:
        memory: 256M
```

### 11.3 Container Resource Limits
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

---

## 🔐 Security Checklist

- ✅ Firewall (UFW) enabled
- ✅ SSL/TLS certificates installed
- ✅ Strong database passwords
- ✅ JWT secret generated (32+ characters)
- ✅ Non-root user for deployment
- ✅ Docker containers run as non-root users
- ✅ Regular security updates (`apt update && apt upgrade`)
- ✅ SSH key authentication (disable password auth)
- ✅ Fail2ban (optional but recommended)
- ✅ Regular database backups
- ✅ Environment variables not committed to git

### Install Fail2ban (Recommended)
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🌐 Production URLs

After successful deployment:

- **Frontend**: https://your-domain.com
- **API**: https://api.your-domain.com/api/v1
- **WebSocket**: wss://api.your-domain.com/api/v1/ws
- **Health Check**: https://api.your-domain.com/health

---

## 📚 Useful Docker Commands

```bash
# View all containers
docker ps -a

# View container logs
docker logs coinsphere-backend -f

# Execute command in container
docker exec -it coinsphere-backend sh

# View Docker images
docker images

# Remove container
docker rm coinsphere-backend

# Remove image
docker rmi coinsphere-backend

# View volumes
docker volume ls

# Inspect container
docker inspect coinsphere-backend

# View networks
docker network ls
```

---

## 🆘 Support

For issues or questions:
- **GitHub Issues**: https://github.com/mkelam/Coinsphere/issues
- **Documentation**: See `/Documentation` folder
- **Docker Docs**: https://docs.docker.com
- **Hostinger Support**: https://www.hostinger.com/tutorials/vps

---

## 📝 Quick Reference

### Start Application
```bash
cd /home/coinsphere/Coinsphere
docker-compose -f docker-compose.prod.yml up -d
```

### Stop Application
```bash
docker-compose -f docker-compose.prod.yml down
```

### Update Application
```bash
cd /home/coinsphere/Coinsphere
git pull origin master
./deployment/deploy-docker.sh
```

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Health Check
```bash
curl http://localhost/api/health
```

---

**🎉 Deployment Complete! Your Coinsphere platform is now running in Docker containers on Hostinger VPS!**

For development setup, see [docker-compose.yml](docker-compose.yml) for local Docker development.
