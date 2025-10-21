# 📊 How to View Token Unlock Strategy Results

There are **3 ways** to view your paper trading results. Choose what works best for you!

---

## ✅ Option 1: Command Line Monitor (EASIEST - Recommended)

**Best for:** Daily quick checks (30 seconds)

### How to Run:

**Step 1: Open Command Prompt**
- Press `Win + R`
- Type `cmd`
- Press Enter

**Step 2: Run the monitor script**
```bash
cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\backend"
npx tsx scripts/monitor-unlock-strategy.ts
```

### What You'll See:

```
📊 Token Unlock Strategy Monitor
════════════════════════════════════════════════════════════════════════════════

✅ Strategy: Token Unlock Front-Running (Test)
   Status: active
   Win Rate: 51.00%
   Risk/Reward: 1.04

📋 Execution State:
   Active: 🟢 YES
   Mode: PAPER
   Capital: $10,000
   Total P&L: +$0.00
   Total Trades: 0
   Win Rate: N/A
   Max Drawdown: N/A
   Open Positions: 0 / 3

📅 Upcoming Unlock Events (Next 30 days):
   🎯 APT - Aptos (ENTRY WINDOW ACTIVE - 24h until unlock)
   📅 ARB - Arbitrum (5 days, 11% supply unlock)
   ... (more unlocks)

📡 Recent Signals (Last 5):
   ℹ️  No signals generated yet

💼 Open Positions:
   ℹ️  No open positions

📈 Performance Summary:
   ℹ️  No closed positions yet
```

**Run this daily at 9 AM and 9 PM!**

---

## 🌐 Option 2: Web Dashboard (PRETTIEST)

**Best for:** Visual charts and pretty interface

### How to View:

**Step 1: Generate the dashboard**
```bash
cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\backend"
npx tsx scripts/view-results-web.ts
```

**Step 2: Open the HTML file**
1. Open Windows Explorer (`Win + E`)
2. Navigate to: `C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner`
3. Double-click: **`results.html`**

**Your browser will open showing:**
- 🎯 Strategy Status (active/inactive, mode)
- 💰 Capital & P&L (current, realized, unrealized)
- 📈 Performance Metrics (trades, win rate, drawdown)
- 📅 Upcoming Unlocks (interactive table with entry window indicators)
- 📡 Recent Signals (buy/sell with strength and reasoning)
- 💼 Open Positions (P&L, stop-loss, take-profit)

**Features:**
- Beautiful gradient design
- Color-coded badges (green = good, red = bad)
- Entry window highlighting
- Real-time P&L colors
- Responsive layout
- Refresh button

**To update the dashboard:**
```bash
# Re-run this anytime to refresh data
npx tsx scripts/view-results-web.ts

# Then refresh your browser (F5)
```

---

## 🗄️ Option 3: Database Direct Access (ADVANCED)

**Best for:** SQL queries and raw data analysis

### How to Access:

**Step 1: Open Adminer (Database UI)**

Open your browser and go to:
```
http://localhost:8080
```

**Step 2: Login**
```
System: PostgreSQL
Server: postgres
Username: coinsphere
Password: postgres
Database: coinsphere_dev
```

**Step 3: Query the data**

### Key Tables:

#### 1. **`token_unlock_schedules`** - All unlock events
```sql
SELECT
  t.symbol,
  t.name,
  u.unlock_date,
  u.unlock_amount,
  u.percent_of_supply,
  u.category,
  u.description
FROM token_unlock_schedules u
JOIN tokens t ON u.token_id = t.id
ORDER BY u.unlock_date;
```

#### 2. **`strategy_execution_state`** - Strategy performance
```sql
SELECT
  is_active,
  mode,
  current_capital,
  total_pnl,
  realized_pnl,
  unrealized_pnl,
  total_trades,
  winning_trades,
  losing_trades,
  win_rate,
  max_drawdown,
  current_open_positions
FROM strategy_execution_state;
```

#### 3. **`trading_signals`** - Generated signals
```sql
SELECT
  action,
  symbol,
  strength,
  reasoning,
  executed,
  created_at
FROM trading_signals
ORDER BY created_at DESC
LIMIT 10;
```

**Note:** This table creates automatically when first signal generates.

#### 4. **`live_positions`** - Open/closed positions
```sql
SELECT
  symbol,
  side,
  entry_price,
  quantity,
  pnl,
  pnl_percent,
  status,
  stop_loss_price,
  take_profit_price,
  created_at,
  closed_at
FROM live_positions
ORDER BY created_at DESC
LIMIT 10;
```

**Note:** This table creates automatically when first position opens.

---

## 📊 What to Check Daily

### Morning (9 AM)

**Run:**
```bash
npx tsx scripts/monitor-unlock-strategy.ts
```

**Check:**
1. ✅ Strategy still active? (should be 🟢 YES)
2. 📅 Any new tokens in entry window? (24-48h before unlock)
3. 📡 Any new signals generated?
4. 💼 Any new positions opened?
5. 📈 P&L changes from yesterday?

### Evening (9 PM)

