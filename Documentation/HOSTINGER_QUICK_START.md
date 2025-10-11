# Hostinger VPS Quick Start Guide

**Status:** VPS Purchased ✅
**Ready to Deploy:** YES
**Estimated Time:** 4-6 hours

---

## Pre-Deployment Checklist

Before you start, make sure you have:

- ✅ **Hostinger VPS purchased** (DONE!)
- [ ] **VPS IP address** (from Hostinger email)
- [ ] **Root password** (from Hostinger email)
- [ ] **Domain name** (coinsphere.app or similar)
- [ ] **GitHub/Git access** to your repository
- [ ] **SSH client** (Windows Terminal, PuTTY, or Git Bash)

---

## Phase 1: Initial VPS Access (15 minutes)

### Step 1.1: Get Your VPS Credentials

Check your email from Hostinger for:
```
VPS IP Address: xxx.xxx.xxx.xxx
Root Password: [your-password]
SSH Port: 22 (default)
```

### Step 1.2: First Connection

**Option A: Windows Terminal / PowerShell (Recommended)**
```bash
# Connect to your VPS
ssh root@your-vps-ip

# When prompted, type "yes" to accept the fingerprint
# Enter the root password from your email
```

**Option B: PuTTY (Windows)**
1. Download PuTTY from [putty.org](https://www.putty.org)
2. Host Name: your-vps-ip
3. Port: 22
4. Connection type: SSH
5. Click "Open"
6. Login as: root
7. Password: [your-root-password]

**Option C: Git Bash**
```bash
ssh root@your-vps-ip
```

### Step 1.3: Update System (IMPORTANT)

```bash
# Update package lists
apt update

# Upgrade all packages (this may take 5-10 minutes)
apt upgrade -y

# Install essential tools
apt install -y curl wget git vim nano htop
```

### Step 1.4: Create Deploy User (Security Best Practice)

```bash
# Create a new user for deployments
adduser deploy
# Enter password when prompted (use a strong password!)
# Press Enter for all other prompts (can leave blank)

# Add deploy user to sudo group
usermod -aG sudo deploy

# Test the new user
su - deploy

# You should now be logged in as "deploy"
# Type "exit" to go back to root
exit
```

---

## Phase 2: Install Core Software (30 minutes)

### Step 2.1: Install Node.js 20 LTS

```bash
# As root user
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 2.2: Install Python 3.11

```bash
# Add Python repository
add-apt-repository ppa:deadsnakes/ppa -y

# Install Python 3.11
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Verify installation
python3.11 --version  # Should show Python 3.11.x
```

### Step 2.3: Install PostgreSQL 15 + TimescaleDB

```bash
# Install PostgreSQL 15
apt install -y postgresql-15 postgresql-client-15

# Install TimescaleDB
sh -c "echo 'deb https://packagecloud.io/timescale/timescaledb/ubuntu/ $(lsb_release -c -s) main' > /etc/apt/sources.list.d/timescaledb.list"
wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | apt-key add -
apt update
apt install -y timescaledb-2-postgresql-15

# Tune TimescaleDB
timescaledb-tune --quiet --yes

# Restart PostgreSQL
systemctl restart postgresql
systemctl status postgresql  # Should show "active (running)"
```

### Step 2.4: Install Redis

```bash
# Install Redis
apt install -y redis-server

# Edit Redis configuration
nano /etc/redis/redis.conf

# Find and update these lines (use Ctrl+W to search):
# maxmemory 2gb
# maxmemory-policy allkeys-lru
# supervised systemd

# Save and exit (Ctrl+X, then Y, then Enter)

# Restart Redis
systemctl restart redis-server
systemctl enable redis-server
systemctl status redis-server  # Should show "active (running)"
```

### Step 2.5: Install Nginx

```bash
# Install Nginx
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx
systemctl status nginx  # Should show "active (running)"

# Test: Visit http://your-vps-ip in browser
# You should see "Welcome to nginx!" page
```

### Step 2.6: Install PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

### Step 2.7: Install Certbot (SSL Certificates)

```bash
# Install Certbot for Let's Encrypt SSL
apt install -y certbot python3-certbot-nginx
```

---

## Phase 3: Database Setup (15 minutes)

### Step 3.1: Create PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
```

```sql
-- Create production database
CREATE DATABASE coinsphere_prod;

-- Create user with strong password
CREATE USER coinsphere WITH ENCRYPTED PASSWORD 'CHANGE_THIS_TO_STRONG_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE coinsphere_prod TO coinsphere;

-- Connect to the database
\c coinsphere_prod

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Exit PostgreSQL
\q
```

### Step 3.2: Test Database Connection

```bash
# Test connection as coinsphere user
psql -U coinsphere -d coinsphere_prod -h localhost

# If prompted for password, enter the password you set above
# You should see: coinsphere_prod=>

# Exit
\q
```

### Step 3.3: Update PostgreSQL to Allow Local Connections

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Add this line BEFORE the other lines (around line 90):
# local   coinsphere_prod    coinsphere                              md5

# Save and exit (Ctrl+X, Y, Enter)

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Phase 4: Deploy Application (45 minutes)

### Step 4.1: Prepare Application Directory

```bash
# Switch to deploy user
su - deploy

# Create application directory
sudo mkdir -p /var/www/coinsphere
sudo chown -R deploy:deploy /var/www/coinsphere
cd /var/www/coinsphere
```

### Step 4.2: Clone Repository

```bash
# If using GitHub (you'll need to set up SSH key or use HTTPS with token)
# For now, we'll copy from your local machine

# On your LOCAL machine (Windows), open another terminal:
# Navigate to your project
cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner"

# Create a tarball (archive) of your project
tar -czf coinsphere.tar.gz --exclude=node_modules --exclude=.git --exclude=backend/dist --exclude=frontend/dist --exclude=backend/playwright-report --exclude=backend/test-results .

# The file will be created at:
# C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\coinsphere.tar.gz
```

**Now upload to VPS using one of these methods:**

**Method A: Using SCP (from Windows Terminal)**
```bash
# On your LOCAL machine
scp coinsphere.tar.gz deploy@your-vps-ip:/var/www/coinsphere/

# Enter deploy user password when prompted
```

**Method B: Using FileZilla**
1. Download FileZilla from [filezilla-project.org](https://filezilla-project.org)
2. Host: sftp://your-vps-ip
3. Username: deploy
4. Password: [your-deploy-password]
5. Port: 22
6. Upload coinsphere.tar.gz to /var/www/coinsphere/

**Method C: Using WinSCP**
1. Download WinSCP from [winscp.net](https://winscp.net)
2. File protocol: SFTP
3. Host: your-vps-ip
4. Username: deploy
5. Password: [your-deploy-password]
6. Upload coinsphere.tar.gz to /var/www/coinsphere/

### Step 4.3: Extract and Setup

```bash
# Back on VPS as deploy user
cd /var/www/coinsphere

# Extract the archive
tar -xzf coinsphere.tar.gz

# Remove the archive
rm coinsphere.tar.gz

# Verify files
ls -la
# You should see: backend, frontend, ml-service, Documentation, etc.
```

### Step 4.4: Backend Setup

```bash
cd /var/www/coinsphere/backend

# Install dependencies (this will take 5-10 minutes)
npm install --production

# Create production environment file
nano .env.production
```

**Add this content (update the PASSWORD!):**
```bash
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://coinsphere:CHANGE_THIS_TO_YOUR_DB_PASSWORD@localhost:5432/coinsphere_prod

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate strong secrets)
JWT_SECRET=REPLACE_WITH_STRONG_SECRET_32_CHARS_MIN
JWT_REFRESH_SECRET=REPLACE_WITH_STRONG_SECRET_32_CHARS_MIN
JWT_EXPIRES_IN=3600

# URLs
FRONTEND_URL=https://coinsphere.app
API_URL=https://api.coinsphere.app

# Email (use your SendGrid API key)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@coinsphere.app

# External APIs
COINGECKO_API_KEY=your-coingecko-api-key
```

**To generate strong JWT secrets, run this on VPS:**
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET
openssl rand -base64 32

# Copy these values to your .env.production file
```

**Save and exit (Ctrl+X, Y, Enter)**

### Step 4.5: Run Database Migrations

```bash
# Still in /var/www/coinsphere/backend

# Copy production env to default .env
cp .env.production .env

# Run migrations
npx prisma migrate deploy

# Seed database with tokens
npm run seed

# Build TypeScript
npm run build

# You should see: dist/ folder created
```

### Step 4.6: ML Service Setup

```bash
cd /var/www/coinsphere/ml-service

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies (this will take 5-10 minutes)
pip install -r requirements.txt

# Create production config
nano .env.production
```

**Add this content:**
```bash
ENVIRONMENT=production
DATABASE_URL=postgresql://coinsphere:CHANGE_THIS_TO_YOUR_DB_PASSWORD@localhost:5432/coinsphere_prod
MODEL_VERSION=v1.0.0
PORT=8000
```

**Save and exit**

### Step 4.7: Frontend Build

```bash
cd /var/www/coinsphere/frontend

# Install dependencies
npm install

# Update .env for production
nano .env.production
```

**Add this content:**
```bash
VITE_API_BASE_URL=https://api.coinsphere.app/api/v1
VITE_WS_URL=wss://api.coinsphere.app/api/v1/ws
VITE_APP_NAME=Coinsphere
VITE_APP_VERSION=0.1.0
```

**Save and exit**

```bash
# Build for production (this will take 2-5 minutes)
npm run build

# You should see: dist/ folder created with built files
```

---

## Phase 5: PM2 Process Management (15 minutes)

### Step 5.1: Create PM2 Ecosystem File

```bash
cd /var/www/coinsphere

# Create PM2 config
nano ecosystem.config.js
```

**Add this content:**
```javascript
module.exports = {
  apps: [
    {
      name: 'coinsphere-backend',
      script: './backend/dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '500M',
    },
    {
      name: 'coinsphere-ml',
      script: './ml-service/venv/bin/uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000',
      cwd: './ml-service',
      env_production: {
        ENVIRONMENT: 'production',
      },
      error_file: './logs/ml-err.log',
      out_file: './logs/ml-out.log',
      max_memory_restart: '1G',
    },
  ],
};
```

**Save and exit**

### Step 5.2: Create Logs Directory

```bash
mkdir -p /var/www/coinsphere/logs
```

### Step 5.3: Start Applications with PM2

```bash
# Start applications
pm2 start ecosystem.config.js --env production

# Check status
pm2 status

# You should see:
# ┌─────┬────────────────────┬─────────────┬─────────┬─────────┬──────────┐
# │ id  │ name               │ namespace   │ version │ mode    │ status   │
# ├─────┼────────────────────┼─────────────┼─────────┼─────────┼──────────┤
# │ 0   │ coinsphere-backend │ default     │ 0.1.0   │ cluster │ online   │
# │ 1   │ coinsphere-backend │ default     │ 0.1.0   │ cluster │ online   │
# │ 2   │ coinsphere-ml      │ default     │ N/A     │ fork    │ online   │
# └─────┴────────────────────┴─────────────┴─────────┴─────────┴──────────┘

# View logs
pm2 logs --lines 50

# Save PM2 process list
pm2 save

# Set PM2 to start on boot
pm2 startup
# Copy and run the command it outputs (will be something like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

### Step 5.4: Test Applications

```bash
# Test backend
curl http://localhost:3001/health
# Should return: {"status":"ok",...}

# Test ML service
curl http://localhost:8000/health
# Should return: {"status":"healthy",...}
```

---

## Phase 6: Domain Setup (30 minutes)

### Step 6.1: Configure DNS Records

**Go to your domain registrar (or Hostinger DNS):**

Add these A records pointing to your VPS IP:

```
Type    Name        Value (Your VPS IP)    TTL
A       @           xxx.xxx.xxx.xxx         3600
A       www         xxx.xxx.xxx.xxx         3600
A       api         xxx.xxx.xxx.xxx         3600
A       ml          xxx.xxx.xxx.xxx         3600
```

**Wait 5-10 minutes for DNS propagation**

Test DNS propagation:
```bash
# On your VPS or local machine
nslookup coinsphere.app
nslookup api.coinsphere.app
# Should return your VPS IP address
```

### Step 6.2: Get SSL Certificates

```bash
# Back on VPS as root or with sudo
sudo certbot --nginx -d coinsphere.app -d www.coinsphere.app -d api.coinsphere.app -d ml.coinsphere.app

# Follow the prompts:
# - Enter your email address
# - Agree to terms (Y)
# - Share email with EFF (Y or N, your choice)
# - Choose option 2: Redirect HTTP to HTTPS

# Certificates will be automatically configured in Nginx!
```

---

## Phase 7: Nginx Configuration (20 minutes)

### Step 7.1: Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/coinsphere
```

**Paste this complete configuration:**

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=ml_limit:10m rate=20r/m;

# Frontend
server {
    listen 80;
    listen [::]:80;
    server_name coinsphere.app www.coinsphere.app;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name coinsphere.app www.coinsphere.app;

    ssl_certificate /etc/letsencrypt/live/coinsphere.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coinsphere.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /var/www/coinsphere/frontend/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
server {
    listen 80;
    server_name api.coinsphere.app;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.coinsphere.app;

    ssl_certificate /etc/letsencrypt/live/coinsphere.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coinsphere.app/privkey.pem;

    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ML Service
server {
    listen 80;
    server_name ml.coinsphere.app;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ml.coinsphere.app;

    ssl_certificate /etc/letsencrypt/live/coinsphere.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coinsphere.app/privkey.pem;

    limit_req zone=ml_limit burst=5 nodelay;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Save and exit**

### Step 7.2: Enable Site and Reload Nginx

```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Enable Coinsphere site
sudo ln -s /etc/nginx/sites-available/coinsphere /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t
# Should output: syntax is ok, test is successful

# Reload Nginx
sudo systemctl reload nginx
```

---

## Phase 8: Security & Monitoring (20 minutes)

### Step 8.1: Configure Firewall

```bash
# Install UFW
sudo apt install -y ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 8.2: Install Fail2Ban

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Start and enable
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### Step 8.3: Set Up Automated Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-coinsphere.sh
```

**Paste this:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/coinsphere"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
sudo -u postgres pg_dump coinsphere_prod | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Save and exit, then:**
```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-coinsphere.sh

# Test backup
sudo /usr/local/bin/backup-coinsphere.sh

# Schedule daily backups at 2 AM
crontab -e
# Choose nano (option 1)
# Add this line at the end:
0 2 * * * /usr/local/bin/backup-coinsphere.sh >> /var/log/coinsphere-backup.log 2>&1

# Save and exit
```

---

## Final Verification

### Test All Endpoints

```bash
# Test frontend
curl -I https://coinsphere.app
# Should return: HTTP/2 200

# Test backend API
curl https://api.coinsphere.app/health
# Should return: {"status":"ok",...}

# Test ML service
curl https://ml.coinsphere.app/health
# Should return: {"status":"healthy",...}
```

### Check PM2 Status

```bash
pm2 status
pm2 logs --lines 20
```

### Check System Resources

```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
htop
# (Press q to exit)
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
pm2 logs coinsphere-backend --lines 50

# Check if port is in use
sudo netstat -tulpn | grep 3001

# Restart backend
pm2 restart coinsphere-backend
```

### Database Connection Issues

```bash
# Test database connection
psql -U coinsphere -d coinsphere_prod -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew --dry-run

# If renewal fails, try:
sudo certbot --nginx -d coinsphere.app -d www.coinsphere.app -d api.coinsphere.app --force-renewal
```

### Nginx Configuration Issues

```bash
# Test Nginx config
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

---

## Post-Deployment Checklist

- [ ] All DNS records pointing to VPS
- [ ] SSL certificates installed and working
- [ ] Frontend accessible at https://coinsphere.app
- [ ] Backend API responding at https://api.coinsphere.app/health
- [ ] ML service responding at https://ml.coinsphere.app/health
- [ ] PM2 processes running (pm2 status)
- [ ] Firewall enabled (sudo ufw status)
- [ ] Automated backups scheduled
- [ ] Monitoring set up (UptimeRobot recommended)

---

## Success!

If all tests pass, your Coinsphere MVP is now live on Hostinger VPS!

**Your URLs:**
- Frontend: https://coinsphere.app
- Backend API: https://api.coinsphere.app
- ML Service: https://ml.coinsphere.app

**Next Steps:**
1. Set up monitoring with UptimeRobot (free)
2. Test user registration and authentication
3. Train ML models on production data
4. Start user acquisition!

---

**Need Help?**
- Check the full deployment guide: [HOSTINGER_DEPLOYMENT_GUIDE.md](HOSTINGER_DEPLOYMENT_GUIDE.md)
- Hostinger Support: 24/7 Live Chat
- Community: GitHub Issues

**Estimated Total Time:** 4-6 hours for first deployment

**Congratulations on your deployment! 🚀**
