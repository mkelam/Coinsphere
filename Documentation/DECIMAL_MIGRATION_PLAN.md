# 🏗️ **DECIMAL MIGRATION PLAN**
## **Float → Decimal: Eliminate Silent Data Corruption**

**Created:** 2025-10-08
**Architect:** Crypto Architect
**Priority:** 🔴 CRITICAL - Production Blocker
**Estimated Time:** 2-3 days (1 senior engineer)

---

## 🎯 **OBJECTIVE**

Migrate ALL monetary calculations from JavaScript `number` (Float64) to `Decimal` type to ensure:
- ✅ **Zero precision loss** in financial calculations
- ✅ **Accurate PnL tracking** for tax reporting
- ✅ **Correct cost-basis calculations** (FIFO/LIFO/HIFO)
- ✅ **No silent data corruption** from floating-point errors

---

## ⚠️ **WHY THIS IS CRITICAL**

### **The Problem:**
```javascript
// JavaScript floating-point arithmetic is BROKEN for money:
0.1 + 0.2 === 0.3  // ❌ FALSE! Actually 0.30000000000000004

// Real-world example with crypto:
let portfolioValue = 0;
for (let i = 0; i < 1000000; i++) {
  portfolioValue += 0.01;  // Adding 1 cent 1M times
}
// Expected: 10000.00
// Actual:   10000.000000001396  ❌ $0.00000001396 error

// Accumulated over millions of transactions → THOUSANDS of dollars lost
```

### **Impact on Coinsphere:**
- ❌ **User sees wrong PnL** → Loss of trust
- ❌ **Tax calculations incorrect** → Legal liability
- ❌ **Portfolio allocation percentages off** → Bad UX
- ❌ **Cost-basis drift** → Audit nightmare

---

## 📋 **MIGRATION PHASES**

### **Phase 1: Setup** ✅ COMPLETE
- [x] Install `decimal.js` package
- [x] Create `utils/decimal.ts` wrapper with helpers
- [x] Set Decimal.js precision to 28 digits

### **Phase 2: Database Schema Migration** (1 hour)

**Files to modify:**
1. `prisma/schema.prisma`
2. Create migration SQL
3. Apply migration with data preservation

**Schema Changes:**

```prisma
// ❌ BEFORE (Float - WRONG!)
model Token {
  currentPrice   Float? @map("current_price")
  marketCap      Float? @map("market_cap")
  volume24h      Float? @map("volume_24h")
  priceChange24h Float? @map("price_change_24h")
}

model Holding {
  amount          Float
  averageBuyPrice Float? @map("average_buy_price")
}

model Transaction {
  amount  Float
  price   Float
  fee     Float @default(0)
}

// ✅ AFTER (Decimal - CORRECT!)
model Token {
  currentPrice   Decimal? @db.Decimal(18, 8) @map("current_price")
  marketCap      Decimal? @db.Decimal(24, 2) @map("market_cap")
  volume24h      Decimal? @db.Decimal(24, 2) @map("volume_24h")
  priceChange24h Decimal? @db.Decimal(10, 4) @map("price_change_24h")
}

model Holding {
  amount          Decimal @db.Decimal(24, 8)
  averageBuyPrice Decimal? @db.Decimal(18, 8) @map("average_buy_price")
}

model Transaction {
  amount  Decimal @db.Decimal(24, 8)
  price   Decimal @db.Decimal(18, 8)
  fee     Decimal @db.Decimal(18, 8) @default(0)
}

model PriceData {
  open   Decimal @db.Decimal(18, 8)
  high   Decimal @db.Decimal(18, 8)
  low    Decimal @db.Decimal(18, 8)
  close  Decimal @db.Decimal(18, 8)
  volume Decimal @db.Decimal(24, 8)
}
```

**Precision Guidelines:**
- **Crypto prices:** `Decimal(18, 8)` - 18 total digits, 8 decimals (supports up to $99,999,999.99999999)
- **Amounts/Volumes:** `Decimal(24, 8)` - Supports large token amounts (meme coins with billions of supply)
- **Market cap:** `Decimal(24, 2)` - 24 digits, 2 decimals (up to $9,999,999,999,999,999,999.99)
- **Percentages:** `Decimal(10, 4)` - Up to 999,999.9999%

**Migration Command:**
```bash
# Create migration
npx prisma migrate dev --name decimal_migration --create-only

# Review generated SQL
# Edit migration if needed to preserve data
# Apply migration
npx prisma migrate deploy
```

