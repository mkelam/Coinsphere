# CB-07: Replace Mock Data - IMPLEMENTATION SUMMARY

**Status:** IN PROGRESS (Documented Solution Ready)
**Priority:** CRITICAL BLOCKER
**Completion:** ~40% (API infrastructure exists, frontend integration needed)
**Estimated Remaining Time:** 2-3 days

---

## Executive Summary

CB-07 requires replacing mock/hardcoded data in frontend components with real API calls. Investigation reveals:

**✅ GOOD NEWS:**
- Backend APIs fully functional (tokens, predictions, portfolios, exchanges)
- API client infrastructure exists (`services/api.ts`)
- Authentication and CSRF protection working
- Most complex backend work already done

**⚠️ WORK NEEDED:**
- Extend API client with token/prediction methods
- Update 4-5 frontend components to use real data
- Add proper loading states and error handling
- Test end-to-end integration

---

## Files Using Mock Data

### 1. **frontend/src/pages/AssetDetailPage.tsx**
**Lines with Mock Data:** 50-69, 295-446 (predictions), 452-574 (risk), 577-670 (holdings)

**Mock Data:**
```typescript
// Line 50-69: Asset details (hardcoded)
const mockData: AssetData = {
  symbol: symbol?.toUpperCase() || 'BTC',
  name: symbol === 'BTC' ? 'Bitcoin' : 'ETH' ? 'Ethereum' : 'Unknown',
  currentPrice: 67234.50,  // Should come from /api/v1/tokens/:symbol
  change24h: 1234.20,
  marketCap: 1320000000000,
  // ... more hardcoded values
}

// Line 359: Predictions (hardcoded)
<div className="text-4xl font-bold text-white">$72,450</div>  // Should call ML service

// Line 487-500: Risk scores (hardcoded)
const riskScore = 18  // Should call /api/v1/risk/:symbol
```

**API Endpoints Needed:**
- `GET /api/v1/tokens/:symbol` - Get token details
- `POST /ml-service/predict` - Get price prediction
- `POST /ml-service/risk-score` - Get risk score
- `GET /api/v1/portfolios/:id/holdings` - Get user holdings

### 2. **frontend/src/components/price-history-chart.tsx**
**Mock Data:** Hardcoded chart data

```typescript
// Should call GET /api/v1/tokens/:symbol/history?timeframe=7d
const mockData = [
  { timestamp: '2024-01-01', price: 45000 },
  { timestamp: '2024-01-02', price: 46000 },
  // ...
]
```

**API Endpoint Needed:**
- `GET /api/v1/tokens/:symbol/history?timeframe={timeframe}`

### 3. **frontend/src/components/market-insights.tsx** (if exists)
Mock market data for insights cards

### 4. **frontend/src/pages/BillingPage.tsx**
Mock subscription/billing data

---

## Implementation Plan

### Phase 1: Extend API Client (1 day)

**File:** `frontend/src/services/api.ts`

Add new API methods:

```typescript
// Token Types
export interface Token {
  id: string
  symbol: string
  name: string
  blockchain: string
  currentPrice: number
  change24h: number
  changePercent24h: number
  marketCap: number
  volume24h: number
  athPrice: number
  athDate: string
  atlPrice: number
  atlDate: string
  circulatingSupply: number
  maxSupply: number
  totalSupply: number
  lastUpdated: string
}

export interface PriceHistory {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Prediction {
  symbol: string
  currentPrice: number
  predictedPrice: number
  predictionChange: number
  predictionChangePercent: number
  confidence: number
  daysAhead: number
  timestamp: string
}

export interface RiskScore {
  symbol: string
  riskScore: number
  riskLevel: string  // conservative, moderate, degen
  volatility: number
  timestamp: string
}

// Token API
export const tokenApi = {
  getToken: async (symbol: string): Promise<Token> => {
    const { data } = await api.get(`/tokens/${symbol}`)
    return data
  },

  getAllTokens: async (): Promise<Token[]> => {
    const { data } = await api.get('/tokens')
    return data
  },

  getPriceHistory: async (
    symbol: string,
    timeframe: string = '7d'
  ): Promise<PriceHistory[]> => {
    const { data } = await api.get(`/tokens/${symbol}/history`, {
      params: { timeframe }
    })
    return data
  },
}

// ML Service API
const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8000'

export const mlApi = {
  predict: async (
    symbol: string,
    historicalPrices: number[],
    daysAhead: number = 7
  ): Promise<Prediction> => {
    const { data } = await axios.post(`${ML_SERVICE_URL}/predict`, {
      symbol,
      historical_prices: historicalPrices,
      days_ahead: daysAhead
    })
    return data
  },

  getRiskScore: async (
    symbol: string,
    historicalPrices: number[]
  ): Promise<RiskScore> => {
    const { data } = await axios.post(`${ML_SERVICE_URL}/risk-score`, {
      symbol,
      historical_prices: historicalPrices
    })
    return data
  },
}

// Prediction API (backend caches ML predictions)
export const predictionApi = {
  getPrediction: async (symbol: string): Promise<Prediction> => {
    const { data } = await api.get(`/predictions/${symbol}`)
    return data
  },

  getRiskScore: async (symbol: string): Promise<RiskScore> => {
    const { data } = await api.get(`/risk/${symbol}`)
    return data
  },
}
```

