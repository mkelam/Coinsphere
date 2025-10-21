# How to Get Binance Testnet Funds

**Quick Guide:** Get free virtual BTC and USDT for paper trading

---

## 🎯 Step-by-Step Instructions

### Step 1: Visit Binance Testnet Website
1. Open your browser
2. Go to: **https://testnet.binance.vision/**
3. You should see the Binance Testnet interface (looks like regular Binance but with "Testnet" label)

### Step 2: Login to Your Testnet Account
1. Click **"Login"** in the top right
2. Use the same credentials you used to create your API keys
3. If you don't remember, you can create a new testnet account:
   - Click **"Register"**
   - Use any email (doesn't need verification)
   - Create password
   - Complete registration

### Step 3: Get Your Testnet Address
1. After login, click **"Wallet"** in the top menu
2. Click **"Fiat and Spot"**
3. Find **USDT** in the list
4. Click **"Deposit"**
5. Copy your **USDT deposit address** (you'll need this)

### Step 4: Request Testnet Funds
There are two methods:

#### Method A: Testnet Faucet (Recommended)
1. Visit: **https://testnet.binance.vision/**
2. Look for **"Get Test Funds"** or **"Faucet"** button
3. Select the asset (BTC or USDT)
4. Enter the amount you need:
   - **BTC:** 0.1 BTC recommended
   - **USDT:** 10,000 USDT recommended
5. Click **"Request"**
6. Wait 1-2 minutes for funds to appear

#### Method B: Contact Support (If Faucet Unavailable)
1. Go to Binance Testnet support
2. Request testnet funds via their Telegram group or forum
3. Provide your testnet account email

### Step 5: Verify Funds Received
1. Go back to **"Wallet" → "Fiat and Spot"**
2. Check your balances:
   - You should see your BTC balance
   - You should see your USDT balance

---

## 🧪 Verify Connection from Your App

Once you have funds, verify your app can see them:

```bash
cd backend
npx tsx scripts/test-exchange-connection.ts
```

**Expected output in Step 4:**
```
📋 Step 4: Testing balance access...
✅ Balance retrieved:
   Total assets: 438
   USDT: 10000.00000000
   BTC: 0.10000000
```

---

## 💡 Recommended Testnet Balances

For testing the Token Unlock strategy:

| Asset | Amount | Purpose |
|-------|--------|---------|
| **USDT** | 10,000 | Trading capital (buy tokens) |
| **BTC** | 0.1 | For BTC pairs testing |
| **ETH** | 1.0 | For ETH pairs testing (optional) |
| **BNB** | 10.0 | For BNB pairs + fees (optional) |

**Start with USDT only** - that's all you need for basic testing.

---

## ⚠️ Important Notes

### Testnet Limitations
- **Not Real Money:** All funds are virtual, have no real value
- **Reset Periodically:** Balances may reset every few weeks
- **Limited Assets:** Not all tokens available on testnet
- **No Withdrawals:** Can't withdraw testnet funds (they're not real)

### Testnet vs Live Differences
- Testnet has lower liquidity (fewer traders)
- Price movements may be different from live market
- Some features may be disabled
- Order book depth is limited

### Security
- Never use testnet API keys for live trading
- Keep testnet and live API keys separate
- Don't share your testnet API keys publicly

---

## 🚨 Troubleshooting

### "Faucet Not Found"
- Binance testnet UI changes frequently
- Try searching for "faucet" or "test funds" in the interface
- Check Binance testnet documentation: https://testnet.binance.vision/
- Join Binance testnet Telegram group for help

### "Funds Not Showing in App"
If funds show on Binance testnet website but not in your app:

1. **Check API Key Permissions:**
   - Login to https://testnet.binance.vision/
   - Go to **API Management**
   - Verify your API key has **"Read"** permission enabled

2. **Verify Environment Variables:**
   ```bash
   cd backend
   # Check .env file has correct keys
   cat .env | grep BINANCE
   ```

3. **Re-run Connection Test:**
   ```bash
   npx tsx scripts/test-exchange-connection.ts
   ```

### "API Key Invalid"
If you get "Invalid API Key" error:

1. **Regenerate API Keys:**
   - Go to https://testnet.binance.vision/
   - Navigate to **API Management**
   - Delete old API key
   - Create new API key
   - Copy new keys to `backend/.env`

2. **Update .env File:**
   ```env
   BINANCE_API_KEY=your_new_api_key_here
   BINANCE_SECRET=your_new_secret_key_here
   BINANCE_TESTNET=true
   ```

3. **Re-test:**
   ```bash
   npx tsx scripts/test-exchange-connection.ts
   ```

---

## ✅ Success Checklist

Before proceeding to strategy testing, verify:

- [ ] Logged into https://testnet.binance.vision/
- [ ] Received testnet funds (at least 10,000 USDT)
- [ ] Funds visible in Binance testnet wallet
- [ ] Ran `test-exchange-connection.ts` successfully
- [ ] Script shows USDT balance in Step 4

**Once all checked ✅, you're ready to test the Token Unlock strategy!**

---

## 📞 Need Help?

- **Binance Testnet Docs:** https://testnet.binance.vision/
- **Binance API Docs:** https://binance-docs.github.io/apidocs/spot/en/
- **CCXT Documentation:** https://docs.ccxt.com/
- **Project Docs:** See [BINANCE_TESTNET_SETUP_COMPLETE.md](BINANCE_TESTNET_SETUP_COMPLETE.md)

---

**Next:** Once funded, run `npx tsx scripts/test-token-unlock-strategy.ts` 🚀
