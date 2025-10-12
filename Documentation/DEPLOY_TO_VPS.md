# Deploy Coinsphere to Hostinger VPS - Interactive Guide

**Created:** 2025-10-11
**VPS Provider:** Hostinger VPS Plan 4 (8GB RAM, 4 cores)
**Deployment Type:** Production Single-Server
**Estimated Time:** 2.5 hours

---

## Prerequisites Checklist

- [x] Hostinger VPS purchased (VPS Plan 4 recommended)
- [x] Credentials file available at: `C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\Hostinger.txt`
- [x] Local codebase ready (Git status: 11 commits ahead)
- [x] All local services tested and healthy
- [x] Deployment guides created (HOSTINGER_QUICK_START.md)

---

## Deployment Overview

This guide will walk you through deploying Coinsphere to your Hostinger VPS in 8 phases:

1. **Phase 1:** Initial VPS Access (15 min)
2. **Phase 2:** Install Core Software (30 min)
3. **Phase 3:** Database Setup (15 min)
4. **Phase 4:** Deploy Application (45 min)
5. **Phase 5:** PM2 Process Management (15 min)
6. **Phase 6:** Domain Setup (30 min)
7. **Phase 7:** Nginx Configuration (20 min)
8. **Phase 8:** Security & Monitoring (20 min)

**Total Estimated Time:** 2.5 hours

---

## Phase 1: Initial VPS Access (15 minutes)

### Step 1.1: Get Your VPS Credentials

1. Open your credentials file:
   ```
   C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\Hostinger.txt
   ```

2. You should see information like:
   ```
   VPS IP Address: XXX.XXX.XXX.XXX
   Username: root
   Password: XXXXXXXX
   ```

### Step 1.2: Connect to VPS via SSH

**Option A: Using Windows PowerShell (Recommended)**
```powershell
ssh root@YOUR_VPS_IP
# When prompted, enter password from Hostinger.txt
```

**Option B: Using PuTTY (Alternative)**
1. Download PuTTY from https://www.putty.org/
2. Enter VPS IP in "Host Name"
3. Click "Open"
4. Login as: root
5. Enter password

### Step 1.3: First-Time Server Setup

Once connected, run these commands:

```bash
# Update system packages
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git vim nano htop ufw fail2ban

# Set timezone to UTC (recommended for servers)
timedatectl set-timezone UTC

# Check system info
echo "=== System Information ==="
cat /etc/os-release
echo ""
echo "=== CPU Info ==="
lscpu | grep "Model name"
echo ""
echo "=== Memory Info ==="
free -h
echo ""
echo "=== Disk Space ==="
df -h
```

**Expected Output:**
```
System Information:
Ubuntu 22.04 LTS (or similar)

CPU Info:
Model name: Intel(R) Xeon(R) CPU (or AMD equivalent)
4 cores

Memory Info:
Total: 8GB
Available: 7.5GB+

Disk Space:
Total: 200GB NVMe SSD
Available: 190GB+
```

### Step 1.4: Create Deploy User (Security Best Practice)

```bash
# Create deploy user
adduser deploy
# Enter password when prompted (save this password!)

# Add to sudo group
usermod -aG sudo deploy

# Switch to deploy user
su - deploy
```

**Important:** From now on, you'll use the `deploy` user for all operations (not root).

---

## Phase 2: Install Core Software (30 minutes)

### Step 2.1: Install Node.js 20 LTS

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install PM2 globally
sudo npm install -g pm2

# Verify PM2
pm2 --version
```

### Step 2.2: Install Python 3.11

```bash
# Add deadsnakes PPA for Python 3.11
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update

# Install Python 3.11 and pip
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Verify installation
python3.11 --version  # Should show 3.11.x
```

### Step 2.3: Install PostgreSQL 15 + TimescaleDB

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Install PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-contrib-15

# Add TimescaleDB repository
sudo sh -c "echo 'deb https://packagecloud.io/timescale/timescaledb/ubuntu/ $(lsb_release -c -s) main' > /etc/apt/sources.list.d/timescaledb.list"
wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | sudo apt-key add -
sudo apt update

# Install TimescaleDB
sudo apt install -y timescaledb-2-postgresql-15

# Configure TimescaleDB
sudo timescaledb-tune --quiet --yes

# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify installation
sudo -u postgres psql -c "SELECT version();"
```

