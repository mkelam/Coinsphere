# Run Strategy Test NOW - No Testnet Funds Needed!

**IMPORTANT:** You do NOT need testnet funds to run this test! It uses **paper mode** with simulated capital.

---

## 🎯 Quick Summary

The strategy test runs in **PAPER mode** which means:
- ✅ Uses $10,000 **virtual** capital (not real money)
- ✅ Simulates all orders (no real exchange trades)
- ✅ Gets real market data from Binance (prices, ticker)
- ✅ Tests complete strategy flow without risk

**You can run this test RIGHT NOW without testnet funds!**

---

## 📍 Where to Run the Script

### Option 1: VS Code Terminal (Recommended)

1. **Open VS Code**
   - Open your project folder: `C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner`

2. **Open Integrated Terminal**
   - Press `` Ctrl+` `` (Control + Backtick)
   - Or: Menu → Terminal → New Terminal

3. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

4. **Run the test:**
   ```bash
   npx tsx scripts/test-token-unlock-strategy.ts
   ```

---

### Option 2: Windows Command Prompt

1. **Open Command Prompt**
   - Press `Win + R`
   - Type `cmd`
   - Press Enter

2. **Navigate to backend folder:**
   ```cmd
   cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\backend"
   ```

3. **Run the test:**
   ```cmd
   npx tsx scripts\test-token-unlock-strategy.ts
   ```

---

### Option 3: Windows PowerShell

1. **Open PowerShell**
   - Press `Win + X`
   - Select "Windows PowerShell"

2. **Navigate to backend folder:**
   ```powershell
   cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\backend"
   ```

3. **Run the test:**
   ```powershell
   npx tsx scripts/test-token-unlock-strategy.ts
   ```

---

## ✅ What the Test Does (30 seconds)

The script will:

1. **Find/Create Token Unlock Strategy** in database
2. **Create test token** (APT - Aptos)
3. **Create test unlock event** (25 hours from now, 10% supply unlock)
4. **Start strategy executor** (connects to Binance)
5. **Activate strategy in PAPER mode** ($10,000 virtual capital)
6. **Subscribe to market data** (APT/USDT ticker)
7. **Monitor for 30 seconds** (check signal generation)
8. **Show results:**
   - Signals generated (if any)
   - Positions opened (if any)
   - Execution state
9. **Stop strategy** gracefully

**Total Duration:** 30-60 seconds

---

## 📊 Expected Output

You should see something like:

```
🧪 Testing Token Unlock Front-Running Strategy

════════════════════════════════════════════════════════════════════════════════

📋 Step 1: Finding Token Unlock strategy...
✅ Found strategy: Token Unlock Front-Running (ID: xxx)

📋 Step 2: Creating sample unlock events...
✅ Found token: APT
✅ Created test unlock event for APT
   Unlock date: 2025-10-22T...
   Amount: 50M tokens (10% of supply)

📋 Step 3: Starting strategy executor...
✅ Strategy executor started

📋 Step 4: Activating Token Unlock strategy...
✅ Strategy activated in PAPER mode
   Capital: $10000
   Symbols: APT/USDT

📋 Step 5: Checking execution state...
✅ Execution state created:
   Active: true
   Mode: paper
   Capital: $10000.00
   Max positions: 3
   Daily loss limit: 5.0%

📋 Step 6: Checking market data subscriptions...
✅ Active subscriptions: 1
   - APT/USDT (binance) - ticker

📋 Step 7: Monitoring for signals (30 seconds)...
⏳ Waiting for market data updates and signal generation...

