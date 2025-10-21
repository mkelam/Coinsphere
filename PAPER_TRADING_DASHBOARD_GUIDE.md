# 📊 Paper Trading Dashboard - Complete Guide

## ✅ What We Built

You now have a **beautiful, real-time React dashboard** integrated into your Coinsphere frontend that displays:

- ✅ Strategy status (active/inactive, mode, capital)
- ✅ P&L tracking (total, realized, unrealized)
- ✅ Upcoming unlock events with entry window alerts
- ✅ Generated signals with execution status
- ✅ Open and closed positions with P&L
- ✅ Performance metrics (win rate, trades, drawdown)
- ✅ Auto-refresh every 30 seconds

---

## 🚀 How to Access the Dashboard

### Step 1: Start the Backend Server

```bash
cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\backend"
npm run dev
```

**Expected Output:**
```
🚀 Coinsphere API Server running on port 3001
📊 Environment: development
🔗 Health check: http://localhost:3001/health
```

### Step 2: Start the Frontend Dev Server

**Open a NEW terminal/command prompt:**

```bash
cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\frontend"
npm run dev
```

**Expected Output:**
```
  VITE v5.0.8  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3: Open the Dashboard

**In your browser, go to:**
```
http://localhost:5173/paper-trading
```

---

## 🎨 Dashboard Features

### Top Cards (Strategy Overview)

**Card 1: Status**
- 🟢 ACTIVE/🔴 INACTIVE badge
- PAPER mode indicator
- Win rate (from backtest: 51%)

**Card 2: Capital**
- Current capital: $10,000
- Allocated capital: $10,000

**Card 3: Total P&L**
- Green for profit, Red for loss
- Realized P&L
- Unrealized P&L

**Card 4: Performance**
- Total trades
- Winners (W)
- Losers (L)
- Current win rate

### Tabs

**Tab 1: Upcoming Unlocks**
- Lists all unlock events in next 30 days
- 🎯 **ENTRY WINDOW** badge (24-48h before unlock)
- ⏰ **Too Close** badge (< 24h)
- 🕐 **Waiting** badge (> 48h)
- Shows days/hours until unlock
- Amount and % of supply

**Tab 2: Signals**
- Recent trading signals (last 10)
- **BUY/SELL** badges (green/red)
- Signal strength (confidence level)
- Reasoning for signal
- ✅ Executed or ⏳ Pending status
- Timestamp

**Tab 3: Positions**
- Open and closed positions
- **LONG/SHORT** badges
- Entry price, quantity
- Current P&L (color-coded)
- Stop-loss and take-profit levels
- Open/Close timestamps

---

## 📡 API Endpoints (Already Working)

The dashboard fetches data from these backend endpoints:

### 1. Overview Endpoint
```
GET http://localhost:3001/api/v1/paper-trading/overview
```
**Returns:** Strategy info, execution state, capital, P&L

### 2. Unlocks Endpoint
```
GET http://localhost:3001/api/v1/paper-trading/unlocks?days=30
```
**Returns:** Upcoming unlock events with entry window status

### 3. Signals Endpoint
```
GET http://localhost:3001/api/v1/paper-trading/signals?limit=10
```
**Returns:** Recent trading signals

### 4. Positions Endpoint
```
GET http://localhost:3001/api/v1/paper-trading/positions?limit=10&status=open
```
**Returns:** Open or closed positions

---

## 🎯 What You'll See Right Now

### Current Status (Oct 21, 2025)

**✅ Working:**
- Strategy: Active in PAPER mode
- Capital: $10,000
- Unlock Events: 6 tokens loaded
  - APT: 1 day until unlock (ENTRY WINDOW!)
  - ARB: 5 days
  - OP: 7 days
  - APE: 8 days
  - APT (2nd): 10 days
  - IMX: 12 days
  - DYDX: 14 days

**⏳ Pending (Will Appear Soon):**
- Signals: Will generate when APT approaches 24-48h window
- Positions: Will open when signals execute
- P&L: Will update as positions move

---

## 🔄 Auto-Refresh

**The dashboard refreshes every 30 seconds automatically!**

You'll see:
- Last updated timestamp (top right)
- 🔄 Refresh button (manual refresh)
- Auto-refresh indicator

---

## 📊 Color Coding System

### Status Badges
- 🟢 **Green** = Active, Open position, Executed signal, Entry window
- 🔴 **Red** = Inactive, Closed position, Too close to unlock
- 🔵 **Blue** = Waiting, Pending
- ⚪ **Gray** = Passed unlock, Historical

### P&L Display
- **Green (+)** = Profitable
- **Red (-)** = Losing

### Signal Actions
- **Green BUY** = Long position
- **Red SELL** = Short or close position

---

## 🎨 Design Features

**Modern Glassmorphism UI:**
- Dark background with gradient
- Semi-transparent cards (glass effect)
- White text with opacity variations
- Smooth animations
- Responsive grid layout

**Icons:**
- Activity indicator for status
- Dollar sign for capital
- Trending up/down arrows for P&L
- Target for performance
- Clock for waiting unlocks
- Check/X for execution status

---

## 🧪 Testing the Dashboard

### Test 1: View Unlock Events

1. Open dashboard
2. Click "Upcoming Unlocks" tab
3. Look for APT with 🎯 **ENTRY WINDOW** badge
4. Verify shows 1 day (24 hours) until unlock

### Test 2: Wait for Signals

**Signals should generate when:**
- APT enters 24-48h window (already there!)
- Strategy detects unlock event
- Signal strength calculated

**Check:**
1. Click "Signals" tab
2. Wait 1-2 minutes
3. Refresh manually (🔄 button)
4. Look for **BUY APT** signal

### Test 3: Monitor Positions

**When signal executes:**
1. Position opens automatically
2. Shows entry price
3. Shows quantity (10% of capital = $1,000)
4. Shows stop-loss (-3%) and take-profit (+5%)

**Check:**
1. Click "Positions" tab
2. Look for **APT/USDT LONG** position
3. Watch P&L update in real-time

---

## ⚙️ Configuration

### Backend Port
- Default: 3001
- Change in: `backend/.env` → `PORT=3001`

### Frontend Port
- Default: 5173
- Change in: `frontend/vite.config.ts`

### API Base URL
- Dev: `http://localhost:3001/api/v1`
- Change in: `frontend/.env` → `VITE_API_BASE_URL`

