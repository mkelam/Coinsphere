# API Types Explained - Coinsphere Trading Platform

**What Kind of APIs Do You Need?**

This document explains the different types of APIs, what they do, and which ones you need for your trading platform.

---

## 📊 Overview: API Types You're Using

| API Type | What It Is | Example in Your Project |
|----------|-----------|------------------------|
| **REST API** | Standard request/response | Binance, CoinGecko, Nansen |
| **WebSocket** | Real-time streaming | Binance price feeds (future) |
| **Webhook** | Server pushes data to you | PayFast payments (already set) |
| **SDK/Library** | Pre-built code wrapper | CCXT for exchanges |
| **Email API** | Send emails programmatically | SendGrid (already configured ✅) |

---

## 1️⃣ REST API (What You Need Most)

### What It Is
- **Traditional API:** You send a request → Server sends response
- **Like ordering food:** You ask for data → Server delivers it
- **One request = One response**

### Examples in Your Project

#### Binance REST API
```typescript
// You send request
GET https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT

// Binance sends response
{
  "symbol": "BTCUSDT",
  "price": "43250.50"
}
```

**What you use it for:**
- Fetch current prices
- Place orders
- Check account balance
- Get order history
- Check order status

#### CoinGecko REST API
```typescript
// You send request
GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd

// CoinGecko sends response
{
  "bitcoin": {
    "usd": 43250
  }
}
```

**What you use it for:**
- Historical price data
- Market cap information
- Trading volume
- Token information

#### Nansen REST API
```typescript
// You send request
GET https://api.nansen.ai/v1/token-unlock-schedule

// Nansen sends response
{
  "unlocks": [
    {
      "token": "APT",
      "date": "2025-10-25",
      "amount": 50000000,
      "percent": 10
    }
  ]
}
```

**What you use it for:**
- Token unlock events
- Smart money wallet data
- On-chain analytics

---

## 2️⃣ WebSocket API (Future Enhancement)

### What It Is
- **Real-time streaming:** Constant data flow
- **Like a phone call:** Connection stays open, data flows continuously
- **Push-based:** Server pushes data when it changes

### Example: Binance WebSocket

```typescript
// Open connection
const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

// Server continuously pushes data
ws.onmessage = (event) => {
  console.log('New trade:', event.data);
  // { price: 43251, quantity: 0.5, time: 1234567890 }
};

// Data comes every few milliseconds!
```

**Advantages:**
- Much faster than REST (milliseconds vs seconds)
- Lower latency for price updates
- Reduced server load

**Current Status in Your Project:**
- ❌ Not implemented yet
- ✅ Using REST API polling instead (good enough for now)
- 📅 Planned for Week 5-6 (performance optimization)

**When You Need It:**
- For high-frequency trading
- For real-time price displays
- For faster signal generation
- Future enhancement (not critical now)

---

## 3️⃣ Webhook API (Already Configured! ✅)

### What It Is
- **Reverse API:** Server calls YOUR API
- **Like a doorbell:** External service notifies you when something happens
- **You provide an endpoint, they push data to you**

### Example: PayFast Webhook (You Already Have This!)

**How It Works:**
```
1. User pays via PayFast
2. PayFast payment completes
3. PayFast calls YOUR server:
   POST http://yourdomain.com/api/v1/payments/webhook
   {
     "payment_id": "12345",
     "amount": "9.99",
     "status": "complete"
   }
4. Your server updates user subscription
```

**Your Implementation:**
```typescript
// File: backend/src/routes/payments.ts
router.post('/webhook', async (req, res) => {
  const { payment_id, status } = req.body;

  // PayFast pushed this data to you!
  if (status === 'complete') {
    await activateUserSubscription(payment_id);
  }

  res.status(200).send('OK');
});
```

**Current Status:**
- ✅ Already configured in your project
- ✅ PayFast webhook endpoint exists
- ✅ No additional setup needed

**You DON'T Need Webhooks For:**
- Binance (you use REST API instead)
- CoinGecko (you poll for data)
- Nansen (you request data)

---

## 4️⃣ SDK/Library (What You're Using: CCXT)

### What It Is
- **Pre-built wrapper:** Someone wrote code to make API calls easier
- **Like a translator:** Converts complex API calls to simple functions
- **Unified interface:** Same code works for multiple exchanges

### Example: CCXT Library

**Without CCXT (Raw REST API):**
```typescript
// Hard way - different for every exchange
const response = await fetch('https://api.binance.com/api/v3/order', {
  method: 'POST',
  headers: {
    'X-MBX-APIKEY': apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    symbol: 'BTCUSDT',
    side: 'BUY',
    type: 'MARKET',
    quantity: 0.001,
    timestamp: Date.now(),
    signature: generateSignature(...) // Complex crypto!
  })
});
```

