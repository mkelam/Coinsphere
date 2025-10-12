# Coinsphere Docker VPS Deployment - Quick Checklist

**VPS:** Hostinger Plan 4 (8GB RAM, 4 cores)
**Method:** Docker + Docker Compose
**Time:** 1.5 hours
**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Completed

---

## Pre-Flight Checklist

- [ ] VPS purchased from Hostinger
- [ ] VPS credentials saved: `C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\Hostinger.txt`
- [ ] VPS IP Address: `_________________`
- [ ] Domain registered: coinsphere.app
- [ ] CoinGecko API key ready
- [ ] PayFast keys ready
- [ ] SendGrid API key ready

---

## Phase 1: VPS Setup (10 min) ⬜

```bash
# 1.1 Connect to VPS
ssh root@YOUR_VPS_IP

# 1.2 Update system
apt update && apt upgrade -y

# 1.3 Install essentials
apt install -y curl wget git vim nano htop ufw

# 1.4 Create deploy user
adduser deploy
usermod -aG sudo deploy
su - deploy
```

- [ ] Connected to VPS successfully
- [ ] System updated
- [ ] Deploy user created
- [ ] Deploy password saved: `_________________`

---

## Phase 2: Install Docker (10 min) ⬜

```bash
# 2.1 Install Docker
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 2.2 Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# 2.3 Add user to docker group
sudo usermod -aG docker deploy
newgrp docker

# 2.4 Verify
docker --version
docker compose version
docker ps
```

- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Deploy user can run docker
- [ ] Docker version: `_________________`

---

## Phase 3: Upload & Configure (20 min) ⬜

```bash
# 3.1 Create directory
sudo mkdir -p /var/www/coinsphere
sudo chown -R deploy:deploy /var/www/coinsphere
cd /var/www/coinsphere
```

**Choose upload method:**

### Option A: Git Clone
```bash
git clone https://github.com/YOUR_USERNAME/coinsphere.git .
```

### Option B: WinSCP
- [ ] Downloaded WinSCP
- [ ] Connected to VPS (deploy user)
- [ ] Uploaded backend/ folder
- [ ] Uploaded frontend/ folder
- [ ] Uploaded ml-service/ folder
- [ ] Uploaded deployment/ folder
- [ ] Uploaded docker-compose.prod.yml
- [ ] Uploaded .env.example

```bash
# 3.2 Create .env file
cd /var/www/coinsphere
cp .env.example .env
nano .env
```

**Fill in these values:**
```bash
# Database
POSTGRES_PASSWORD=___________________  # Generate: openssl rand -base64 32
DB_PASSWORD=___________________        # Same as above

# JWT Secrets
JWT_SECRET=___________________         # Generate: openssl rand -base64 48
JWT_REFRESH_SECRET=___________________  # Generate: openssl rand -base64 48

# API Keys
COINGECKO_API_KEY=___________________
STRIPE_SECRET_KEY=___________________
STRIPE_WEBHOOK_SECRET=___________________
SENDGRID_API_KEY=___________________

# URLs
VITE_API_URL=https://api.coinsphere.app/v1
VITE_WS_URL=wss://api.coinsphere.app/v1/ws
```

- [ ] .env file created
- [ ] All secrets generated
- [ ] All API keys added

```bash
# 3.3 Fix Node version in Dockerfiles (Node 22 → Node 20)
nano backend/Dockerfile.prod
# Change line 2: FROM node:20-alpine AS base

nano frontend/Dockerfile.prod
# Change line 2: FROM node:20-alpine AS base

# 3.4 Create directories
mkdir -p deployment/ssl
mkdir -p deployment/certbot/conf
mkdir -p deployment/certbot/www
mkdir -p backups
mkdir -p backend/logs
```

- [ ] Dockerfiles updated to Node 20
- [ ] All directories created

---

## Phase 4: Build & Start (20 min) ⬜