### Auto-Refresh Interval
- Current: 30 seconds
- Change in: `frontend/src/pages/PaperTradingDashboard.tsx` line 86
- ```typescript
  const interval = setInterval(() => fetchData(true), 30000); // 30s
  ```

---

## 🛠️ Troubleshooting

### Dashboard Won't Load

**Check 1: Backend Running?**
```bash
curl http://localhost:3001/health
```
Should return: `{"status":"ok"}`

**Check 2: Frontend Running?**
Open: `http://localhost:5173`
Should show Coinsphere home page

**Check 3: Route Exists?**
Open: `http://localhost:5173/paper-trading`
Should show dashboard (not 404)

### No Data Showing

**Check 1: API Returning Data?**
```bash
curl http://localhost:3001/api/v1/paper-trading/overview
```
Should return JSON with strategy data

**Check 2: Unlock Events Added?**
```bash
cd backend
npx tsx scripts/monitor-unlock-strategy.ts
```
Should show 6 unlock events

**Check 3: Console Errors?**
1. Press F12 in browser
2. Click "Console" tab
3. Look for red errors
4. Check "Network" tab for failed requests

### Dashboard Shows "Loading..." Forever

**Check:**
1. Open browser console (F12)
2. Look for CORS errors
3. Verify backend allows `http://localhost:5173`
4. Check `backend/src/server.ts` line 103-111

**Fix:** Backend should allow frontend origin in CORS config