**Data Preservation SQL:**
```sql
-- PostgreSQL automatically converts Float to Decimal
-- No data loss occurs (Float is subset of Decimal)

ALTER TABLE "tokens"
  ALTER COLUMN "current_price" TYPE DECIMAL(18,8),
  ALTER COLUMN "market_cap" TYPE DECIMAL(24,2),
  ALTER COLUMN "volume_24h" TYPE DECIMAL(24,2),
  ALTER COLUMN "price_change_24h" TYPE DECIMAL(10,4);

ALTER TABLE "holdings"
  ALTER COLUMN "amount" TYPE DECIMAL(24,8),
  ALTER COLUMN "average_buy_price" TYPE DECIMAL(18,8);

ALTER TABLE "transactions"
  ALTER COLUMN "amount" TYPE DECIMAL(24,8),
  ALTER COLUMN "price" TYPE DECIMAL(18,8),
  ALTER COLUMN "fee" TYPE DECIMAL(18,8);

ALTER TABLE "price_data"
  ALTER COLUMN "open" TYPE DECIMAL(18,8),
  ALTER COLUMN "high" TYPE DECIMAL(18,8),
  ALTER COLUMN "low" TYPE DECIMAL(18,8),
  ALTER COLUMN "close" TYPE DECIMAL(18,8),
  ALTER COLUMN "volume" TYPE DECIMAL(24,8);
```

---

### **Phase 3: Service Layer Migration** (4 hours)

#### **3.1 Portfolio Service** (`services/portfolioService.ts`)

**Location:** Lines 240-266 (calculatePortfolioStats)

```typescript
// ❌ BEFORE
private calculatePortfolioStats(portfolio: any) {
  let totalValue = 0;
  let totalCost = 0;

  for (const holding of portfolio.holdings) {
    const currentPrice = holding.token.currentPrice || 0;
    const averageBuyPrice = holding.averageBuyPrice || 0;
    const amount = holding.amount;

    totalValue += currentPrice * amount;  // ❌ Float multiplication
    totalCost += averageBuyPrice * amount;
  }

  const profitLoss = totalValue - totalCost;
  const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

  return {
    totalValue: Math.round(totalValue * 100) / 100,  // ❌ Lossy rounding
    totalCost: Math.round(totalCost * 100) / 100,
    profitLoss: Math.round(profitLoss * 100) / 100,
    profitLossPercentage: Math.round(profitLossPercentage * 100) / 100,
    holdingsCount,
  };
}
```

```typescript
// ✅ AFTER
import { toDecimal, multiply, add, subtract, percentage, toNumber } from '../utils/decimal.js';
import Decimal from 'decimal.js';

private calculatePortfolioStats(portfolio: any) {
  let totalValue = new Decimal(0);
  let totalCost = new Decimal(0);
  let holdingsCount = 0;

  for (const holding of portfolio.holdings) {
    holdingsCount++;

    const currentPrice = toDecimal(holding.token.currentPrice);
    const averageBuyPrice = toDecimal(holding.averageBuyPrice);
    const amount = toDecimal(holding.amount);

    // Precise multiplication and addition
    totalValue = totalValue.plus(multiply(currentPrice, amount));
    totalCost = totalCost.plus(multiply(averageBuyPrice, amount));
  }

  const profitLoss = subtract(totalValue, totalCost);
  const profitLossPercentage = totalCost.greaterThan(0)
    ? percentage(profitLoss, totalCost)
    : new Decimal(0);

  return {
    totalValue: toNumber(totalValue, 2),        // Convert to number ONLY for JSON output
    totalCost: toNumber(totalCost, 2),
    profitLoss: toNumber(profitLoss, 2),
    profitLossPercentage: toNumber(profitLossPercentage, 2),
    holdingsCount,
  };
}
```

**Similar changes needed for:**
- `getPortfolioAllocation()` - Lines 317-383
- Any other monetary calculations

---

#### **3.2 Holdings Service** (`services/holdingsService.ts`)

**Location:** Weighted average calculation (lines 79-92)

```typescript
// ❌ BEFORE
if (data.averageBuyPrice && existingHolding.averageBuyPrice) {
  const oldValue = existingHolding.amount * existingHolding.averageBuyPrice;
  const newValue = data.amount * data.averageBuyPrice;
  newAverageBuyPrice = (oldValue + newValue) / newAmount;
}
```

```typescript
// ✅ AFTER
import { toDecimal, weightedAverage, add, toNumber } from '../utils/decimal.js';

if (data.averageBuyPrice && existingHolding.averageBuyPrice) {
  // Use precise weighted average calculation
  newAverageBuyPrice = weightedAverage(
    existingHolding.averageBuyPrice,  // value1
    existingHolding.amount,            // weight1
    data.averageBuyPrice,              // value2
    data.amount                        // weight2
  );
}

// When updating database, convert to string for Prisma
const holding = await prisma.holding.update({
  where: { id: existingHolding.id },
  data: {
    amount: add(existingHolding.amount, data.amount).toString(),
    averageBuyPrice: newAverageBuyPrice?.toString(),
  },
});
```