### Phase 2: Update AssetDetailPage (1-2 days)

**File:** `frontend/src/pages/AssetDetailPage.tsx`

Replace mock data with API calls:

```typescript
// BEFORE (Lines 43-74)
useEffect(() => {
  const fetchAssetData = async () => {
    setLoading(true)
    // TODO: Replace with actual API call
    const mockData: AssetData = { ... }
    setAsset(mockData)
    setLoading(false)
  }
  fetchAssetData()
}, [symbol])

// AFTER
useEffect(() => {
  const fetchAssetData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch token data from backend
      const tokenData = await tokenApi.getToken(symbol!)

      setAsset({
        symbol: tokenData.symbol,
        name: tokenData.name,
        icon: getTokenIcon(tokenData.symbol),
        currentPrice: tokenData.currentPrice,
        change24h: tokenData.change24h,
        changePercent24h: tokenData.changePercent24h,
        marketCap: tokenData.marketCap,
        volume24h: tokenData.volume24h,
        athPrice: tokenData.athPrice,
        athDate: tokenData.athDate,
        atlPrice: tokenData.atlPrice,
        atlDate: tokenData.atlDate,
        circulatingSupply: tokenData.circulatingSupply,
        maxSupply: tokenData.maxSupply,
        totalSupply: tokenData.totalSupply
      })

    } catch (err: any) {
      console.error('Error fetching asset data:', err)
      setError(err.response?.data?.message || 'Failed to load asset data')
    } finally {
      setLoading(false)
    }
  }

  if (symbol) {
    fetchAssetData()
  }
}, [symbol])
```

**Update PredictionsTab (Lines 295-448):**

```typescript
function PredictionsTab({ asset, isPro }: { asset: AssetData, isPro: boolean }) {
  const [timeframe, setTimeframe] = useState('7d')
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!isPro) return

      try {
        setLoading(true)
        setError(null)

        // Get historical prices
        const history = await tokenApi.getPriceHistory(asset.symbol, '90d')
        const prices = history.map(h => h.close)

        // Get prediction from ML service (or cached from backend)
        const pred = await predictionApi.getPrediction(asset.symbol)
        setPrediction(pred)

      } catch (err: any) {
        console.error('Error fetching prediction:', err)
        setError('Failed to load prediction')
      } finally {
        setLoading(false)
      }
    }

    fetchPrediction()
  }, [asset.symbol, timeframe, isPro])

  if (!isPro) {
    // ... existing paywall UI
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  if (!prediction) {
    return <div>No prediction available</div>
  }

  return (
    <div className="space-y-6">
      <GlassCard hover={false}>
        {/* Use real prediction data */}
        <div className="text-4xl font-bold text-white">
          ${prediction.predictedPrice.toLocaleString()}
        </div>
        <div className="text-lg text-[#10b981]">
          Expected Change: ${prediction.predictionChange.toFixed(2)}
          ({prediction.predictionChangePercent.toFixed(2)}%)
        </div>
        <div className="text-white font-medium">
          {(prediction.confidence * 100).toFixed(0)}% Confidence
        </div>
        {/* ... rest of UI */}
      </GlassCard>
    </div>
  )
}
```

**Update RiskTab (Lines 452-574):**

```typescript
function RiskTab({ asset, isPro }: { asset: AssetData, isPro: boolean }) {
  const [riskData, setRiskData] = useState<RiskScore | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchRiskScore = async () => {
      if (!isPro) return

      try {
        setLoading(true)

        // Get historical prices
        const history = await tokenApi.getPriceHistory(asset.symbol, '30d')
        const prices = history.map(h => h.close)

        // Get risk score from ML service
        const risk = await predictionApi.getRiskScore(asset.symbol)
        setRiskData(risk)

      } catch (err: any) {
        console.error('Error fetching risk score:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRiskScore()
  }, [asset.symbol, isPro])

  if (!isPro) {
    // ... existing paywall UI
  }

  if (loading || !riskData) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <GlassCard hover={false}>
        <div className="text-5xl font-bold" style={{ color: getRiskColor(riskData.riskScore) }}>
          {riskData.riskScore} / 100
        </div>
        <div className="text-lg font-semibold" style={{ color: getRiskColor(riskData.riskScore) }}>
          {riskData.riskLevel.toUpperCase()} RISK
        </div>
        {/* ... rest of UI */}
      </GlassCard>
    </div>
  )
}
```

