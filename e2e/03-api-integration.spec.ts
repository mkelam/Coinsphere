import { test, expect } from '@playwright/test';

// Helper function to get CSRF token
async function getCsrfToken(request: any, token: string): Promise<string> {
  const response = await request.get('http://localhost:3001/api/v1/csrf-token', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok()) {
    throw new Error('Failed to fetch CSRF token');
  }
  const data = await response.json();
  return data.csrfToken;
}

test.describe('API Integration Tests', () => {
  const apiBase = 'http://localhost:3001/api/v1';
  let authToken: string;
  let userId: string;

  test('should check backend health', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
  });

  test('should register a new user via API', async ({ request }) => {
    const email = `api-test-${Date.now()}@coinsphere.com`;
    const password = 'ApiTest123!';

    const response = await request.post(`${apiBase}/auth/register`, {
      data: {
        email,
        password,
        firstName: 'API',
        lastName: 'Test',
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('accessToken');
    expect(data).toHaveProperty('refreshToken');
    expect(data).toHaveProperty('user');
    expect(data.user.email).toBe(email);

    authToken = data.accessToken;
    userId = data.user.id;
  });

  test('should fetch tokens list', async ({ request }) => {
    const response = await request.get(`${apiBase}/tokens`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('tokens');
    expect(Array.isArray(data.tokens)).toBeTruthy();
    expect(data.tokens.length).toBeGreaterThan(0);

    // Check token structure
    const token = data.tokens[0];
    expect(token).toHaveProperty('symbol');
    expect(token).toHaveProperty('name');
    expect(token).toHaveProperty('currentPrice');
  });

  test('should fetch ML predictions for BTC', async ({ request }) => {
    const response = await request.get(`${apiBase}/predictions/BTC?timeframe=24h`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('symbol', 'BTC');
    expect(data).toHaveProperty('prediction');
    expect(data.prediction).toHaveProperty('predictedPrice');
    expect(data.prediction).toHaveProperty('confidence');
    expect(data.prediction).toHaveProperty('direction');
    expect(data.prediction).toHaveProperty('technicalIndicators');

    // Check technical indicators
    const indicators = data.prediction.technicalIndicators;
    expect(indicators).toHaveProperty('rsi');
    expect(indicators).toHaveProperty('macd');
    expect(indicators).toHaveProperty('trend');
  });

  test('should fetch risk score for ETH', async ({ request }) => {
    const response = await request.get(`${apiBase}/risk/ETH`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('riskScore');
    expect(data.riskScore).toHaveProperty('overallScore');
    expect(data.riskScore).toHaveProperty('riskLevel');
    expect(data.riskScore).toHaveProperty('components');

    // Risk score should be between 0-100
    expect(data.riskScore.overallScore).toBeGreaterThanOrEqual(0);
    expect(data.riskScore.overallScore).toBeLessThanOrEqual(100);

    // Risk level should be one of the defined levels
    expect(['safe', 'low', 'medium', 'high', 'extreme']).toContain(data.riskScore.riskLevel);
  });

  test('should create portfolio with authentication', async ({ request }) => {
    const email = `portfolio-test-${Date.now()}@coinsphere.com`;
    const password = 'PortfolioTest123!';

    // Register user
    const registerResponse = await request.post(`${apiBase}/auth/register`, {
      data: { email, password, firstName: 'Portfolio', lastName: 'Test' },
    });
    const authData = await registerResponse.json();
    const token = authData.accessToken;

    // Get CSRF token
    const csrfToken = await getCsrfToken(request, token);

    // Create portfolio
    const portfolioResponse = await request.post(`${apiBase}/portfolios`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-CSRF-Token': csrfToken,
      },
      data: { name: 'E2E Test Portfolio' },
    });

    expect(portfolioResponse.ok()).toBeTruthy();

    const portfolioData = await portfolioResponse.json();
    expect(portfolioData).toHaveProperty('portfolio');
    expect(portfolioData.portfolio.name).toBe('E2E Test Portfolio');
  });

  test('should fetch portfolios with authentication', async ({ request }) => {
    const email = `fetch-portfolio-${Date.now()}@coinsphere.com`;
    const password = 'FetchTest123!';

    // Register user
    const registerResponse = await request.post(`${apiBase}/auth/register`, {
      data: { email, password, firstName: 'Fetch', lastName: 'Test' },
    });
    const authData = await registerResponse.json();
    const token = authData.accessToken;

    // Fetch portfolios
    const portfoliosResponse = await request.get(`${apiBase}/portfolios`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(portfoliosResponse.ok()).toBeTruthy();

    const data = await portfoliosResponse.json();
    expect(data).toHaveProperty('portfolios');
    expect(Array.isArray(data.portfolios)).toBeTruthy();
  });

  test('should create alert with authentication', async ({ request }) => {
    const email = `alert-test-${Date.now()}@coinsphere.com`;
    const password = 'AlertTest123!';

    // Register user
    const registerResponse = await request.post(`${apiBase}/auth/register`, {
      data: { email, password, firstName: 'Alert', lastName: 'Test' },
    });
    const authData = await registerResponse.json();
    const token = authData.accessToken;

    // Get CSRF token
    const csrfToken = await getCsrfToken(request, token);

    // Create alert
    const alertResponse = await request.post(`${apiBase}/alerts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-CSRF-Token': csrfToken,
      },
      data: {
        alertType: 'price',
        tokenSymbol: 'BTC',
        condition: 'above',
        threshold: 150000,
      },
    });

    expect(alertResponse.ok()).toBeTruthy();

    const alertData = await alertResponse.json();
    expect(alertData).toHaveProperty('alert');
    expect(alertData.alert.tokenSymbol).toBe('BTC');
    expect(alertData.alert.threshold).toBe(150000);
  });

  test('should reject requests without authentication', async ({ request }) => {
    // Try to create portfolio without token
    const response = await request.post(`${apiBase}/portfolios`, {
      data: { name: 'Unauthorized Portfolio' },
    });

    expect(response.status()).toBe(401);
  });

  test('should handle token refresh', async ({ request }) => {
    const email = `refresh-test-${Date.now()}@coinsphere.com`;
    const password = 'RefreshTest123!';

    // Register user
    const registerResponse = await request.post(`${apiBase}/auth/register`, {
      data: { email, password, firstName: 'Refresh', lastName: 'Test' },
    });
    const authData = await registerResponse.json();
    const refreshToken = authData.refreshToken;

    // Use refresh token to get new access token
    const refreshResponse = await request.post(`${apiBase}/auth/refresh`, {
      data: { refreshToken },
    });

    expect(refreshResponse.ok()).toBeTruthy();

    const refreshData = await refreshResponse.json();
    expect(refreshData).toHaveProperty('accessToken');
    expect(refreshData).toHaveProperty('refreshToken');
  });
});
