import { test, expect } from '@playwright/test';
import { randomBytes } from 'crypto';

/**
 * E2E Tests: Token Management
 *
 * Tests token/cryptocurrency data endpoints:
 * - List all tokens
 * - Get specific token details
 * - Price history retrieval
 */

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/v1`;

let accessToken: string;

test.describe('Token Management E2E Flow', () => {
  test.beforeAll(async ({ request }) => {
    // Create a test user and get access token
    const randomId = randomBytes(8).toString('hex');
    const testEmail = `tokentest+${randomId}@coinsphere.com`;

    const response = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: testEmail,
        password: 'SecureP@ssw0rd123!',
        firstName: 'Token',
        lastName: 'Test',
      },
    });

    const data = await response.json();
    accessToken = data.accessToken;
  });

  test('01. List all tokens', async ({ request }) => {
    const response = await request.get(`${API_URL}/tokens`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.tokens).toBeDefined();
    expect(Array.isArray(data.tokens)).toBeTruthy();
    expect(data.tokens.length).toBeGreaterThan(0);

    // Verify token structure
    const firstToken = data.tokens[0];
    expect(firstToken.id).toBeDefined();
    expect(firstToken.symbol).toBeDefined();
    expect(firstToken.name).toBeDefined();
    expect(firstToken.blockchain).toBeDefined();
    expect(firstToken.currentPrice).toBeDefined();
    expect(firstToken.marketCap).toBeDefined();
  });

  test('02. Get specific token - BTC', async ({ request }) => {
    const response = await request.get(`${API_URL}/tokens/BTC`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.token).toBeDefined();
    expect(data.token.symbol).toBe('BTC');
    expect(data.token.name).toBe('Bitcoin');
    expect(data.token.currentPrice).toBeGreaterThan(0);
  });

  test('03. Get specific token - ETH', async ({ request }) => {
    const response = await request.get(`${API_URL}/tokens/ETH`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.token).toBeDefined();
    expect(data.token.symbol).toBe('ETH');
    expect(data.token.name).toBe('Ethereum');
  });

  test('04. Get non-existent token should return 404', async ({ request }) => {
    const response = await request.get(`${API_URL}/tokens/NOTREAL`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toContain('not found');
  });

  test('05. Get price history - 24h', async ({ request }) => {
    const response = await request.get(`${API_URL}/tokens/BTC/history?timeframe=24h`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.symbol).toBe('BTC');
    expect(data.timeframe).toBe('24h');
    expect(data.currentPrice).toBeDefined();
  });

  test('06. Get price history - 7d', async ({ request }) => {
    const response = await request.get(`${API_URL}/tokens/ETH/history?timeframe=7d`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.symbol).toBe('ETH');
    expect(data.timeframe).toBe('7d');
  });

  test('07. Get price history - 30d', async ({ request }) => {
    const response = await request.get(`${API_URL}/tokens/SOL/history?timeframe=30d`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.symbol).toBe('SOL');
    expect(data.timeframe).toBe('30d');
  });

  test('08. List tokens without auth should fail', async ({ request }) => {
    const response = await request.get(`${API_URL}/tokens`);

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('09. Verify token caching (same request twice)', async ({ request }) => {
    // First request
    const response1 = await request.get(`${API_URL}/tokens`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response1.status()).toBe(200);
    const data1 = await response1.json();

    // Second request (should hit cache)
    const response2 = await request.get(`${API_URL}/tokens`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response2.status()).toBe(200);
    const data2 = await response2.json();

    // Data should be identical (from cache)
    expect(data1.tokens.length).toBe(data2.tokens.length);
  });

  test('10. Verify multiple token symbols', async ({ request }) => {
    const expectedTokens = ['BTC', 'ETH', 'SOL', 'USDC', 'USDT'];

    const response = await request.get(`${API_URL}/tokens`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    const symbols = data.tokens.map((token: any) => token.symbol);

    for (const symbol of expectedTokens) {
      expect(symbols).toContain(symbol);
    }
  });
});