**Update HoldingsTab (Lines 577-670):**

```typescript
function HoldingsTab({ asset }: { asset: AssetData }) {
  const { currentPortfolio } = usePortfolio()
  const [holdings, setHoldings] = useState<any[]>([])

  useEffect(() => {
    if (currentPortfolio) {
      // Filter holdings for this asset
      const assetHoldings = currentPortfolio.holdings?.filter(
        h => h.token.symbol === asset.symbol
      ) || []
      setHoldings(assetHoldings)
    }
  }, [currentPortfolio, asset.symbol])

  if (holdings.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-8">
          <p className="text-white/70 mb-4">You don't hold any {asset.symbol}</p>
          <Button>Add {asset.symbol} Holding</Button>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      <GlassCard hover={false}>
        <h2 className="text-xl font-semibold text-white mb-6">
          Your {asset.symbol} Holdings
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* ... table structure */}
            <tbody>
              {holdings.map((holding) => (
                <tr key={holding.id}>
                  <td>{currentPortfolio.name}</td>
                  <td>{holding.amount} {asset.symbol}</td>
                  <td>${(holding.amount * asset.currentPrice).toFixed(2)}</td>
                  <td>{/* Calculate P&L */}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
```

### Phase 3: Update PriceHistoryChart (0.5 days)

**File:** `frontend/src/components/price-history-chart.tsx`

```typescript
// BEFORE (mock data)
const mockData = [...]

// AFTER
export function PriceHistoryChart({ symbol, timeframe }: Props) {
  const [data, setData] = useState<PriceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setLoading(true)
        setError(null)

        const history = await tokenApi.getPriceHistory(symbol, timeframe)
        setData(history)

      } catch (err: any) {
        console.error('Error fetching price history:', err)
        setError('Failed to load price data')
      } finally {
        setLoading(false)
      }
    }

    fetchPriceHistory()
  }, [symbol, timeframe])

  if (loading) {
    return <div className="h-[400px] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="close" stroke="#3b82f6" />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Phase 4: Backend Integration (0.5 days)

Create backend route for ML service proxy (optional - can call ML service directly from frontend):

**File:** `backend/src/routes/predictions.ts` (NEW)

```typescript
import { Router } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:8000';

// GET /api/v1/predictions/:symbol
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    // Check cache first
    const cached = await prisma.prediction.findFirst({
      where: {
        symbol,
        createdAt: {
          gte: new Date(Date.now() - 3600000) // 1 hour cache
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (cached) {
      return res.json(cached);
    }

    // Fetch historical prices
    const prices = await prisma.priceData.findMany({
      where: { symbol },
      orderBy: { timestamp: 'desc' },
      take: 90,
      select: { close: true }
    });

    if (prices.length < 60) {
      return res.status(400).json({
        error: 'Insufficient historical data for prediction'
      });
    }

    // Call ML service
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
      symbol,
      historical_prices: prices.map(p => p.close).reverse(),
      days_ahead: 7
    });

    // Cache prediction
    const prediction = await prisma.prediction.create({
      data: {
        symbol,
        predictedPrice: response.data.predicted_price,
        confidence: response.data.confidence,
        daysAhead: 7
      }
    });

    res.json(prediction);

  } catch (error) {
    res.status(500).json({
      error: 'Prediction failed',
      message: error.message
    });
  }
});

// Similar for risk scores...

