# How to Use Nansen MCP with Claude Code

## Overview

Nansen MCP is **already configured** in your Claude Code setup and ready to use. This guide explains how to leverage it for Phase 0 trading research.

## Configuration Status ✅

The Nansen MCP server is configured in `.claude.json`:

```json
{
  "mcpServers": {
    "nansen": {
      "type": "http",
      "url": "https://mcp.nansen.ai/ra/mcp/",
      "headers": {
        "NANSEN-API-KEY": "wqbsH9Cdbt9eQ8d1H34txhdO4QmEbSiR"
      }
    }
  }
}
```

## How to Use Nansen MCP via Claude

### Method 1: Direct Prompts to Claude

Simply ask Claude to use the Nansen MCP in your prompts:

```
User: "Use the Nansen MCP to find Smart Money wallets on Ethereum
       that have been active in the last 30 days with portfolio
       value over $500,000"

Claude: [Automatically uses Nansen MCP]
        [Returns wallet data]
```

### Method 2: Specific Queries

Ask Claude for specific wallet analysis:

```
User: "Use Nansen MCP to analyze wallet 0x8EB8a3b98659Cce290402893d0123abb75E3ab28
       - Get PnL data
       - Get trade performance
       - Get wallet label"

Claude: [Queries Nansen MCP]
        [Returns comprehensive analysis]
```

### Method 3: Batch Processing

Ask Claude to process multiple wallets:

```
User: "For each of these 5 wallet addresses, use Nansen MCP to:
       1. Get total trades analyzed
       2. Calculate win rate
       3. Get realized PnL
       4. Identify top 5 traded tokens

       Then save the results to our database via the trading research API"

Claude: [Processes batch request]
        [Inserts into database]
```

## Example Prompts for Phase 0 Research

### Week 1 Day 1-2: Smart Money Discovery

```
"Use Nansen MCP to find 30 Smart Money wallets labeled 'Smart Money - DeFi'
on Ethereum with:
- Portfolio value > $100,000
- Active in last 12 months
- Positive returns

For each wallet found, save to database using:
POST http://localhost:3001/api/v1/trading-research/wallets

Include: address, label, chain, trades, win rate, profit/loss"
```

### Week 1 Day 1-2: Wallet Enrichment

```
"For wallet 0x8EB8a3b98659Cce290402893d0123abb75E3ab28, use Nansen MCP to:

1. Get detailed PnL data (realized, unrealized, ROI)
2. Get trade performance (total trades, win rate, avg hold time)
3. Get transaction history (last 50 trades)
4. Identify top 10 most traded tokens

Then update the database record via:
POST http://localhost:3001/api/v1/trading-research/wallets/:address/enrich"
```

### Week 1: Cross-Chain Analysis

```
"Use Nansen MCP to compare Smart Money activity across:
- Ethereum
- Arbitrum
- Base
- Solana

Find top 10 wallets on each chain by:
- Total trading volume
- Win rate
- Sharpe ratio

Save results categorized by blockchain"
```

## Nansen MCP Capabilities

Based on the MCP documentation, you can ask Claude to:

### 1. Smart Money Tracking
- "Show me tokens funds bought in the last 24 hours"
- "What DCA strategies are profitable traders using?"
- "Find new tokens with high smart money inflows"

### 2. Wallet Analysis
- "Analyze trading performance of wallet 0x..."
- "Get PnL breakdown for wallet 0x..."
- "What are this wallet's best and worst trades?"

### 3. Token Intelligence
- "Find tokens with highest Smart Money accumulation this week"
- "Which tokens are whales selling?"
- "Show me new token launches with institutional backing"

### 4. Pattern Discovery
- "What entry/exit patterns do top DeFi traders use?"
- "Find wallets that consistently buy before social spikes"
- "Identify leading indicators for altcoin pumps"

## Integration with Trading Research System

### Workflow

```
1. Claude uses Nansen MCP
       ↓
2. Gets wallet/trade data
       ↓
3. Processes and structures data
       ↓
4. Calls backend API to save
       ↓
5. Database updated with research results
```

### Example End-to-End Request

```
User: "Execute Week 1 Day 1-2 research plan:

1. Use Nansen MCP to discover 30 Smart Money wallets on Ethereum
2. Filter: portfolio > $100K, active 12+ months, profitable
3. For each wallet, get:
   - Total trades
   - Win rate
   - Average hold time
   - Top 5 traded tokens
   - Total profit/loss
4. Save all wallets to database
5. Calculate social leading scores (using LunarCrush if available)
6. Generate summary report"

Claude: [Executes complete workflow]
        [Returns summary with database IDs]
```