```bash
cd /var/www/coinsphere

# 4.1 Build images (10-15 min)
docker compose -f docker-compose.prod.yml build --no-cache

# 4.2 Start database services
docker compose -f docker-compose.prod.yml up -d postgres redis

# Wait 30 seconds, then check:
docker compose -f docker-compose.prod.yml ps

# 4.3 Run migrations
docker compose -f docker-compose.prod.yml run --rm backend sh -c "npx prisma migrate deploy"

# 4.4 Seed database
docker compose -f docker-compose.prod.yml run --rm backend sh -c "npm run seed"

# 4.5 Start all services
docker compose -f docker-compose.prod.yml up -d

# 4.6 Check status
docker compose -f docker-compose.prod.yml ps

# 4.7 Test services
curl http://localhost:3001/health
curl http://localhost:80
```

- [ ] All images built successfully
- [ ] Database started (healthy)
- [ ] Redis started (healthy)
- [ ] Migrations applied (10 migrations)
- [ ] Database seeded (31 tokens, 10 DeFi protocols)
- [ ] All containers running
- [ ] Backend health check passes
- [ ] Frontend responds

**Expected containers:**
```
coinsphere-postgres   Up (healthy)
coinsphere-redis      Up (healthy)
coinsphere-backend    Up (healthy)
coinsphere-frontend   Up (healthy)
coinsphere-nginx      Up (healthy)
```

---

## Phase 5: SSL & Domain (20 min) ⬜

### 5.1 Configure DNS

**In domain registrar (Namecheap/GoDaddy):**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_VPS_IP | 3600 |
| A | www | YOUR_VPS_IP | 3600 |
| A | api | YOUR_VPS_IP | 3600 |

- [ ] DNS A records added
- [ ] Waited 5-10 minutes for propagation

```bash
# 5.2 Verify DNS
nslookup coinsphere.app
nslookup www.coinsphere.app
nslookup api.coinsphere.app
```

- [ ] All 3 domains resolve to VPS IP

### 5.3 Obtain SSL Certificates

```bash
# Stop nginx
docker compose -f docker-compose.prod.yml stop nginx

# Install Certbot
sudo apt install -y certbot

# Get certificates
sudo certbot certonly --standalone \
  -d coinsphere.app \
  -d www.coinsphere.app \
  -d api.coinsphere.app \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive

# Copy certificates
sudo cp /etc/letsencrypt/live/coinsphere.app/fullchain.pem /var/www/coinsphere/deployment/ssl/
sudo cp /etc/letsencrypt/live/coinsphere.app/privkey.pem /var/www/coinsphere/deployment/ssl/
sudo chown -R deploy:deploy /var/www/coinsphere/deployment/ssl
chmod 600 /var/www/coinsphere/deployment/ssl/*.pem
```

- [ ] SSL certificates obtained
- [ ] Certificates copied to deployment/ssl/
- [ ] Permissions set correctly

### 5.4 Configure Nginx for SSL

```bash
# Edit nginx config (or create if doesn't exist)
nano /var/www/coinsphere/deployment/nginx-docker.conf
```

- [ ] Nginx configuration updated with SSL
- [ ] HTTP → HTTPS redirect configured
- [ ] Security headers added

```bash
# Restart nginx
docker compose -f docker-compose.prod.yml restart nginx

# Check logs
docker compose -f docker-compose.prod.yml logs nginx --tail=50
```

- [ ] Nginx restarted successfully
- [ ] No errors in logs

### 5.5 Set Up Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job
sudo crontab -e
# Add: 0 2 * * * certbot renew --quiet --deploy-hook "docker compose -f /var/www/coinsphere/docker-compose.prod.yml restart nginx"
```

- [ ] Renewal test successful
- [ ] Cron job added

---

## Phase 6: Security & Monitoring (20 min) ⬜

### 6.1 Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

- [ ] Firewall enabled
- [ ] Only ports 22, 80, 443 open

### 6.2 Fail2Ban

```bash
sudo apt install -y fail2ban
sudo nano /etc/fail2ban/jail.local
```

**Add:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
```

```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status
```

- [ ] Fail2Ban installed
- [ ] SSH jail configured
- [ ] Fail2Ban running

### 6.3 Automated Backups

```bash
sudo nano /usr/local/bin/coinsphere-backup.sh
```

**Add script from DOCKER_VPS_DEPLOYMENT.md (Phase 6.3)**