### Step 2.4: Install Redis 7

```bash
# Add Redis repository
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt update

# Install Redis
sudo apt install -y redis

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify installation
redis-cli ping  # Should return PONG
```

### Step 2.5: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
sudo systemctl status nginx
```

**Checkpoint:** Verify all software installed correctly:
```bash
echo "=== Software Versions ==="
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"
echo "Python: $(python3.11 --version)"
echo "PostgreSQL: $(sudo -u postgres psql -V)"
echo "Redis: $(redis-cli --version)"
echo "Nginx: $(nginx -v 2>&1)"
```

---

## Phase 3: Database Setup (15 minutes)

### Step 3.1: Create Production Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE coinsphere_prod;
CREATE USER coinsphere WITH ENCRYPTED PASSWORD 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE coinsphere_prod TO coinsphere;

# Enable TimescaleDB extension
\c coinsphere_prod
CREATE EXTENSION IF NOT EXISTS timescaledb;

# Verify extension
SELECT * FROM pg_extension WHERE extname = 'timescaledb';

# Exit PostgreSQL
\q
```

**Important:** Save the database password you just created! You'll need it for environment variables.

### Step 3.2: Configure PostgreSQL for Remote Access (Optional)

If you want to connect from your local machine for debugging:

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf

# Find and change:
listen_addresses = 'localhost'  # Change to '*' for remote access

# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Add this line at the bottom:
host    coinsphere_prod    coinsphere    0.0.0.0/0    scram-sha-256

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Phase 4: Deploy Application (45 minutes)

### Step 4.1: Prepare Deployment Directory

```bash
# Create application directory
sudo mkdir -p /var/www/coinsphere
sudo chown -R deploy:deploy /var/www/coinsphere

# Navigate to directory
cd /var/www/coinsphere
```

### Step 4.2: Upload Code to VPS

**Option A: Using Git (Recommended if you have GitHub repo)**
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/coinsphere.git .

# Or if using main branch:
git clone -b master https://github.com/YOUR_USERNAME/coinsphere.git .
```

**Option B: Using WinSCP (Windows GUI)**
1. Download WinSCP: https://winscp.net/
2. Connect to your VPS:
   - Host name: YOUR_VPS_IP
   - User name: deploy
   - Password: (deploy user password)
3. Navigate to `/var/www/coinsphere`
4. Upload entire project folder from your local machine:
   ```
   C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\
   ```
5. Upload these folders:
   - `backend/`
   - `frontend/`
   - `ml-service/`
   - `Documentation/`
   - `package.json`
   - `README.md`

**Option C: Using SCP (Command Line)**
```powershell
# From your Windows machine (PowerShell)
cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner"

# Upload backend
scp -r backend deploy@YOUR_VPS_IP:/var/www/coinsphere/

# Upload frontend
scp -r frontend deploy@YOUR_VPS_IP:/var/www/coinsphere/

# Upload ml-service
scp -r ml-service deploy@YOUR_VPS_IP:/var/www/coinsphere/
```

### Step 4.3: Install Backend Dependencies

```bash
cd /var/www/coinsphere/backend

# Install Node.js dependencies
npm install --production

# Verify installation
ls -la node_modules/  # Should see many packages
```

### Step 4.4: Configure Backend Environment Variables

```bash
# Create .env file
nano .env
```

Paste this content (replace placeholders):
```bash
# Environment
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://coinsphere:YOUR_DB_PASSWORD@localhost:5432/coinsphere_prod

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (GENERATE NEW ONES!)
JWT_SECRET=GENERATE_A_LONG_RANDOM_STRING_MIN_32_CHARS
JWT_REFRESH_SECRET=GENERATE_ANOTHER_LONG_RANDOM_STRING_MIN_32_CHARS
JWT_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=604800

