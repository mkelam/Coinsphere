# MCP Data Dashboard - Complete Guide

## Overview

The **MCP Data Dashboard** provides real-time monitoring and analytics for the Coinsphere application's integration with **LunarCrush** and **Nansen** Model Context Protocol (MCP) services. This dashboard gives visibility into connection health, performance metrics, and data availability from these critical external data sources.

---

## Table of Contents

1. [What is MCP?](#what-is-mcp)
2. [Dashboard Features](#dashboard-features)
3. [Data Sources](#data-sources)
4. [API Endpoints](#api-endpoints)
5. [Dashboard Sections](#dashboard-sections)
6. [Usage Guide](#usage-guide)
7. [Troubleshooting](#troubleshooting)

---

## What is MCP?

**Model Context Protocol (MCP)** is a standardized protocol for real-time data streaming from external services. Coinsphere uses MCP to connect to:

- **LunarCrush**: Social sentiment data, trending coins, galaxy scores
- **Nansen**: On-chain analytics, smart money wallet tracking

### Why MCP Matters

- **Real-time Data**: SSE (Server-Sent Events) streaming for instant updates
- **Fallback Support**: Automatic REST API fallback if MCP connection fails
- **Performance Monitoring**: Track uptime, latency, and connection stability
- **Cost Efficiency**: Reduce API call costs with persistent connections

---

## Dashboard Features

### ✅ Real-Time Connection Status
- Live monitoring of LunarCrush SSE connection
- Nansen MCP health checks
- Visual indicators (green = healthy, red = disconnected)

### 📊 Performance Metrics
- **Uptime Percentage**: Track connection reliability
- **Latency Statistics**: Current, average, min, max response times
- **Request Counts**: Total requests, MCP vs REST breakdown
- **Reconnection Tracking**: Monitor reconnection attempts and success rates

### 🔄 Auto-Refresh
- Dashboard refreshes every 30 seconds
- Manual refresh button for instant updates
- Non-intrusive loading states

### 📈 Historical Data
- Connection event timeline
- Latency trends (last 50 samples)
- Reconnection history

---

## Data Sources

### 1. LunarCrush MCP

**Purpose**: Social sentiment and trending crypto data

**Connection Type**: SSE (Server-Sent Events)

**Data Provided**:
- Galaxy Score (0-100 social influence metric)
- Alt Rank (popularity ranking)
- Social Volume (mentions across platforms)
- Sentiment Analysis (-1 to +1)
- Trending coins
- Social contributors
- Tweet volume and Reddit posts

**Endpoints**:
- Status: `GET /api/v1/social/mcp/status`
- Metrics: `GET /api/v1/social/mcp/metrics`
- Reset Metrics: `POST /api/v1/social/mcp/metrics/reset`

### 2. Nansen MCP

**Purpose**: On-chain analytics and smart money tracking

**Connection Type**: HTTP REST

**Data Provided**:
- Smart Money wallet discovery
- Wallet profiling (portfolio value, P&L, trading activity)
- Transaction history
- Token activity analysis
- Wallet labels and classifications

**Endpoints**:
- Health Check: `GET /api/v1/trading-research/nansen/health`

---

## API Endpoints

### LunarCrush MCP Status

**Endpoint**: `GET /api/v1/social/mcp/status`

**Response**:
```json
{
  "mcp": {
    "enabled": true,
    "connected": true,
    "status": "connected"
  },
  "rest": {
    "available": true,
    "status": "available"
  },
  "activeMode": "MCP (SSE)",
  "timestamp": "2025-10-20T06:57:19.332Z"
}
```

### LunarCrush MCP Metrics

**Endpoint**: `GET /api/v1/social/mcp/metrics`

**Response**:
```json
{
  "metrics": {
    "uptime": {
      "totalSeconds": 660.056,
      "percentage": 97.20543361726693,
      "lastConnected": 1760943402883,
      "lastDisconnected": 1760943396061
    },
    "latency": {
      "current": 0,
      "average": 0,
      "min": null,
      "max": 0,
      "samples": 0
    },
    "reconnections": {
      "total": 2,
      "successful": 0,
      "failed": 0,
      "lastAttempt": 1760943396061
    },
    "requests": {
      "total": 0,
      "successful": 0,
      "failed": 0,
      "mcpCount": 0,
      "restCount": 0
    },
    "history": {
      "latency": [],
      "connections": [
        {
          "timestamp": 1760942766188,
          "event": "connected"
        },
        {
          "timestamp": 1760943081033,
          "event": "disconnected"
        },
        {
          "timestamp": 1760943081035,
          "event": "reconnect_attempt",
          "details": "Attempt 1/5"
        }
      ]
    }
  },
  "timestamp": "2025-10-20T06:57:20.635Z"
}
```

### Nansen MCP Health

**Endpoint**: `GET /api/v1/trading-research/nansen/health`

**Response**:
```json
{
  "success": true,
  "data": {
    "healthy": false,
    "service": "Nansen MCP"
  }
}
```

### Reset MCP Metrics

**Endpoint**: `POST /api/v1/social/mcp/metrics/reset`

**Purpose**: Clear all historical metrics and restart tracking

**Response**:
```json
{
  "success": true,
  "message": "MCP metrics reset successfully"
}
```

---

## Dashboard Sections

### 1. Overview Tab

**Summary Cards**:
- **Uptime**: Displays current uptime percentage with color coding
  - Green (≥95%): Excellent
  - Yellow (80-94%): Good
  - Red (<80%): Needs attention
- **Reconnections**: Total reconnection attempts with success/failure breakdown
- **Total Requests**: Combined MCP and REST API requests
- **Average Latency**: Mean response time across all requests

### 2. Performance Tab

**Latency Statistics**:
- Current latency (most recent request)
- Average latency (rolling average)
- Minimum latency (best response time)
- Maximum latency (worst response time)

**Request Statistics**:
- Total requests
- Success rate (percentage bar)
- MCP vs REST breakdown

### 3. Connections Tab

**Connection Timestamps**:
- Last Connected: When the MCP connection was last established
- Last Disconnected: When the connection was last lost

**Recent Events**:
- Chronological list of connection events
- Event types:
  - ✅ Connected
  - ❌ Disconnected
  - 🔄 Reconnection Attempt
  - ✅ Reconnection Successful
  - ⚠️ Reconnection Failed
- Timestamps for each event
- Additional details (e.g., "Attempt 2/5")

---

## Usage Guide

### Accessing the Dashboard

**URL**: `http://localhost:5174/mcp-data` (development)

**Production**: `https://coinsphere.app/mcp-data`

### Reading the Metrics

#### Uptime Percentage
- **97%+**: Excellent - Connection is very stable
- **90-97%**: Good - Occasional disconnections
- **80-90%**: Fair - Frequent reconnections
- **<80%**: Poor - Connection issues, check logs

#### Latency
- **<100ms**: Excellent - Very fast responses
- **100-500ms**: Good - Normal operation
- **500-1000ms**: Fair - Slightly slow
- **>1000ms**: Poor - Investigate network or API issues

#### Reconnections
- **0-5**: Normal - Expected occasional reconnections
- **5-20**: Moderate - Monitor connection stability
- **>20**: High - Investigate network or API issues

### Interpreting Connection Status

#### LunarCrush MCP
- **SSE Connection: Connected** ✅ - Real-time streaming active
- **REST API: Available** ✅ - Fallback ready
- **Active Mode: MCP (SSE)** - Using optimal mode

#### Nansen MCP
- **Service Status: Healthy** ✅ - API accessible
- **Service Status: Unavailable** ❌ - Check API key or endpoint

### Manual Actions

#### Refresh Data
Click the **Refresh** button in the top-right to manually update all metrics.

#### Reset Metrics
To clear all historical data and start fresh:
```bash
curl -X POST http://localhost:3001/api/v1/social/mcp/metrics/reset
```

---

## Troubleshooting

### Issue: LunarCrush MCP Shows "Disconnected"

**Possible Causes**:
1. Missing or invalid `LUNARCRUSH_API_KEY` environment variable
2. Network connectivity issues
3. LunarCrush SSE endpoint unavailable

**Solutions**:
1. Verify API key in `.env` file:
   ```bash
   LUNARCRUSH_API_KEY=your-api-key-here
   ```
2. Check backend logs for connection errors:
   ```bash
   cd backend && npm run dev
   ```
3. Test SSE endpoint manually:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" https://lunarcrush.ai/sse
   ```

### Issue: Nansen MCP Shows "Unavailable"

**Note**: This is expected in development if you don't have a Nansen API key.

**Possible Causes**:
1. Missing `NANSEN_API_KEY` environment variable
2. Nansen MCP endpoint not accessible
3. API key invalid or expired

**Solutions**:
1. Add Nansen API key to `.env`:
   ```bash
   NANSEN_API_KEY=your-nansen-api-key
   NANSEN_MCP_URL=https://mcp.nansen.ai/ra/mcp/
   ```
2. Verify endpoint availability:
   ```bash
   curl -H "NANSEN-API-KEY: YOUR_API_KEY" https://mcp.nansen.ai/ra/mcp/health
   ```

### Issue: High Reconnection Count

**Possible Causes**:
1. Unstable network connection
2. Server timeout or restart
3. SSE connection limits

**Solutions**:
1. Check network stability
2. Review backend logs for errors
3. Increase reconnection delay in `lunarcrushMcpService.ts`:
   ```typescript
   private reconnectDelay = 10000; // Increase to 10 seconds
   ```

### Issue: No Data Showing

**Possible Causes**:
1. Backend server not running
2. CORS issues
3. API endpoint URLs incorrect

**Solutions**:
1. Start backend server:
   ```bash
   cd backend && npm run dev
   ```
2. Check browser console for CORS errors
3. Verify API base URL in dashboard component:
   ```typescript
   fetch('http://localhost:3001/api/v1/social/mcp/status')
   ```

### Issue: Latency Data Missing

**Explanation**: Latency is only recorded when actual API requests are made.

**To Generate Latency Data**:
1. Make requests to LunarCrush endpoints:
   ```bash
   curl "http://localhost:3001/api/v1/social/BTC"
   ```
2. Check the Markets page (uses social data)
3. Wait for background price updates (runs every 2 hours)

---

## Technical Architecture

### Frontend Component

**File**: `frontend/src/pages/McpDataDashboard.tsx`

**Key Features**:
- React hooks for state management
- Auto-refresh with 30-second interval
- Responsive grid layout
- Tab-based navigation
- Real-time status indicators

**Styling**:
- Consistent with app's glass morphism design
- Uses `glass-card` class
- Color palette: `#3b82f6` (blue), `#10b981` (green), `#ef4444` (red)

### Backend Services

**LunarCrush MCP Service**:
- File: `backend/src/services/lunarcrushMcpService.ts`
- SSE connection with auto-reconnection
- Fallback to REST API
- Redis caching (15-minute TTL)

**Nansen MCP Service**:
- File: `backend/src/services/nansenMcpService.ts`
- HTTP REST API
- Smart Money wallet discovery
- Redis caching (1-hour TTL)

**MCP Metrics Service**:
- File: `backend/src/services/mcpMetricsService.ts`
- Tracks all performance metrics
- Persists to Redis every minute
- 24-hour data retention

### API Routes

**Social Routes**:
- File: `backend/src/routes/social.ts`
- Endpoints: `/api/v1/social/mcp/status`, `/api/v1/social/mcp/metrics`

**Trading Research Routes**:
- File: `backend/src/routes/tradingResearch.ts`
- Endpoint: `/api/v1/trading-research/nansen/health`

---

## Performance Optimization

### Caching Strategy

**LunarCrush**:
- SSE streaming = no caching needed (real-time)
- REST fallback = 15-minute Redis cache

**Nansen**:
- Wallet profiles = 1-hour Redis cache
- Smart Money discovery = 1-hour Redis cache

### Connection Management

**Reconnection Logic**:
- Max 5 reconnection attempts
- Exponential backoff (5s, 10s, 15s, 20s, 25s)
- Automatic connection on service start

**Health Checks**:
- LunarCrush: Ping every 15 seconds
- Nansen: Ping on demand

---

## Future Enhancements

### Planned Features

1. **Historical Charts**:
   - Line chart for latency over time
   - Uptime percentage trends
   - Request volume graphs

2. **Alerting**:
   - Email/SMS notifications on connection loss
   - Slack integration for downtime alerts
   - Configurable thresholds

3. **Advanced Analytics**:
   - Cost tracking (API call costs)
   - Data usage statistics
   - Performance benchmarking

4. **Admin Controls**:
   - Manual reconnection trigger
   - Connection mode toggle (MCP vs REST)
   - API key rotation UI

---

## Related Documentation

- [LunarCrush API Documentation](https://lunarcrush.com/developers/api)
- [Nansen API Documentation](https://docs.nansen.ai/)
- [SSE (Server-Sent Events) Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [Coinsphere System Architecture Document](Documentation/System%20Architecture%20Document.md)

---

## Support

For issues or questions about the MCP Data Dashboard:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review backend logs: `cd backend && npm run dev`
3. Open a GitHub issue: https://github.com/coinsphere/coinsphere/issues
4. Contact team: #coinsphere-dev on Slack

---

**Last Updated**: October 20, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
