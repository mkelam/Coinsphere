# Coinsphere Docker Deployment Guide - Hostinger VPS

**Created:** 2025-10-11
**VPS Provider:** Hostinger VPS Plan 4 (8GB RAM, 4 cores)
**Deployment Method:** Docker + Docker Compose
**Estimated Time:** 1.5 hours

---

## Why Docker Deployment?

✅ **Simplified Setup** - No manual software installation (Node.js, PostgreSQL, Redis, Python)
✅ **Consistency** - Same environment from development to production
✅ **Easy Updates** - `docker-compose pull && docker-compose up -d`
✅ **Isolated Services** - Each service runs in its own container
✅ **Easy Rollbacks** - Quick revert to previous version
✅ **Resource Management** - Built-in memory/CPU limits

---

## Prerequisites Checklist

- [x] Hostinger VPS purchased (Plan 4: 8GB RAM, 4 cores)
- [x] VPS credentials at: `C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\Hostinger.txt`
- [x] Docker Compose files ready (`docker-compose.prod.yml`)
- [x] Production Dockerfiles ready (`Dockerfile.prod`)
- [ ] Domain registered: coinsphere.app

---

## Deployment Overview - 6 Phases

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Initial VPS Setup | 10 min | ⬜ Pending |
| 2 | Install Docker & Docker Compose | 10 min | ⬜ Pending |
| 3 | Upload Project & Configure | 20 min | ⬜ Pending |
| 4 | Build & Start Containers | 20 min | ⬜ Pending |
| 5 | SSL & Domain Configuration | 20 min | ⬜ Pending |
| 6 | Security & Monitoring | 20 min | ⬜ Pending |

**Total Time:** 1.5 hours (vs 2.5 hours with manual installation)

---

## Phase 1: Initial VPS Setup (10 minutes)

### Step 1.1: Connect to VPS

1. **Open your credentials file:**
   ```
   C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\Hostinger.txt
   ```

2. **Connect via SSH:**
   ```powershell
   ssh root@YOUR_VPS_IP
   # Enter password from Hostinger.txt when prompted
   ```

### Step 1.2: Update System & Create User

```bash
# Update system packages
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git vim nano htop ufw

# Create deploy user
adduser deploy
# Enter password when prompted (SAVE THIS PASSWORD!)

# Add to sudo group
usermod -aG sudo deploy

# Add to docker group (we'll install Docker next)
usermod -aG docker deploy

# Switch to deploy user
su - deploy
cd ~
```

---

## Phase 2: Install Docker & Docker Compose (10 minutes)

### Step 2.1: Install Docker

```bash
# Install Docker's GPG key
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version
docker compose version

# Test Docker (should see "Hello from Docker!")
sudo docker run hello-world
```

**Expected Output:**
```
Docker version 24.0.x
Docker Compose version v2.23.x
Hello from Docker!
```

### Step 2.2: Configure Docker for Deploy User

```bash
# Add deploy user to docker group (if not already done)
sudo usermod -aG docker deploy

# Apply group membership (logout and login, or use newgrp)
newgrp docker

# Verify deploy user can run docker
docker ps
# Should show empty list (no permission denied error)
```

---

## Phase 3: Upload Project & Configure (20 minutes)

### Step 3.1: Create Project Directory

```bash
# Create application directory
sudo mkdir -p /var/www/coinsphere
sudo chown -R deploy:deploy /var/www/coinsphere
cd /var/www/coinsphere
```

### Step 3.2: Upload Code to VPS

**Choose your preferred method:**

#### **Option A: Git Clone (Recommended)**

```bash
# If you have GitHub repository set up:
git clone https://github.com/YOUR_USERNAME/coinsphere.git .

# Or clone specific branch:
git clone -b master https://github.com/YOUR_USERNAME/coinsphere.git .
```

#### **Option B: WinSCP (Windows GUI)**

1. Download WinSCP: https://winscp.net/
2. Connect to VPS:
   - **Host name:** YOUR_VPS_IP
   - **Port:** 22
   - **User name:** deploy
   - **Password:** (deploy user password)
3. Navigate to `/var/www/coinsphere`
4. Upload these folders/files from your local machine:
   ```
   C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\
   ```
   Upload:
   - `backend/` (entire folder)
   - `frontend/` (entire folder)
   - `ml-service/` (entire folder)
   - `deployment/` (entire folder)
   - `docker-compose.prod.yml`
   - `.env.example`

