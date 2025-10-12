# Week 2 Implementation Plan - DeFi Expansion
**Start Date:** October 10, 2025
**End Date:** October 17, 2025
**Goal:** Expand DeFi to 25+ protocols, add multi-chain support, implement USD value calculation

---

## 📊 Week 1 Achievements (Completed ✅)

### Backend
- ✅ DeFi service with The Graph integration (460 lines)
- ✅ 5 API endpoints fully functional
- ✅ 16 protocols seeded in database
- ✅ Uniswap V3, Aave V3, Compound V2 subgraph queries
- ✅ Database schema with DefiProtocol + DefiPosition models
- ✅ Server running successfully on port 3001

### Frontend
- ✅ DeFi page with portfolio overview (290 lines)
- ✅ Protocol cards component (130 lines)
- ✅ Position table with sort/filter (295 lines)
- ✅ API client service (130 lines)
- ✅ Navigation integration
- ✅ Server running on port 5173

**Total Code:** ~1,765 lines
**Status:** 100% Complete, ready for expansion

---

## 🎯 Week 2 Goals

### Primary Objectives
1. **Expand Protocol Support:** 16 → 25+ protocols
2. **Add Multi-Chain Support:** Ethereum → Polygon, Optimism, Arbitrum
3. **Implement USD Value Calculation:** $0 placeholder → Real prices
4. **Calculate APY:** Display real yield data
5. **Integration Testing:** Test with real wallet addresses

### Success Metrics
- [ ] 25+ protocols with subgraph queries
- [ ] 3+ blockchains supported
- [ ] USD values accurate within 5%
- [ ] APY calculated for all applicable positions
- [ ] 1+ real wallet tested successfully

---

## 📅 Day-by-Day Implementation Plan

### **Day 1 (Thursday) - Protocol Expansion**

**Morning (4 hours):**
- [ ] Add Curve Finance subgraph queries
- [ ] Add Lido staking queries
- [ ] Add Rocket Pool queries
- [ ] Add Yearn Finance queries
- [ ] Add Convex Finance queries

**Afternoon (4 hours):**
- [ ] Add Balancer V2 queries
- [ ] Add SushiSwap queries
- [ ] Add PancakeSwap queries
- [ ] Test all new subgraph queries
- [ ] Update syncDefiPositions() to include new protocols

**Deliverables:**
- 9 new protocol integrations
- Total protocols: 25+
- All queries tested

---

### **Day 2 (Friday) - Multi-Chain Support**

**Morning (4 hours):**
- [ ] Add Polygon subgraph endpoints
  - Uniswap V3 Polygon
  - Aave V3 Polygon
  - SushiSwap Polygon
- [ ] Add Optimism subgraph endpoints
  - Uniswap V3 Optimism
  - Aave V3 Optimism
- [ ] Add Arbitrum subgraph endpoints
  - Uniswap V3 Arbitrum
  - GMX Arbitrum
  - Aave V3 Arbitrum

**Afternoon (4 hours):**
- [ ] Update defiService to handle multi-chain
- [ ] Add chain parameter to API endpoints
- [ ] Update database to track positions by chain
- [ ] Test multi-chain sync

**Deliverables:**
- 4 blockchains supported (Ethereum, Polygon, Optimism, Arbitrum)
- 10+ cross-chain protocol queries
- Multi-chain sync working

---

### **Day 3 (Monday) - USD Value Calculation**

**Morning (4 hours):**
- [ ] Create priceService.ts
- [ ] Integrate with CoinGecko API for token prices
- [ ] Build price cache (Redis TTL: 5 minutes)
- [ ] Implement token price lookup by symbol

**Afternoon (4 hours):**
- [ ] Update syncDefiPositions() to calculate USD values
- [ ] Add price calculation logic: `amount × currentPrice`
- [ ] Handle stablecoins (USDC, DAI, USDT = $1.00)
- [ ] Test USD value accuracy

**Deliverables:**
- Real USD values instead of $0
- Price cache to reduce API calls
- Accuracy within 5% of actual values

---

### **Day 4 (Tuesday) - APY Calculation**

**Morning (4 hours):**
- [ ] Research APY data sources
  - The Graph: Pool APY data
  - DeFi Llama API: Protocol yields
  - Direct protocol contracts
- [ ] Implement Aave APY fetching (lending/borrow rates)
- [ ] Implement Compound APY fetching
- [ ] Implement Curve APY fetching

**Afternoon (4 hours):**
- [ ] Build APY cache (Redis TTL: 1 hour)
- [ ] Update DeFi positions with real APY values
- [ ] Add APY to frontend display
- [ ] Test APY accuracy

**Deliverables:**
- Real APY values for lending/staking positions
- APY cache to reduce external API calls
- Frontend shows accurate yields

---

### **Day 5 (Wednesday) - Integration Testing**

**Morning (4 hours):**
- [ ] Find test Ethereum addresses with DeFi positions
  - Uniswap V3 liquidity provider
  - Aave lender
  - Compound user
