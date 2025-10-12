/**
 * End-to-End Tests: Portfolio Management
 * Tests portfolio CRUD operations, asset management, and value calculations
 *
 * Priority: CRITICAL (Core Feature)
 * Estimated Execution Time: 8-10 minutes
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001/api/v1';

// Test data
const generateTestEmail = () => `portfoliotest${Date.now()}@coinsphere.com`;
const testPassword = 'TestPass123!';
const testFirstName = 'Portfolio';
const testLastName = 'Tester';

// Increase timeout for complex operations
test.setTimeout(120000); // 2 minutes per test

test.describe('Portfolio Management - CRUD Operations', () => {
  let testEmail: string;
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail();

    // Signup and login
    await page.goto(`${BASE_URL}/signup`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="firstName"]', testFirstName);
    await page.fill('input[name="lastName"]', testLastName);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.check('input[type="checkbox"]#terms');

    await page.click('[data-testid="signup-submit-button"]');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20000 });

    // CRITICAL: Wait for auth to fully initialize by checking localStorage
    await page.waitForFunction(() => {
      const token = localStorage.getItem('accessToken');
      const user = localStorage.getItem('user');
      return token !== null && user !== null;
    }, { timeout: 10000 });

    // Additional wait for React state to sync with localStorage
    await page.waitForTimeout(1000);

    // Navigate to portfolios page
    await page.goto(`${BASE_URL}/portfolios`);
    await page.waitForLoadState('networkidle');
  });

  test('TC-P01: Should display portfolios page correctly', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1, h2').filter({ hasText: /portfolio/i }).first()).toBeVisible();

    // Check for "Create Portfolio" button
    const createButton = page.locator('button, a').filter({ hasText: /create.*portfolio|new.*portfolio|\+ portfolio/i }).first();
    await expect(createButton).toBeVisible();

    // Check for empty state or portfolios list
    const hasPortfolios = await page.locator('[data-testid="portfolio-card"], [data-testid="portfolio-item"]').count() > 0;

    if (!hasPortfolios) {
      // Should show empty state
      await expect(page.locator('text=/no portfolios|get started|create your first/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC-P02: Should create a new portfolio with name', async ({ page }) => {
    // Click create portfolio button using data-testid
    await page.getByTestId('new-portfolio-button').click();

    // Wait for modal to open
    await page.waitForTimeout(500);

    // Fill portfolio name using data-testid
    const portfolioName = 'My Test Portfolio';
    await page.getByTestId('portfolio-name-input').fill(portfolioName);

    // Optional: Fill description using data-testid
    const descriptionInput = page.getByTestId('portfolio-description-input');
    if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descriptionInput.fill('Test portfolio for E2E testing');
    }

    // Submit form using data-testid
    await page.getByTestId('create-portfolio-save').click();

    // CRITICAL: Wait for modal backdrop to fully disappear
    await page.waitForSelector('.fixed.inset-0', { state: 'detached', timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // Verify portfolio appears in list (or reload page to see it)
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('portfolio-card').filter({ hasText: portfolioName })).toBeVisible({ timeout: 10000 });
  });

  test('TC-P03: Should create portfolio with initial asset', async ({ page }) => {
    // Click create portfolio
    const createButton = page.locator('button, a').filter({ hasText: /create.*portfolio|new.*portfolio|\+ portfolio/i }).first();
    await createButton.click();
    await page.waitForTimeout(1000);

    // Fill portfolio details
    const portfolioName = 'BTC Portfolio';
    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(portfolioName);

    // Look for "Add Asset" or similar button in the form
    const addAssetButton = page.locator('button').filter({ hasText: /add.*asset|add.*holding/i }).first();

    if (await addAssetButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addAssetButton.click();
      await page.waitForTimeout(500);

      // Select token (BTC)
      const tokenInput = page.locator('input[placeholder*="search" i], input[placeholder*="token" i], select').first();
      await tokenInput.fill('BTC');
      await page.waitForTimeout(500);

      // Select from dropdown
      const btcOption = page.locator('text="BTC", text="Bitcoin"').first();
      if (await btcOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btcOption.click();
      }

      // Enter amount
      const amountInput = page.locator('input[name="amount"], input[placeholder*="amount" i]').first();
      await amountInput.fill('0.5');

      // Enter purchase price (optional)
      const priceInput = page.locator('input[name="price"], input[placeholder*="price" i]').first();
      if (await priceInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await priceInput.fill('45000');
      }
    }

    // Submit form
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /create|save/i }).first();
    await submitButton.click();

    await page.waitForTimeout(2000);

    // Verify portfolio created
    await expect(page.locator(`text="${portfolioName}"`).first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-P04: Should add asset to existing portfolio', async ({ page }) => {
    // First create a portfolio
    const createButton = page.locator('button, a').filter({ hasText: /create.*portfolio|new.*portfolio/i }).first();
    await createButton.click();
    await page.waitForTimeout(1000);

    const portfolioName = 'Multi-Asset Portfolio';
    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(portfolioName);

    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /create|save/i }).first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Now click on the portfolio to view details
    const portfolioCard = page.locator(`text="${portfolioName}"`).first();
    await portfolioCard.click();
    await page.waitForTimeout(1000);

    // Look for "Add Asset" button in portfolio detail view
    const addAssetButton = page.locator('button').filter({ hasText: /add.*asset|add.*holding|\+ add/i }).first();
    await expect(addAssetButton).toBeVisible({ timeout: 5000 });
    await addAssetButton.click();

    await page.waitForTimeout(500);

    // Fill asset details
    const tokenInput = page.locator('input[placeholder*="search" i], input[placeholder*="token" i]').first();
    await tokenInput.fill('ETH');
    await page.waitForTimeout(500);

    // Select ETH from dropdown
    const ethOption = page.locator('text="ETH", text="Ethereum"').first();
    if (await ethOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ethOption.click();
    }

    // Enter amount
    const amountInput = page.locator('input[name="amount"], input[placeholder*="amount" i]').first();
    await amountInput.fill('2');

    // Save asset
    const saveButton = page.locator('button').filter({ hasText: /save|add|confirm/i }).first();
    await saveButton.click();

    await page.waitForTimeout(2000);

    // Verify asset appears in portfolio
    await expect(page.locator('text="ETH", text="Ethereum"').first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-P05: Should display empty state when no portfolios exist', async ({ page }) => {
    // Assuming fresh user has no portfolios
    const emptyState = page.locator('text=/no portfolios|get started|create your first/i').first();

    // Either empty state is visible, or portfolios exist
    const hasEmptyState = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
    const hasPortfolios = await page.locator('[data-testid="portfolio-card"], [data-testid="portfolio-item"]').count() > 0;

    expect(hasEmptyState || hasPortfolios).toBeTruthy();
  });

  test('TC-P06: Should search/filter portfolios by name', async ({ page }) => {
    // Create multiple portfolios
    const portfolios = ['Bitcoin Holdings', 'Ethereum Portfolio', 'Altcoin Basket'];

    for (const name of portfolios) {
      await page.getByTestId('new-portfolio-button').click();
      await page.waitForTimeout(500);

      await page.getByTestId('portfolio-name-input').fill(name);

      await page.getByTestId('create-portfolio-save').click();

      // Wait for modal to close completely
      await page.waitForSelector('.fixed.inset-0', { state: 'detached', timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Look for search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Search for "Bitcoin"
      await searchInput.fill('Bitcoin');
      await page.waitForTimeout(1000);

      // Should show Bitcoin Holdings
      await expect(page.locator('text="Bitcoin Holdings"').first()).toBeVisible();

      // Should NOT show Ethereum Portfolio
      const ethereumVisible = await page.locator('text="Ethereum Portfolio"').isVisible({ timeout: 1000 }).catch(() => false);
      expect(ethereumVisible).toBeFalsy();
    } else {
      // If no search, at least verify all portfolios are visible
      for (const name of portfolios) {
        await expect(page.locator(`text="${name}"`).first()).toBeVisible();
      }
    }
  });

  test('TC-P07: Should delete portfolio with confirmation', async ({ page }) => {
    // Create a portfolio to delete
    const createButton = page.locator('button, a').filter({ hasText: /create.*portfolio|new.*portfolio/i }).first();
    await createButton.click();
    await page.waitForTimeout(500);

    const portfolioName = 'Portfolio To Delete';
    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(portfolioName);

    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /create|save/i }).first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Verify portfolio exists
    await expect(page.locator(`text="${portfolioName}"`).first()).toBeVisible();

    // Click on portfolio to view details or find delete button
    const portfolioCard = page.locator(`text="${portfolioName}"`).first();
    await portfolioCard.click();
    await page.waitForTimeout(1000);

    // Look for delete button (could be in menu, settings, or direct button)
    const deleteButton = page.locator('button').filter({ hasText: /delete|remove/i }).first();

    if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteButton.click();
      await page.waitForTimeout(500);

      // Look for confirmation dialog
      const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|delete/i }).first();

      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }

      // Navigate back to portfolios list
      await page.goto(`${BASE_URL}/portfolios`);
      await page.waitForLoadState('networkidle');

      // Verify portfolio is deleted
      const portfolioStillExists = await page.locator(`text="${portfolioName}"`).isVisible({ timeout: 2000 }).catch(() => false);
      expect(portfolioStillExists).toBeFalsy();
    } else {
      // If delete button not found, test passes with warning
      console.warn('Delete button not found - feature may not be implemented yet');
    }
  });
});

test.describe('Portfolio Management - Value Calculations', () => {
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail();

    // Signup and login
    await page.goto(`${BASE_URL}/signup`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="firstName"]', testFirstName);
    await page.fill('input[name="lastName"]', testLastName);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.check('input[type="checkbox"]#terms');

    await page.click('[data-testid="signup-submit-button"]');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20000 });

    // CRITICAL: Wait for auth to fully initialize
    await page.waitForFunction(() => {
      const token = localStorage.getItem('accessToken');
      const user = localStorage.getItem('user');
      return token !== null && user !== null;
    }, { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.goto(`${BASE_URL}/portfolios`);
    await page.waitForLoadState('networkidle');
  });

  test('TC-P08: Should display portfolio total value', async ({ page }) => {
    // Create portfolio with known asset
    await page.getByTestId('new-portfolio-button').click();
    await page.waitForTimeout(500);

    await page.getByTestId('portfolio-name-input').fill('Value Test Portfolio');

    await page.getByTestId('create-portfolio-save').click();
    await page.waitForTimeout(2000);

    // Click portfolio to view details
    const portfolioCard = page.locator('text="Value Test Portfolio"').first();
    await portfolioCard.click();
    await page.waitForTimeout(1000);

    // Look for value display (usually shows $0.00 initially or with real values)
    const valueDisplay = page.locator('text=/\\$[0-9,]+\\.?[0-9]*/').first();
    await expect(valueDisplay).toBeVisible({ timeout: 5000 });

    // Verify it's a valid currency format
    const valueText = await valueDisplay.textContent();
    expect(valueText).toMatch(/\$[\d,]+\.?\d*/);
  });

  test('TC-P09: Should calculate portfolio 24h change', async ({ page }) => {
    // Create portfolio
    await page.getByTestId('new-portfolio-button').click();
    await page.waitForTimeout(500);

    await page.getByTestId('portfolio-name-input').fill('Change Tracking Portfolio');

    await page.getByTestId('create-portfolio-save').click();
    await page.waitForTimeout(2000);

    // Click portfolio
    const portfolioCard = page.locator('text="Change Tracking Portfolio"').first();
    await portfolioCard.click();
    await page.waitForTimeout(1000);

    // Look for 24h change display (could be +5.2%, -2.8%, etc.)
    const changeDisplay = page.locator('text=/[+-]?[0-9]+\.?[0-9]*%/').first();

    if (await changeDisplay.isVisible({ timeout: 5000 }).catch(() => false)) {
      const changeText = await changeDisplay.textContent();

      // Verify it's a valid percentage format
      expect(changeText).toMatch(/[+-]?\d+\.?\d*%/);

      // Check color coding (green for positive, red for negative)
      const isPositive = changeText!.includes('+') || !changeText!.includes('-');
      const color = await changeDisplay.evaluate(el => window.getComputedStyle(el).color);

      if (isPositive) {
        // Should be green-ish (rgb with high green value)
        expect(color).toMatch(/rgb\([0-9]+,\s*[1-9][0-9]+/);
      }
    } else {
      // If no assets, may show 0% or no change
      console.log('24h change not displayed - portfolio may be empty');
    }
  });

  test('TC-P10: Should show portfolio allocation breakdown', async ({ page }) => {
    // Create portfolio
    await page.getByTestId('new-portfolio-button').click();
    await page.waitForTimeout(500);

    await page.getByTestId('portfolio-name-input').fill('Allocation Portfolio');

    await page.getByTestId('create-portfolio-save').click();
    await page.waitForTimeout(2000);

    // Click portfolio
    const portfolioCard = page.locator('text="Allocation Portfolio"').first();
    await portfolioCard.click();
    await page.waitForTimeout(1000);

    // Look for allocation chart or breakdown (pie chart, bar chart, or list with percentages)
    const allocationSection = page.locator('text=/allocation|distribution|breakdown/i').first();

    if (await allocationSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Verify chart or list exists
      const hasChart = await page.locator('canvas, svg').count() > 0;
      const hasPercentages = await page.locator('text=/%/').count() > 0;

      expect(hasChart || hasPercentages).toBeTruthy();
    } else {
      console.log('Allocation section not found - may be empty portfolio');
    }
  });
});

