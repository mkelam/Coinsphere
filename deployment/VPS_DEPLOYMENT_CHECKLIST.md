# Coinsphere VPS Deployment Checklist

**Date:** 2025-10-11
**VPS Provider:** Hostinger
**Deployment Guide:** DEPLOY_TO_VPS.md
**Quick Start:** Documentation/HOSTINGER_QUICK_START.md

---

## Pre-Deployment Checklist

### ✅ Local Environment
- [x] All local services tested and healthy
- [x] Database seeded with 31 tokens and 10 DeFi protocols
- [x] ML models trained successfully (3/3 models)
- [x] E2E tests passing (30 tests)
- [x] TypeScript build successful (0 errors)
- [x] Critical security vulnerability fixed (token routes)
- [x] Git status clean (11 commits ready to push)

### ✅ VPS Purchase
- [x] Hostinger VPS Plan 4 purchased (8GB RAM, 4 cores)
- [x] VPS credentials saved at: `C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\Hostinger.txt`
- [ ] VPS IP address noted: `___________________`
- [ ] Root password noted (from Hostinger.txt)

### ✅ Domain Configuration
- [ ] Domain registered: coinsphere.app
- [ ] Domain registrar access confirmed
- [ ] Ready to configure DNS A records

### ✅ External Services
- [ ] CoinGecko Pro API key obtained
- [ ] PayFast account created (live keys ready)
- [ ] SendGrid account created (API key ready)
- [ ] Payfast account created (merchant ID/key ready)

### ✅ Deployment Tools
- [ ] WinSCP installed (or FileZilla, or SCP command ready)
- [ ] SSH client ready (PowerShell or PuTTY)
- [ ] Text editor ready for .env file editing

---

## Phase 1: Initial VPS Access (15 min)

### Step 1.1: Connect to VPS
- [ ] Opened credentials file: `Hostinger.txt`
- [ ] Noted VPS IP address: `___________________`
- [ ] Connected via SSH: `ssh root@YOUR_VPS_IP`
- [ ] Successfully logged in

### Step 1.2: System Update
```bash
apt update && apt upgrade -y
```
- [ ] System packages updated
- [ ] No critical errors during update

### Step 1.3: Install Essential Tools
```bash
apt install -y curl wget git vim nano htop ufw fail2ban
```
- [ ] Essential tools installed

### Step 1.4: Create Deploy User
```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```
- [ ] Deploy user created
- [ ] Deploy user password saved: `___________________`
- [ ] Switched to deploy user

---

## Phase 2: Install Core Software (30 min)

### Step 2.1: Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```
- [ ] Node.js installed
- [ ] npm installed
- [ ] PM2 installed globally
- [ ] Verified versions: `node --version` (v20.x.x)

### Step 2.2: Python 3.11
```bash
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
```
- [ ] Python 3.11 installed
- [ ] Verified version: `python3.11 --version`

### Step 2.3: PostgreSQL 15 + TimescaleDB
```bash
# (See DEPLOY_TO_VPS.md Phase 2.3 for full commands)
```
- [ ] PostgreSQL 15 installed
- [ ] TimescaleDB extension installed
- [ ] PostgreSQL service running
- [ ] Verified: `sudo -u postgres psql -c "SELECT version();"`

### Step 2.4: Redis 7
```bash
# (See DEPLOY_TO_VPS.md Phase 2.4 for full commands)
```
- [ ] Redis installed
- [ ] Redis service running
- [ ] Verified: `redis-cli ping` (returns PONG)

### Step 2.5: Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```
- [ ] Nginx installed
- [ ] Nginx service running

---

## Phase 3: Database Setup (15 min)

### Step 3.1: Create Production Database
```sql
CREATE DATABASE coinsphere_prod;
CREATE USER coinsphere WITH ENCRYPTED PASSWORD 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE coinsphere_prod TO coinsphere;
\c coinsphere_prod
CREATE EXTENSION IF NOT EXISTS timescaledb;
```
- [ ] Database created: `coinsphere_prod`
- [ ] Database user created: `coinsphere`
- [ ] Database password saved: `___________________`
- [ ] TimescaleDB extension enabled
- [ ] Verified extension: `SELECT * FROM pg_extension WHERE extname = 'timescaledb';`

---

## Phase 4: Deploy Application (45 min)

### Step 4.1: Create Application Directory
```bash
sudo mkdir -p /var/www/coinsphere
sudo chown -R deploy:deploy /var/www/coinsphere
cd /var/www/coinsphere
```
- [ ] Directory created: `/var/www/coinsphere`
- [ ] Ownership set to deploy user

### Step 4.2: Upload Code to VPS
**Choose your upload method:**

#### Option A: Git Clone
```bash
git clone https://github.com/YOUR_USERNAME/coinsphere.git .
```
- [ ] Repository cloned successfully

#### Option B: WinSCP/FileZilla
- [ ] Connected to VPS (deploy user)
- [ ] Uploaded `backend/` folder
- [ ] Uploaded `frontend/` folder
- [ ] Uploaded `ml-service/` folder
- [ ] Uploaded `Documentation/` folder