- [ ] Test sync with real addresses
- [ ] Verify position accuracy
- [ ] Test USD value calculations

**Afternoon (4 hours):**
- [ ] Test multi-chain sync (Polygon, Optimism)
- [ ] Test error handling (invalid addresses, failed queries)
- [ ] Test rate limiting
- [ ] Fix bugs discovered during testing

**Deliverables:**
- 5+ real wallet addresses tested
- Position accuracy > 95%
- All edge cases handled

---

## 🛠️ Technical Implementation Details

### New Protocol Queries to Add

**1. Curve Finance**
```typescript
interface CurvePosition {
  id: string;
  user: string;
  pool: {
    name: string;
    coins: string[];
  };
  balance: string;
  virtualPrice: string;
}

async function fetchCurvePositions(walletAddress: string): Promise<CurvePosition[]> {
  const client = new GraphQLClient(SUBGRAPH_ENDPOINTS['curve']);
  const query = gql`
    query GetGaugeDeposits($user: String!) {
      gaugeDeposits(where: { user: $user }) {
        id
        user
        gauge {
          pool {
            name
            coins
          }
        }
        balance
      }
    }
  `;
  // ... implementation
}
```

**2. Lido Staking**
```typescript
interface LidoPosition {
  id: string;
  account: string;
  shares: string;
  totalPooledEther: string;
}

async function fetchLidoPositions(walletAddress: string): Promise<LidoPosition[]> {
  const client = new GraphQLClient(SUBGRAPH_ENDPOINTS['lido']);
  const query = gql`
    query GetStakes($account: String!) {
      stakes(where: { account: $account }) {
        id
        account
        shares
      }
    }
  `;
  // ... implementation
}
```

**3. Rocket Pool**
```typescript
interface RocketPoolPosition {
  id: string;
  node: string;
  rplStake: string;
  minipoolCount: number;
}

async function fetchRocketPoolPositions(walletAddress: string): Promise<RocketPoolPosition[]> {
  // Implementation for rETH holdings
}
```

### USD Value Calculation Logic

```typescript
// priceService.ts
import axios from 'axios';
import { redisClient } from '../lib/redis.js';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export async function getTokenPrice(symbol: string): Promise<number> {
  // Check cache first
  const cached = await redisClient.get(`price:${symbol.toLowerCase()}`);
  if (cached) return parseFloat(cached);

  // Stablecoin handling
  const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX'];
  if (stablecoins.includes(symbol.toUpperCase())) {
    return 1.00;
  }

  // Fetch from CoinGecko
  const coingeckoIds: Record<string, string> = {
    'ETH': 'ethereum',
    'BTC': 'bitcoin',
    'WETH': 'weth',
    'WBTC': 'wrapped-bitcoin',
    // ... more mappings
  };

  const id = coingeckoIds[symbol.toUpperCase()];
  if (!id) return 0;

  try {
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: id,
        vs_currencies: 'usd',
      },
    });

    const price = response.data[id]?.usd || 0;

    // Cache for 5 minutes
    await redisClient.setex(`price:${symbol.toLowerCase()}`, 300, price.toString());

    return price;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return 0;
  }
}

// Update syncDefiPositions to calculate USD value
const price = await getTokenPrice(position.tokenSymbol);
const valueUsd = amount.times(new Decimal(price));
```

### APY Calculation Logic

```typescript
// apyService.ts
import axios from 'axios';

const DEFI_LLAMA_API = 'https://yields.llama.fi';

export async function getProtocolAPY(protocolSlug: string, poolId: string): Promise<number> {
  try {
    const response = await axios.get(`${DEFI_LLAMA_API}/pools`);
    const pools = response.data.data;

    const pool = pools.find((p: any) =>
      p.project === protocolSlug && p.pool === poolId
    );

    return pool?.apy || 0;
  } catch (error) {
    console.error(`Error fetching APY for ${protocolSlug}:`, error);
    return 0;
  }
}

// For Aave, use contract data
export async function getAaveSupplyAPY(asset: string): Promise<number> {
  // Fetch from Aave subgraph
  const query = gql`
    query GetReserve($asset: String!) {
      reserve(id: $asset) {
        liquidityRate
      }
    }
  `;
  // Convert liquidityRate to APY
  // APY = (1 + rate/secondsPerYear)^secondsPerYear - 1
}
```

---

## 📦 New Packages to Install

```bash
# Backend
cd backend
npm install @defillama/sdk  # DeFi Llama integration
npm install ethers@5.7.2    # Already installed
npm install axios           # Already installed

# Optional: Direct contract interaction
npm install @ethersproject/contracts
```

---

## 🗃️ Database Updates

### Add Chain to DefiPosition Model

```prisma
model DefiPosition {
  // ... existing fields
  blockchain    String   @default("ethereum") // Add blockchain field

  @@unique([userId, protocolId, walletAddress, tokenSymbol, blockchain])
  @@index([blockchain])
}
```

### Migration