#### **Option C: SCP Command (Windows PowerShell)**

```powershell
# From your local machine
cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner"

# Create tarball
tar -czf coinsphere.tar.gz backend frontend ml-service deployment docker-compose.prod.yml .env.example

# Upload to VPS
scp coinsphere.tar.gz deploy@YOUR_VPS_IP:/var/www/coinsphere/

# Then on VPS, extract:
cd /var/www/coinsphere
tar -xzf coinsphere.tar.gz
rm coinsphere.tar.gz
```

### Step 3.3: Create Production Environment File

```bash
cd /var/www/coinsphere

# Create .env file from example
cp .env.example .env

# Edit .env file
nano .env
```

**Paste this content (replace placeholders):**

```bash
# Database
POSTGRES_USER=coinsphere
POSTGRES_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
POSTGRES_DB=coinsphere_prod
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD  # Same as POSTGRES_PASSWORD

# JWT Secrets (generate these!)
JWT_SECRET=GENERATE_MIN_48_CHAR_RANDOM_STRING
JWT_REFRESH_SECRET=GENERATE_MIN_48_CHAR_RANDOM_STRING
JWT_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=604800

# API Keys
COINGECKO_API_KEY=your-coingecko-pro-api-key
STRIPE_SECRET_KEY=your-payfast-secret-key
STRIPE_WEBHOOK_SECRET=your-payfast-webhook-secret
PAYFAST_MERCHANT_ID=your-payfast-merchant-id
PAYFAST_MERCHANT_KEY=your-payfast-merchant-key
PAYFAST_PASSPHRASE=your-payfast-passphrase
PAYFAST_SANDBOX=false
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@coinsphere.app

# Frontend URLs
VITE_API_URL=https://api.coinsphere.app/v1
VITE_WS_URL=wss://api.coinsphere.app/v1/ws

# CORS
CORS_ORIGIN=https://coinsphere.app,https://www.coinsphere.app

# ML Service
MODEL_VERSION=v1.0.0
TRAINING_BATCH_SIZE=32
```

**Generate Strong JWT Secrets:**
```bash
# Generate JWT_SECRET
openssl rand -base64 48
# Copy output and paste into .env

# Generate JWT_REFRESH_SECRET
openssl rand -base64 48
# Copy output and paste into .env
```

**Generate Strong Database Password:**
```bash
# Generate random password
openssl rand -base64 32
# Copy output and use for POSTGRES_PASSWORD and DB_PASSWORD
```

Save and exit (Ctrl+X, Y, Enter).

### Step 3.4: Verify File Structure

```bash
cd /var/www/coinsphere

# Check directory structure
tree -L 2 -d

# Or use ls
ls -la
```

**Expected structure:**
```
/var/www/coinsphere/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── Dockerfile.prod
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile.prod
│   └── package.json
├── ml-service/
│   ├── app/
│   ├── scripts/
│   ├── Dockerfile
│   └── requirements.txt
├── deployment/
│   ├── nginx-docker.conf
│   └── ssl/
├── docker-compose.prod.yml
└── .env
```

---

## Phase 4: Build & Start Containers (20 minutes)

### Step 4.1: Fix Backend Dockerfile (Node 22 → Node 20)

Your backend Dockerfile.prod uses Node 22, but your project requires Node 20 LTS. Let's fix this:

```bash
cd /var/www/coinsphere/backend

# Edit Dockerfile.prod
nano Dockerfile.prod
```

**Change line 2:**
```dockerfile
# OLD:
FROM node:22-alpine AS base

# NEW:
FROM node:20-alpine AS base
```

Save and exit (Ctrl+X, Y, Enter).

### Step 4.2: Fix Frontend Dockerfile (Node 22 → Node 20)

```bash
cd /var/www/coinsphere/frontend

# Edit Dockerfile.prod
nano Dockerfile.prod
```

**Change line 2:**
```dockerfile
# OLD:
FROM node:22-alpine AS base

# NEW:
FROM node:20-alpine AS base
```

Save and exit (Ctrl+X, Y, Enter).

### Step 4.3: Create Required Directories