### Step 4.3: Backend Setup
```bash
cd /var/www/coinsphere/backend
npm install --production
```
- [ ] Backend dependencies installed
- [ ] Created `.env` file with production values
- [ ] JWT secrets generated: `openssl rand -base64 48`
- [ ] All environment variables configured

**Backend .env checklist:**
- [ ] `DATABASE_URL` configured
- [ ] `REDIS_URL` configured
- [ ] `JWT_SECRET` set (min 32 chars)
- [ ] `JWT_REFRESH_SECRET` set (min 32 chars)
- [ ] `COINGECKO_API_KEY` set
- [ ] `STRIPE_SECRET_KEY` set
- [ ] `SENDGRID_API_KEY` set

### Step 4.4: Run Database Migrations
```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
```
- [ ] Prisma client generated
- [ ] Migrations applied successfully
- [ ] Database seeded (31 tokens, 10 DeFi protocols)

### Step 4.5: Build Backend
```bash
npm run build
```
- [ ] TypeScript compiled successfully
- [ ] `dist/` folder created

### Step 4.6: Frontend Setup
```bash
cd /var/www/coinsphere/frontend
npm install
```
- [ ] Frontend dependencies installed
- [ ] Created `.env` file

**Frontend .env checklist:**
- [ ] `VITE_API_BASE_URL=https://api.coinsphere.app/v1`
- [ ] `VITE_WS_URL=wss://api.coinsphere.app/v1/ws`

### Step 4.7: Build Frontend
```bash
npm run build
```
- [ ] Frontend built successfully
- [ ] `dist/` folder created

### Step 4.8: ML Service Setup
```bash
cd /var/www/coinsphere/ml-service
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
- [ ] Virtual environment created
- [ ] ML dependencies installed
- [ ] Created `.env` file with `DATABASE_URL`

---

## Phase 5: PM2 Process Management (15 min)

### Step 5.1: Create PM2 Ecosystem File
```bash
cd /var/www/coinsphere
nano ecosystem.config.js
```
- [ ] Ecosystem file created (see DEPLOY_TO_VPS.md for content)
- [ ] Logs directory created: `mkdir -p /var/www/coinsphere/logs`

### Step 5.2: Start Services
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```
- [ ] Backend started (2 instances in cluster mode)
- [ ] ML service started (1 instance)
- [ ] PM2 status shows all services "online"
- [ ] PM2 startup command executed

### Step 5.3: Verify Services
```bash
curl http://localhost:3001/health
curl http://localhost:8000/health
```
- [ ] Backend health check returns: `{"status":"ok"}`
- [ ] ML service health check returns: `{"status":"healthy"}`

---

## Phase 6: Domain Setup (30 min)

### Step 6.1: Configure DNS
**In your domain registrar (e.g., Namecheap):**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_VPS_IP | 3600 |
| A | www | YOUR_VPS_IP | 3600 |
| A | api | YOUR_VPS_IP | 3600 |

- [ ] DNS A records added
- [ ] Waited 5-10 minutes for propagation

### Step 6.2: Verify DNS
```bash
nslookup coinsphere.app
nslookup www.coinsphere.app
nslookup api.coinsphere.app
```
- [ ] DNS resolves to VPS IP for all 3 domains

### Step 6.3: Install SSL Certificates
```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d coinsphere.app -d www.coinsphere.app -d api.coinsphere.app
sudo systemctl start nginx
```
- [ ] Certbot installed
- [ ] SSL certificates obtained
- [ ] Certificates saved at: `/etc/letsencrypt/live/coinsphere.app/`

### Step 6.4: Enable Auto-Renewal
```bash
sudo certbot renew --dry-run
sudo systemctl enable certbot.timer
```
- [ ] Auto-renewal tested successfully
- [ ] Certbot timer enabled

---

## Phase 7: Nginx Configuration (20 min)

### Step 7.1: Create Nginx Site Configuration
```bash
sudo nano /etc/nginx/sites-available/coinsphere
```
- [ ] Nginx configuration created (see DEPLOY_TO_VPS.md for full config)
- [ ] Frontend server block configured (coinsphere.app)
- [ ] API server block configured (api.coinsphere.app)
- [ ] SSL certificates referenced
- [ ] Rate limiting configured
- [ ] WebSocket support configured

### Step 7.2: Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/coinsphere /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```
- [ ] Site enabled
- [ ] Default site removed
- [ ] Nginx configuration test passed
- [ ] Nginx reloaded

---

## Phase 8: Security & Monitoring (20 min)

### Step 8.1: Configure Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```
- [ ] UFW firewall enabled
- [ ] SSH allowed (port 22)
- [ ] HTTP/HTTPS allowed (ports 80/443)

### Step 8.2: Configure Fail2Ban
```bash
sudo nano /etc/fail2ban/jail.local
```
- [ ] Fail2Ban jail configuration created
- [ ] SSH protection enabled
- [ ] Nginx protection enabled
- [ ] Fail2Ban restarted