✅ Signals generated: 0-1
   (May be 0 if no signals triggered yet - that's normal)

📋 Step 8: Checking positions...
✅ Positions: 0
   ℹ️  No positions opened yet

📋 Step 9: Stopping strategy...
✅ Strategy stopped
✅ Strategy executor stopped

════════════════════════════════════════════════════════════════════════════════
✅ TEST COMPLETED SUCCESSFULLY
════════════════════════════════════════════════════════════════════════════════

📊 Summary:
   Strategy: Token Unlock Front-Running
   Test duration: 30 seconds
   Signals: 0-1
   Positions: 0
   Mode: PAPER (no real trades)
```

---

## ⚠️ Possible Errors & Solutions

### Error: "Cannot find module 'dotenv'"
**Solution:**
```bash
npm install
```

### Error: "Database connection failed"
**Solution:**
```bash
# Start Docker containers
docker-compose up -d
```

### Error: "BINANCE_API_KEY not found"
**Solution:**
- Keys are already in `backend/.env`
- The script should load them automatically
- If not, check `.env` file exists in `backend/` folder

### Error: "Command 'npx' not found"
**Solution:**
- Make sure you're in the `backend` folder
- Verify Node.js installed: `node --version`
- Should show: v20.x.x

---

## 🎯 What Happens in PAPER Mode?

### Market Data (Real)
- ✅ Connects to Binance testnet
- ✅ Gets real APT/USDT price ticker
- ✅ Receives market updates

### Trading (Simulated)
- 🔷 **Virtual capital:** $10,000 (not real)
- 🔷 **Simulated orders:** No real trades placed
- 🔷 **Simulated fills:** Orders filled at market price
- 🔷 **Track P&L:** All calculations based on real prices

### What Gets Saved
- ✅ Strategy execution state (in database)
- ✅ Trading signals (in database)
- ✅ Simulated positions (in database)
- ✅ P&L calculations (in database)

**Result:** You can test the complete strategy without any financial risk!

---

## 💡 About Testnet Funds

### Do I Need Them?
**For this test: NO** ✅

The test runs in **paper mode** (simulated), so no real or testnet funds are needed.

### When DO I Need Testnet Funds?
**For live testnet trading: YES** (but that's later)

If you want to place **actual orders** on Binance testnet (not simulated), you would need testnet funds. But:
- ⚠️ **Binance Spot testnet faucet is currently down** (404 error)
- 🔷 **Alternative:** Use Binance Futures testnet which has working faucet
- ✅ **For now:** Paper mode is sufficient for validation

### How to Get Testnet Funds (When Available)
**Option 1: Wait for Binance Spot faucet to be fixed**
- Check: https://testnet.binance.vision/
- Look for "Faucet" or "Get Test Funds" button

**Option 2: Use Binance Futures Testnet** (working faucet)
- Visit: https://testnet.binancefuture.com/
- Login and request funds from faucet
- Get USDT for futures trading

**Option 3: Request via Binance Developer Community**
- Visit: https://dev.binance.vision/
- Post request with your testnet account email
- Binance support manually adds funds

---

## 🚀 Run It Now!

**Copy and paste this into your terminal:**

```bash
cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\backend"
npx tsx scripts/test-token-unlock-strategy.ts
```

**That's it!** The test will run for 30 seconds and show you the complete strategy flow.

---

## 📋 After the Test

### If Successful ✅
- Strategy infrastructure validated
- Database connections working
- Exchange integration working
- Ready for continuous monitoring

### Next Steps
1. **Review test output** - check for any errors
2. **Verify database entries** - use Adminer at http://localhost:8080
3. **Check execution state** - confirm strategy can activate/deactivate
4. **Plan continuous monitoring** - see [PAPER_TRADING_NEXT_STEPS.md](PAPER_TRADING_NEXT_STEPS.md)

### If Errors ❌
- Copy the error message
- Check the troubleshooting section above
- Review backend logs in `backend/logs/`
- Ask for help with specific error details

---

## 🎊 Why This Is Awesome

You can now:
- ✅ Test complete trading strategy
- ✅ Without risking any money
- ✅ With real market data
- ✅ Validate entry/exit logic
- ✅ Track P&L calculations
- ✅ Monitor signal generation

**All in 30 seconds, without testnet funds!**

---

**Ready? Run the command above now! 🚀**