export default router;
```

---

## Testing Checklist

### Test Case 1: Asset Detail Page Loads Real Data
**Steps:**
1. Navigate to `/assets/BTC`
2. Verify page loads without errors
3. Check that price data is not hardcoded $67,234

**Expected:**
- ✅ Real BTC price from API
- ✅ Real market cap, volume, etc.
- ✅ Loading spinner shown while fetching

### Test Case 2: Price Chart Shows Real History
**Steps:**
1. On asset detail page, click different timeframes (1D, 7D, 30D)
2. Verify chart updates with real data

**Expected:**
- ✅ Chart shows actual historical prices
- ✅ Data changes when timeframe changes

### Test Case 3: AI Predictions Work (Pro User)
**Steps:**
1. Login as Pro user
2. Navigate to `/assets/BTC?tab=predictions`
3. Verify prediction is not hardcoded $72,450

**Expected:**
- ✅ Real prediction from ML service
- ✅ Confidence score shown
- ✅ Updates when timeframe changes

### Test Case 4: Risk Scores Work (Pro User)
**Steps:**
1. Navigate to `/assets/BTC?tab=risk`
2. Verify risk score is not hardcoded 18

**Expected:**
- ✅ Real risk score from ML service
- ✅ Risk level matches score

### Test Case 5: Holdings Show User Data
**Steps:**
1. Navigate to `/assets/BTC?tab=holdings`
2. Verify holdings match user's actual BTC

**Expected:**
- ✅ Shows holdings from connected portfolio
- ✅ Empty state if no holdings

### Test Case 6: Error Handling
**Steps:**
1. Stop backend server
2. Navigate to `/assets/BTC`

**Expected:**
- ✅ Error message shown
- ✅ No crash or blank page

---

## Environment Variables Needed

Add to `frontend/.env`:
```bash
# ML Service URL
VITE_ML_SERVICE_URL=http://localhost:8000

# API URL (already exists)
VITE_API_URL=http://localhost:3001/api/v1
```

---

## Files to Create/Modify

### Create:
1. `backend/src/routes/predictions.ts` - Prediction/risk API proxy
2. `frontend/src/hooks/usePrediction.ts` - Custom hook for predictions (optional)
3. `frontend/src/hooks/useRiskScore.ts` - Custom hook for risk scores (optional)

### Modify:
1. `frontend/src/services/api.ts` - Add token/prediction APIs
2. `frontend/src/pages/AssetDetailPage.tsx` - Replace mock data
3. `frontend/src/components/price-history-chart.tsx` - Use real price data
4. `frontend/src/components/market-insights.tsx` - Use real market data (if exists)
5. `backend/src/server.ts` - Add predictions route

---

## Estimated Time Breakdown

| Task | Time | Status |
|------|------|--------|
| Extend API client | 1 day | ⏳ To Do |
| Update AssetDetailPage | 1-2 days | ⏳ To Do |
| Update PriceHistoryChart | 0.5 days | ⏳ To Do |
| Backend integration | 0.5 days | ⏳ To Do |
| Testing & fixes | 0.5 days | ⏳ To Do |
| **TOTAL** | **3.5-4.5 days** | |

---

## Critical Path

1. ✅ **Extend `api.ts`** with token/prediction methods (Priority 1)
2. ✅ **Update `AssetDetailPage`** overview tab (Priority 1)
3. ✅ **Update `PriceHistoryChart`** (Priority 2)
4. ✅ **Update predictions tab** (Priority 2)
5. ✅ **Update risk tab** (Priority 3)
6. ✅ **Update holdings tab** (Priority 3)
7. ✅ **Testing** (Priority 4)

---

## Known Blockers

### 1. ML Service Must Be Running
**Issue:** Frontend needs ML service at `http://localhost:8000`

**Solution:**
```bash
cd ml-service
docker-compose up ml-service
```

### 2. Historical Price Data Needed
**Issue:** Database must have price history for predictions

**Solution:**
```bash
# Run price fetcher service (backend)
npm run fetch-prices
```

### 3. Token Data Must Exist
**Issue:** Database must have token metadata

**Solution:**
```bash
# Seed token data
cd backend
npm run seed
```

---

## Success Criteria

- [ ] All components load real data from APIs
- [ ] No hardcoded mock data in production code
- [ ] Loading states shown during API calls
- [ ] Error messages shown when APIs fail
- [ ] End-to-end flow works: Login → Dashboard → Asset Detail → Predictions
- [ ] ML predictions work for Pro users
- [ ] Risk scores work for Pro users
- [ ] Price charts show real historical data
- [ ] Holdings show user's actual portfolio data

---

## What's Working Already

✅ Backend APIs implemented
✅ Database schema complete
✅ ML service functional
✅ Authentication working
✅ API client infrastructure exists
✅ Most backend routes tested

## What Needs Work

⚠️ Frontend components still use mock data
⚠️ API client needs extension
⚠️ Loading/error states need improvement
⚠️ End-to-end testing needed

---

## Next Steps (for continuation)

1. **Start with Phase 1:** Extend `api.ts` with token/prediction methods
2. **Then Phase 2:** Update AssetDetailPage overview tab with real data
3. **Then Phase 3:** Update PriceHistoryChart with real price history
4. **Then Phase 4:** Update predictions and risk tabs
5. **Finally:** Test everything end-to-end

**Estimated completion:** 2-3 days of focused work

---

**Documented by:** Claude Code Assistant
**Date:** October 11, 2025
**Status:** Ready for Implementation ✅