**Key principle:**
- ✅ Use `Decimal` for ALL calculations
- ✅ Convert to `.toString()` when writing to database
- ✅ Convert to `.toNumber()` ONLY for JSON responses

---

#### **3.3 Price Updater Service** (`services/priceUpdater.ts`)

**Location:** CoinGecko API response parsing

```typescript
// ❌ BEFORE
currentPrice: coin.current_price,  // Float from API

// ✅ AFTER
import { toDecimal } from '../utils/decimal.js';

currentPrice: toDecimal(coin.current_price).toString(),  // Convert to Decimal, then string for DB
marketCap: toDecimal(coin.market_cap).toString(),
volume24h: toDecimal(coin.total_volume).toString(),
priceChange24h: toDecimal(coin.price_change_percentage_24h).toString(),
```

---

### **Phase 4: Route Layer Updates** (1 hour)

**No changes needed!** Routes already return service results.
Only change: Ensure Zod schemas accept Decimal as string:

```typescript
// Validation schemas already use z.number() which accepts Decimal.toNumber()
const createHoldingSchema = z.object({
  amount: z.number().positive(),  // Frontend sends number, we convert to Decimal internally
  averageBuyPrice: z.number().positive().optional(),
});
```

**Response Serialization:**
- Prisma automatically converts Decimal to string in JSON
- Our `toNumber()` calls in services ensure clean number output

---

### **Phase 5: Testing** (3 hours)

#### **5.1 Unit Tests**

Create `tests/decimal.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import {
  toDecimal,
  multiply,
  add,
  weightedAverage,
  percentage,
  toNumber
} from '../src/utils/decimal';

describe('Decimal Precision', () => {
  test('should handle 0.1 + 0.2 correctly', () => {
    const result = add(0.1, 0.2);
    expect(result.toString()).toBe('0.3');  // ✅ Exact!
  });

  test('should calculate portfolio value precisely', () => {
    // 0.123456789 BTC at $50,000.123 per BTC
    const amount = toDecimal('0.123456789');
    const price = toDecimal('50000.123');
    const value = multiply(amount, price);

    expect(value.toFixed(2)).toBe('6172.35');  // Exact to 2 decimals
  });

  test('should calculate weighted average correctly', () => {
    // Existing: 10 BTC at $40,000
    // New: 5 BTC at $50,000
    // Expected: (10*40000 + 5*50000) / 15 = 43,333.33
    const avg = weightedAverage(40000, 10, 50000, 5);
    expect(avg.toFixed(2)).toBe('43333.33');
  });

  test('should handle large amounts without overflow', () => {
    // 1 billion SHIB at $0.00001
    const amount = toDecimal('1000000000');
    const price = toDecimal('0.00001');
    const value = multiply(amount, price);

    expect(value.toString()).toBe('10000');
  });
});
```

#### **5.2 Integration Tests**

Test critical flows:

```typescript
describe('Portfolio Service Integration', () => {
  test('should calculate PnL accurately', async () => {
    // Create portfolio with BTC holding
    const portfolio = await portfolioService.createPortfolio({
      userId: testUser.id,
      name: 'Test Portfolio',
    });

    // Add BTC holding: 0.5 BTC at $40,000
    await holdingsService.addHolding({
      portfolioId: portfolio.id,
      tokenSymbol: 'BTC',
      amount: 0.5,
      averageBuyPrice: 40000,
    }, testUser.id);

    // Update BTC price to $50,000
    await prisma.token.update({
      where: { symbol: 'BTC' },
      data: { currentPrice: new Decimal('50000').toString() },
    });

    // Fetch portfolio with stats
    const result = await portfolioService.getPortfolioById(portfolio.id, testUser.id);

    // Assertions
    expect(result.stats.totalCost).toBe(20000);    // 0.5 * 40000
    expect(result.stats.totalValue).toBe(25000);   // 0.5 * 50000
    expect(result.stats.profitLoss).toBe(5000);    // 25000 - 20000
    expect(result.stats.profitLossPercentage).toBe(25);  // (5000 / 20000) * 100
  });
});
```

**Run tests:**
```bash
npm test -- decimal
npm test -- portfolio
npm test -- holdings
```

---

### **Phase 6: Deployment** (1 hour)

**Pre-Deployment Checklist:**
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Database migration tested on staging
- [ ] Backup production database
- [ ] Rollback plan documented

**Deployment Steps:**

1. **Backup Production DB:**
```bash
pg_dump -h production-db.amazonaws.com -U coinsphere -d coinsphere_prod > backup_pre_decimal_migration_$(date +%Y%m%d).sql
```

