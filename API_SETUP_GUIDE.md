# API Setup Guide for Coinsphere

**Purpose:** Complete guide for all API keys and accounts needed
**Last Updated:** October 20, 2025
**Priority:** Organized by urgency and cost

---

## 🚨 CRITICAL - Required for Paper Trading (Week 1)

### 1. Binance Testnet API (FREE) ⭐ **START HERE**

**Purpose:** Paper trading and testing without real money
**Cost:** FREE
**Priority:** CRITICAL - Needed immediately

**Setup Steps:**
1. Go to https://testnet.binance.vision/
2. Click "GitHub" to sign in with GitHub account
3. Click "Generate HMAC_SHA256 Key"
4. Copy API Key and Secret Key
5. Save to `backend/.env`:
   ```env
   BINANCE_API_KEY=your_testnet_api_key
   BINANCE_SECRET=your_testnet_secret_key
   BINANCE_TESTNET=true
   ```

**Features:**
- Full trading simulation
- Fake balance (unlimited virtual money)
- Real-time market data
- Test order execution
- No risk - completely safe

**Limitations:**
- Not real trading
- Some features may not work exactly like live
- Data might be slightly delayed

**Test Command:**
```bash
cd backend
npx tsx scripts/test-exchange-connection.ts
```

---

## ⚡ HIGH PRIORITY - Needed Soon (Week 1-2)

### 2. CoinGecko API (FREE tier available)

**Purpose:** Historical and current price data for backtesting and analysis
**Cost:**
- FREE: 10-50 calls/minute
- Demo: $129/month (500 calls/minute) - **Recommended for production**

**Already Configured:** Your project uses CoinGecko for price data

**Setup Steps:**
1. Go to https://www.coingecko.com/en/api/pricing
2. For FREE tier: Just use their public API (no key needed)
3. For PRO tier: Sign up and get API key
4. Add to `backend/.env`:
   ```env
   COINGECKO_API_KEY=your_api_key  # Optional for free tier
   ```

**What You're Using It For:**
- Token price history
- Market cap data
- Trading volume
- Price data for backtesting
- Real-time price updates

**Current Usage:** Already integrated in your codebase

---

### 3. Nansen MCP (Already Integrated via MCP)

**Purpose:** On-chain data, smart money tracking, token unlock events
**Cost:** Varies by plan (likely $150-$500/month)

**Status:** ✅ Already integrated via MCP server

**What You're Using It For:**
- Token unlock schedule (CRITICAL for your strategy)
- Smart money wallet tracking
- On-chain transaction analysis
- Holder analysis
- DeFi position tracking

**MCP Tools Available:**
- `token_unlock_schedule` - Get unlock events
- `token_current_top_holders` - Find whales
- `token_pnl_leaderboard` - Profitable traders
- `address_portfolio` - Wallet holdings
- And 20+ more tools

**Configuration:** Already configured in your MCP settings

**Usage Example:**
```typescript
// Fetch token unlock events
const unlocks = await nansenMcpService.getTokenUnlockSchedule({
  minUnlockPercent: 5,
  daysAhead: 30,
});
```

---

## 📊 MEDIUM PRIORITY - Needed for Production (Week 3-4)

### 4. SendGrid Email API

**Purpose:** Email notifications for trading alerts
**Cost:** $15/month (40,000 emails)

**Setup Steps:**
1. Go to https://sendgrid.com/pricing/
2. Sign up for Essentials plan ($15/month)
3. Create API key in Settings > API Keys
4. Add to `backend/.env`:
   ```env
   SENDGRID_API_KEY=your_sendgrid_api_key
   SMTP_FROM=alerts@coinsphere.app
   ```

**What You'll Use It For:**
- Position opened/closed alerts
- Stop-loss triggered notifications
- Take-profit alerts
- Emergency stop notifications
- Daily performance summaries
- Weekly reports

**When to Set Up:** Before live trading (Week 3-4)

---

### 5. Sentry Error Tracking

**Purpose:** Production error monitoring and debugging
**Cost:** FREE tier available, $26/month for Team plan