**With CCXT (Easy way):**
```typescript
// Easy way - same for all exchanges!
const order = await exchange.createMarketBuyOrder('BTC/USDT', 0.001);
```

**Current Status:**
- ✅ Already using CCXT v4.2.0
- ✅ Configured in `backend/src/services/exchange/BinanceConnector.ts`
- ✅ Works for Binance, can add Coinbase/Kraken later

---

## 5️⃣ Email API (Already Configured! ✅)

### What It Is
- **Programmatic emails:** Send emails via code
- **No SMTP server needed:** Service handles it
- **Transactional emails:** Alerts, notifications, reports

### SendGrid (You Already Have This!)

**Your Configuration:**
```env
SENDGRID_API_KEY=SG.jhlpMJA7QfOnQ7piWQFdZA...
SENDGRID_FROM_EMAIL=mmkela@gmail.com
```

**How You'll Use It:**
```typescript
// Example: Send alert when position closes
await sendEmail({
  to: user.email,
  subject: 'Position Closed: BTC/USDT',
  text: `Your position closed with +2.5% profit ($125 gain)`,
  html: '<h1>Position Closed</h1><p>Profit: +2.5%</p>'
});
```

**Current Status:**
- ✅ API key already configured
- ✅ Ready to use
- ⏳ Need to implement email templates
- 📅 Will use in Week 3-4 for trading alerts

---

## 📋 Summary: What APIs You Actually Need

### ✅ Already Configured
1. **SendGrid** - Email API ✅
   - Type: REST API
   - Status: Configured and ready
   - API Key: Already in .env

2. **PayFast** - Webhook API ✅
   - Type: Webhook
   - Status: Configured
   - Endpoint: `/api/v1/payments/webhook`

3. **CoinGecko** - REST API ✅
   - Type: REST API
   - Status: Working
   - API Key: Already in .env

4. **Nansen** - REST API via MCP ✅
   - Type: REST API
   - Status: Integrated via MCP
   - Working through MCP server

### ⏳ Need to Set Up Now (Week 1)

5. **Binance Testnet** - REST API
   - Type: REST API (with WebSocket option)
   - What to get: API Key + Secret
   - Where: https://testnet.binance.vision/
   - Add to .env:
     ```env
     BINANCE_API_KEY=your_key
     BINANCE_SECRET=your_secret
     BINANCE_TESTNET=true
     ```

### 🔮 Future (Week 7-8)

6. **Binance Live** - REST API
   - Same as testnet, but real money
   - Only after paper trading success

### 🚀 Optional Future Enhancements

7. **Binance WebSocket** - WebSocket API
   - For real-time streaming
   - Week 5-6 optimization
   - Not critical now

8. **Twilio** - REST API
   - SMS alerts
   - Optional

---

## 🎯 What You Need to Understand

### Question 1: "Which kind of API?"

**Answer:** Primarily **REST APIs** for everything:

- **Binance:** REST API (standard request/response)
  - You call their API when you need data
  - Example: `GET /api/v3/ticker/price`

- **CoinGecko:** REST API
  - You request price data
  - Example: `GET /simple/price`

- **Nansen:** REST API (via MCP)
  - You request on-chain data
  - Already working through MCP

**You're NOT using:**
- ❌ GraphQL APIs
- ❌ SOAP APIs
- ❌ gRPC APIs
- ❌ FIX Protocol (institutional trading)
- ⏳ WebSocket (future)

### Question 2: "SendGrid already has API key?"

**Answer:** ✅ YES! You're all set for email.

**What you have:**
```env
SENDGRID_API_KEY=SG.xxx...xxx (already configured in .env)
SENDGRID_FROM_EMAIL=mmkela@gmail.com
```

**What this means:**
- ✅ SendGrid account already created
- ✅ API key already generated
- ✅ Verified sender email (mmkela@gmail.com)
- ✅ Ready to send emails programmatically

**What you need to do:**
- Nothing! It's ready to use
- Just implement email templates when needed
- Test it with a simple email send

**Test it now:**
```typescript
// File: backend/scripts/test-sendgrid.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const msg = {
  to: 'mmkela@gmail.com',
  from: 'mmkela@gmail.com',
  subject: 'Coinsphere Test Email',
  text: 'SendGrid is working!',
};

await sgMail.send(msg);
console.log('✅ Email sent successfully!');
```

---

## 🔍 Deep Dive: Binance API Types

Since Binance is your main trading platform, here's what they offer:

### 1. REST API (What You'll Use)
**Endpoint:** `https://api.binance.com` (live) or `https://testnet.binance.vision` (testnet)

**What it does:**
- Place orders
- Cancel orders
- Check balances
- Get market data
- Query order status

**Type of requests:**
```typescript
// Market data (public, no auth needed)
GET /api/v3/ticker/price?symbol=BTCUSDT

// Trading (requires API key)
POST /api/v3/order (create order)
DELETE /api/v3/order (cancel order)
GET /api/v3/account (get balance)
```