```bash
cd /var/www/coinsphere

# Create deployment directories
mkdir -p deployment/ssl
mkdir -p deployment/certbot/conf
mkdir -p deployment/certbot/www
mkdir -p backups

# Create logs directory for backend
mkdir -p backend/logs

# Set permissions
chmod -R 755 deployment
chmod -R 755 backups
```

### Step 4.4: Build Docker Images

```bash
cd /var/www/coinsphere

# Build all images (this will take 10-15 minutes)
docker compose -f docker-compose.prod.yml build --no-cache

# Monitor build progress
# You'll see output for:
# - Backend build (installing npm packages, compiling TypeScript)
# - Frontend build (installing npm packages, running Vite build)
# - ML service build (installing Python packages)
```

**Expected Output:**
```
[+] Building 850.5s (45/45) FINISHED
 => [backend internal] load build definition
 => [backend] building...
 => [frontend internal] load build definition
 => [frontend] building...
 => [ml-service internal] load build definition
 => [ml-service] building...
Successfully built!
```

### Step 4.5: Start Database First (For Migrations)

```bash
# Start PostgreSQL and Redis first
docker compose -f docker-compose.prod.yml up -d postgres redis

# Wait for services to be healthy (30 seconds)
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs postgres
docker compose -f docker-compose.prod.yml logs redis
```

**Expected Output:**
```
NAME                    STATUS              PORTS
coinsphere-postgres     Up (healthy)        5432/tcp
coinsphere-redis        Up (healthy)        6379/tcp
```

### Step 4.6: Run Database Migrations

```bash
# Run migrations using backend container
docker compose -f docker-compose.prod.yml run --rm backend sh -c "npx prisma migrate deploy"

# Seed database with tokens and DeFi protocols
docker compose -f docker-compose.prod.yml run --rm backend sh -c "npm run seed"
```

**Expected Output:**
```
✓ Migrations applied successfully (10 migrations)
✓ Seeded 31 tokens
✓ Seeded 10 DeFi protocols
```

### Step 4.7: Start All Services

```bash
# Start all remaining services
docker compose -f docker-compose.prod.yml up -d

# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f --tail=50
```

**Expected Output:**
```
NAME                    STATUS              PORTS
coinsphere-postgres     Up (healthy)        5432/tcp
coinsphere-redis        Up (healthy)        6379/tcp
coinsphere-backend      Up (healthy)        3001/tcp
coinsphere-frontend     Up (healthy)        80/tcp
coinsphere-nginx        Up (healthy)        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### Step 4.8: Verify Services

```bash
# Test backend health
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":"..."}

# Test nginx (should proxy to frontend)
curl http://localhost:80
# Expected: HTML content from frontend

# Check Docker stats
docker stats --no-stream
```

**Expected Docker Stats:**
```
CONTAINER              CPU %   MEM USAGE / LIMIT     MEM %
coinsphere-postgres    1.5%    150MB / 8GB          1.88%
coinsphere-redis       0.5%    30MB / 8GB           0.38%
coinsphere-backend     3.0%    250MB / 8GB          3.13%
coinsphere-frontend    0.2%    10MB / 8GB           0.13%
coinsphere-nginx       0.3%    8MB / 8GB            0.10%
```

---

## Phase 5: SSL & Domain Configuration (20 minutes)

### Step 5.1: Configure DNS Records

1. **Log into your domain registrar** (e.g., Namecheap, GoDaddy)
2. **Find DNS settings** for `coinsphere.app`
3. **Add A records:**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_VPS_IP | 3600 |
| A | www | YOUR_VPS_IP | 3600 |
| A | api | YOUR_VPS_IP | 3600 |

4. **Save changes** and wait 5-10 minutes for propagation

### Step 5.2: Verify DNS Propagation

```bash
# Check DNS from VPS
nslookup coinsphere.app
nslookup www.coinsphere.app
nslookup api.coinsphere.app

# Should all resolve to YOUR_VPS_IP
```

**Or use online tool:** https://dnschecker.org

### Step 5.3: Obtain SSL Certificates (Let's Encrypt)

```bash
cd /var/www/coinsphere

# Stop nginx temporarily
docker compose -f docker-compose.prod.yml stop nginx

# Install Certbot on host (not in container)
sudo apt install -y certbot

