# Paper Trading - Next Steps

**Date:** October 21, 2025
**Current Status:** Exchange connected ✅ | Strategy ready ✅
**Next:** Fund testnet → Test strategy → Monitor for 7 days

---

## 🎯 Quick Summary

You've completed:
- ✅ Binance testnet API connection validated
- ✅ Order placement/cancellation working
- ✅ Token Unlock strategy implemented
- ✅ Strategy test script ready

**Now you need to:**
1. Get testnet funds (10 minutes)
2. Run strategy test (1 minute)
3. Monitor paper trading (7 days)

---

## 📋 Step-by-Step Guide

### Step 1: Get Testnet Funds (10 minutes)

**See full guide:** [GET_TESTNET_FUNDS_GUIDE.md](GET_TESTNET_FUNDS_GUIDE.md)

**Quick version:**
1. Visit: https://testnet.binance.vision/
2. Login to your testnet account
3. Request funds from the faucet:
   - **10,000 USDT** (for trading)
   - **0.1 BTC** (optional, for BTC pairs)
4. Verify funds received:
   ```bash
   cd backend
   npx tsx scripts/test-exchange-connection.ts
   ```
   Should show USDT balance in Step 4

---

### Step 2: Run Strategy Test (1 minute)

Once you have testnet funds, run the strategy test:

```bash
cd backend
npx tsx scripts/test-token-unlock-strategy.ts
```

**What this test does:**

1. **Creates/finds Token Unlock strategy** in database
2. **Creates test token** (APT - Aptos)
3. **Creates test unlock event** (25 hours from now, 10% supply unlock)
4. **Starts strategy executor** (connects to Binance)
5. **Activates strategy in PAPER mode** ($10,000 virtual capital)
6. **Monitors for 30 seconds** (checks signal generation)
7. **Shows results:**
   - Signals generated
   - Positions opened (if any)
   - Execution state
8. **Stops strategy** gracefully

**Expected Duration:** 30-60 seconds

**Expected Output:**
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

✅ Signals generated: 1
   Signal: BUY APT/USDT
   Strength: 0.85
   Reasoning: Large unlock in 25h (10% supply) - front-running opportunity
   Executed: ✅
   Timestamp: 2025-10-21T...

📋 Step 8: Checking positions...
✅ Positions: 1
   Position: LONG APT/USDT
   Entry: $12.345678
   Quantity: 810.37
   Status: open
   P&L: $0.00 (0.00%)

📋 Step 9: Stopping strategy...
✅ Strategy stopped
✅ Strategy executor stopped

════════════════════════════════════════════════════════════════════════════════
✅ TEST COMPLETED SUCCESSFULLY
════════════════════════════════════════════════════════════════════════════════

📊 Summary:
   Strategy: Token Unlock Front-Running
   Test duration: 30 seconds
   Signals: 1
   Positions: 1
   Mode: PAPER (no real trades)

💡 Next steps:
   1. Add real unlock event data via Nansen MCP
   2. Test with live market data from Binance
   3. Monitor signals and validate entry/exit logic
   4. Once validated, switch to LIVE mode

✨ Token Unlock strategy is ready for production!
```

---

### Step 3: Monitor Paper Trading (7 Days)

After successful test, activate the strategy for continuous paper trading:

#### Option A: Keep Strategy Running (Recommended)

**Start the backend server:**
```bash
cd backend
npm run dev
```

**Activate strategy via API:**
```bash
# POST http://localhost:3001/api/v1/strategies/activate
curl -X POST http://localhost:3001/api/v1/strategies/activate \
  -H "Content-Type: application/json" \
  -d '{
    "strategyId": "YOUR_STRATEGY_ID",
    "symbols": ["APT/USDT", "ARB/USDT"],
    "exchange": "binance",
    "mode": "paper",
    "allocatedCapital": 10000,
    "maxPositionSize": 0.10,
    "maxOpenPositions": 3,
    "dailyLossLimit": 0.05,
    "stopLoss": 0.03,
    "takeProfit": 0.05
  }'
