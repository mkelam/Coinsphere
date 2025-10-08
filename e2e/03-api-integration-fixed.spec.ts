import { test, expect } from '@playwright/test';
import { getAuthenticatedContext, getAuthHeaders, createTestUser } from './helpers/auth';

test.describe('API Integration Tests (CSRF Fixed)', () => {
  const apiBase = 'http://localhost:3001/api/v1';

  test('should check backend health', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
  });

  test('should register a new user via API', async ({ request }) => {
    const ctx = await createTestUser(request, 'register');

    expect(ctx.accessToken).toBeTruthy();
    expect(ctx.refreshToken).toBeTruthy();
    expect(ctx.csrfToken).toBeTruthy();
    expect(ctx.email).toContain('@coinsphere.com');
  });

  test('should fetch tokens list', async ({ request }) => {
    const ctx = await createTestUser(request, 'tokens-list');

    const response = await request.get(`${apiBase}/tokens`, {
      headers: getAuthHeaders(ctx),
    });
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('tokens');
    expect(Array.isArray(data.tokens)).toBeTruthy();
  });

  test('should create portfolio with CSRF token', async ({ request }) => {
    const ctx = await createTestUser(request, 'portfolio-create');

    const response = await request.post(`${apiBase}/portfolios`, {
      headers: getAuthHeaders(ctx),
      data: { name: 'E2E Test Portfolio' },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('portfolio');
    expect(data.portfolio.name).toBe('E2E Test Portfolio');
  });

  test('should fetch portfolios with CSRF token', async ({ request }) => {
    const ctx = await createTestUser(request, 'portfolio-fetch');

    const response = await request.get(`${apiBase}/portfolios`, {
      headers: getAuthHeaders(ctx),
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('portfolios');
    expect(Array.isArray(data.portfolios)).toBeTruthy();
  });

  test('should create alert with CSRF token', async ({ request }) => {
    const ctx = await createTestUser(request, 'alert-create');

    const response = await request.post(`${apiBase}/alerts`, {
      headers: getAuthHeaders(ctx),
      data: {
        alertType: 'price',
        tokenSymbol: 'BTC',
        condition: 'above',
        threshold: 150000,
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('alert');
    expect(data.alert.tokenSymbol).toBe('BTC');
  });

  test('should reject requests without authentication', async ({ request }) => {
    const response = await request.post(`${apiBase}/portfolios`, {
      data: { name: 'Unauthorized Portfolio' },
    });

    expect(response.status()).toBe(401);
  });

  test('should reject requests without CSRF token', async ({ request }) => {
    // Register and get JWT token
    const email = `csrf-test-${Date.now()}@coinsphere.com`;
    const password = 'TestPassword123!';

    await request.post(`${apiBase}/auth/register`, {
      data: { email, password, firstName: 'Test', lastName: 'User' },
    });

    // Login to get access token
    const loginResponse = await request.post(`${apiBase}/auth/login`, {
      data: { email, password },
    });
    const { accessToken } = await loginResponse.json();

    // Try to create portfolio WITHOUT CSRF token (only JWT)
    const response = await request.post(`${apiBase}/portfolios`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Missing X-CSRF-Token header
      },
      data: { name: 'No CSRF Portfolio' },
    });

    // Should be rejected
    expect(response.status()).toBe(403);
    const error = await response.json();
    expect(error.error).toContain('CSRF');
  });

  test('should handle token refresh', async ({ request }) => {
    const ctx = await createTestUser(request, 'refresh');

    // Wait 1.1 seconds to avoid token reuse detection
    // (Backend detects reuse if token used twice within 1 second)
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Use refresh token to get new access token
    const refreshResponse = await request.post(`${apiBase}/auth/refresh`, {
      data: { refreshToken: ctx.refreshToken },
    });

    expect(refreshResponse.ok()).toBeTruthy();

    const refreshData = await refreshResponse.json();
    expect(refreshData).toHaveProperty('accessToken');
    expect(refreshData).toHaveProperty('refreshToken');
  });
});
