# Performance Benchmarks & Optimization

**Document Version:** 1.0
**Last Updated:** 2025-10-07
**Owner:** Engineering Team
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [Performance Targets](#performance-targets)
3. [Frontend Performance](#frontend-performance)
4. [Backend Performance](#backend-performance)
5. [Database Performance](#database-performance)
6. [Load Testing](#load-testing)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Optimization Strategies](#optimization-strategies)

---

## 1. Overview

**Why Performance Matters:**
- **User retention:** 53% of mobile users abandon sites that take >3s to load
- **SEO:** Google Core Web Vitals directly affect search rankings
- **Conversion:** 1 second delay = 7% reduction in conversions
- **Cost:** Slow queries consume more server resources ($$$)

**Performance Philosophy:**
- **Perceived performance > actual performance**: Show skeleton loaders while loading
- **Optimize for p95, not average**: 95th percentile users matter most
- **Measure everything**: No guessing, only data-driven optimization

---

## 2. Performance Targets

### 2.1 Frontend (Web App)

**Core Web Vitals (Google's metrics):**

| Metric | Target | Acceptable | Current | Priority |
|--------|--------|------------|---------|----------|
| **LCP (Largest Contentful Paint)** | <2.5s | <4.0s | TBD | High |
| **FID (First Input Delay)** | <100ms | <300ms | TBD | High |
| **CLS (Cumulative Layout Shift)** | <0.1 | <0.25 | TBD | Medium |

**Additional metrics:**

| Metric | Target | Acceptable | Current | Priority |
|--------|--------|------------|---------|----------|
| **TTFB (Time to First Byte)** | <200ms | <600ms | TBD | High |
| **FCP (First Contentful Paint)** | <1.5s | <3.0s | TBD | Medium |
| **TTI (Time to Interactive)** | <3.5s | <7.0s | TBD | Medium |
| **Bundle size (JS)** | <200KB | <500KB | TBD | Medium |
| **Bundle size (CSS)** | <50KB | <100KB | TBD | Low |

**Lighthouse score:** Target 90+ (desktop), 75+ (mobile)

---

### 2.2 Backend (API)

**Response times (p95):**

| Endpoint | Target | Acceptable | Current | Priority |
|----------|--------|------------|---------|----------|
| `GET /api/v1/portfolios/:id` | <200ms | <500ms | TBD | High |
| `GET /api/v1/holdings` | <150ms | <400ms | TBD | High |
| `GET /api/v1/prices/:symbol` | <100ms | <300ms | TBD | High |
| `POST /api/v1/holdings` | <300ms | <700ms | TBD | Medium |
| `GET /api/v1/predictions/:symbol` | <400ms | <1000ms | TBD | Medium |
| `POST /api/v1/alerts` | <200ms | <500ms | TBD | Low |

**Throughput:**
- **Requests per second (RPS):** Target 500 RPS sustained, 1000 RPS peak
- **Concurrent users:** Support 1,000 concurrent users

**Error rate:** <0.5% of requests

---

### 2.3 Database

**Query performance (p95):**

| Query Type | Target | Acceptable | Current | Priority |
|------------|--------|------------|---------|----------|
| `SELECT` (indexed) | <10ms | <50ms | TBD | High |
| `SELECT` (full table scan) | <100ms | <500ms | TBD | Medium |
| `INSERT` | <20ms | <100ms | TBD | Medium |
| `UPDATE` | <30ms | <150ms | TBD | Medium |
| `JOIN` (2-3 tables) | <50ms | <200ms | TBD | High |

**Connection pool:**
- **Pool size:** 20 connections (production)
- **Max wait time:** <100ms

**Cache hit rate (Redis):** >90%

---

## 3. Frontend Performance

### 3.1 Initial Load Optimization

**Code splitting:**
```typescript
// ✅ GOOD: Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Settings = lazy(() => import('./pages/Settings'));

<Routes>
  <Route path="/" element={<Suspense fallback={<Loading />}><Dashboard /></Suspense>} />
  <Route path="/portfolio" element={<Suspense fallback={<Loading />}><Portfolio /></Suspense>} />
</Routes>
```

**Bundle analysis:**
```bash
# Analyze bundle size
npm run build -- --analyze

# Output: Build complete (200KB gzipped)
# Largest chunks:
#   - vendor.js: 120KB (React, React Query, Chart.js)
#   - main.js: 60KB (app code)
#   - styles.css: 20KB (Tailwind)
```

**Optimization targets:**
- Tree-shake unused dependencies (e.g., import only needed lodash functions)
- Use dynamic imports for heavy libraries (e.g., chart.js)
- Compress with Brotli (30% smaller than gzip)

---

### 3.2 Runtime Performance

**React optimizations:**

**1. Memoization:**
```typescript
// ✅ GOOD: Memoize expensive calculations
const portfolioValue = useMemo(() => {
  return holdings.reduce((sum, h) => sum + h.currentValue, 0);
}, [holdings]);

// ✅ GOOD: Memoize components
const HoldingRow = React.memo(({ holding }: { holding: Holding }) => {
  return <tr>{/* ... */}</tr>;
});
```

**2. Virtualization (for large lists):**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function HoldingsList({ holdings }: { holdings: Holding[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: holdings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,  // Row height
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <HoldingRow
            key={virtualRow.index}
            holding={holdings[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

**3. Debouncing:**
```typescript
import { useDebouncedValue } from '@/hooks/useDebounce';

function AssetSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);  // 300ms delay

  // Only search after user stops typing for 300ms
  const { data } = useQuery({
    queryKey: ['assets', debouncedQuery],
    queryFn: () => searchAssets(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });
}
```

---

### 3.3 Image Optimization

**Next-gen formats:**
```html
<!-- Serve WebP with fallback -->
<picture>
  <source srcset="/logo.webp" type="image/webp">
  <img src="/logo.png" alt="Coinsphere">
</picture>
```

**Lazy loading:**
```html
<img src="/chart.png" loading="lazy" alt="Price chart" />
```

**CDN delivery:**
- Use Cloudflare CDN for static assets
- Enable auto-minification and caching

---

### 3.4 CSS Optimization

**Tailwind purge (remove unused classes):**
```javascript
// tailwind.config.js
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],  // Scan files
  // Unused classes automatically removed in production build
};
```

**Critical CSS (inline above-the-fold styles):**
```html
<head>
  <style>
    /* Inline critical CSS for above-the-fold content */
    .header { /* ... */ }
    .portfolio-card { /* ... */ }
  </style>
  <link rel="stylesheet" href="/styles.css" media="print" onload="this.media='all'">
</head>
```

---

## 4. Backend Performance

### 4.1 API Response Optimization

**Caching strategy:**

**Level 1: In-memory cache (Redis)**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getPriceWithCache(symbol: string): Promise<number> {
  const cacheKey = `price:${symbol}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return parseFloat(cached);
  }

  // Cache miss, fetch from API
  const price = await coinGeckoApi.getPrice(symbol);

  // Store in cache for 30 seconds
  await redis.setex(cacheKey, 30, price.toString());

  return price;
}
```

**Level 2: HTTP caching (CDN)**
```typescript
app.get('/api/v1/prices/:symbol', async (req, res) => {
  const price = await getPrice(req.params.symbol);

  // Cache at CDN for 30 seconds
  res.set('Cache-Control', 'public, max-age=30, s-maxage=30');
  res.json({ price });
});
```

**Cache invalidation:**
- Price data: 30 seconds TTL (auto-expire)
- User portfolio: Invalidate on holding add/edit/delete
- Risk scores: 6 hours TTL (recalculated batch job)

---

### 4.2 Database Query Optimization

**Indexing strategy:**

**Before (slow - 500ms):**
```sql
SELECT * FROM holdings WHERE user_id = 'uuid-123';
-- No index on user_id → full table scan
```

**After (fast - 5ms):**
```sql
CREATE INDEX idx_holdings_user_id ON holdings(user_id);
SELECT * FROM holdings WHERE user_id = 'uuid-123';
-- Uses index → instant lookup
```

**Compound indexes:**
```sql
-- Query: Find active alerts for a specific user
CREATE INDEX idx_alerts_user_active ON alerts(user_id, is_active)
WHERE is_active = true;

-- Query: Get price history for asset in date range
CREATE INDEX idx_price_history_symbol_time ON price_history(asset_symbol, time DESC);
```

**Query optimization:**

**Before (N+1 query problem - slow):**
```typescript
// Fetch portfolio (1 query)
const portfolio = await db.query('SELECT * FROM portfolios WHERE user_id = $1', [userId]);

// Fetch holdings one by one (N queries)
for (const holding of portfolio.holdings) {
  holding.asset = await db.query('SELECT * FROM assets WHERE symbol = $1', [holding.symbol]);
}
```

**After (join - fast):**
```typescript
const portfolio = await db.query(`
  SELECT
    p.*,
    h.*,
    a.*
  FROM portfolios p
  JOIN holdings h ON h.portfolio_id = p.id
  JOIN assets a ON a.symbol = h.asset_symbol
  WHERE p.user_id = $1
`, [userId]);
```

---

### 4.3 API Rate Limiting

**Prevent abuse and ensure fair usage:**

```typescript
import rateLimit from 'express-rate-limit';

// General rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // 100 requests per 15 min per IP
  message: 'Too many requests, please try again later.',
});

app.use('/api/', limiter);

// Stricter limit for expensive endpoints
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,  // 10 requests per minute
});

app.use('/api/v1/predictions', strictLimiter);
```

**Per-user rate limits (Redis):**
```typescript
async function checkUserRateLimit(userId: string): Promise<boolean> {
  const key = `rate:${userId}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 60);  // 60 second window
  }

  return count <= 100;  // Max 100 requests per minute per user
}
```

---

## 5. Database Performance

### 5.1 Connection Pooling

**PostgreSQL connection pool (pg):**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: 'coinsphere',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,  // Max 20 connections
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 2000,  // Wait max 2s for available connection
});

export async function query(sql: string, params: any[]) {
  const start = Date.now();
  const result = await pool.query(sql, params);
  const duration = Date.now() - start;

  if (duration > 100) {
    logger.warn(`Slow query (${duration}ms): ${sql}`);
  }

  return result;
}
```

---

### 5.2 Query Performance Monitoring

**Enable query logging for slow queries:**
```sql
-- PostgreSQL config (postgresql.conf)
log_min_duration_statement = 100  -- Log queries >100ms
```

**Analyze query plan:**
```sql
EXPLAIN ANALYZE
SELECT *
FROM holdings h
JOIN assets a ON a.symbol = h.asset_symbol
WHERE h.user_id = 'uuid-123';

-- Output:
-- Index Scan using idx_holdings_user_id on holdings  (cost=0.42..8.44 rows=1 width=152) (actual time=0.015..0.016 rows=5 loops=1)
-- Index Cond: (user_id = 'uuid-123'::uuid)
-- Planning Time: 0.082 ms
-- Execution Time: 0.035 ms
```

**Optimization checklist:**
- ✅ All foreign keys have indexes
- ✅ No sequential scans on large tables (>10K rows)
- ✅ JOINs use indexes (not nested loops)
- ✅ No N+1 queries (use JOINs or batch loads)

---

### 5.3 TimescaleDB Optimization

**Hypertable configuration:**
```sql
-- Optimize chunk interval (1 week chunks)
SELECT set_chunk_time_interval('price_history', INTERVAL '7 days');

-- Enable compression (50% size reduction)
ALTER TABLE price_history SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'asset_symbol',
  timescaledb.compress_orderby = 'time DESC'
);

-- Auto-compress data older than 7 days
SELECT add_compression_policy('price_history', INTERVAL '7 days');

-- Auto-drop data older than 2 years
SELECT add_retention_policy('price_history', INTERVAL '2 years');
```

**Query optimization:**
```sql
-- ✅ GOOD: Filter by time first (uses hypertable partitioning)
SELECT * FROM price_history
WHERE asset_symbol = 'BTC'
AND time > NOW() - INTERVAL '90 days'
ORDER BY time DESC;

-- ❌ BAD: No time filter (scans all chunks)
SELECT * FROM price_history
WHERE asset_symbol = 'BTC'
ORDER BY time DESC LIMIT 90;
```

---

## 6. Load Testing

### 6.1 Load Testing Tools

**Artillery (HTTP load testing):**
```yaml
# artillery.yml
config:
  target: https://api.coinsphere.io
  phases:
    - duration: 60  # 1 minute
      arrivalRate: 10  # 10 new users per second
      rampTo: 50  # Ramp up to 50/sec

scenarios:
  - name: "Portfolio view"
    flow:
      - get:
          url: "/api/v1/portfolios/{{ userId }}"
      - get:
          url: "/api/v1/holdings"
      - get:
          url: "/api/v1/prices/BTC"
```

**Run test:**
```bash
npm install -g artillery
artillery run artillery.yml

# Output:
# Scenarios launched: 3000
# Scenarios completed: 3000
# Requests completed: 9000
# RPS sent: 150
# RPS completed: 148
# Response time p95: 245ms  ✅ (target <500ms)
# Response time p99: 480ms
# Error rate: 0.2%  ✅ (target <0.5%)
```

---

### 6.2 Load Test Scenarios

**Scenario 1: Homepage load (unauthenticated)**
- Target: 1,000 concurrent users
- Pages: Landing page, pricing, docs
- Expected: <2s LCP, <0.5% error rate

**Scenario 2: Dashboard (authenticated)**
- Target: 500 concurrent users
- Actions: Login, view portfolio, add holding, create alert
- Expected: <500ms API response time, <1% error rate

**Scenario 3: Real-time price updates (WebSocket)**
- Target: 1,000 concurrent WebSocket connections
- Frequency: Price update every 5 seconds per user
- Expected: <100ms latency, <1% disconnections

**Scenario 4: Spike test (Black Friday simulation)**
- Ramp: 0 → 1,000 users in 1 minute
- Sustain: 1,000 users for 5 minutes
- Expected: No crashes, graceful degradation

---

### 6.3 Stress Testing

**Find breaking point:**
```yaml
config:
  phases:
    - duration: 600  # 10 minutes
      arrivalRate: 10
      rampTo: 500  # Ramp up to 500 RPS
```

**Expected results:**
- **At 100 RPS:** Response time <200ms (comfortable)
- **At 300 RPS:** Response time <500ms (acceptable)
- **At 500 RPS:** Response time <1000ms (degraded)
- **At 700+ RPS:** Errors spike >5% (breaking point)

**Bottleneck analysis:**
- If DB CPU spikes → Add read replicas
- If API CPU spikes → Add more ECS tasks
- If Redis maxes out → Increase cache size

---

## 7. Monitoring & Alerts

### 7.1 Real User Monitoring (RUM)

**Sentry Performance Monitoring:**
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,  // Sample 10% of transactions

  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
  ],
});
```

**Custom performance marks:**
```typescript
// Measure specific actions
performance.mark('portfolio-fetch-start');
await fetchPortfolio(userId);
performance.mark('portfolio-fetch-end');

performance.measure(
  'portfolio-fetch',
  'portfolio-fetch-start',
  'portfolio-fetch-end'
);

// Send to analytics
const measure = performance.getEntriesByName('portfolio-fetch')[0];
analytics.track('performance_metric', {
  metric: 'portfolio_fetch_time',
  duration: measure.duration,
  userId
});
```

---

### 7.2 Server Monitoring

**CloudWatch metrics (AWS):**
- **ECS CPU utilization:** Alert if >80%
- **ECS memory utilization:** Alert if >85%
- **RDS CPU utilization:** Alert if >70%
- **RDS connections:** Alert if >80% of max

**Custom API metrics:**
```typescript
import { cloudwatch } from '@/lib/aws';

async function trackApiResponseTime(endpoint: string, duration: number) {
  await cloudwatch.putMetricData({
    Namespace: 'Coinsphere/API',
    MetricData: [{
      MetricName: 'ResponseTime',
      Dimensions: [{ Name: 'Endpoint', Value: endpoint }],
      Value: duration,
      Unit: 'Milliseconds',
      Timestamp: new Date()
    }]
  });
}
```

**Alert thresholds:**
```yaml
# CloudWatch alarms
- Alarm: API_HighResponseTime
  Metric: ResponseTime
  Threshold: >500ms (p95)
  Action: Page on-call engineer

- Alarm: API_HighErrorRate
  Metric: ErrorRate
  Threshold: >1%
  Action: Slack notification

- Alarm: Database_HighConnections
  Metric: DatabaseConnections
  Threshold: >18 (of 20 max)
  Action: Page on-call engineer
```

---

### 7.3 Database Monitoring

**pg_stat_statements (query stats):**
```sql
-- Enable extension
CREATE EXTENSION pg_stat_statements;

-- View slowest queries
SELECT
  query,
  calls,
  total_exec_time / calls AS avg_time_ms,
  max_exec_time AS max_time_ms
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Output:
-- query                              | calls | avg_time_ms | max_time_ms
-- SELECT * FROM price_history WHERE...| 15000 | 145.2       | 850.0
-- UPDATE holdings SET current_value...| 8000  | 82.5        | 320.0
```

**Index usage stats:**
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,  -- Number of index scans
  idx_tup_read  -- Number of rows read
FROM pg_stat_user_indexes
WHERE idx_scan = 0  -- Unused indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Drop unused indexes to save space and improve write performance
```

---

## 8. Optimization Strategies

### 8.1 Quick Wins (Low Effort, High Impact)

**1. Enable compression (Brotli/Gzip):**
```typescript
// Express.js
import compression from 'compression';

app.use(compression({
  level: 6,  // Compression level (1-9)
  threshold: 1024,  // Only compress files >1KB
}));
```

**Impact:** 60-80% size reduction for text assets (HTML/CSS/JS)

---

**2. Add database indexes:**
```sql
-- Before: 500ms query
-- After: 5ms query
CREATE INDEX idx_holdings_user_id ON holdings(user_id);
```

**Impact:** 100x faster queries for lookups

---

**3. Enable Redis caching:**
```typescript
// Cache price data for 30 seconds
await redis.setex(`price:BTC`, 30, price.toString());
```

**Impact:** Reduce external API calls by 90%+

---

**4. Code splitting (lazy load routes):**
```typescript
const Portfolio = lazy(() => import('./pages/Portfolio'));
```

**Impact:** Reduce initial bundle by 30-50%

---

### 8.2 Advanced Optimizations

**1. Database read replicas:**
```typescript
// Write to primary
await primaryDb.query('INSERT INTO holdings ...');

// Read from replica
const holdings = await replicaDb.query('SELECT * FROM holdings ...');
```

**Impact:** Distribute read load, improve write performance

---

**2. CDN for static assets:**
- Serve assets from Cloudflare CDN (closer to users)
- Impact: 50-70% faster load times globally

---

**3. Prefetching/preloading:**
```html
<!-- Prefetch next page (download in background) -->
<link rel="prefetch" href="/portfolio">

<!-- Preload critical resources -->
<link rel="preload" href="/fonts/inter.woff2" as="font">
```

**Impact:** Instant navigation to prefetched pages

---

**4. Service worker caching (PWA):**
```typescript
// Cache static assets for offline use
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

**Impact:** Instant repeat visits, offline support

---

## Appendix: Performance Testing Checklist

**Before launch:**
- [ ] Lighthouse score >90 (desktop), >75 (mobile)
- [ ] All API endpoints <500ms (p95)
- [ ] Load test passes at 500 RPS
- [ ] No N+1 queries
- [ ] All tables have necessary indexes
- [ ] Redis cache hit rate >90%
- [ ] CloudWatch alarms configured
- [ ] Sentry performance monitoring enabled

**Post-launch (ongoing):**
- [ ] Weekly performance review (check dashboards)
- [ ] Monthly load test (ensure capacity)
- [ ] Quarterly database index review
- [ ] Continuous query optimization (monitor slow queries)

---

**Document End**

*Performance targets will be measured and refined during Sprint 1-2 based on real user data.*