```

**Monitor in real-time:**
1. Keep backend running 24/7 (or during market hours)
2. Check signals generated:
   ```bash
   # View recent signals
   curl http://localhost:3001/api/v1/signals?strategyId=xxx&limit=10
   ```
3. Check positions:
   ```bash
   # View open positions
   curl http://localhost:3001/api/v1/positions?strategyId=xxx&status=open
   ```
4. Check performance:
   ```bash
   # View P&L summary
   curl http://localhost:3001/api/v1/strategies/xxx/performance
   ```

#### Option B: Manual Testing (Quick Tests)

Run the test script whenever you want to check:
```bash
npx tsx scripts/test-token-unlock-strategy.ts
```

This is good for:
- Quick validation
- Testing changes
- One-off checks

But not ideal for continuous monitoring.

---

## 📊 What to Monitor

### Daily Checks (5 minutes)

1. **Signals Generated:**
   - How many BUY signals triggered?
   - How many SELL signals triggered?
   - Signal quality (strength scores)

2. **Positions Opened:**
   - Entry prices vs actual unlock times
   - Position sizes (should be ~10% of capital)
   - Stop-loss and take-profit levels

3. **P&L Tracking:**
   - Realized P&L (closed positions)
   - Unrealized P&L (open positions)
   - Win rate percentage
   - Average return per trade

4. **Risk Metrics:**
   - Daily loss limit hit? (should stay under 5%)
   - Max positions respected? (max 3)
   - Stop-losses triggered?

### Weekly Review (30 minutes)

1. **Performance Analysis:**
   - Total P&L for the week
   - Number of trades executed
   - Best performing pairs
   - Worst performing pairs

2. **Strategy Validation:**
   - Did front-running work? (bought before unlocks)
   - Did prices drop after unlocks? (sell signals triggered)
   - Entry timing correct? (24-48h before)
   - Exit timing correct? (0-2h after unlock)

3. **System Health:**
   - Any errors or crashes?
   - API rate limits hit?
   - Database performance OK?
   - Memory/CPU usage normal?

---

## 🎯 Success Criteria (Week 1-2)

Before moving to live trading, validate:

### Minimum Requirements
- [ ] Strategy runs without crashes for 7 days
- [ ] At least 10 signals generated
- [ ] At least 5 positions opened
- [ ] No critical errors in logs
- [ ] Stop-loss and take-profit working correctly
- [ ] Position sizing correct (~10% of capital)
- [ ] Risk limits respected (daily loss, max positions)

### Performance Targets (Nice to Have)
- [ ] Win rate > 45% (matches backtest: 51%)
- [ ] Average return > 0.3% per trade (backtest: 0.51%)
- [ ] Max drawdown < 15% (backtest: -12.5%)
- [ ] Sharpe ratio > 0 (backtest: 0.08)

**Note:** Paper trading results may differ from backtest due to:
- Limited testnet liquidity
- Different market conditions
- Testnet price feed delays
- Fewer unlock events available

---

## ⚠️ Troubleshooting

### "No signals generated after 7 days"

**Possible causes:**
1. **No unlock events in date range**
   - Token unlock events are rare
   - Try adding more tokens: ARB, OP, IMX, DYDX
   - Use Nansen MCP to find upcoming unlocks

2. **Market data not streaming**
   - Check backend logs for errors
   - Verify Binance connection still active
   - Re-run: `npx tsx scripts/test-exchange-connection.ts`

3. **Strategy not activated**
   - Check execution state in database
   - Verify `isActive = true`
   - Check strategy executor logs

**Solution:**
```bash
# Add more tokens with upcoming unlocks
# Check Nansen MCP for token unlock calendar
npx tsx scripts/add-unlock-events.ts
```

### "Positions not opening despite signals"

**Possible causes:**
1. **Insufficient testnet balance**
   - Request more USDT from faucet
   - Verify balance > $10,000

2. **Order placement failing**
   - Check API permissions (need "Trading" enabled)
   - Check order logs for errors
   - Verify symbol exists on Binance (APT/USDT, etc.)

3. **Paper mode preventing orders**
   - This is expected - paper mode simulates orders
   - Check `simulated_orders` table instead of `live_positions`

**Solution:**
```bash
# Check order logs
tail -f backend/logs/orders.log

# Verify balance
npx tsx scripts/test-exchange-connection.ts
```

### "Strategy crashed after X hours"

**Possible causes:**
1. **API rate limit exceeded**
   - Default: 1200 requests/minute
   - Reduce polling frequency
   - Add rate limit backoff

2. **Database connection lost**
   - Check PostgreSQL running
   - Check connection string correct
   - Restart database if needed

3. **Memory leak**
   - Check memory usage: `top` or Task Manager
   - Restart backend if memory > 2GB

**Solution:**
```bash
# Restart backend
cd backend
npm run dev

# Re-activate strategy
curl -X POST http://localhost:3001/api/v1/strategies/activate [...]
```

---

## 📈 After 7 Days: Live Trading Checklist

If paper trading successful, prepare for live trading:

### Pre-Live Checklist
- [ ] Paper trading ran for 7+ days without crashes
- [ ] Performance metrics acceptable (win rate, returns)
- [ ] All risk limits working (stop-loss, daily loss, position size)
- [ ] Reviewed all closed positions (at least 5)
- [ ] Understand why winning trades won and losing trades lost
- [ ] Comfortable with strategy logic and execution

### Go-Live Steps (Week 7-8)
1. **Switch to live API:**
   - Remove `BINANCE_TESTNET=true` from `.env`
   - Add live Binance API keys
   - Test connection: `npx tsx scripts/test-exchange-connection.ts`

2. **Start with small capital:**
   - Allocate only $100-500 initially
   - Increase after successful live trades

3. **Monitor closely:**
   - Check every trade within 1 hour
   - Review P&L daily
   - Set up real-time alerts (Telegram, SMS)

4. **Scale gradually:**
   - Week 1: $100-500
   - Week 2: $500-1,000
   - Week 3: $1,000-2,000
   - Week 4+: Scale based on performance

---

## 🔗 Related Documentation

- **[BINANCE_TESTNET_SETUP_COMPLETE.md](BINANCE_TESTNET_SETUP_COMPLETE.md)** - Testnet setup guide
- **[GET_TESTNET_FUNDS_GUIDE.md](GET_TESTNET_FUNDS_GUIDE.md)** - How to get testnet funds
- **[API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)** - All API requirements
- **[PHASE_2_COMPLETE_SUMMARY.md](PHASE_2_COMPLETE_SUMMARY.md)** - Live trading infrastructure

---

## 📞 Need Help?

- **Backend logs:** `backend/logs/` folder
- **Database:** Adminer at http://localhost:8080
- **API docs:** http://localhost:3001/docs (when backend running)
- **Binance testnet:** https://testnet.binance.vision/

---

**Current Step:** Get testnet funds → Run strategy test 🚀