**Setup Steps:**
1. Go to https://sentry.io/signup/
2. Create new project (Node.js)
3. Copy DSN
4. Add to `backend/.env`:
   ```env
   SENTRY_DSN=https://your-key@sentry.io/project-id
   SENTRY_ENVIRONMENT=production
   SENTRY_TRACES_SAMPLE_RATE=0.1
   ```

**What It Does:**
- Catches runtime errors
- Tracks API failures
- Performance monitoring
- Stack traces for debugging
- Alert on critical errors

**When to Set Up:** Before live trading (Week 3-4)

---

## 🔐 PRODUCTION ONLY - Not Needed Yet (Week 7-8)

### 6. Binance Live API

**Purpose:** Real trading with real money
**Cost:** FREE (trading fees apply: 0.1% per trade)

**⚠️ DO NOT SET UP UNTIL:**
- 2 weeks successful paper trading
- All tests passing
- Risk management validated
- You're ready to risk real money

**Setup Steps (When Ready):**
1. Go to https://www.binance.com/
2. Create account and complete KYC
3. Enable 2FA (required)
4. API Management > Create API
5. Set permissions: Read + Spot Trading
6. Whitelist your server IP
7. Add to `backend/.env`:
   ```env
   BINANCE_API_KEY=your_live_api_key
   BINANCE_SECRET=your_live_secret_key
   BINANCE_TESTNET=false  # IMPORTANT: Set to false for live
   ```

**Security Requirements:**
- Enable API IP whitelist
- Enable withdrawal whitelist
- Restrict API to spot trading only
- Do NOT enable withdrawals via API
- Use separate API key for trading vs monitoring

**Initial Capital:** $100-$500 recommended

---

## 💰 OPTIONAL - Future Enhancements

### 7. Twilio SMS API (Optional)

**Purpose:** SMS alerts for critical events
**Cost:** Pay-as-you-go (~$0.0075 per SMS)

**Setup Steps:**
1. Go to https://www.twilio.com/
2. Sign up and verify phone
3. Get account SID and auth token
4. Add to `backend/.env`:
   ```env
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+1234567890
   ALERT_PHONE_NUMBER=your_phone
   ```

**Use Cases:**
- Emergency stop triggered
- Position closed with large loss
- System critical errors
- Exchange API down

**When to Set Up:** Optional, before live trading

---

### 8. CryptoCompare API (Backup)

**Purpose:** Backup price data source
**Cost:** FREE tier available

**Setup Steps:**
1. Go to https://www.cryptocompare.com/
2. Sign up for free account
3. Get API key
4. Add to `backend/.env`:
   ```env
   CRYPTOCOMPARE_API_KEY=your_api_key
   ```

**When to Set Up:** Optional, as backup

---

### 9. LunarCrush API (Sentiment Data)

**Purpose:** Social sentiment analysis
**Cost:** $199/month

**Status:** Already configured in your codebase but optional

**When to Set Up:** Future enhancement (Month 3+)

---

## 📝 Complete Environment Setup

### Immediate Setup (Week 1)

Copy this to your `backend/.env` file:

