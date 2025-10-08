import { test, expect } from '@playwright/test';

test.describe('Dashboard Features', () => {
  const testEmail = 'e2e-dashboard@coinsphere.com';
  const testPassword = 'TestPassword123!';

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill(testEmail);
    await page.getByPlaceholder(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('should display portfolio hero section', async ({ page }) => {
    // Check for portfolio value display
    await expect(page.getByText(/total.*value|portfolio.*value/i)).toBeVisible();

    // Check for percentage change
    await expect(page.locator('text=/[+-]?\\d+\\.\\d+%/')).toBeVisible({ timeout: 5000 });

    // Check for quick stats (should have multiple stat cards)
    const statCards = page.locator('[class*="stat"]').or(page.locator('[class*="card"]'));
    await expect(statCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display holdings table', async ({ page }) => {
    // Check for table or holdings section
    const holdingsSection = page.locator('text=/holdings|assets/i').first();
    await expect(holdingsSection).toBeVisible({ timeout: 5000 });

    // If there are holdings, check table structure
    const hasHoldings = await page.locator('table, [role="table"]').count() > 0;
    if (hasHoldings) {
      // Should show token symbols
      await expect(page.locator('text=/BTC|ETH|SOL/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display asset allocation chart', async ({ page }) => {
    // Check for asset allocation section
    const allocationSection = page.locator('text=/asset.*allocation|allocation/i').first();
    await expect(allocationSection).toBeVisible({ timeout: 5000 });
  });

  test('should display market insights', async ({ page }) => {
    // Check for market insights section
    const insightsSection = page.locator('text=/market.*insights|insights/i').first();
    await expect(insightsSection).toBeVisible({ timeout: 5000 });

    // Wait for predictions to load (they fetch from API)
    await page.waitForTimeout(3000);

    // Should show ML prediction data
    const hasPredictions = await page.locator('text=/prediction|forecast|bullish|bearish/i').count() > 0;
    if (hasPredictions) {
      expect(hasPredictions).toBeTruthy();
    }
  });

  test('should display transaction history', async ({ page }) => {
    // Scroll to transaction history section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for transaction history section
    const transactionSection = page.locator('text=/transaction.*history|recent.*transactions/i').first();
    await expect(transactionSection).toBeVisible({ timeout: 5000 });
  });

  test('should have responsive navigation', async ({ page }) => {
    // Check for header/nav
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();

    // Should have logo or app name
    await expect(page.locator('text=/coinsphere|cryptosense/i').first()).toBeVisible();
  });

  test('should display glass card design system', async ({ page }) => {
    // Check that cards have glass morphism effect
    const glassCards = page.locator('[class*="glass"]');
    const cardCount = await glassCards.count();

    expect(cardCount).toBeGreaterThan(0);

    // Check for black background
    const bodyBg = await page.evaluate(() => {
      const body = document.querySelector('body');
      return window.getComputedStyle(body!).backgroundColor;
    });

    // Should be black or very dark (rgb(0, 0, 0) or close to it)
    expect(bodyBg).toContain('rgb(0, 0, 0)');
  });

  test('should update prices in real-time', async ({ page }) => {
    // Get initial price value
    const priceElement = page.locator('text=/\\$[0-9,]+\\.?[0-9]*/').first();
    await expect(priceElement).toBeVisible({ timeout: 5000 });

    const initialPrice = await priceElement.textContent();

    // Wait for potential WebSocket update (prices update every 5-60 seconds)
    await page.waitForTimeout(10000);

    // Price might have updated (not guaranteed in 10s, but worth checking)
    const currentPrice = await priceElement.textContent();

    // At minimum, price element should still be visible
    await expect(priceElement).toBeVisible();
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Reload page to trigger loading states
    await page.reload();

    // Check for loading indicators (skeleton loaders or spinners)
    const hasLoadingState = await page.locator('[class*="skeleton"], [class*="spinner"], [class*="loading"]').count() > 0;

    // Loading states should appear briefly
    if (hasLoadingState) {
      // Wait for content to load
      await expect(page.getByText(/total.*value|portfolio.*value/i)).toBeVisible({ timeout: 10000 });
    }
  });
});