## Nansen Direct API (Fallback)

If MCP is unavailable, we also have a **direct Nansen API integration**:

### Backend Service

File: `backend/src/services/nansenApiService.ts`

### Available Methods

```typescript
// Get wallet PnL data
await nansenApiService.getWalletPnL(address, chain);

// Get trade performance
await nansenApiService.getTradePerformance(address, chain);

// Get wallet label
await nansenApiService.getWalletLabel(address, chain);
```

### API Endpoints

```bash
# Base URL
https://api.nansen.ai/api/v1

# Authentication
Header: X-API-KEY: your-api-key

# Example: Get wallet PnL
POST /profiler/address/pnl-summary
Body: {
  "address": "0x...",
  "chain": "ethereum"
}

# Example: Get trade performance
POST /profiler/address/trade-performance
Body: {
  "address": "0x...",
  "chain": "ethereum"
}
```

## Troubleshooting

### Issue: MCP endpoint returns 404

**Solution 1**: Use Claude Code to access MCP (not direct HTTP calls)
```
# ❌ Wrong (won't work from backend)
curl https://mcp.nansen.ai/ra/mcp/

# ✅ Correct (via Claude)
"Claude, use Nansen MCP to get data for wallet 0x..."
```

**Solution 2**: Use direct Nansen API fallback
```typescript
import { nansenApiService } from './services/nansenApiService.js';

const pnl = await nansenApiService.getWalletPnL(address, 'ethereum');
```

### Issue: API rate limits

**Solution**: Implement caching (already done)
- 1-hour cache for PnL data
- Redis caching for all Nansen responses

### Issue: Missing Smart Money search endpoint

**Solution**: Use test data seeder or manual input
```bash
npm run seed:research
```

## Best Practices

### 1. Batch Processing
Group wallet queries to minimize API calls:
```
"For these 10 wallets, use Nansen MCP to get all data in one batch"
```

### 2. Incremental Updates
Update existing wallets instead of re-querying:
```
"Only fetch new trades for wallets updated more than 24 hours ago"
```

### 3. Error Handling
Ask Claude to handle failures gracefully:
```
"If Nansen MCP fails, skip that wallet and continue with the next one.
 Keep a log of failed wallets for retry later."
```

### 4. Data Validation
Verify data before saving:
```
"Before saving to database, verify:
 - Win rate is between 0 and 1
 - Total trades > 0
 - Portfolio value is realistic (> $1K and < $1B)"
```

## API Key Management

Your API key is configured in two places:

1. **Claude Code MCP** (`.claude.json`):
   ```json
   "headers": {
     "NANSEN-API-KEY": "wqbsH9Cdbt9eQ8d1H34txhdO4QmEbSiR"
   }
   ```

2. **Backend Environment** (`.env`):
   ```bash
   NANSEN_API_KEY=wqbsH9Cdbt9eQ8d1H34txhdO4QmEbSiR
   NANSEN_API_URL=https://api.nansen.ai/api/v1
   ```

## Testing the Integration

### Step 1: Verify MCP Configuration
```
User: "Check if the Nansen MCP is available and working"

Claude: [Tests MCP connection]
        [Reports status]
```

### Step 2: Simple Query
```
User: "Use Nansen MCP to get the label for wallet
       0x8EB8a3b98659Cce290402893d0123abb75E3ab28"

Claude: [Returns label, e.g., "Smart Money - DeFi"]
```

### Step 3: Full Workflow
```
User: "Execute a test run of the Week 1 Day 1-2 workflow with just 3 wallets"

Claude: [Discovers 3 wallets]
        [Enriches data]
        [Saves to database]
        [Returns summary]
```

## Resources

- **Nansen MCP Docs**: https://docs.nansen.ai/nansen-mcp/overview
- **Nansen API Docs**: https://docs.nansen.ai/
- **Get API Key**: https://app.nansen.ai/account?tab=api
- **Supported Chains**: 25+ (Ethereum, Solana, Bitcoin, Arbitrum, Base, etc.)

## Summary

✅ **Nansen MCP is configured and ready**
✅ **Ask Claude directly** - "Use Nansen MCP to..."
✅ **Direct API fallback available** via `nansenApiService`
✅ **Complete workflow integration** with trading research system

**You can start using Nansen MCP right now by simply asking Claude!**

---

**Example to get started:**

```
"Claude, use the Nansen MCP to find 5 Smart Money wallets on Ethereum
that trade DeFi tokens. For each wallet, get their win rate and total PnL.
Then save the results to our database using the trading research API."
```

Claude will handle everything automatically! 🚀