```bash
cd backend
npx prisma migrate dev --name add_blockchain_to_defi_positions
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// defiService.test.ts
describe('DeFi Service', () => {
  test('fetchUniswapV3Positions returns positions', async () => {
    const positions = await fetchUniswapV3Positions('0x123...');
    expect(positions).toBeInstanceOf(Array);
  });

  test('getTokenPrice returns valid price', async () => {
    const price = await getTokenPrice('ETH');
    expect(price).toBeGreaterThan(0);
  });

  test('syncDefiPositions creates positions in DB', async () => {
    await syncDefiPositions('user-id', '0x123...');
    const positions = await getUserDefiPositions('user-id');
    expect(positions.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
// defi.integration.test.ts
describe('DeFi API Integration', () => {
  test('GET /api/v1/defi/protocols returns 25+ protocols', async () => {
    const response = await request(app).get('/api/v1/defi/protocols');
    expect(response.status).toBe(200);
    expect(response.body.count).toBeGreaterThanOrEqual(25);
  });

  test('POST /api/v1/defi/sync syncs positions', async () => {
    const response = await request(app)
      .post('/api/v1/defi/sync')
      .set('Authorization', `Bearer ${testToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.summary.success).toBeGreaterThan(0);
  });
});
```

### Real Wallet Test Addresses

```typescript
// Known addresses with DeFi positions (public data)
const TEST_ADDRESSES = {
  uniswapLP: '0x47173b170c64d16393a52e6c480b3ad8c302ba1e', // Uniswap V3 LP
  aaveLender: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c', // Aave user
  compoundUser: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', // Binance
  curveLP: '0x5c00977a2002a3c9925dbfbfce1eea31d05b9f95', // Curve LP
  lidoStaker: '0x1b8568FbB47708E9E9D31Ff303254f748805bf21', // Lido staker
};
```

---

## 📊 Success Criteria

### End of Week 2 Targets

| Metric | Week 1 | Week 2 Target | Status |
|--------|---------|---------------|--------|
| **Protocols** | 16 | 25+ | 🔴 |
| **Blockchains** | 1 (Ethereum) | 4 | 🔴 |
| **USD Values** | $0 placeholder | Real prices | 🔴 |
| **APY Data** | N/A | Real yields | 🔴 |
| **Tests** | 0 | 10+ | 🔴 |
| **Real Wallets Tested** | 0 | 5+ | 🔴 |

### Quality Gates

- [ ] All 25+ protocols return data from subgraphs
- [ ] USD value accuracy > 95% vs CoinGecko
- [ ] APY values within 2% of protocol websites
- [ ] Multi-chain sync completes in < 10 seconds
- [ ] No crashes or errors during real wallet tests
- [ ] Code coverage > 60% for DeFi services

---

## 🚀 Deployment Plan (End of Week 2)

### Staging Deployment

```bash
# 1. Run migrations
cd backend
npx prisma migrate deploy

# 2. Seed new protocols
npx tsx prisma/seeds/defi-protocols.ts

# 3. Restart backend
pm2 restart backend

# 4. Test on staging
curl https://api-staging.coinsphere.app/api/v1/defi/protocols
```

### Production Deployment

**Prerequisites:**
- [ ] All tests passing
- [ ] 5+ real wallets tested successfully
- [ ] USD values accurate
- [ ] APY calculations verified
- [ ] Multi-chain tested
- [ ] Code reviewed

**Go/No-Go Decision:** Friday, October 17, 2025

---

## 📝 Notes & Risks

### Risks

1. **The Graph Rate Limits**
   - Free tier: 1,000 queries/day
   - Mitigation: Upgrade to paid tier ($50/month for 100K queries)

2. **CoinGecko API Limits**
   - Free tier: 10-50 calls/minute
   - Mitigation: Aggressive caching (5-minute TTL)

3. **Subgraph Downtime**
   - The Graph subgraphs can go offline
   - Mitigation: Fallback to direct contract calls

4. **Price Accuracy**
   - CoinGecko may have stale/incorrect prices
   - Mitigation: Cross-check with CryptoCompare, Binance

5. **APY Volatility**
   - DeFi yields change rapidly
   - Mitigation: Cache for 1 hour, show "as of" timestamp

### Optimizations

- **Parallel Queries:** Fetch all protocols concurrently
- **Batch Updates:** Update multiple positions in single DB transaction
- **Smart Caching:** Cache by wallet + chain + timestamp
- **Pagination:** Limit to 100 positions per sync

---

## 🎯 Next Week (Week 3) Preview

### Auto-Sync Implementation
- Background cron job (every 15 minutes)
- Bull queue for async processing
- Webhook support for instant updates

### NFT Integration Start
- OpenSea API integration
- NFT metadata fetching
- Floor price tracking
- NFT gallery UI

### Performance Optimization
- Redis caching layer
- Database query optimization
- Frontend lazy loading
- Image optimization

---

**Plan Created:** October 10, 2025
**Status:** Ready to Execute
**Estimated Completion:** October 17, 2025
**Complexity:** Medium-High
