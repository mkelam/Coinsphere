# Coinsphere - Hostinger VPS Deployment Guide

## =€ Complete Deployment Guide for Hostinger VPS

This guide covers deploying the Coinsphere platform (Backend + Frontend + Database) on a Hostinger VPS.

---

## =Ë Prerequisites

### VPS Requirements
- **Hostinger VPS Plan**: KVM 2 or higher recommended
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: Minimum 40GB SSD
- **OS**: Ubuntu 22.04 LTS (recommended)

### Domain Setup
- Domain pointed to VPS IP address
- DNS A record: `your-domain.com` ’ `VPS_IP`
- DNS A record: `www.your-domain.com` ’ `VPS_IP`

---

## =' Step 1: Initial VPS Setup

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

### 1.4 Install Required Software
```bash
# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 15
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib-15

# Install TimescaleDB
sudo apt install -y timescaledb-2-postgresql-15

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx
```

---

## =Ä Step 2: Database Setup

### 2.1 Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE coinsphere;
CREATE USER coinsphere WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE coinsphere TO coinsphere;
\c coinsphere
CREATE EXTENSION IF NOT EXISTS timescaledb;
\q
```

### 2.2 Configure PostgreSQL for Remote Access (if needed)
```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
# Set: listen_addresses = 'localhost'

sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: local   all   coinsphere   md5

sudo systemctl restart postgresql
```

---

## =æ Step 3: Deploy Application

### 3.1 Clone Repository
```bash
cd /home/coinsphere
git clone https://github.com/mkelam/Coinsphere.git
cd Coinsphere
```

### 3.2 Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create production .env file
cat > .env << EOF
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://coinsphere:your-secure-password@localhost:5432/coinsphere

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# APIs
COINGECKO_API_KEY=your-coingecko-api-key

# Redis (optional - for caching)
REDIS_URL=redis://localhost:6379
EOF

# Run database migrations
npx prisma generate
npx prisma migrate deploy

# Seed initial data
npx prisma db seed

# Build (if needed)
npm run build
```

### 3.3 Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create production .env file
cat > .env << EOF
VITE_API_URL=https://api.your-domain.com/api/v1
VITE_WS_URL=wss://api.your-domain.com/api/v1/ws
EOF

# Build for production
npm run build
```

---

## ™ Step 4: PM2 Process Management

### 4.1 Copy PM2 Ecosystem Config
```bash
cp deployment/ecosystem.config.js /home/coinsphere/Coinsphere/
```

### 4.2 Start Applications with PM2
```bash
cd /home/coinsphere/Coinsphere

# Start backend
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs
```

### 4.3 Monitor Applications
```bash
# View logs
pm2 logs

# View status
pm2 status

# Restart apps
pm2 restart all
```

---

## < Step 5: Nginx Configuration

### 5.1 Copy Nginx Config
```bash
sudo cp deployment/nginx.conf /etc/nginx/sites-available/coinsphere
sudo ln -s /etc/nginx/sites-available/coinsphere /etc/nginx/sites-enabled/
```

### 5.2 Test and Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## = Step 6: SSL Certificate (Let's Encrypt)

### 6.1 Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com
```

### 6.2 Auto-Renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot will auto-renew via systemd timer
sudo systemctl status certbot.timer
```

---

## =% Step 7: Firewall Setup

### 7.1 Configure UFW
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## =Ê Step 8: Monitoring & Logging

### 8.1 View Application Logs
```bash
# Backend logs
pm2 logs coinsphere-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### 8.2 PM2 Monitoring
```bash
pm2 monit
```

---

## = Step 9: Deployment Updates

### 9.1 Pull Latest Changes
```bash
cd /home/coinsphere/Coinsphere
git pull origin master
```

### 9.2 Update Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
pm2 restart coinsphere-backend
```

### 9.3 Update Frontend
```bash
cd ../frontend
npm install
npm run build
# Nginx will automatically serve the new build
```

---

## >ê Step 10: Health Checks

### 10.1 Test Endpoints
```bash
# Backend health
curl https://api.your-domain.com/health

# Frontend
curl https://your-domain.com

# WebSocket (use wscat)
npm install -g wscat
wscat -c wss://api.your-domain.com/api/v1/ws
```

### 10.2 Database Health
```bash
sudo -u postgres psql -d coinsphere -c "SELECT version();"
sudo -u postgres psql -d coinsphere -c "SELECT count(*) FROM tokens;"
```

---

## =¨ Troubleshooting

### Backend Not Starting
```bash
pm2 logs coinsphere-backend --err
# Check database connection
# Verify .env variables
```

### Frontend 502 Error
```bash
# Check if PM2 backend is running
pm2 status

# Check Nginx config
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -h localhost -U coinsphere -d coinsphere

# Check PostgreSQL status
sudo systemctl status postgresql
```

### SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate
sudo certbot certificates
```

---

## =È Performance Optimization

### Enable Nginx Caching
Already configured in `deployment/nginx.conf`

### PostgreSQL Tuning
```bash
sudo nano /etc/postgresql/15/main/postgresql.conf

# Recommended settings for 4GB RAM VPS:
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 5MB
min_wal_size = 1GB
max_wal_size = 4GB

sudo systemctl restart postgresql
```

---

## = Security Checklist

-  Firewall (UFW) enabled
-  SSL/TLS certificates installed
-  PostgreSQL password authentication
-  JWT secret key generated
-  Non-root user for deployment
-  Regular security updates
-  SSH key authentication (recommended)
-  Fail2ban (optional but recommended)

---

## <¯ Production URLs

- **Frontend**: https://your-domain.com
- **API**: https://api.your-domain.com
- **WebSocket**: wss://api.your-domain.com/api/v1/ws
- **Health Check**: https://api.your-domain.com/health

---

## =Þ Support

For issues or questions:
- GitHub Issues: https://github.com/mkelam/Coinsphere/issues
- Documentation: See `/Documentation` folder

---

**Deployment completed! Your Coinsphere platform is now live! =€**