# API Keys (add your real keys)
COINGECKO_API_KEY=your-coingecko-api-key
STRIPE_SECRET_KEY=your-payfast-secret-key
STRIPE_WEBHOOK_SECRET=your-payfast-webhook-secret

# Payfast (Internationaln payments)
PAYFAST_MERCHANT_ID=your-merchant-id
PAYFAST_MERCHANT_KEY=your-merchant-key
PAYFAST_PASSPHRASE=your-passphrase
PAYFAST_SANDBOX=false

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@coinsphere.app

# CORS
CORS_ORIGIN=https://coinsphere.app,https://www.coinsphere.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate JWT Secrets:**
```bash
# Generate random secrets
openssl rand -base64 48
# Copy output for JWT_SECRET

openssl rand -base64 48
# Copy output for JWT_REFRESH_SECRET
```

Save and exit (Ctrl+X, Y, Enter).

### Step 4.5: Run Database Migrations

```bash
cd /var/www/coinsphere/backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database with tokens and DeFi protocols
npm run seed

# Verify database
npx prisma db pull
```

**Expected Output:**
```
✓ Migrations applied successfully
✓ Seeded 31 tokens
✓ Seeded 10 DeFi protocols
```

### Step 4.6: Build Backend

```bash
cd /var/www/coinsphere/backend

# Compile TypeScript
npm run build

# Verify build
ls -la dist/  # Should see compiled JavaScript files
```

### Step 4.7: Install Frontend Dependencies

```bash
cd /var/www/coinsphere/frontend

# Install dependencies
npm install

# Verify installation
ls -la node_modules/
```

### Step 4.8: Configure Frontend Environment Variables

```bash
# Create .env file
nano .env
```

Paste this content:
```bash
VITE_API_BASE_URL=https://api.coinsphere.app/v1
VITE_WS_URL=wss://api.coinsphere.app/v1/ws
VITE_APP_NAME=Coinsphere
VITE_APP_VERSION=0.1.0
```

Save and exit.

### Step 4.9: Build Frontend

```bash
cd /var/www/coinsphere/frontend

# Build for production
npm run build

# Verify build
ls -la dist/  # Should see index.html, assets/, etc.
```

### Step 4.10: Install ML Service Dependencies

```bash
cd /var/www/coinsphere/ml-service

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
pip list
```

### Step 4.11: Configure ML Service Environment Variables

```bash
# Create .env file
nano .env
```

Paste this content:
```bash
DATABASE_URL=postgresql://coinsphere:YOUR_DB_PASSWORD@localhost:5432/coinsphere_prod
MODEL_VERSION=v1.0.0
TRAINING_BATCH_SIZE=32
MLFLOW_TRACKING_URI=http://localhost:5000
```

Save and exit.

---

## Phase 5: PM2 Process Management (15 minutes)

### Step 5.1: Create PM2 Ecosystem File

```bash
cd /var/www/coinsphere

# Create ecosystem.config.js
nano ecosystem.config.js
```

Paste this content:
```javascript
module.exports = {
  apps: [
    {
      name: 'coinsphere-backend',
      script: './backend/dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/www/coinsphere/logs/backend-error.log',
      out_file: '/var/www/coinsphere/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      restart_delay: 4000
    },
    {
      name: 'coinsphere-ml',
      script: './ml-service/venv/bin/uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000 --workers 2',
      cwd: '/var/www/coinsphere/ml-service',
      instances: 1,
      exec_mode: 'fork',
      env: {
        PYTHONPATH: '/var/www/coinsphere/ml-service'
      },
      error_file: '/var/www/coinsphere/logs/ml-error.log',
      out_file: '/var/www/coinsphere/logs/ml-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '2G',
      restart_delay: 4000
    }
  ]
};
```

Save and exit.

### Step 5.2: Create Logs Directory

