# Code Style Guide

**Document Version:** 1.0
**Last Updated:** 2025-10-07
**Owner:** Engineering Team
**Status:** Draft

---

## Table of Contents

1. [Introduction](#introduction)
2. [General Principles](#general-principles)
3. [TypeScript/JavaScript Style](#typescriptjavascript-style)
4. [Python Style](#python-style)
5. [React/Frontend Style](#reactfrontend-style)
6. [CSS/Tailwind Style](#csstailwind-style)
7. [Git Commit Conventions](#git-commit-conventions)
8. [Code Review Guidelines](#code-review-guidelines)
9. [Tools & Automation](#tools--automation)

---

## 1. Introduction

This document defines the coding standards for the Coinsphere codebase. Consistent style improves readability, maintainability, and reduces cognitive load during code reviews.

**Key Goals:**
- **Consistency**: Code should look like it was written by a single developer
- **Readability**: Prioritize clarity over cleverness
- **Maintainability**: Make future changes easy and safe
- **Automation**: Enforce rules via linters/formatters, not manual reviews

**Philosophy:**
> "Code is read 10x more often than it's written. Optimize for the reader, not the writer."

---

## 2. General Principles

### 2.1 Core Rules

1. **Clarity over brevity**: `calculateTotalPortfolioValue()` > `calcVal()`
2. **Explicit over implicit**: No magic numbers or unexplained constants
3. **Fail fast**: Validate inputs early, throw errors immediately
4. **Single Responsibility**: Functions/classes should do ONE thing well
5. **DRY (Don't Repeat Yourself)**: Extract duplicated logic into shared functions
6. **YAGNI (You Ain't Gonna Need It)**: Don't add features "just in case"

### 2.2 Naming Conventions

**Variables & Functions:**
```typescript
// ✅ GOOD: Descriptive, clear intent
const userPortfolioValue = calculateTotalValue(holdings);
const hasExceededRiskThreshold = portfolioRiskScore > 60;

// ❌ BAD: Abbreviations, unclear purpose
const val = calc(h);
const flag = score > 60;
```

**Constants:**
```typescript
// ✅ GOOD: Uppercase with underscores
const MAX_ALERT_COUNT_FREE_TIER = 5;
const API_TIMEOUT_MS = 30000;

// ❌ BAD: camelCase for constants
const maxAlertCountFreeTier = 5;
```

**Booleans:**
```typescript
// ✅ GOOD: Prefix with is/has/can/should
const isActive = user.status === 'active';
const hasApiKey = !!user.exchangeApiKey;
const canAccessProFeatures = user.tier === 'pro';

// ❌ BAD: No prefix, unclear meaning
const active = user.status === 'active';
const apiKey = !!user.exchangeApiKey;
```

**Classes & Interfaces:**
```typescript
// ✅ GOOD: PascalCase, noun-based
class PortfolioService {}
interface UserPreferences {}
type RiskScore = number;

// ❌ BAD: camelCase, verb-based
class portfolioService {}
interface getUserPreferences {}
```

### 2.3 File Organization

**Project Structure:**
```
src/
├── components/          # React components
│   ├── Dashboard/
│   │   ├── Dashboard.tsx       # Main component
│   │   ├── Dashboard.test.tsx  # Tests
│   │   ├── Dashboard.stories.tsx  # Storybook
│   │   └── index.ts            # Re-export
│   └── shared/                 # Shared/reusable components
├── hooks/               # Custom React hooks
├── services/            # API clients, external integrations
├── utils/               # Pure utility functions
├── types/               # TypeScript type definitions
└── constants/           # App-wide constants
```

**File Naming:**
- Components: `PascalCase.tsx` (e.g., `PortfolioTable.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatCurrency.ts`)
- Tests: `*.test.ts` or `*.spec.ts`
- Constants: `UPPER_SNAKE_CASE.ts` (e.g., `API_ENDPOINTS.ts`)

---

## 3. TypeScript/JavaScript Style

### 3.1 Configuration

**ESLint:** `eslint.config.js`
```javascript
export default {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'  // Must be last
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',  // Ban `any` type
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'no-console': 'warn',  // Use logger instead
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

**Prettier:** `.prettierrc`
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### 3.2 Type Annotations

**Always annotate function returns:**
```typescript
// ✅ GOOD: Explicit return type
function calculatePortfolioValue(holdings: Holding[]): number {
  return holdings.reduce((sum, h) => sum + h.currentValue, 0);
}

// ❌ BAD: Inferred return type
function calculatePortfolioValue(holdings: Holding[]) {
  return holdings.reduce((sum, h) => sum + h.currentValue, 0);
}
```

**Use interfaces over types for objects:**
```typescript
// ✅ GOOD: Interface for object shapes
interface UserProfile {
  id: string;
  email: string;
  tier: 'free' | 'plus' | 'pro' | 'power-trader';
}

// ❌ BAD: Type alias for objects
type UserProfile = {
  id: string;
  email: string;
  tier: string;
};
```

**Avoid `any`:**
```typescript
// ✅ GOOD: Specific types or generics
function processApiResponse<T>(response: Response): Promise<T> {
  return response.json();
}

// ❌ BAD: any type
function processApiResponse(response: any): Promise<any> {
  return response.json();
}
```

### 3.3 Functions

**Arrow functions for callbacks:**
```typescript
// ✅ GOOD: Arrow function preserves `this` context
holdings.filter((h) => h.value > 100);

// ❌ BAD: Function keyword in callback
holdings.filter(function (h) {
  return h.value > 100;
});
```

**Named functions for top-level declarations:**
```typescript
// ✅ GOOD: Named function (shows up in stack traces)
export function calculateRiskScore(factors: RiskFactors): number {
  return factors.volatility * 0.3 + factors.marketCap * 0.25;
}

// ❌ BAD: Arrow function assigned to const
export const calculateRiskScore = (factors: RiskFactors): number => {
  return factors.volatility * 0.3 + factors.marketCap * 0.25;
};
```

**Default parameters:**
```typescript
// ✅ GOOD: Default values in signature
function fetchPriceHistory(symbol: string, days: number = 90): Promise<PriceData[]> {
  return api.get(`/prices/${symbol}?days=${days}`);
}

// ❌ BAD: Manual default handling
function fetchPriceHistory(symbol: string, days?: number): Promise<PriceData[]> {
  const actualDays = days ?? 90;
  return api.get(`/prices/${symbol}?days=${actualDays}`);
}
```

### 3.4 Async/Await

**Always use async/await over .then():**
```typescript
// ✅ GOOD: async/await (cleaner, easier error handling)
async function getUserPortfolio(userId: string): Promise<Portfolio> {
  try {
    const user = await fetchUser(userId);
    const holdings = await fetchHoldings(user.id);
    return { user, holdings };
  } catch (error) {
    logger.error('Failed to fetch portfolio', error);
    throw new PortfolioError('Unable to load portfolio');
  }
}

// ❌ BAD: .then() chains
function getUserPortfolio(userId: string): Promise<Portfolio> {
  return fetchUser(userId)
    .then((user) => {
      return fetchHoldings(user.id).then((holdings) => ({ user, holdings }));
    })
    .catch((error) => {
      logger.error('Failed to fetch portfolio', error);
      throw new PortfolioError('Unable to load portfolio');
    });
}
```

### 3.5 Error Handling

**Custom error classes:**
```typescript
// ✅ GOOD: Specific error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

throw new ApiError('Rate limit exceeded', 429, '/api/prices');

// ❌ BAD: Generic Error
throw new Error('Rate limit exceeded');
```

**Never swallow errors:**
```typescript
// ✅ GOOD: Log and re-throw or handle gracefully
try {
  await updatePortfolio(userId);
} catch (error) {
  logger.error('Portfolio update failed', { userId, error });
  throw error;  // Re-throw if caller should handle
}

// ❌ BAD: Silent failure
try {
  await updatePortfolio(userId);
} catch (error) {
  // Do nothing - error lost!
}
```

### 3.6 Imports

**Absolute imports (via tsconfig paths):**
```typescript
// ✅ GOOD: Absolute imports from root
import { PortfolioService } from '@/services/PortfolioService';
import { formatCurrency } from '@/utils/formatCurrency';

// ❌ BAD: Relative imports
import { PortfolioService } from '../../../services/PortfolioService';
import { formatCurrency } from '../../utils/formatCurrency';
```

**Organize imports:**
```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal modules (absolute)
import { PortfolioService } from '@/services/PortfolioService';
import { formatCurrency } from '@/utils/formatCurrency';

// 3. Types
import type { Portfolio, Holding } from '@/types/portfolio';

// 4. Styles (last)
import './Dashboard.css';
```

---

## 4. Python Style

### 4.1 Configuration

**Follows PEP 8 with some modifications**

**Black:** `.pyproject.toml`
```toml
[tool.black]
line-length = 100
target-version = ['py311']
include = '\.pyi?$'
```

**Ruff (linter):** `ruff.toml`
```toml
line-length = 100
select = ["E", "F", "W", "I", "N", "UP", "B"]
ignore = ["E501"]  # Line too long (handled by Black)
```

### 4.2 Naming Conventions

```python
# Variables & functions: snake_case
def calculate_risk_score(market_cap: float, volatility: float) -> float:
    weighted_score = market_cap * 0.25 + volatility * 0.20
    return round(weighted_score, 2)

# Constants: UPPER_SNAKE_CASE
MAX_RETRIES = 3
API_TIMEOUT_SECONDS = 30

# Classes: PascalCase
class RiskScoreCalculator:
    def __init__(self, weights: dict[str, float]):
        self.weights = weights

# Private methods: _leading_underscore
def _internal_helper(data: list) -> list:
    return sorted(data)
```

### 4.3 Type Hints

**Always use type hints (Python 3.11+ syntax):**
```python
# ✅ GOOD: Full type annotations
def fetch_price_history(
    symbol: str,
    days: int = 90
) -> list[dict[str, float]]:
    """Fetch historical price data for asset."""
    response = api.get(f"/prices/{symbol}", params={"days": days})
    return response.json()

# ❌ BAD: No type hints
def fetch_price_history(symbol, days=90):
    response = api.get(f"/prices/{symbol}", params={"days": days})
    return response.json()
```

**Use TypedDict for structured dicts:**
```python
from typing import TypedDict

# ✅ GOOD: Explicit structure
class PriceData(TypedDict):
    timestamp: str
    price: float
    volume: float

def process_prices(data: list[PriceData]) -> float:
    return sum(p["price"] for p in data) / len(data)

# ❌ BAD: Generic dict
def process_prices(data: list[dict]) -> float:
    return sum(p["price"] for p in data) / len(data)
```

### 4.4 Docstrings

**Google-style docstrings:**
```python
def calculate_portfolio_risk(holdings: list[Holding]) -> float:
    """Calculate weighted risk score for portfolio.

    Args:
        holdings: List of user's holdings with risk scores

    Returns:
        Portfolio-wide risk score (0-100)

    Raises:
        ValueError: If holdings list is empty

    Example:
        >>> holdings = [Holding(symbol="BTC", value=1000, risk=8)]
        >>> calculate_portfolio_risk(holdings)
        8.0
    """
    if not holdings:
        raise ValueError("Holdings list cannot be empty")

    total_value = sum(h.value for h in holdings)
    weighted_risk = sum(h.value * h.risk for h in holdings) / total_value
    return round(weighted_risk, 2)
```

### 4.5 Context Managers

**Use context managers for resources:**
```python
# ✅ GOOD: Context manager ensures cleanup
async with httpx.AsyncClient() as client:
    response = await client.get("https://api.coingecko.com/prices")
    data = response.json()

# ❌ BAD: Manual cleanup required
client = httpx.AsyncClient()
response = await client.get("https://api.coingecko.com/prices")
data = response.json()
await client.aclose()  # Easy to forget!
```

### 4.6 List Comprehensions

**Use comprehensions for simple transformations:**
```python
# ✅ GOOD: Clear and concise
active_symbols = [h.symbol for h in holdings if h.is_active]

# ❌ BAD: Verbose loop
active_symbols = []
for h in holdings:
    if h.is_active:
        active_symbols.append(h.symbol)
```

**But not for complex logic:**
```python
# ✅ GOOD: Loop for complex logic
processed = []
for price in price_history:
    if price.volume > 1000000:
        normalized = (price.close - price.open) / price.open
        processed.append(normalized)

# ❌ BAD: Unreadable comprehension
processed = [
    (p.close - p.open) / p.open
    for p in price_history
    if p.volume > 1000000
]
```

---

## 5. React/Frontend Style

### 5.1 Component Structure

**Functional components with hooks:**
```typescript
// ✅ GOOD: Functional component
export function PortfolioTable({ userId }: PortfolioTableProps) {
  const [sortBy, setSortBy] = useState<SortField>('value');
  const { data, isLoading } = usePortfolio(userId);

  if (isLoading) return <LoadingSpinner />;
  if (!data) return <ErrorMessage />;

  return (
    <table>
      {/* ... */}
    </table>
  );
}

// ❌ BAD: Class component (deprecated pattern)
export class PortfolioTable extends React.Component {
  state = { sortBy: 'value' };

  render() {
    return <table>{/* ... */}</table>;
  }
}
```

**Component file structure:**
```typescript
// 1. Imports
import React, { useState } from 'react';
import { usePortfolio } from '@/hooks/usePortfolio';
import type { PortfolioTableProps } from './types';

// 2. Types/Interfaces
interface SortConfig {
  field: 'symbol' | 'value' | 'risk';
  direction: 'asc' | 'desc';
}

// 3. Component
export function PortfolioTable({ userId }: PortfolioTableProps) {
  // ... component logic
}

// 4. Sub-components (if needed)
function TableHeader({ onSort }: TableHeaderProps) {
  // ... header logic
}

// 5. Exports
export default PortfolioTable;
```

### 5.2 Props

**Destructure props:**
```typescript
// ✅ GOOD: Destructure in function signature
function UserCard({ name, email, tier }: UserCardProps) {
  return <div>{name} - {email}</div>;
}

// ❌ BAD: Access via props object
function UserCard(props: UserCardProps) {
  return <div>{props.name} - {props.email}</div>;
}
```

**Use TypeScript for prop types:**
```typescript
// ✅ GOOD: TypeScript interface
interface UserCardProps {
  name: string;
  email: string;
  tier: 'free' | 'plus' | 'pro';
  onUpgrade?: () => void;  // Optional prop
}

// ❌ BAD: PropTypes (deprecated)
UserCard.propTypes = {
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
};
```

### 5.3 Hooks

**Custom hooks for reusable logic:**
```typescript
// ✅ GOOD: Extract to custom hook
export function usePortfolio(userId: string) {
  return useQuery({
    queryKey: ['portfolio', userId],
    queryFn: () => fetchPortfolio(userId),
    staleTime: 30_000,  // 30 seconds
  });
}

// Usage
function Dashboard({ userId }: DashboardProps) {
  const { data, isLoading, error } = usePortfolio(userId);
  // ... render
}

// ❌ BAD: Inline query in every component
function Dashboard({ userId }: DashboardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio', userId],
    queryFn: () => fetchPortfolio(userId),
  });
}
```

**Hook naming: Always prefix with `use`**
```typescript
// ✅ GOOD
function useLocalStorage(key: string) { /* ... */ }
function useDebounce(value: string, delay: number) { /* ... */ }

// ❌ BAD
function localStorageHook(key: string) { /* ... */ }
function debounce(value: string, delay: number) { /* ... */ }
```

### 5.4 Conditional Rendering

**Use short-circuit for simple conditions:**
```typescript
// ✅ GOOD: Clean short-circuit
{isLoading && <LoadingSpinner />}
{error && <ErrorMessage error={error} />}

// ❌ BAD: Ternary with null
{isLoading ? <LoadingSpinner /> : null}
```

**Use ternary for if/else:**
```typescript
// ✅ GOOD: Ternary for two branches
{user.tier === 'free' ? <UpgradePrompt /> : <PremiumFeatures />}

// ❌ BAD: Nested short-circuits
{user.tier === 'free' && <UpgradePrompt />}
{user.tier !== 'free' && <PremiumFeatures />}
```

### 5.5 Event Handlers

**Name handlers `handle*` or `on*`:**
```typescript
// ✅ GOOD: Clear naming
function PortfolioTable() {
  const handleSortChange = (field: SortField) => {
    setSortBy(field);
  };

  const handleRowClick = (holdingId: string) => {
    navigate(`/holdings/${holdingId}`);
  };

  return <Table onSort={handleSortChange} onRowClick={handleRowClick} />;
}

// ❌ BAD: Unclear naming
function PortfolioTable() {
  const sortChange = (field: SortField) => { /* ... */ };
  const clicked = (id: string) => { /* ... */ };
}
```

---

## 6. CSS/Tailwind Style

### 6.1 Tailwind Utility Classes

**Order of classes (recommended):**
```tsx
// ✅ GOOD: Logical grouping (layout → spacing → typography → colors → effects)
<div className="flex items-center gap-4 p-6 text-lg font-semibold text-gray-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">

// ❌ BAD: Random order
<div className="text-gray-900 bg-white hover:shadow-lg flex p-6 gap-4 items-center shadow-md rounded-lg transition-shadow font-semibold text-lg">
```

**Extract to components for repeated styles:**
```typescript
// ✅ GOOD: Reusable component
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {children}
    </div>
  );
}

// ❌ BAD: Repeat classes everywhere
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  {/* Content */}
</div>
```

### 6.2 Custom CSS

**Use CSS Modules for component-specific styles:**
```css
/* Dashboard.module.css */
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

```typescript
// Dashboard.tsx
import styles from './Dashboard.module.css';

export function Dashboard() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>{/* ... */}</div>
    </div>
  );
}
```

---

## 7. Git Commit Conventions

### 7.1 Commit Message Format

**Conventional Commits:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

**Examples:**
```
feat(portfolio): add risk score column to holdings table

Added a new column displaying the Degen Risk Score (0-100) for each
asset in the user's portfolio. Includes tooltip explaining the score.

Closes #123

---

fix(api): handle 429 rate limit errors from CoinGecko

Previously, rate limit errors caused the entire price fetch to fail.
Now we retry with exponential backoff (3 attempts).

Fixes #456

---

docs(readme): update installation instructions

Added Node.js version requirement (20+) and clarified Docker setup.

---

refactor(hooks): extract portfolio fetching to usePortfolio hook

Removed duplicated useQuery calls across Dashboard, PortfolioPage, and
AssetDetail components. All now use shared usePortfolio hook.
```

### 7.2 Branch Naming

**Pattern:** `<type>/<short-description>`

```
feat/add-whale-alerts
fix/portfolio-calculation-bug
docs/api-specification-update
refactor/extract-risk-service
```

### 7.3 Pull Requests

**PR Title:** Same format as commit messages
```
feat(alerts): implement whale activity alerts (#789)
```

**PR Description Template:**
```markdown
## Summary
Brief description of what this PR does (1-2 sentences)

## Changes
- Added WhaleAlert component
- Implemented whale transaction detection service
- Updated AlertService to support whale alerts

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Tested on mobile viewport

## Screenshots (if UI change)
[Attach screenshots or GIFs]

## Related Issues
Closes #123
Related to #456
```

---

## 8. Code Review Guidelines

### 8.1 For Authors

**Before requesting review:**
- [ ] Code passes all linters/formatters (`npm run lint`, `black .`)
- [ ] All tests pass (`npm test`, `pytest`)
- [ ] Self-review: read your own diff line-by-line
- [ ] Add comments explaining "why" (not "what")
- [ ] Update documentation if API/behavior changed

### 8.2 For Reviewers

**What to look for:**
1. **Correctness**: Does the code do what it's supposed to do?
2. **Edge cases**: What happens with empty arrays, null values, errors?
3. **Performance**: Any O(n²) loops? Unnecessary re-renders?
4. **Security**: SQL injection? XSS? API key exposure?
5. **Readability**: Can a new developer understand this in 6 months?

**Review tone:**
```
✅ GOOD: "Consider using a Set instead of an array for O(1) lookups here"
✅ GOOD: "This might fail if `holdings` is empty. Should we add a check?"

❌ BAD: "This is terrible code"
❌ BAD: "Why didn't you use a Set?"
```

**Approval criteria:**
- ✅ Approve: Minor nits, no blocking issues
- 💬 Comment: Questions or suggestions, but not blocking
- 🚫 Request Changes: Critical issues (security, correctness, major performance)

---

## 9. Tools & Automation

### 9.1 Pre-commit Hooks

**Husky + lint-staged:**

`.husky/pre-commit`
```bash
#!/bin/sh
npm run lint-staged
```

`package.json`
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.py": [
      "black",
      "ruff check --fix"
    ]
  }
}
```

### 9.2 CI/CD Checks

**GitHub Actions:** `.github/workflows/ci.yml`
```yaml
name: CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3  # Upload coverage
```

### 9.3 VS Code Settings

**`.vscode/settings.json`**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true
  },
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

### 9.4 Recommended Extensions

**TypeScript/React:**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Error Lens (inline error highlighting)

**Python:**
- Black Formatter
- Ruff
- Pylance (type checking)
- Python Test Explorer

---

## Appendix: Common Patterns

### A1. API Error Handling

```typescript
// Standard pattern for API calls
export async function fetchPortfolio(userId: string): Promise<Portfolio> {
  try {
    const response = await fetch(`/api/v1/portfolios/${userId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (!response.ok) {
      if (response.status === 401) throw new UnauthorizedError();
      if (response.status === 404) throw new NotFoundError('Portfolio not found');
      throw new ApiError(`HTTP ${response.status}`, response.status, response.url);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Unexpected error fetching portfolio', { userId, error });
    throw new ApiError('Failed to fetch portfolio', 500, '/api/v1/portfolios');
  }
}
```

### A2. React Query Pattern

```typescript
// Standard React Query hook
export function usePortfolio(userId: string) {
  return useQuery({
    queryKey: ['portfolio', userId],
    queryFn: () => fetchPortfolio(userId),
    staleTime: 30_000,  // 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      logger.error('Portfolio query failed', { userId, error });
      toast.error('Failed to load portfolio. Please try again.');
    },
  });
}
```

### A3. Form Validation (React Hook Form + Zod)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const alertSchema = z.object({
  assetSymbol: z.string().min(1, 'Asset is required'),
  thresholdUsd: z.number().positive('Threshold must be positive'),
  emailEnabled: z.boolean(),
});

type AlertFormData = z.infer<typeof alertSchema>;

export function CreateAlertForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
  });

  const onSubmit = async (data: AlertFormData) => {
    await createAlert(data);
    toast.success('Alert created!');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('assetSymbol')} />
      {errors.assetSymbol && <span>{errors.assetSymbol.message}</span>}
      {/* ... */}
    </form>
  );
}
```

---

**Document End**

*This style guide is a living document and will be updated as the team agrees on new conventions.*