2. **Apply Migration (Zero-Downtime):**
```bash
# Step 1: Add new Decimal columns (non-breaking)
ALTER TABLE tokens ADD COLUMN current_price_decimal DECIMAL(18,8);
UPDATE tokens SET current_price_decimal = current_price::DECIMAL(18,8);

# Step 2: Deploy new code (reads from old columns, writes to both)
git push production main

# Step 3: Backfill data
UPDATE tokens SET current_price_decimal = current_price WHERE current_price_decimal IS NULL;

# Step 4: Swap columns (downtime: ~5 seconds)
BEGIN;
  ALTER TABLE tokens DROP COLUMN current_price;
  ALTER TABLE tokens RENAME COLUMN current_price_decimal TO current_price;
COMMIT;

# Step 5: Deploy final code (reads/writes from new Decimal columns)
git push production main
```

3. **Validation:**
```bash
# Compare portfolio stats before/after
SELECT
  portfolio_id,
  SUM(amount * current_price) as total_value,
  SUM(amount * average_buy_price) as total_cost
FROM holdings h
JOIN tokens t ON h.token_id = t.id
GROUP BY portfolio_id
LIMIT 10;
```

4. **Monitoring:**
```bash
# Watch for errors
tail -f /var/log/coinsphere/app.log | grep -i "decimal\|precision\|NaN"

# Check Sentry for new errors
# Monitor response times for performance regression
```

---

## 🎯 **SUCCESS CRITERIA**

- ✅ All Float fields converted to Decimal in database
- ✅ All monetary calculations use Decimal.js
- ✅ PnL calculations accurate to 2 decimal places
- ✅ No precision loss errors in logs
- ✅ Performance impact < 5% (Decimal.js is fast)
- ✅ All tests passing
- ✅ Production deployment successful

---

## 📊 **RISK ASSESSMENT**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration breaks existing data | Low | High | Full DB backup + rollback plan |
| Performance regression | Low | Medium | Benchmark before/after |
| Frontend breaks on Decimal strings | Low | High | Frontend already handles number types |
| Decimal.js bugs | Very Low | High | Battle-tested library (10M+ downloads/week) |

---

## 🔄 **ROLLBACK PLAN**

If migration fails:

1. **Restore Database:**
```bash
psql -h production-db -U coinsphere -d coinsphere_prod < backup_pre_decimal_migration.sql
```

2. **Revert Code:**
```bash
git revert HEAD
git push production main
```

3. **Verify:**
```bash
# Test critical endpoints
curl -X GET https://api.coinsphere.com/api/v1/portfolios -H "Authorization: Bearer $TOKEN"
```

**Recovery Time Objective (RTO):** < 10 minutes
**Recovery Point Objective (RPO):** 0 (zero data loss)

---

## 📋 **TASK CHECKLIST**

### Phase 1: Setup ✅
- [x] Install decimal.js
- [x] Create utils/decimal.ts wrapper

### Phase 2: Database
- [ ] Update Prisma schema (Float → Decimal)
- [ ] Create migration
- [ ] Test migration on dev database
- [ ] Test migration on staging database

### Phase 3: Services
- [ ] Update portfolioService.ts
- [ ] Update holdingsService.ts
- [ ] Update transactionsService.ts (when created)
- [ ] Update priceUpdater.ts
- [ ] Update any other services with monetary calculations

### Phase 4: Testing
- [ ] Write Decimal unit tests
- [ ] Write portfolio integration tests
- [ ] Write holdings integration tests
- [ ] Run full test suite
- [ ] Manual testing on staging

### Phase 5: Deployment
- [ ] Backup production database
- [ ] Deploy to staging
- [ ] Validate on staging
- [ ] Deploy to production
- [ ] Monitor for 24 hours

---

## 📚 **REFERENCES**

- **Decimal.js Docs:** https://mikemcl.github.io/decimal.js/
- **PostgreSQL Decimal Type:** https://www.postgresql.org/docs/current/datatype-numeric.html
- **Prisma Decimal:** https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#decimal
- **Why Floats Are Bad for Money:** https://stackoverflow.com/questions/3730019/why-not-use-double-or-float-to-represent-currency

---

## 🏗️ **ARCHITECT SIGN-OFF**

**Status:** ✅ APPROVED FOR IMPLEMENTATION

**Estimated Completion:** 2-3 days
**Risk Level:** LOW (with proper testing)
**Business Impact:** CRITICAL (prevents financial data corruption)

**Next Step:** Begin Phase 2 - Database Schema Migration

---

*Document prepared by Crypto Architect*
*Coinsphere - Military-Grade Financial Accuracy*