```bash
mkdir -p /var/www/coinsphere/logs
```

### Step 5.3: Start Services with PM2

```bash
cd /var/www/coinsphere

# Start all services
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Save PM2 configuration
pm2 save

# Enable PM2 to start on boot
pm2 startup
# Copy and run the command it outputs
```

**Expected Output:**
```
┌─────┬────────────────────────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name                   │ mode    │ status  │ cpu     │ memory   │
├─────┼────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ coinsphere-backend     │ cluster │ online  │ 5%      │ 120 MB   │
│ 1   │ coinsphere-backend     │ cluster │ online  │ 5%      │ 115 MB   │
│ 2   │ coinsphere-ml          │ fork    │ online  │ 10%     │ 350 MB   │
└─────┴────────────────────────┴─────────┴─────────┴─────────┴──────────┘
```

### Step 5.4: Test Backend API

```bash
# Test health endpoint
curl http://localhost:3001/health

# Expected output:
# {"status":"ok","timestamp":"2025-10-11T..."}
```

### Step 5.5: Test ML Service

```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected output:
# {"status":"healthy","service":"coinsphere-ml"}
```

---

## Phase 6: Domain Setup (30 minutes)

### Step 6.1: Configure DNS Records

1. Log into your domain registrar (e.g., Namecheap, GoDaddy)
2. Find DNS settings for `coinsphere.app`
3. Add these A records:

| Type | Host | Value (Points to) | TTL |
|------|------|-------------------|-----|
| A | @ | YOUR_VPS_IP | 3600 |
| A | www | YOUR_VPS_IP | 3600 |
| A | api | YOUR_VPS_IP | 3600 |

4. Save DNS records
5. Wait 5-10 minutes for DNS propagation

### Step 6.2: Verify DNS Propagation

```bash
# Check DNS resolution (from your VPS)
nslookup coinsphere.app
nslookup www.coinsphere.app
nslookup api.coinsphere.app

# Or use online tool:
# https://dnschecker.org
```

### Step 6.3: Install Certbot (Let's Encrypt SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Stop Nginx temporarily
sudo systemctl stop nginx

# Generate SSL certificates
sudo certbot certonly --standalone -d coinsphere.app -d www.coinsphere.app -d api.coinsphere.app

# When prompted:
# - Enter email address
# - Agree to Terms of Service (Y)
# - Share email with EFF (optional - N)

# Restart Nginx
sudo systemctl start nginx
```

**Expected Output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/coinsphere.app/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/coinsphere.app/privkey.pem
```

### Step 6.4: Set Up Auto-Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run

# Enable auto-renewal (runs twice daily)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Phase 7: Nginx Configuration (20 minutes)

### Step 7.1: Create Nginx Configuration

```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/coinsphere
```

Paste this complete Nginx configuration:
```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=ml_limit:10m rate=20r/m;

# Upstream backend servers
upstream backend {
    least_conn;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# Upstream ML service
upstream ml_service {
    server 127.0.0.1:8000 max_fails=3 fail_timeout=30s;
    keepalive 16;
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

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/coinsphere.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coinsphere.app/privkey.pem;
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

    # Frontend static files
    root /var/www/coinsphere/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React Router - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# Backend API - api.coinsphere.app
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.coinsphere.app;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/coinsphere.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coinsphere.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req zone=api_limit burst=20 nodelay;

    # API endpoints
    location /v1/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /v1/ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # ML predictions endpoint
    location /v1/predictions {
        limit_req zone=ml_limit burst=5 nodelay;
        proxy_pass http://ml_service;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # Health check
    location /health {
        access_log off;
        proxy_pass http://backend;
    }
}
```

Save and exit (Ctrl+X, Y, Enter).

### Step 7.2: Enable Site Configuration

```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/coinsphere /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Expected output:
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Reload Nginx
sudo systemctl reload nginx
```

### Step 7.3: Verify Nginx is Running

```bash
sudo systemctl status nginx

# Check listening ports
sudo netstat -tulpn | grep nginx
```

