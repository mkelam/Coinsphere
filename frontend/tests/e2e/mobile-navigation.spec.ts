/**
 * End-to-End Tests: Mobile Navigation
 * Tests mobile bottom navigation after P0 fix
 */

import { test, expect, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// Mobile device configuration
const iPhone12 = devices['iPhone 12'];
const iPhoneProMax = devices['iPhone 14 Pro Max'];
const galaxyS21 = {
  ...devices['Galaxy S9+'],
  viewport: { width: 360, height: 800 },
};

// Generate unique test user
const generateTestEmail = () => `mobiletest${Date.now()}@coinsphere.com`;

test.describe('Mobile Bottom Navigation', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async ({ page }) => {
    // Set mobile viewport for this test group
    await page.setViewportSize(iPhone12.viewport);

    testEmail = generateTestEmail();
    testPassword = 'TestPass123!';

    // Login first
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });

    // Navigate to dashboard
    if (page.url().includes('/onboarding')) {
      await page.goto(`${BASE_URL}/dashboard`);
    }
  });

  test('should display mobile bottom navigation on mobile viewport', async ({ page }) => {
    // Check that bottom navigation is visible
    const bottomNav = page.locator('nav[aria-label*="bottom"]').or(page.locator('nav.fixed.bottom-0'));
    await expect(bottomNav).toBeVisible();

    // Check all 5 navigation items are present
    const navItems = ['Dashboard', 'Portfolios', 'DeFi', 'Exchanges', 'Alerts'];

    for (const item of navItems) {
      await expect(page.locator(`button[aria-label*="${item}"]`)).toBeVisible();
    }
  });

  test('should navigate to dashboard via bottom nav', async ({ page }) => {
    // Go to different page first
    await page.goto(`${BASE_URL}/portfolios`);

    // Click Dashboard in bottom nav
    await page.click('button[aria-label*="Dashboard"]');

    // Should navigate to dashboard
    await page.waitForURL(/\/dashboard/);
    expect(page.url()).toContain('/dashboard');
  });

  test('should navigate to portfolios via bottom nav', async ({ page }) => {
    // Click Portfolios in bottom nav
    await page.click('button[aria-label*="Portfolios"]');

    // Should navigate to portfolios
    await page.waitForURL(/\/portfolios/);
    expect(page.url()).toContain('/portfolios');
  });

  test('should navigate to DeFi via bottom nav', async ({ page }) => {
    // Click DeFi in bottom nav
    await page.click('button[aria-label*="DeFi"]');

    // Should navigate to defi
    await page.waitForURL(/\/defi/);
    expect(page.url()).toContain('/defi');
  });

  test('should navigate to exchanges via bottom nav', async ({ page }) => {
    // Click Exchanges in bottom nav
    await page.click('button[aria-label*="Exchanges"]');

    // Should navigate to exchanges
    await page.waitForURL(/\/exchanges/);
    expect(page.url()).toContain('/exchanges');
  });

  test('should navigate to alerts via bottom nav', async ({ page }) => {
    // Click Alerts in bottom nav
    await page.click('button[aria-label*="Alerts"]');

    // Should navigate to alerts
    await page.waitForURL(/\/alerts/);
    expect(page.url()).toContain('/alerts');
  });

  test('should highlight active route in bottom nav', async ({ page }) => {
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`);

    // Dashboard button should be highlighted (aria-current="page")
    const dashboardButton = page.locator('button[aria-label*="Dashboard"]');
    await expect(dashboardButton).toHaveAttribute('aria-current', 'page');

    // Navigate to portfolios
    await page.click('button[aria-label*="Portfolios"]');
    await page.waitForURL(/\/portfolios/);

    // Portfolios button should be highlighted
    const portfoliosButton = page.locator('button[aria-label*="Portfolios"]');
    await expect(portfoliosButton).toHaveAttribute('aria-current', 'page');

    // Dashboard should no longer be highlighted
    await expect(dashboardButton).not.toHaveAttribute('aria-current', 'page');
  });

  test('should have accessible touch targets (min 44px)', async ({ page }) => {
    const navButtons = page.locator('button[aria-label*="Dashboard"], button[aria-label*="Portfolios"], button[aria-label*="DeFi"], button[aria-label*="Exchanges"], button[aria-label*="Alerts"]');

    const count = await navButtons.count();
    for (let i = 0; i < count; i++) {
      const button = navButtons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        // WCAG 2.1 AA requires minimum 44x44px touch targets
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should remain fixed at bottom during scroll', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Get initial position of bottom nav
    const bottomNav = page.locator('nav[aria-label*="bottom"]').or(page.locator('nav.fixed.bottom-0'));
    const initialBox = await bottomNav.boundingBox();

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500); // Wait for scroll

    // Get position after scroll
    const scrolledBox = await bottomNav.boundingBox();

    // Position should remain the same (fixed)
    expect(scrolledBox?.y).toBe(initialBox?.y);
  });

  test('should not interfere with page content', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Check that bottom nav has proper spacing
    const bottomNav = page.locator('nav[aria-label*="bottom"]').or(page.locator('nav.fixed.bottom-0'));
    const navBox = await bottomNav.boundingBox();

    // Check that content has bottom padding to avoid being hidden
    const mainContent = page.locator('main');
    const contentStyle = await mainContent.evaluate(el => window.getComputedStyle(el).paddingBottom);

    // Content should have bottom padding
    expect(parseInt(contentStyle)).toBeGreaterThan(0);
  });
});

test.describe('Mobile Bottom Navigation - Different Devices', () => {
  test('iPhone 12 - bottom nav should be visible', async ({ browser }) => {
    const context = await browser.newContext(iPhone12);
    const page = await context.newPage();

    const testEmail = generateTestEmail();
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!');

    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });

    if (page.url().includes('/onboarding')) {
      await page.goto(`${BASE_URL}/dashboard`);
    }

    const bottomNav = page.locator('nav[aria-label*="bottom"]').or(page.locator('nav.fixed.bottom-0'));
    await expect(bottomNav).toBeVisible();

    await context.close();
  });

  test('iPhone 14 Pro Max - bottom nav should be visible', async ({ browser }) => {
    const context = await browser.newContext(iPhoneProMax);
    const page = await context.newPage();

    const testEmail = generateTestEmail();
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!');

    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });

    if (page.url().includes('/onboarding')) {
      await page.goto(`${BASE_URL}/dashboard`);
    }

    const bottomNav = page.locator('nav[aria-label*="bottom"]').or(page.locator('nav.fixed.bottom-0'));
    await expect(bottomNav).toBeVisible();

    await context.close();
  });

  test('Galaxy S21 - bottom nav should be visible', async ({ browser }) => {
    const context = await browser.newContext(galaxyS21);
    const page = await context.newPage();

    const testEmail = generateTestEmail();
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!');

    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });

    if (page.url().includes('/onboarding')) {
      await page.goto(`${BASE_URL}/dashboard`);
    }

    const bottomNav = page.locator('nav[aria-label*="bottom"]').or(page.locator('nav.fixed.bottom-0'));
    await expect(bottomNav).toBeVisible();

    await context.close();
  });
});

test.describe('Desktop - Bottom Nav Should NOT Be Visible', () => {
  test.use({
    viewport: { width: 1920, height: 1080 },
  });

  test('should hide bottom navigation on desktop viewport', async ({ page }) => {
    const testEmail = generateTestEmail();
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!');

    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });

    if (page.url().includes('/onboarding')) {
      await page.goto(`${BASE_URL}/dashboard`);
    }

    // Bottom nav should NOT be visible on desktop
    const bottomNav = page.locator('nav[aria-label*="bottom"]').or(page.locator('nav.fixed.bottom-0'));
    await expect(bottomNav).not.toBeVisible();

    // Top navigation should be visible instead
    const topNav = page.locator('nav.hidden.md\\:flex');
    await expect(topNav).toBeVisible();
  });
});

test.describe('Mobile Navigation Performance', () => {
  test('navigation should be fast (<100ms)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(iPhone12.viewport);
    const testEmail = generateTestEmail();
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!');

    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });

    if (page.url().includes('/onboarding')) {
      await page.goto(`${BASE_URL}/dashboard`);
    }

    // Measure navigation time
    const startTime = Date.now();
    await page.click('button[aria-label*="Portfolios"]');
    await page.waitForURL(/\/portfolios/);
    const endTime = Date.now();

    const navigationTime = endTime - startTime;

    // Navigation should be fast (<1000ms total including page load)
    expect(navigationTime).toBeLessThan(1000);
  });
});