**Run:**
```bash
npx tsx scripts/monitor-unlock-strategy.ts
```

**Check:**
1. 💼 Position P&L updates (how much profit/loss today?)
2. 🎯 Any stop-loss or take-profit hits?
3. 📊 Any positions closed today?
4. 📈 Overall daily performance

**Optional:** Refresh web dashboard
```bash
npx tsx scripts/view-results-web.ts
# Then open results.html in browser
```

---

## 🔍 What Each Metric Means

### Strategy Status
- **🟢 ACTIVE** = Strategy is running and monitoring markets
- **🔴 INACTIVE** = Strategy stopped (needs restart)

### Capital & P&L
- **Current Capital** = Total available money ($10,000 starting)
- **Total P&L** = Realized + Unrealized profit/loss
- **Realized P&L** = Profit/loss from closed trades
- **Unrealized P&L** = Profit/loss from open positions

### Performance
- **Total Trades** = Number of trades executed
- **Win Rate** = % of trades that made profit
- **Max Drawdown** = Worst loss from peak (risk metric)
- **Open Positions** = Current open trades

### Unlock Events
- **🎯 ENTRY WINDOW** = 24-48h before unlock (strategy can enter)
- **⏰ Too Close** = Less than 24h (strategy won't enter)
- **⏳ Waiting** = More than 48h (strategy waiting)

### Signals
- **BUY** = Open long position (bet price goes up)
- **SELL** = Close position or open short
- **Strength** = Confidence level (0-1, higher = more confident)
- **Executed** = Whether trade was placed

### Positions
- **LONG** = Bought token, profit if price goes up
- **Entry Price** = Price when position opened
- **P&L** = Current profit/loss
- **Stop Loss** = Auto-exit if price drops 3%
- **Take Profit** = Auto-exit if price rises 5%
- **Status** = OPEN (active) or CLOSED (exited)

---

## 🎯 Quick Commands Reference

```bash
# Navigate to backend
cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\backend"

# Daily monitor (command line)
npx tsx scripts/monitor-unlock-strategy.ts

# Generate web dashboard
npx tsx scripts/view-results-web.ts

# Full strategy test
npx tsx scripts/test-token-unlock-strategy.ts

# Add more unlock events
npx tsx scripts/add-token-unlock-events.ts
```

---

## 💡 Pro Tips

1. **Bookmark the web dashboard**
   - Open `results.html` in browser
   - Press `Ctrl + D` to bookmark
   - Re-generate daily before viewing

2. **Create a Windows shortcut**
   ```
   Target: C:\Windows\System32\cmd.exe /k cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\backend" && npx tsx scripts/monitor-unlock-strategy.ts
   Name: Token Unlock Monitor
   ```

3. **Set reminders**
   - 9 AM daily: Check monitor
   - 9 PM daily: Check monitor
   - Sunday: Weekly performance review

4. **Screenshot results**
   - Take screenshots of web dashboard
   - Track progress over time
   - Compare week-over-week

---

## 🚨 Troubleshooting

### "Strategy not found"
**Fix:** Run the test script
```bash
npx tsx scripts/test-token-unlock-strategy.ts
```

### "No unlock events"
**Fix:** Add unlock events
```bash
npx tsx scripts/add-token-unlock-events.ts
```

### "Signal/Position table not found"
**Status:** ✅ Normal! Tables create automatically when:
- First signal generates → `trading_signals` table created
- First position opens → `live_positions` table created

### Web dashboard won't open
**Fix:**
1. Make sure `results.html` exists in project root
2. Right-click → Open with → Choose browser
3. Or drag file into browser window

---

## 📅 Weekly Review Checklist

**Every Sunday:**

1. **Run monitor and note:**
   - Total trades this week
   - Win rate
   - Total P&L
   - Max drawdown

2. **Check unlock calendar:**
   - Which unlocks occurred?
   - Did signals generate correctly?
   - Were entry windows accurate?

3. **Review positions:**
   - Which trades won?
   - Which trades lost?
   - Why did they win/lose?

4. **Adjust if needed:**
   - Entry timing (24-48h optimal?)
   - Position size (10% too much/little?)
   - Stop-loss (3% too tight/loose?)
   - Take-profit (5% too aggressive/conservative?)

---

## ✅ Your Daily Routine

**Morning (5 minutes):**
```bash
1. Open Command Prompt
2. cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\backend"
3. npx tsx scripts/monitor-unlock-strategy.ts
4. Check for new signals and positions
5. Note any changes
```

**Evening (5 minutes):**
```bash
1. Run monitor again
2. Check position P&L
3. Look for closed trades
4. Note daily performance
```

**Optional (if you prefer visual):**
```bash
1. npx tsx scripts/view-results-web.ts
2. Open results.html in browser
3. Review pretty dashboard
4. Take screenshot for records
```

---

**🎯 That's it! You now have 3 ways to view your results:**
1. ✅ Command line monitor (fastest)
2. 🌐 Web dashboard (prettiest)
3. 🗄️ Database direct (most powerful)

**Choose whichever you prefer and check daily!** 📊🚀