---

## Phase 8: Security & Monitoring (20 minutes)

### Step 8.1: Configure UFW Firewall

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verify firewall rules
sudo ufw status verbose

# Expected output:
# 22/tcp    ALLOW   Anywhere (SSH)
# 80/tcp    ALLOW   Anywhere (HTTP)
# 443/tcp   ALLOW   Anywhere (HTTPS)
```

### Step 8.2: Configure Fail2Ban

```bash
# Create jail configuration for Nginx
sudo nano /etc/fail2ban/jail.local
```

Paste this content:
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

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
```

Save and exit.

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status
```

### Step 8.3: Set Up Automated Backups

```bash
# Create backup script
sudo nano /usr/local/bin/coinsphere-backup.sh
```

Paste this backup script:
```bash
#!/bin/bash
# Coinsphere Automated Backup Script

BACKUP_DIR="/var/backups/coinsphere"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="coinsphere_prod"
DB_USER="coinsphere"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
PGPASSWORD="YOUR_DB_PASSWORD" pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup application code
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /var/www/coinsphere/backend /var/www/coinsphere/frontend /var/www/coinsphere/ml-service

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable and schedule:
```bash
# Make script executable
sudo chmod +x /usr/local/bin/coinsphere-backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e

# Add this line:
0 2 * * * /usr/local/bin/coinsphere-backup.sh >> /var/log/coinsphere-backup.log 2>&1
```

### Step 8.4: Set Up Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/coinsphere
```

Paste this content:
```
/var/www/coinsphere/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

Save and exit.

### Step 8.5: Set Up Monitoring with PM2 Plus (Optional)

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Link to PM2 Plus (free monitoring)
# Visit: https://app.pm2.io
# Create free account
# Get public/private keys

pm2 link YOUR_PUBLIC_KEY YOUR_PRIVATE_KEY
```

---

## Deployment Verification Checklist

After completing all phases, verify everything is working:

### ✅ Infrastructure Checks

```bash
# Check all services are running
sudo systemctl status postgresql
sudo systemctl status redis-server
sudo systemctl status nginx
pm2 status

# Check disk space
df -h

# Check memory usage
free -h

# Check listening ports
sudo netstat -tulpn | grep LISTEN
# Should see: 80, 443 (nginx), 3001 (backend), 8000 (ML), 5432 (postgres), 6379 (redis)
```

### ✅ API Endpoint Checks

```bash
# Test backend health (from VPS)
curl http://localhost:3001/health

# Test ML service health
curl http://localhost:8000/health

# Test public HTTPS endpoints (from your local machine)
curl https://api.coinsphere.app/v1/health
curl https://coinsphere.app/health
```

### ✅ Frontend Checks

1. Open browser and visit: https://coinsphere.app
2. Verify homepage loads correctly
3. Check browser console for errors (F12)
4. Test registration/login flow

### ✅ Database Checks

```bash
# Connect to database
sudo -u postgres psql coinsphere_prod

# Check tokens
SELECT COUNT(*) FROM tokens;
# Should return 31

# Check DeFi protocols
SELECT COUNT(*) FROM defi_protocols;
# Should return 10

# Exit
\q
```

### ✅ Security Checks

```bash
# Verify SSL certificate
curl -I https://coinsphere.app | grep -i strict-transport

# Check firewall status
sudo ufw status

# Check Fail2Ban
sudo fail2ban-client status
```

---

## Troubleshooting Common Issues

### Issue 1: Nginx 502 Bad Gateway

**Cause:** Backend service not running or wrong port

**Fix:**
```bash
# Check PM2 status
pm2 status

# Restart backend
pm2 restart coinsphere-backend

# Check logs
pm2 logs coinsphere-backend --lines 50
```

### Issue 2: SSL Certificate Error

**Cause:** Certificate not properly installed or DNS not propagated

**Fix:**
```bash
# Verify DNS resolution
nslookup coinsphere.app