### Positions/Signals Tables Empty

**This is NORMAL!**
- Signals table creates when first signal generates
- Positions table creates when first position opens
- You'll see: "No signals generated yet" (expected message)

---

## 📱 Responsive Design

**Works on:**
- ✅ Desktop (1920x1080+)
- ✅ Laptop (1366x768+)
- ✅ Tablet (768px+)
- ✅ Mobile (375px+)

**Mobile View:**
- Cards stack vertically
- Tabs stay horizontal
- Tables scroll horizontally
- Refresh button stays fixed

---

## 🎯 Next Steps

### Day 1-2
- [x] Access dashboard at http://localhost:5173/paper-trading
- [ ] Verify unlock events showing
- [ ] Wait for APT signals to generate
- [ ] Monitor first position opening

### Day 3-7
- [ ] Check dashboard twice daily (9 AM, 9 PM)
- [ ] Watch positions open and close
- [ ] Track P&L changes
- [ ] Review performance metrics

### Week 2+
- [ ] Analyze which unlocks generated best signals
- [ ] Review win rate vs backtest (51%)
- [ ] Decide on strategy adjustments
- [ ] Consider adding more unlock events

---

## 📚 Files Created

### Backend
1. **`backend/src/routes/paperTrading.ts`** - API endpoints
   - GET /overview
   - GET /unlocks
   - GET /signals
   - GET /positions
   - GET /performance

2. **`backend/src/server.ts`** - Route registration (line 42, 188)

### Frontend
3. **`frontend/src/pages/PaperTradingDashboard.tsx`** - Main dashboard component
4. **`frontend/src/App.tsx`** - Route added (line 41, 105)

---

## 🔗 Quick Links

| Resource | URL |
|----------|-----|
| **Dashboard** | http://localhost:5173/paper-trading |
| **Backend API** | http://localhost:3001/api/v1 |
| **API Health** | http://localhost:3001/health |
| **Adminer DB** | http://localhost:8080 |
| **API Docs** | http://localhost:3001/api-docs |

---

## 💡 Pro Tips

1. **Bookmark the Dashboard**
   - Press `Ctrl + D` on http://localhost:5173/paper-trading
   - Quick access for daily monitoring

2. **Keep Terminals Open**
   - Terminal 1: Backend server (npm run dev)
   - Terminal 2: Frontend server (npm run dev)
   - Don't close them!

3. **Check Both Views**
   - Dashboard for visual overview
   - Command line monitor for detailed logs
   - Database (Adminer) for raw data

4. **Watch for Entry Windows**
   - 🎯 badge appears 24-48h before unlock
   - Signals should generate automatically
   - Check "Signals" tab frequently

5. **Understand P&L**
   - **Unrealized** = Open positions (can change)
   - **Realized** = Closed positions (locked in)
   - **Total** = Both combined

---

## ✅ Final Checklist

Before monitoring:

- [x] Backend API endpoints created
- [x] Frontend dashboard page created
- [x] Route added to App.tsx
- [x] API tested and working
- [x] 6 unlock events loaded
- [x] Strategy active in PAPER mode
- [ ] **Start backend server**
- [ ] **Start frontend server**
- [ ] **Open dashboard in browser**
- [ ] **Bookmark dashboard URL**

---

## 🎉 You're Ready!

**To start monitoring:**

```bash
# Terminal 1: Backend
cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\backend"
npm run dev

# Terminal 2: Frontend (NEW terminal)
cd "C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\frontend"
npm run dev

# Browser
http://localhost:5173/paper-trading
```

**Then:**
- Check dashboard twice daily
- Watch for signals when APT enters window
- Monitor P&L as positions move
- Review performance metrics weekly

---

**🚀 Happy Paper Trading!**

Built with React, TypeScript, Tailwind CSS, and Shadcn/ui
Powered by Prisma, PostgreSQL, and Express.js

**Remember:** This is PAPER TRADING - No real money at risk! 📊✨