# Obtain certificates
sudo certbot certonly --standalone \
  -d coinsphere.app \
  -d www.coinsphere.app \
  -d api.coinsphere.app \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive

# Certificates will be saved at:
# /etc/letsencrypt/live/coinsphere.app/fullchain.pem
# /etc/letsencrypt/live/coinsphere.app/privkey.pem
```

**Expected Output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/coinsphere.app/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/coinsphere.app/privkey.pem
```

### Step 5.4: Copy SSL Certificates for Docker

```bash
# Copy certificates to deployment directory
sudo cp /etc/letsencrypt/live/coinsphere.app/fullchain.pem /var/www/coinsphere/deployment/ssl/
sudo cp /etc/letsencrypt/live/coinsphere.app/privkey.pem /var/www/coinsphere/deployment/ssl/

# Set permissions
sudo chown -R deploy:deploy /var/www/coinsphere/deployment/ssl
chmod 600 /var/www/coinsphere/deployment/ssl/*.pem
```

### Step 5.5: Update Nginx Configuration for SSL

```bash
cd /var/www/coinsphere/deployment

# Check if nginx-docker.conf exists
ls -la nginx-docker.conf
```

If the file doesn't exist, let's create it:

```bash
nano nginx-docker.conf
```

**Paste this complete Nginx configuration:**

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=ml_limit:10m rate=20r/m;

    # Upstream services
    upstream backend {
        server backend:3001 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream frontend {
        server frontend:80 max_fails=3 fail_timeout=30s;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        listen [::]:80;
        server_name coinsphere.app www.coinsphere.app api.coinsphere.app;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Frontend - coinsphere.app and www.coinsphere.app
    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name coinsphere.app www.coinsphere.app;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Backend API - api.coinsphere.app
    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name api.coinsphere.app;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;

        location /v1/ {
            proxy_pass http://backend/api/v1/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # WebSocket support
        location /v1/ws {
            proxy_pass http://backend/api/v1/ws;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400;
        }

        # Health check
        location /health {
            access_log off;
            proxy_pass http://backend/health;
        }
    }
}
```

Save and exit (Ctrl+X, Y, Enter).

### Step 5.6: Restart Nginx with SSL

```bash
cd /var/www/coinsphere

# Restart nginx container
docker compose -f docker-compose.prod.yml restart nginx

# Check nginx logs
docker compose -f docker-compose.prod.yml logs nginx --tail=50
```

### Step 5.7: Set Up SSL Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job for auto-renewal
sudo crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * certbot renew --quiet --deploy-hook "docker compose -f /var/www/coinsphere/docker-compose.prod.yml restart nginx"
```

---

## Phase 6: Security & Monitoring (20 minutes)

### Step 6.1: Configure UFW Firewall

```bash
# Enable firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Verify rules
sudo ufw status verbose
```

**Expected Output:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### Step 6.2: Install Fail2Ban

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create jail configuration
sudo nano /etc/fail2ban/jail.local
```

**Paste this content:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
```

Save and restart:
```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status
```

### Step 6.3: Set Up Automated Backups

```bash
# Create backup script
sudo nano /usr/local/bin/coinsphere-backup.sh
```

**Paste this script:**
```bash
#!/bin/bash
# Coinsphere Docker Backup Script

BACKUP_DIR="/var/www/coinsphere/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
docker exec coinsphere-postgres pg_dump -U coinsphere coinsphere_prod | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup volumes
docker run --rm \
  -v coinsphere_postgres_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/postgres_volume_$DATE.tar.gz -C /data .

docker run --rm \
  -v coinsphere_redis_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/redis_volume_$DATE.tar.gz -C /data .

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable and schedule:
```bash
sudo chmod +x /usr/local/bin/coinsphere-backup.sh

# Test backup
sudo /usr/local/bin/coinsphere-backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e

# Add this line:
0 2 * * * /usr/local/bin/coinsphere-backup.sh >> /var/log/coinsphere-backup.log 2>&1
```

### Step 6.4: Set Up Log Rotation

```bash
# Docker automatically rotates logs, but let's configure it
sudo nano /etc/docker/daemon.json
```

**Paste this content:**
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:
```bash
sudo systemctl restart docker

# Restart all containers
cd /var/www/coinsphere
docker compose -f docker-compose.prod.yml restart
```

### Step 6.5: Set Up Docker Monitoring

```bash
# Install ctop (Docker container monitoring)
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop

# Run ctop to see real-time container stats
ctop
# Press 'q' to quit
```

---

## Deployment Verification Checklist

### ✅ Infrastructure Checks

```bash
cd /var/www/coinsphere

# Check all containers
docker compose -f docker-compose.prod.yml ps

# Check container health
docker compose -f docker-compose.prod.yml ps --all

# Check resource usage
docker stats --no-stream
```

**Expected Output:**
```
NAME                  STATUS              HEALTH
coinsphere-postgres   Up 10 minutes       healthy
coinsphere-redis      Up 10 minutes       healthy
coinsphere-backend    Up 10 minutes       healthy
coinsphere-frontend   Up 10 minutes       healthy
coinsphere-nginx      Up 10 minutes       healthy
```

### ✅ Application Checks

```bash
# Test backend (from VPS)
curl http://localhost:3001/health
# Expected: {"status":"ok"}

# Test frontend (from VPS)
curl http://localhost:80
# Expected: HTML content

# Test SSL (from VPS)
curl -I https://api.coinsphere.app/v1/health
# Expected: 200 OK with SSL headers
```

**From your local machine (browser):**
- [ ] https://coinsphere.app loads successfully
- [ ] No SSL certificate errors
- [ ] Console shows no errors (F12)
- [ ] https://api.coinsphere.app/v1/health returns `{"status":"ok"}`

### ✅ Database Checks

```bash
# Connect to database
docker exec -it coinsphere-postgres psql -U coinsphere -d coinsphere_prod

# Check tokens
SELECT COUNT(*) FROM tokens;
-- Should return 31

# Check DeFi protocols
SELECT COUNT(*) FROM defi_protocols;
-- Should return 10

# Exit
\q
```

### ✅ Security Checks

```bash
# Check firewall
sudo ufw status

# Check Fail2Ban
sudo fail2ban-client status

# Check SSL certificate expiry
sudo certbot certificates
```

---

## Common Docker Commands

### Container Management
```bash
cd /var/www/coinsphere

# View all containers
docker compose -f docker-compose.prod.yml ps

# View logs (all services)
docker compose -f docker-compose.prod.yml logs -f

# View logs (specific service)
docker compose -f docker-compose.prod.yml logs -f backend

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Stop all services
docker compose -f docker-compose.prod.yml stop

# Start all services
docker compose -f docker-compose.prod.yml start

# Rebuild and restart specific service
docker compose -f docker-compose.prod.yml up -d --build backend
```

### Database Operations
```bash
# Access PostgreSQL
docker exec -it coinsphere-postgres psql -U coinsphere -d coinsphere_prod

# Run migrations
docker compose -f docker-compose.prod.yml run --rm backend sh -c "npx prisma migrate deploy"

# Seed database
docker compose -f docker-compose.prod.yml run --rm backend sh -c "npm run seed"

# Backup database
docker exec coinsphere-postgres pg_dump -U coinsphere coinsphere_prod > backup.sql

# Restore database
cat backup.sql | docker exec -i coinsphere-postgres psql -U coinsphere -d coinsphere_prod
```

### Debugging
```bash
# Enter container shell
docker exec -it coinsphere-backend sh

# View container logs
docker logs coinsphere-backend --tail=100 -f

# Inspect container
docker inspect coinsphere-backend

# Check container resource usage
docker stats coinsphere-backend

# View Docker system info
docker system df
docker system info
```

---

## Updating the Application

### Method 1: Pull Latest Code (Git)

```bash
cd /var/www/coinsphere

# Pull latest changes
git pull origin master

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run any new migrations
docker compose -f docker-compose.prod.yml run --rm backend sh -c "npx prisma migrate deploy"
```

### Method 2: Upload New Code (WinSCP)

1. Upload changed files via WinSCP
2. Rebuild affected services:
```bash
cd /var/www/coinsphere

# If backend changed:
docker compose -f docker-compose.prod.yml up -d --build backend

# If frontend changed:
docker compose -f docker-compose.prod.yml up -d --build frontend
```

---

## Troubleshooting

### Issue 1: Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Check if port is in use
sudo netstat -tulpn | grep 3001

# Remove container and recreate
docker compose -f docker-compose.prod.yml rm -f backend
docker compose -f docker-compose.prod.yml up -d backend
```

### Issue 2: Database Connection Error

```bash
# Check if postgres is healthy
docker compose -f docker-compose.prod.yml ps postgres

# Check postgres logs
docker compose -f docker-compose.prod.yml logs postgres

# Restart postgres
docker compose -f docker-compose.prod.yml restart postgres

# Wait for healthy status
docker compose -f docker-compose.prod.yml ps
```

### Issue 3: Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes
# WARNING: This removes all unused containers, networks, images, and volumes

# Or clean selectively:
docker container prune  # Remove stopped containers
docker image prune -a   # Remove unused images
docker volume prune     # Remove unused volumes
```

### Issue 4: SSL Certificate Renewal Failed

```bash
# Manual renewal
sudo certbot renew --force-renewal

# Copy new certificates
sudo cp /etc/letsencrypt/live/coinsphere.app/fullchain.pem /var/www/coinsphere/deployment/ssl/
sudo cp /etc/letsencrypt/live/coinsphere.app/privkey.pem /var/www/coinsphere/deployment/ssl/

# Restart nginx
docker compose -f docker-compose.prod.yml restart nginx
```

---

## Performance Optimization

### 1. Resource Limits

Edit `docker-compose.prod.yml` to add resource limits:

```yaml
services:
  backend:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 2. Enable Docker BuildKit

```bash
# Add to ~/.bashrc or ~/.zshrc
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Reload shell
source ~/.bashrc
```

### 3. Use Docker Compose Profiles (Optional)

For development features (like Adminer):

```yaml
# In docker-compose.prod.yml
adminer:
  profiles: ["debug"]
  # ... rest of config
```

Start without profiles:
```bash
docker compose -f docker-compose.prod.yml up -d
```

Start with debug profile:
```bash
docker compose -f docker-compose.prod.yml --profile debug up -d
```

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check container health
docker compose -f docker-compose.prod.yml ps

# Check resource usage
docker stats --no-stream

# Check disk space
df -h

# Check logs for errors
docker compose -f docker-compose.prod.yml logs --tail=50 | grep -i error
```

### Weekly Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check for Docker updates
sudo apt update
sudo apt list --upgradable | grep docker

# Clean up unused Docker resources
docker system prune --volumes
```

### Monthly Maintenance

```bash
# Review backups
ls -lh /var/www/coinsphere/backups/

# Check SSL certificate expiry
sudo certbot certificates

# Review Fail2Ban bans
sudo fail2ban-client status sshd
```

---

## Cost Summary

**Monthly Costs:**
- **Hostinger VPS Plan 4:** $14.99/month
- **CoinGecko Pro API:** $129/month
- **SendGrid:** $15/month
- **PayFast:** 2.9% + $0.30 per transaction
- **Total Fixed:** ~$159/month

**vs AWS (without Docker):**
- **EC2 + RDS + ElastiCache:** $150-250/month
- **CoinGecko Pro:** $129/month
- **SendGrid:** $15/month
- **Total:** $294-394/month

**Monthly Savings:** $135-235 (46-59% cost reduction)

---

## Next Steps After Deployment

1. **Configure API Keys**
   - Add real CoinGecko Pro API key to `.env`
   - Switch PayFast to live mode
   - Configure SendGrid email templates

2. **Set Up Monitoring**
   - PM2 Plus (if needed): https://app.pm2.io
   - UptimeRobot: https://uptimerobot.com
   - Sentry (error tracking): https://sentry.io

3. **Test All Features**
   - User registration/login
   - Portfolio tracking
   - Price predictions
   - Payment flows (PayFast, Payfast)

4. **Launch**
   - Social media announcement
   - Product Hunt launch
   - Reddit r/CryptoCurrency post

---

## Summary

**Deployment Method:** Docker Compose on Hostinger VPS
**Total Time:** 1.5 hours (vs 2.5 hours manual installation)
**Containers:** 5 (postgres, redis, backend, frontend, nginx)
**SSL:** Let's Encrypt (auto-renewing)
**Backups:** Automated daily backups
**Security:** UFW firewall + Fail2Ban

**Production URLs:**
- **Frontend:** https://coinsphere.app
- **API:** https://api.coinsphere.app/v1

---

**Ready to deploy? Start with Phase 1! 🚀**