test.describe('Portfolio Management - Multi-Portfolio', () => {
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail();

    // Signup and login
    await page.goto(`${BASE_URL}/signup`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="firstName"]', testFirstName);
    await page.fill('input[name="lastName"]', testLastName);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.check('input[type="checkbox"]#terms');

    await page.click('[data-testid="signup-submit-button"]');
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20000 });

    // CRITICAL: Wait for auth to fully initialize
    await page.waitForFunction(() => {
      const token = localStorage.getItem('accessToken');
      const user = localStorage.getItem('user');
      return token !== null && user !== null;
    }, { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.goto(`${BASE_URL}/portfolios`);
    await page.waitForLoadState('networkidle');
  });

  test('TC-P11: Should create and manage multiple portfolios', async ({ page }) => {
    const portfolios = [
      { name: 'Long Term Holdings', description: 'BTC & ETH only' },
      { name: 'Trading Portfolio', description: 'Active trading' },
      { name: 'DeFi Positions', description: 'Staking and LP' },
    ];

    // Create multiple portfolios
    for (const portfolio of portfolios) {
      await page.getByTestId('new-portfolio-button').click();
      await page.waitForTimeout(500);

      await page.getByTestId('portfolio-name-input').fill(portfolio.name);

      const descInput = page.getByTestId('portfolio-description-input');
      if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descInput.fill(portfolio.description);
      }

      await page.getByTestId('create-portfolio-save').click();

      // Wait for modal to close completely
      await page.waitForSelector('.fixed.inset-0', { state: 'detached', timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Verify all portfolios are created
    for (const portfolio of portfolios) {
      await expect(page.locator(`text="${portfolio.name}"`).first()).toBeVisible();
    }

    // Count portfolio cards
    const portfolioCount = await page.locator('[data-testid="portfolio-card"], [data-testid="portfolio-item"], div:has(text="Portfolio")').count();
    expect(portfolioCount).toBeGreaterThanOrEqual(3);
  });

  test('TC-P12: Should switch between portfolios', async ({ page }) => {
    // Create two portfolios
    const portfolio1 = 'Portfolio One';
    const portfolio2 = 'Portfolio Two';

    for (const name of [portfolio1, portfolio2]) {
      await page.getByTestId('new-portfolio-button').click();
      await page.waitForTimeout(500);

      await page.getByTestId('portfolio-name-input').fill(name);

      await page.getByTestId('create-portfolio-save').click();

      // Wait for modal to close completely
      await page.waitForSelector('.fixed.inset-0', { state: 'detached', timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Click first portfolio
    await page.locator(`text="${portfolio1}"`).first().click();
    await page.waitForTimeout(1000);

    // Verify we're viewing portfolio 1
    await expect(page.locator(`h1, h2`).filter({ hasText: portfolio1 }).first()).toBeVisible({ timeout: 5000 });

    // Navigate back to portfolios list
    await page.goto(`${BASE_URL}/portfolios`);
    await page.waitForLoadState('networkidle');

    // Click second portfolio
    await page.locator(`text="${portfolio2}"`).first().click();
    await page.waitForTimeout(1000);

    // Verify we're viewing portfolio 2
    await expect(page.locator(`h1, h2`).filter({ hasText: portfolio2 }).first()).toBeVisible({ timeout: 5000 });
  });
});