# Regenerate certificate
sudo certbot certonly --standalone -d coinsphere.app -d www.coinsphere.app -d api.coinsphere.app --force-renewal

# Reload Nginx
sudo systemctl reload nginx
```

### Issue 3: Database Connection Refused

**Cause:** PostgreSQL not running or wrong credentials

**Fix:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart if needed
sudo systemctl restart postgresql

# Verify connection
sudo -u postgres psql coinsphere_prod
```

### Issue 4: PM2 Process Keeps Crashing

**Cause:** Application error or memory leak

**Fix:**
```bash
# Check error logs
pm2 logs coinsphere-backend --err --lines 100

# Increase memory limit in ecosystem.config.js
nano /var/www/coinsphere/ecosystem.config.js
# Change: max_memory_restart: '2G'

# Restart PM2
pm2 restart all
```

---

## Performance Optimization Tips

### 1. Enable Redis Caching Aggressively
- Backend already has caching middleware (30s for tokens, 60s for history)
- Increase TTL for rarely-changing data

### 2. Database Indexing
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_tokens_symbol ON tokens(symbol);
CREATE INDEX idx_price_data_token_time ON price_data(token_id, time DESC);
```

### 3. PM2 Cluster Mode
- Already configured for 2 backend instances
- Can increase to 4 instances if needed (ecosystem.config.js: `instances: 4`)

### 4. Nginx Caching
- Add proxy caching for static API responses
- Configure browser caching for frontend assets (already configured)

---

## Next Steps After Deployment

### 1. Set Up Monitoring Dashboard
- PM2 Plus (free tier): https://app.pm2.io
- UptimeRobot (free uptime monitoring): https://uptimerobot.com

### 2. Configure API Keys
- CoinGecko Pro API
- PayFast live keys
- SendGrid API key

### 3. Test Payment Flows
- PayFast test mode → Live mode
- Payfast sandbox → Production

### 4. Set Up Analytics
- Google Analytics
- Mixpanel (optional)

### 5. Configure Email Templates
- Welcome email
- Password reset
- Price alerts
- Subscription confirmations

---

## Maintenance Commands Reference

### Daily Operations
```bash
# Check application status
pm2 status
pm2 logs --lines 20

# Check system health
htop  # Press F10 to exit
df -h
free -h

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Weekly Maintenance
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart services (low traffic time)
pm2 restart all
sudo systemctl restart nginx
```

### Monthly Maintenance
```bash
# Check disk usage and clean
sudo apt autoremove -y
sudo apt autoclean

# Review logs
journalctl --vacuum-time=30d

# Verify backups
ls -lh /var/backups/coinsphere/
```

---

## Support & Documentation

### Key Documentation Files
- [HOSTINGER_QUICK_START.md](Documentation/HOSTINGER_QUICK_START.md) - Quick start guide
- [PRODUCTION_READINESS_ASSESSMENT.md](Documentation/PRODUCTION_READINESS_ASSESSMENT.md) - Production checklist
- [System Architecture Document.md](Documentation/System Architecture Document.md) - Architecture details
- [API_SPECIFICATION.md](Documentation/API_SPECIFICATION.md) - API endpoints reference

### External Resources
- **PM2 Documentation:** https://pm2.keymetrics.io/docs/usage/quick-start/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/docs/
- **PostgreSQL Tuning:** https://pgtune.leopard.in.ua/

### Emergency Contacts
- **Hostinger Support:** 24/7 live chat
- **PM2 Community:** https://github.com/Unitech/pm2/issues

---

## Summary

**Deployment Status:** Ready to begin Phase 1

**Estimated Total Time:** 2.5 hours

**Cost Savings vs AWS:** 90% ($135-235/month saved)

**Next Action:** Connect to VPS via SSH and begin Phase 1

---

**Good luck with your deployment! 🚀**

Once you complete all 8 phases, your Coinsphere application will be live at:
- **Frontend:** https://coinsphere.app
- **API:** https://api.coinsphere.app/v1
- **API Docs:** https://api.coinsphere.app/v1/docs