### Step 8.3: Set Up Backups
```bash
sudo nano /usr/local/bin/coinsphere-backup.sh
sudo chmod +x /usr/local/bin/coinsphere-backup.sh
sudo crontab -e
```
- [ ] Backup script created
- [ ] Backup script made executable
- [ ] Cron job added (daily at 2 AM)

### Step 8.4: Set Up Log Rotation
```bash
sudo nano /etc/logrotate.d/coinsphere
```
- [ ] Logrotate configuration created
- [ ] PM2 logs configured to rotate (14 days retention)

---

## Post-Deployment Verification

### ✅ Infrastructure Checks

```bash
# Check all services
sudo systemctl status postgresql
sudo systemctl status redis-server
sudo systemctl status nginx
pm2 status

# Check ports
sudo netstat -tulpn | grep LISTEN
```
- [ ] PostgreSQL running
- [ ] Redis running
- [ ] Nginx running
- [ ] PM2 backend instances running (2)
- [ ] PM2 ML service running (1)
- [ ] All expected ports listening (80, 443, 3001, 8000, 5432, 6379)

### ✅ Application Checks

**From VPS:**
```bash
curl http://localhost:3001/health
curl http://localhost:8000/health
```
- [ ] Backend returns 200 OK
- [ ] ML service returns 200 OK

**From your local machine (browser):**
- [ ] https://coinsphere.app loads successfully
- [ ] No SSL certificate errors
- [ ] Homepage displays correctly
- [ ] No console errors (F12)
- [ ] https://api.coinsphere.app/v1/health returns `{"status":"ok"}`

### ✅ Database Checks

```bash
sudo -u postgres psql coinsphere_prod
SELECT COUNT(*) FROM tokens;
SELECT COUNT(*) FROM defi_protocols;
\q
```
- [ ] 31 tokens in database
- [ ] 10 DeFi protocols in database

### ✅ Security Checks

```bash
# SSL certificate
curl -I https://coinsphere.app | grep -i strict-transport

# Firewall
sudo ufw status

# Fail2Ban
sudo fail2ban-client status
```
- [ ] Strict-Transport-Security header present
- [ ] UFW active
- [ ] Fail2Ban running with jails enabled

---

## Final Testing

### ✅ User Registration Flow
- [ ] Visit https://coinsphere.app
- [ ] Click "Sign Up"
- [ ] Fill in registration form
- [ ] Submit registration
- [ ] Verify account created (check database or logs)

### ✅ API Authentication Flow
```bash
# Test registration endpoint
curl -X POST https://api.coinsphere.app/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@coinsphere.app","password":"Test123!","firstName":"Test","lastName":"User"}'
```
- [ ] Returns 201 Created with accessToken

### ✅ Token Data Flow
```bash
# Test tokens endpoint (requires authentication)
curl https://api.coinsphere.app/v1/tokens \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
- [ ] Returns 200 OK with token list
- [ ] Returns 401 Unauthorized without token

---

## Deployment Complete! 🚀

### Production URLs
- **Frontend:** https://coinsphere.app
- **API:** https://api.coinsphere.app/v1
- **API Docs:** https://api.coinsphere.app/v1/docs

### Monitoring
- **PM2 Logs:** `pm2 logs`
- **Nginx Logs:** `sudo tail -f /var/log/nginx/access.log`
- **System Stats:** `htop`

### Maintenance
- **Restart Services:** `pm2 restart all`
- **Reload Nginx:** `sudo systemctl reload nginx`
- **View Backups:** `ls -lh /var/backups/coinsphere/`

### Cost Summary
- **Monthly VPS Cost:** $14.99 (Hostinger VPS Plan 4)
- **Monthly Savings vs AWS:** ~$135-235 (90% cost reduction)
- **Annual Savings:** ~$1,620-2,820

---

## Troubleshooting Reference

### Common Issues

**502 Bad Gateway**
- Check: `pm2 status` - Ensure backend is running
- Check: `pm2 logs coinsphere-backend` - Look for errors
- Fix: `pm2 restart coinsphere-backend`

**SSL Certificate Error**
- Check: `nslookup coinsphere.app` - Verify DNS
- Fix: `sudo certbot renew --force-renewal`

**Database Connection Refused**
- Check: `sudo systemctl status postgresql`
- Fix: `sudo systemctl restart postgresql`

**High Memory Usage**
- Check: `free -h` and `pm2 monit`
- Fix: Increase `max_memory_restart` in ecosystem.config.js

---

## Next Steps

1. **Configure API Keys**
   - Add real CoinGecko Pro API key
   - Switch PayFast to live mode
   - Configure SendGrid templates

2. **Set Up Monitoring**
   - Link PM2 Plus (https://app.pm2.io)
   - Set up UptimeRobot (https://uptimerobot.com)

3. **Test Payment Flows**
   - PayFast checkout
   - Payfast checkout
   - Subscription management

4. **Launch Marketing**
   - Social media announcement
   - Product Hunt launch
   - Reddit r/CryptoCurrency post

---

**Deployment Date:** ___________________
**Deployed By:** ___________________
**Production URL:** https://coinsphere.app
**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Completed

**Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________
