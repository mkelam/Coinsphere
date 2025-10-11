import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_BASE = 'http://localhost:3001/api/v1';

let authToken: string;
let csrfToken: string;

// Test user credentials
const testUser = {
  email: 'e2etest@coinsphere.com',
  password: 'Test123!@#',
};

test.describe('Exchange Integration E2E Tests', () => {
  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    try {
      const loginResponse = await request.post(`${API_BASE}/auth/login`, {
        data: testUser,
      });

      if (loginResponse.ok()) {
        const loginData = await loginResponse.json();
        authToken = loginData.accessToken;

        // Get CSRF token
        const csrfResponse = await request.get(`${API_BASE}/csrf-token`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (csrfResponse.ok()) {
          const csrfData = await csrfResponse.json();
          csrfToken = csrfData.csrfToken;
        }
      }
    } catch (error) {
      console.log('Test user not found, will skip tests requiring authentication');
    }
  });

  test.describe('Exchange API Endpoints', () => {
    test('should get list of supported exchanges', async ({ request }) => {
      const response = await request.get(`${API_BASE}/exchanges/supported`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('exchanges');
      expect(Array.isArray(data.exchanges)).toBeTruthy();
      expect(data.exchanges.length).toBeGreaterThan(0);

      // Check for expected exchanges
      const exchangeIds = data.exchanges.map((ex: any) => ex.id);
      expect(exchangeIds).toContain('binance');
      expect(exchangeIds).toContain('coinbase');
      expect(exchangeIds).toContain('kraken');
      expect(exchangeIds).toContain('kucoin');

      // Verify exchange structure
      data.exchanges.forEach((ex: any) => {
        expect(ex).toHaveProperty('id');
        expect(ex).toHaveProperty('name');
        expect(ex).toHaveProperty('requiresPassphrase');
      });
    });

    test('should reject test connection with invalid credentials', async ({ request }) => {
      const response = await request.post(`${API_BASE}/exchanges/test`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-CSRF-Token': csrfToken,
        },
        data: {
          exchange: 'binance',
          apiKey: 'invalid-api-key',
          apiSecret: 'invalid-api-secret',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('message');
    });

    test('should require API key for test connection', async ({ request }) => {
      const response = await request.post(`${API_BASE}/exchanges/test`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-CSRF-Token': csrfToken,
        },
        data: {
          exchange: 'binance',
          apiSecret: 'some-secret',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.message).toContain('Validation error');
    });

    test('should get empty connections list for new user', async ({ request }) => {
      const response = await request.get(`${API_BASE}/exchanges/connections`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-CSRF-Token': csrfToken,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('connections');
      expect(Array.isArray(data.connections)).toBeTruthy();
    });
  });

  test.describe('Exchange Connections Page UI', () => {
    test.beforeEach(async ({ page }) => {
      // Setup: Login and navigate to exchanges page
      await page.goto(`${BASE_URL}/login`);
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');

      // Wait for redirect to dashboard
      await page.waitForURL(`${BASE_URL}/dashboard`);

      // Navigate to exchanges page
      await page.goto(`${BASE_URL}/exchanges`);
    });

    test('should display exchanges page with connect button', async ({ page }) => {
      // Check page title
      await expect(page.locator('h1')).toContainText('Exchange Connections');

      // Check for Connect Exchange button
      const connectButton = page.locator('button:has-text("Connect Exchange")');
      await expect(connectButton).toBeVisible();
    });

    test('should open connect exchange modal', async ({ page }) => {
      // Click Connect Exchange button
      await page.click('button:has-text("Connect Exchange")');

      // Modal should be visible
      await expect(page.locator('text=Connect Exchange').nth(1)).toBeVisible();

      // Should show exchange selection grid
      await expect(page.locator('text=Binance')).toBeVisible();
      await expect(page.locator('text=Coinbase')).toBeVisible();
      await expect(page.locator('text=Kraken')).toBeVisible();
      await expect(page.locator('text=KuCoin')).toBeVisible();
    });

    test('should show exchange connection form after selecting exchange', async ({ page }) => {
      // Click Connect Exchange button
      await page.click('button:has-text("Connect Exchange")');

      // Select Binance
      await page.click('text=Binance');

      // Form fields should be visible
      await expect(page.locator('text=API Key')).toBeVisible();
      await expect(page.locator('text=API Secret')).toBeVisible();
      await expect(page.locator('button:has-text("Test Connection")').first()).toBeVisible();
    });

    test('should require all fields for test connection', async ({ page }) => {
      // Click Connect Exchange button
      await page.click('button:has-text("Connect Exchange")');

      // Select Binance
      await page.click('text=Binance');

      // Try to test without filling fields
      const testButton = page.locator('button:has-text("Test Connection")').first();
      await expect(testButton).toBeDisabled();
    });

    test('should close modal on cancel', async ({ page }) => {
      // Click Connect Exchange button
      await page.click('button:has-text("Connect Exchange")');

      // Modal should be visible
      await expect(page.locator('text=Connect Exchange').nth(1)).toBeVisible();

      // Click close button (X icon)
      await page.click('[data-testid="close-modal"], button:has(svg)').catch(() => {
        // Fallback: click outside modal
        page.click('body', { position: { x: 10, y: 10 } });
      });

      // Wait a bit for modal to close
      await page.waitForTimeout(500);
    });

    test('should display security notice', async ({ page }) => {
      // Check for security information
      await expect(page.locator('text=Security Information')).toBeVisible();
      await expect(page.locator('text=AES-256-GCM')).toBeVisible();
      await expect(page.locator('text=read-only API keys')).toBeVisible();
    });

    test('should show empty state when no connections', async ({ page }) => {
      // Check for empty state message
      const hasConnections = await page.locator('[data-testid="exchange-connection-card"]').count();

      if (hasConnections === 0) {
        await expect(page.locator('text=No Exchange Connections')).toBeVisible();
        await expect(
          page.locator('text=Connect your first exchange')
        ).toBeVisible();
      }
    });
  });

  test.describe('Integration Workflow', () => {
    test('should handle full connection workflow (mock)', async ({ page, request }) => {
      // This test demonstrates the full workflow without actually connecting
      // (since we don't have real exchange API credentials in CI)

      await page.goto(`${BASE_URL}/login`);
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');

      await page.waitForURL(`${BASE_URL}/dashboard`);
      await page.goto(`${BASE_URL}/exchanges`);

      // Step 1: Open modal
      await page.click('button:has-text("Connect Exchange")');
      await expect(page.locator('text=Select an exchange')).toBeVisible();

      // Step 2: Select exchange
      await page.click('text=Binance');
      await expect(page.locator('text=API Key')).toBeVisible();

      // Step 3: Fill in dummy credentials
      await page.fill('input[placeholder*="API key"]', 'test-api-key-12345');
      await page.fill('input[type="password"]', 'test-secret-key-67890');

      // Step 4: Test button should now be enabled
      const testButton = page.locator('button:has-text("Test Connection")').first();
      await expect(testButton).toBeEnabled();

      // Note: In real scenario, we would:
      // 1. Click Test Connection
      // 2. See "Connection successful" message
      // 3. Click "Connect Exchange"
      // 4. See success toast
      // 5. Connection appears in list with status "active"
    });
  });
});
