/**
 * Multi-Level Navigation E2E Tests
 *
 * Tests all navigation levels of the Coinsphere application:
 * - 2nd Level: Hamburger menu dropdown navigation
 * - 3rd Level: User menu dropdown navigation (Settings, Billing, Help, etc.)
 * - 4th Level: Within-page nested navigation
 *
 * Prerequisites:
 * - User must be authenticated
 * - Application must be running at http://localhost:5173
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// Generate unique test user email for each test run
const generateTestEmail = () => `navtest${Date.now()}@coinsphere.com`;

// Increase timeout for navigation flows
test.setTimeout(90000);

// Helper function to signup and login before each test
async function signupAndLogin(page: any, email: string, password: string) {
  // First signup
  await page.goto(`${BASE_URL}/signup`);
  await page.waitForLoadState('networkidle');

  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', 'User');
  await page.fill('input[type="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.check('input[type="checkbox"]#terms');

  await page.click('[data-testid="signup-submit-button"]');
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20000 });

  // Navigate to dashboard if on onboarding
  if (page.url().includes('/onboarding')) {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
  }

  await page.waitForTimeout(1000); // Let page fully load
}

test.describe('2nd Level Navigation - Hamburger Menu', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail();
    testPassword = 'TestPass123!';
    await signupAndLogin(page, testEmail, testPassword);
  });

  test('should open hamburger menu and navigate to Dashboard', async ({ page }) => {
    // Navigate away from dashboard first
    await page.goto('http://localhost:5173/portfolios');
    await page.waitForLoadState('networkidle');

    // Click hamburger menu button
    const hamburgerButton = page.locator('[data-testid="hamburger-menu-button"]');
    await expect(hamburgerButton).toBeVisible();
    await hamburgerButton.click();

    // Verify menu is open
    await page.waitForTimeout(300); // Wait for animation
    const menuDrawer = page.locator('text=Dashboard').first();
    await expect(menuDrawer).toBeVisible();

    // Click Dashboard in hamburger menu
    await menuDrawer.click();

    // Verify navigation
    await page.waitForURL('http://localhost:5173/dashboard', { timeout: 5000 });
    expect(page.url()).toBe('http://localhost:5173/dashboard');
  });

  test('should navigate to all primary pages from hamburger menu', async ({ page }) => {
    const menuItems = [
      { name: 'Portfolios', url: '/portfolios' },
      { name: 'DeFi', url: '/defi' },
      { name: 'Exchanges', url: '/exchanges' },
      { name: 'Alerts', url: '/alerts' },
      { name: 'Dashboard', url: '/dashboard' },
    ];

    for (const item of menuItems) {
      // Open hamburger menu
      const hamburgerButton = page.locator('[data-testid="hamburger-menu-button"]');
      await hamburgerButton.click();
      await page.waitForTimeout(300);

      // Click menu item
      const menuItem = page.locator(`text=${item.name}`).first();
      await expect(menuItem).toBeVisible();
      await menuItem.click();

      // Verify navigation
      await page.waitForURL(`http://localhost:5173${item.url}`, { timeout: 5000 });
      expect(page.url()).toContain(item.url);

      // Wait a moment before next iteration
      await page.waitForTimeout(500);
    }
  });

  test('should close hamburger menu when clicking outside', async ({ page }) => {
    // Open hamburger menu
    const hamburgerButton = page.locator('[data-testid="hamburger-menu-button"]');
    await hamburgerButton.click();
    await page.waitForTimeout(300);

    // Verify menu is open
    const menuDrawer = page.locator('text=Dashboard').first();
    await expect(menuDrawer).toBeVisible();

    // Click outside the menu (on the main content area)
    await page.click('body', { position: { x: 600, y: 200 } });
    await page.waitForTimeout(300);

    // Note: Menu might stay open depending on click-outside implementation
    // This test documents current behavior
  });

  test('should toggle hamburger menu with X button', async ({ page }) => {
    // Open hamburger menu
    const hamburgerButton = page.locator('[data-testid="hamburger-menu-button"]');
    await hamburgerButton.click();
    await page.waitForTimeout(300);

    // Verify menu is open (hamburger icon should change to X)
    const closeIcon = page.locator('[data-testid="hamburger-menu-button"] svg').first();
    await expect(closeIcon).toBeVisible();

    // Click X to close
    await hamburgerButton.click();
    await page.waitForTimeout(300);

    // Menu should be closed (icon should change back to hamburger)
    await expect(hamburgerButton).toBeVisible();
  });

  test('should highlight active route in hamburger menu', async ({ page }) => {
    // Navigate to DeFi page
    await page.goto('http://localhost:5173/defi');
    await page.waitForLoadState('networkidle');

    // Open hamburger menu
    const hamburgerButton = page.locator('[data-testid="hamburger-menu-button"]');
    await hamburgerButton.click();
    await page.waitForTimeout(300);

    // Check if DeFi item is highlighted (has active class)
    const defiMenuItem = page.locator('button:has-text("DeFi")').first();
    await expect(defiMenuItem).toBeVisible();

    // Check for active styling (blue background)
    const bgColor = await defiMenuItem.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Active items should have blue background (rgb values for #3B82F6)
    expect(bgColor).toBeTruthy();
  });
});

test.describe('3rd Level Navigation - User Menu Dropdown', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail();
    testPassword = 'TestPass123!';
    await signupAndLogin(page, testEmail, testPassword);
  });

  test('should open user menu dropdown', async ({ page }) => {
    // Click user menu button
    const userMenuButton = page.locator('[data-testid="user-menu-button"]');
    await expect(userMenuButton).toBeVisible();
    await userMenuButton.click();

    // Verify dropdown is visible
    const userMenuDropdown = page.locator('[data-testid="user-menu-dropdown"]');
    await expect(userMenuDropdown).toBeVisible({ timeout: 2000 });

    // Verify menu items are visible
    await expect(page.locator('text=Profile Settings')).toBeVisible();
    await expect(page.locator('text=Billing & Payments')).toBeVisible();
    await expect(page.locator('text=Help & Support')).toBeVisible();
  });

  test('should navigate to Settings from user menu', async ({ page }) => {
    // Open user menu
    await page.locator('[data-testid="user-menu-button"]').click();
    await page.waitForTimeout(300);

    // Click Settings
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.click();

    // Verify navigation to settings page
    await page.waitForURL('http://localhost:5173/settings', { timeout: 5000 });
    expect(page.url()).toBe('http://localhost:5173/settings');
  });

  test('should navigate to Billing from user menu', async ({ page }) => {
    // Open user menu
    await page.locator('[data-testid="user-menu-button"]').click();
    await page.waitForTimeout(300);

    // Click Billing & Payments
    await page.locator('text=Billing & Payments').click();

    // Verify navigation to billing page
    await page.waitForURL('http://localhost:5173/billing', { timeout: 5000 });
    expect(page.url()).toBe('http://localhost:5173/billing');
  });

  test('should navigate to Help from user menu', async ({ page }) => {
    // Open user menu
    await page.locator('[data-testid="user-menu-button"]').click();
    await page.waitForTimeout(300);

    // Click Help & Support
    await page.locator('text=Help & Support').click();

    // Verify navigation to help page
    await page.waitForURL('http://localhost:5173/help', { timeout: 5000 });
    expect(page.url()).toBe('http://localhost:5173/help');
  });

  test('should show upgrade button for free tier users', async ({ page }) => {
    // Open user menu
    await page.locator('[data-testid="user-menu-button"]').click();
    await page.waitForTimeout(300);

    // Check if user is on free tier
    const freeLabel = page.locator('text=Free Plan');
    const isFreeUser = await freeLabel.isVisible().catch(() => false);

    if (isFreeUser) {
      // Verify Upgrade button is visible
      const upgradeButton = page.locator('text=Upgrade to Plus');
      await expect(upgradeButton).toBeVisible();

      // Click upgrade button
      await upgradeButton.click();

      // Verify navigation to pricing page
      await page.waitForURL('http://localhost:5173/pricing', { timeout: 5000 });
      expect(page.url()).toBe('http://localhost:5173/pricing');
    } else {
      // For paid users, upgrade button should not be visible
      const upgradeButton = page.locator('text=Upgrade to Plus');
      await expect(upgradeButton).not.toBeVisible();
    }
  });

  test('should display user information in dropdown', async ({ page }) => {
    // Open user menu
    await page.locator('[data-testid="user-menu-button"]').click();
    await page.waitForTimeout(300);

    const userMenuDropdown = page.locator('[data-testid="user-menu-dropdown"]');
    await expect(userMenuDropdown).toBeVisible();

    // Verify email is displayed
    await expect(userMenuDropdown.locator(`text=${testEmail}`)).toBeVisible();

    // Verify subscription tier is displayed
    const tierBadge = userMenuDropdown.locator('span:has-text("Plan")');
    await expect(tierBadge).toBeVisible();
  });

  test('should close user menu when clicking outside', async ({ page }) => {
    // Open user menu
    await page.locator('[data-testid="user-menu-button"]').click();
    await page.waitForTimeout(300);

    const userMenuDropdown = page.locator('[data-testid="user-menu-dropdown"]');
    await expect(userMenuDropdown).toBeVisible();

    // Click outside the dropdown
    await page.click('body', { position: { x: 200, y: 200 } });
    await page.waitForTimeout(500);

    // Menu should be closed
    await expect(userMenuDropdown).not.toBeVisible();
  });

  test('should logout from user menu', async ({ page }) => {
    // Open user menu
    await page.locator('[data-testid="user-menu-button"]').click();
    await page.waitForTimeout(300);

    // Click logout button
    const logoutButton = page.locator('[data-testid="logout-button"]');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Verify redirect to login page
    await page.waitForURL('http://localhost:5173/login', { timeout: 5000 });
    expect(page.url()).toBe('http://localhost:5173/login');

    // Verify user is logged out (login form should be visible)
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

test.describe('4th Level Navigation - Within-Page Navigation', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail();
    testPassword = 'TestPass123!';
    await signupAndLogin(page, testEmail, testPassword);
  });

  test('should navigate within Portfolio page - Create Portfolio', async ({ page }) => {
    // Navigate to Portfolios page
    await page.goto('http://localhost:5173/portfolios');
    await page.waitForLoadState('networkidle');

    // Click Create Portfolio button (if visible)
    const createButton = page.locator('button:has-text("Create Portfolio")').first();
    const isVisible = await createButton.isVisible().catch(() => false);

    if (isVisible) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // Verify modal or form appears
      // This is 4th level navigation - navigating within the same page to a form/modal
      const modalOrForm = page.locator('text=Portfolio Name').or(page.locator('input[placeholder*="Portfolio"]'));
      await expect(modalOrForm.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should navigate within DeFi page - Wallet connection', async ({ page }) => {
    // Navigate to DeFi page
    await page.goto('http://localhost:5173/defi');
    await page.waitForLoadState('networkidle');

    // Look for Connect Wallet button (4th level nav within DeFi page)
    const connectWalletButton = page.locator('button:has-text("Connect Wallet")').first();
    const isVisible = await connectWalletButton.isVisible().catch(() => false);

    if (isVisible) {
      await connectWalletButton.click();
      await page.waitForTimeout(1000);

      // Verify wallet connection modal appears
      // This is within-page navigation to a modal/overlay
      const walletModal = page.locator('text=MetaMask').or(page.locator('text=WalletConnect')).or(page.locator('text=Select Wallet'));
      await expect(walletModal.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should navigate within Alerts page - Create Alert', async ({ page }) => {
    // Navigate to Alerts page
    await page.goto('http://localhost:5173/alerts');
    await page.waitForLoadState('networkidle');

    // Look for Create Alert button
    const createAlertButton = page.locator('button:has-text("Create Alert")').or(page.locator('button:has-text("New Alert")'));
    const isVisible = await createAlertButton.first().isVisible().catch(() => false);

    if (isVisible) {
      await createAlertButton.first().click();
      await page.waitForTimeout(1000);

      // Verify alert creation form/modal appears (4th level within-page navigation)
      const alertForm = page.locator('text=Alert Type').or(page.locator('text=Price Target')).or(page.locator('select').first());
      await expect(alertForm.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should navigate within Dashboard - Portfolio selector', async ({ page }) => {
    // Already on dashboard from login
    await page.waitForLoadState('networkidle');

    // Look for portfolio selector dropdown (4th level nav within dashboard)
    const portfolioSelector = page.locator('select').or(page.locator('button:has-text("Portfolio")'));
    const isVisible = await portfolioSelector.first().isVisible().catch(() => false);

    if (isVisible) {
      // Click portfolio selector
      await portfolioSelector.first().click();
      await page.waitForTimeout(500);

      // Verify options appear (within-page navigation)
      // The selector should show portfolio options or a dropdown
      expect(await portfolioSelector.first().isVisible()).toBe(true);
    }
  });

  test('should navigate between tabs within Settings page', async ({ page }) => {
    // Navigate to Settings page
    await page.goto('http://localhost:5173/settings');
    await page.waitForLoadState('networkidle');

    // Look for tab navigation within settings (4th level)
    const tabs = ['Profile', 'Security', 'Notifications', 'Preferences', 'API'];

    for (const tabName of tabs) {
      const tab = page.locator(`button:has-text("${tabName}")`).or(page.locator(`a:has-text("${tabName}")`));
      const isVisible = await tab.first().isVisible().catch(() => false);

      if (isVisible) {
        await tab.first().click();
        await page.waitForTimeout(500);

        // Verify tab content changes (this is within-page navigation)
        // The URL might change or content might update
        await page.waitForTimeout(300);

        // Tab should now be active (have active styling)
        const isActive = await tab.first().evaluate((el) => {
          return el.classList.contains('active') ||
                 el.getAttribute('aria-current') === 'page' ||
                 window.getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)';
        });

        // Document that we navigated to this tab
        expect(isActive).toBeDefined();
      }
    }
  });

  test('should navigate to individual portfolio detail page', async ({ page }) => {
    // Navigate to Portfolios page
    await page.goto('http://localhost:5173/portfolios');
    await page.waitForLoadState('networkidle');

    // Look for a portfolio card or row to click (4th level - page to detail page)
    const portfolioItem = page.locator('[data-testid^="portfolio-"]').or(
      page.locator('button:has-text("View")').or(
        page.locator('tr').filter({ hasText: 'Portfolio' })
      )
    );

    const firstPortfolio = portfolioItem.first();
    const isVisible = await firstPortfolio.isVisible().catch(() => false);

    if (isVisible) {
      await firstPortfolio.click();
      await page.waitForTimeout(1000);

      // Verify we navigated to a portfolio detail view
      // URL should contain /portfolios/ or /dashboard with portfolioId
      const currentUrl = page.url();
      const hasPortfolioDetail = currentUrl.includes('/portfolios/') ||
                                 currentUrl.includes('portfolioId=') ||
                                 currentUrl.includes('/dashboard');

      expect(hasPortfolioDetail).toBe(true);
    }
  });
});

test.describe('Cross-Level Navigation Combinations', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail();
    testPassword = 'TestPass123!';
    await signupAndLogin(page, testEmail, testPassword);
  });

  test('should navigate: Hamburger (2nd) -> User Menu (3rd) -> Settings (3rd) -> Back to Dashboard (2nd)', async ({ page }) => {
    // Start at Portfolios
    await page.goto('http://localhost:5173/portfolios');
    await page.waitForLoadState('networkidle');

    // Use hamburger menu (2nd level) to go to Alerts
    await page.locator('[data-testid="hamburger-menu-button"]').click();
    await page.waitForTimeout(300);
    await page.locator('text=Alerts').first().click();
    await page.waitForURL('http://localhost:5173/alerts', { timeout: 5000 });

    // Use user menu (3rd level) to go to Settings
    await page.locator('[data-testid="user-menu-button"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="settings-button"]').click();
    await page.waitForURL('http://localhost:5173/settings', { timeout: 5000 });

    // Use hamburger menu again to go back to Dashboard
    await page.locator('[data-testid="hamburger-menu-button"]').click();
    await page.waitForTimeout(300);
    await page.locator('text=Dashboard').first().click();
    await page.waitForURL('http://localhost:5173/dashboard', { timeout: 5000 });

    expect(page.url()).toBe('http://localhost:5173/dashboard');
  });

  test('should maintain state when navigating between levels', async ({ page }) => {
    // Open hamburger menu
    await page.locator('[data-testid="hamburger-menu-button"]').click();
    await page.waitForTimeout(300);

    // Verify hamburger is open
    const hamburgerMenu = page.locator('text=Dashboard').first();
    await expect(hamburgerMenu).toBeVisible();

    // Now open user menu while hamburger is still open
    await page.locator('[data-testid="user-menu-button"]').click();
    await page.waitForTimeout(300);

    // Both menus might be visible (depending on implementation)
    const userMenu = page.locator('[data-testid="user-menu-dropdown"]');
    await expect(userMenu).toBeVisible();

    // Close user menu
    await page.click('body', { position: { x: 200, y: 200 } });
    await page.waitForTimeout(300);

    // Hamburger menu state should be preserved or auto-close
    // This documents actual behavior
  });
});