```bash
sudo chmod +x /usr/local/bin/coinsphere-backup.sh
sudo /usr/local/bin/coinsphere-backup.sh  # Test it

# Add to crontab
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/coinsphere-backup.sh >> /var/log/coinsphere-backup.log 2>&1
```

- [ ] Backup script created
- [ ] Test backup successful
- [ ] Cron job added

### 6.4 Docker Log Rotation

```bash
sudo nano /etc/docker/daemon.json
```

**Add:**
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
cd /var/www/coinsphere
docker compose -f docker-compose.prod.yml restart
```

- [ ] Log rotation configured
- [ ] Docker restarted
- [ ] All containers restarted

---

## Final Verification ✅

### Infrastructure Checks

```bash
# All containers healthy?
docker compose -f docker-compose.prod.yml ps

# Resource usage OK?
docker stats --no-stream

# Disk space OK?
df -h
```

- [ ] All 5 containers running (healthy)
- [ ] Memory usage < 6GB
- [ ] Disk usage < 50GB

### Application Checks

**From VPS:**
```bash
curl http://localhost:3001/health
curl -I https://api.coinsphere.app/v1/health
```

- [ ] Backend returns 200 OK
- [ ] HTTPS health check passes

**From browser:**
- [ ] https://coinsphere.app loads
- [ ] No SSL errors
- [ ] No console errors (F12)
- [ ] Homepage renders correctly

### Database Checks

```bash
docker exec -it coinsphere-postgres psql -U coinsphere -d coinsphere_prod

SELECT COUNT(*) FROM tokens;        -- Should be 31
SELECT COUNT(*) FROM defi_protocols; -- Should be 10
\q
```

- [ ] 31 tokens in database
- [ ] 10 DeFi protocols in database

### Security Checks

```bash
# SSL working?
curl -I https://coinsphere.app | grep -i strict-transport

# Firewall active?
sudo ufw status

# Fail2Ban running?
sudo fail2ban-client status
```

- [ ] SSL certificate valid
- [ ] HSTS header present
- [ ] Firewall active
- [ ] Fail2Ban running

---

## Deployment Complete! 🎉

### Production URLs
- **Frontend:** https://coinsphere.app
- **API:** https://api.coinsphere.app/v1
- **API Health:** https://api.coinsphere.app/v1/health

### Quick Commands Reference

```bash
# View container status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart service
docker compose -f docker-compose.prod.yml restart backend

# Restart all
docker compose -f docker-compose.prod.yml restart

# View resource usage
docker stats

# Access database
docker exec -it coinsphere-postgres psql -U coinsphere -d coinsphere_prod

# View backups
ls -lh /var/www/coinsphere/backups/
```

### Monitoring Tools

```bash
# Real-time container monitoring
ctop

# System monitoring
htop

# Disk usage
df -h

# Check firewall
sudo ufw status

# Check Fail2Ban
sudo fail2ban-client status
```

---

## Cost Summary

**Monthly Fixed Costs:**
- Hostinger VPS Plan 4: $14.99
- CoinGecko Pro API: $129
- SendGrid: $15
- **Total: $158.99/month**

**vs AWS:** $294-394/month
**Savings:** $135-235/month (46-59%)

---

## Next Steps

1. **Test All Features**
   - [ ] User registration
   - [ ] Login flow
   - [ ] Portfolio tracking
   - [ ] Price predictions
   - [ ] Payment flows (PayFast/Payfast)

2. **Configure Production API Keys**
   - [ ] CoinGecko Pro (live key)
   - [ ] PayFast (live mode)
   - [ ] SendGrid (production)

3. **Set Up Monitoring**
   - [ ] UptimeRobot (https://uptimerobot.com)
   - [ ] Sentry error tracking (optional)

4. **Launch**
   - [ ] Social media announcement
   - [ ] Product Hunt launch
   - [ ] Marketing campaigns

---

**Deployment Date:** ___________________
**Deployed By:** ___________________
**VPS IP:** ___________________
**Status:** ⬜ Not Started | ⬜ In Progress | ✅ Completed

**Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________