```env
# ============================================
# WEEK 1 SETUP - PAPER TRADING
# ============================================

# Server Configuration
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://coinsphere:postgres@localhost:5432/coinsphere_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=604800

# Encryption (for Exchange API Keys)
ENCRYPTION_KEY=your-256-bit-encryption-key-minimum-32-characters-required

# ============================================
# BINANCE TESTNET - START HERE ⭐
# ============================================
BINANCE_API_KEY=paste_your_testnet_key_here
BINANCE_SECRET=paste_your_testnet_secret_here
BINANCE_TESTNET=true

# ============================================
# OPTIONAL - Can leave blank for now
# ============================================

# CoinGecko (FREE tier - no key needed)
COINGECKO_API_KEY=

# Email (set up in Week 3-4)
SENDGRID_API_KEY=
SMTP_FROM=alerts@coinsphere.app

# Error Tracking (set up in Week 3-4)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🎯 Setup Priority Timeline

### Week 1 (This Week) ⭐ **DO NOW**

**Required:**
1. ✅ Binance Testnet API - **CRITICAL**
   - FREE
   - Takes 5 minutes
   - Needed for testing

**Optional:**
2. CoinGecko (free tier) - Already working
3. Database setup (PostgreSQL) - Already configured

### Week 2-3

**Recommended:**
1. SendGrid Email ($15/month)
   - For trading alerts
   - Before paper trading completes
2. Sentry Error Tracking (FREE/paid)
   - For production monitoring

### Week 7-8 (Only when ready for live trading)

**Production:**
1. Binance Live API - **Only after successful paper trading**
   - Requires real money
   - Start with $100-$500
   - Complete all pre-live checklist first

---

## 💡 Quick Start Instructions

**To start paper trading TODAY:**

1. **Create Binance Testnet Account** (5 minutes)
   ```
   1. Go to: https://testnet.binance.vision/
   2. Login with GitHub
   3. Generate API key
   ```

2. **Update .env file** (2 minutes)
   ```bash
   cd backend
   cp .env.example .env
   # Add your Binance testnet keys to .env
   ```

3. **Test Connection** (1 minute)
   ```bash
   npx tsx scripts/test-exchange-connection.ts
   ```

4. **Run Strategy Test** (30 seconds)
   ```bash
   npx tsx scripts/test-token-unlock-strategy.ts
   ```

**That's it!** You're ready for paper trading.

---

## 📊 Cost Summary

### Immediate Costs (Week 1)
- **Total: $0** (Everything is FREE)

### Week 3-4 Costs (Production Setup)
- SendGrid: $15/month
- Sentry: $0-$26/month (optional paid tier)
- **Total: $15-$41/month**

### Live Trading Costs (Week 7+)
- Binance trading fees: 0.1% per trade
- Example: $1,000 trade = $1 fee
- **Total: Depends on trading volume**

### Optional Future Costs
- Twilio SMS: ~$5-10/month
- LunarCrush: $199/month (optional)
- **Total: Variable**

---

## 🔒 Security Best Practices

### API Key Security

1. **Never commit API keys to git**
   - Use .env file (already in .gitignore)
   - Never hardcode in source code

2. **Use environment-specific keys**
   - Testnet keys for development
   - Live keys only in production
   - Separate keys for different environments

3. **Restrict API permissions**
   - Binance: Only enable "Spot Trading" + "Read"
   - Never enable "Withdraw" permission
   - Whitelist IP addresses

4. **Rotate keys regularly**
   - Change every 3-6 months
   - Immediately if compromised
   - Keep old keys for 24h during transition

5. **Monitor API usage**
   - Check for unusual activity
   - Set up alerts for failed auth
   - Review API logs weekly

---

## ✅ Setup Checklist

### Week 1 - Paper Trading
- [ ] Binance Testnet account created
- [ ] Testnet API keys generated
- [ ] Keys added to backend/.env
- [ ] Exchange connection test passed
- [ ] Strategy test script runs successfully

### Week 3-4 - Production Prep
- [ ] SendGrid account created
- [ ] Email API configured
- [ ] Sentry account created
- [ ] Error tracking configured
- [ ] Test email alerts working

### Week 7-8 - Live Trading (Only when ready)
- [ ] 2 weeks successful paper trading
- [ ] Binance live account created
- [ ] KYC verification complete
- [ ] 2FA enabled
- [ ] Live API keys generated
- [ ] IP whitelist configured
- [ ] Initial capital deposited ($100-$500)
- [ ] All safety controls tested

---

## 🆘 Troubleshooting

### "API Key Invalid" Error
- Check key is copied correctly (no spaces)
- Verify key hasn't expired
- Check API permissions enabled
- Confirm IP whitelist (if set)

### "Insufficient Balance" Error (Testnet)
- Testnet gives unlimited virtual balance
- If error persists, regenerate API keys
- Try different trading pair

### "Rate Limit Exceeded"
- Reduce polling frequency
- Add delays between requests
- Upgrade API plan if needed

---

## 📞 Support

### Binance Testnet
- Docs: https://testnet.binance.vision/
- No support (it's free)
- Check GitHub issues

### Production APIs
- SendGrid: support.sendgrid.com
- Sentry: sentry.io/support
- Binance: binance.com/support

---

**Ready to start?** Set up your Binance Testnet account now! It's FREE and takes 5 minutes.

**Next:** Run `npx tsx scripts/test-exchange-connection.ts` to verify everything works.