### 2. WebSocket API (Future Enhancement)
**Endpoint:** `wss://stream.binance.com:9443/ws/`

**What it does:**
- Real-time price updates
- Live order book
- Live trades stream
- Account updates

**When to use:**
- Week 5-6 optimization
- For high-frequency strategies
- For better latency

**Current approach:**
- You poll REST API every 1-5 seconds (good enough)
- WebSocket would be every millisecond (overkill for now)

### 3. WebSocket API for Account Updates
**What it does:**
- Get notified when orders fill
- Real-time balance updates
- Position updates

**Status:** Future enhancement

---

## 💡 Practical Examples

### Example 1: Place a Trade (REST API)

**Using CCXT (your approach):**
```typescript
import { exchangeManager } from './services/exchange/ExchangeManager';

// Simple and clean!
const order = await exchangeManager.createOrder({
  symbol: 'BTC/USDT',
  exchange: 'binance',
  type: 'market',
  side: 'buy',
  amount: 0.001
});
```

**What happens behind the scenes:**
1. CCXT creates signature
2. Sends POST to Binance REST API
3. Binance executes order
4. Returns order confirmation
5. CCXT formats response
6. You get clean JavaScript object

### Example 2: Get Price Data (REST API)

```typescript
// Your current approach (polling every 1 second)
const ticker = await exchangeManager.fetchTicker('BTC/USDT', 'binance');
console.log(ticker.last); // $43,250.50

// Repeat every 1 second
setInterval(async () => {
  const ticker = await exchangeManager.fetchTicker('BTC/USDT', 'binance');
  // Process new price
}, 1000);
```

**Future with WebSocket:**
```typescript
// Future approach (continuous stream)
const ws = new WebSocket('wss://stream.binance.com/ws/btcusdt@ticker');
ws.onmessage = (event) => {
  const ticker = JSON.parse(event.data);
  console.log(ticker.c); // Latest price (updates every 100ms)
};
```

### Example 3: Send Alert Email (Email API)

```typescript
// When position closes with profit
if (position.pnl > 0) {
  await sendEmail({
    to: user.email,
    subject: `🎉 Profit: ${position.symbol}`,
    template: 'position-closed',
    data: {
      symbol: position.symbol,
      profit: position.pnl,
      percent: position.pnlPercent
    }
  });
}
```

---

## ✅ Final Answer to Your Questions

### Question 1: "Which kind of API are we setting?"

**Answer:**
- **Binance Testnet:** REST API (standard request/response)
- **Type:** RESTful API with JSON responses
- **Not:** WebSocket, Webhook, FIX, or GraphQL
- **Authentication:** API Key + Secret (HMAC SHA256 signature)

**What you need:**
1. Create account → Get API Key + Secret
2. Add to .env file
3. CCXT handles all the complex API calls
4. You just call simple functions

### Question 2: "SendGrid already has API key?"

**Answer:**
- ✅ **YES!** Fully configured
- ✅ API key already in .env
- ✅ Sender email verified
- ✅ Ready to use immediately
- ✅ No additional setup needed

**Status check:**
```env
✅ SENDGRID_API_KEY=SG.xxx...xxx (configured)
✅ SENDGRID_FROM_EMAIL=mmkela@gmail.com
```

---

## 🎯 Your Action Items

### 1. Binance Testnet (Only Thing You Need!)
- [ ] Create account: https://testnet.binance.vision/
- [ ] Generate API key + secret
- [ ] Add to backend/.env:
  ```env
  BINANCE_API_KEY=your_key
  BINANCE_SECRET=your_secret
  BINANCE_TESTNET=true
  ```
- [ ] Test: `npx tsx scripts/test-exchange-connection.ts`

### 2. SendGrid (Already Done! ✅)
- [x] API key configured
- [x] Sender verified
- [ ] Test sending an email (optional)

### 3. Everything Else
- [x] CoinGecko - Working ✅
- [x] Nansen - Working via MCP ✅
- [x] PayFast - Configured ✅
- [ ] Binance Live - Wait until Week 7-8
- [ ] WebSocket - Future enhancement

---

## 📞 Quick Reference

**What API types are you using?**
- ✅ REST API (Binance, CoinGecko, Nansen, SendGrid)
- ✅ Webhook API (PayFast payments)
- ✅ SDK/Library (CCXT for exchanges)
- ⏳ WebSocket API (Future enhancement)

**What you need to set up TODAY:**
- Only Binance Testnet REST API (5 minutes)

**What's already set up:**
- SendGrid ✅
- PayFast ✅
- CoinGecko ✅
- Nansen (via MCP) ✅

**You're 95% ready!** Just need that Binance testnet key! 🚀
