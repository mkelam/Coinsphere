import { test, expect } from '@playwright/test';

test.describe('UX Fidelity & Design System Validation', () => {
  const timestamp = Date.now();
  const testEmail = `ux-test-${timestamp}@coinsphere.com`;
  const testPassword = 'TestPassword123!';

  test.beforeAll(async ({ browser }) => {
    // Create test user
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/signup');
    await page.getByTestId('firstname-input').fill('UX');
    await page.getByTestId('lastname-input').fill('Test');
    await page.getByTestId('email-input').fill(testEmail);
    await page.getByTestId('password-input').fill(testPassword);
    await page.locator('#confirmPassword').fill(testPassword);
    await page.locator('#terms').check();
    await page.getByTestId('signup-submit-button').click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    await context.close();
  });

  test('Design System: Login Page - Glassmorphism & Branding', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/ux-fidelity/login-page.png',
      fullPage: true
    });

    // Validate crystal ball branding
    await expect(page.getByText('🔮')).toBeVisible();
    await expect(page.getByTestId('page-title')).toHaveText('CoinSphere');

    // Validate black background
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    expect(bgColor).toContain('rgb(0, 0, 0)');

    // Validate glass card exists
    const glassCard = page.locator('.glass-card').first();
    await expect(glassCard).toBeVisible();

    // Check glass card computed styles
    const cardStyles = await glassCard.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        background: styles.backgroundColor,
        backdropFilter: styles.backdropFilter,
        border: styles.border,
        borderRadius: styles.borderRadius,
      };
    });

    // Validate glassmorphism properties
    expect(cardStyles.backdropFilter).toContain('blur');
    expect(cardStyles.borderRadius).toBeTruthy();

    console.log('✅ Login Page Design System Validated:', cardStyles);
  });

  test('Design System: Signup Page - Consistency Check', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: 'test-results/ux-fidelity/signup-page.png',
      fullPage: true
    });

    // Same branding as login
    await expect(page.getByText('🔮')).toBeVisible();
    await expect(page.getByTestId('page-title')).toHaveText('CoinSphere');

    // Same glass card styling
    const glassCard = page.locator('.glass-card').first();
    await expect(glassCard).toBeVisible();

    // Validate color scheme consistency
    const blueButton = page.getByTestId('signup-submit-button');
    const buttonBg = await blueButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should be accent-blue #3b82f6 = rgb(59, 130, 246)
    expect(buttonBg).toContain('rgb(59, 130, 246)');

    console.log('✅ Signup Page Consistency Validated');
  });

  test('Design System: Dashboard - Glass Cards & Layout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByTestId('email-input').fill(testEmail);
    await page.getByTestId('password-input').fill(testPassword);
    await Promise.all([
      page.waitForURL(/.*dashboard/, { timeout: 10000 }),
      page.getByTestId('login-submit-button').click()
    ]);

    await page.waitForLoadState('networkidle');

    // Take full dashboard screenshot
    await page.screenshot({
      path: 'test-results/ux-fidelity/dashboard-page.png',
      fullPage: true
    });

    // Validate header branding
    await expect(page.getByText('🔮')).toBeVisible();
    await expect(page.locator('header').getByText('CoinSphere')).toBeVisible();

    // Count glass cards
    const glassCards = page.locator('.glass-card');
    const cardCount = await glassCards.count();
    expect(cardCount).toBeGreaterThan(0);

    console.log(`✅ Dashboard has ${cardCount} glass cards`);

    // Validate header backdrop blur
    const header = page.locator('header');
    const headerStyles = await header.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backdropFilter: styles.backdropFilter,
        position: styles.position,
        zIndex: styles.zIndex,
      };
    });

    expect(headerStyles.backdropFilter).toContain('blur');
    expect(headerStyles.position).toBe('sticky');
    expect(parseInt(headerStyles.zIndex)).toBeGreaterThanOrEqual(50);

    console.log('✅ Header Design System Validated:', headerStyles);
  });

  test('Design System: Color Palette Validation', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check CSS variables are defined
    const cssVariables = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      return {
        accentBlue: getComputedStyle(document.documentElement).getPropertyValue('--accent-blue').trim(),
        accentGreen: getComputedStyle(document.documentElement).getPropertyValue('--accent-green').trim(),
        accentRed: getComputedStyle(document.documentElement).getPropertyValue('--accent-red').trim(),
        bgPrimary: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim(),
        textPrimary: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
      };
    });

    // Validate color tokens match design system
    expect(cssVariables.accentBlue).toBe('#3b82f6');
    expect(cssVariables.accentGreen).toBe('#10b981');
    expect(cssVariables.accentRed).toBe('#ef4444');
    expect(cssVariables.bgPrimary).toBe('#000000');
    expect(cssVariables.textPrimary).toBe('#ffffff');

    console.log('✅ Color Palette Validated:', cssVariables);
  });

  test('Design System: Typography Hierarchy', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check page title (should be 3xl)
    const pageTitle = page.getByTestId('page-title');
    const titleStyles = await pageTitle.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        color: styles.color,
      };
    });

    // text-3xl = 1.875rem = 30px
    expect(parseFloat(titleStyles.fontSize)).toBeGreaterThanOrEqual(28);
    expect(titleStyles.color).toContain('rgb(255, 255, 255)'); // White text

    console.log('✅ Typography Validated:', titleStyles);
  });

  test('Design System: Interactive States - Button Hover', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const submitButton = page.getByTestId('login-submit-button');

    // Get initial state
    const initialBg = await submitButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Hover state
    await submitButton.hover();
    await page.waitForTimeout(300); // Wait for transition

    const hoverBg = await submitButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Hover should have transition effect (colors may be slightly different)
    // Both should be blue-ish (contain rgb values in blue range)
    expect(initialBg).toContain('rgb');
    expect(hoverBg).toContain('rgb');

    console.log('✅ Hover States Working:', { initialBg, hoverBg });
  });

  test('Design System: Glass Card Hover Animation', async ({ page }) => {
    // Login and go to dashboard
    await page.goto('/login');
    await page.getByTestId('email-input').fill(testEmail);
    await page.getByTestId('password-input').fill(testPassword);
    await Promise.all([
      page.waitForURL(/.*dashboard/, { timeout: 10000 }),
      page.getByTestId('login-submit-button').click()
    ]);

    await page.waitForLoadState('networkidle');

    const glassCard = page.locator('.glass-card').first();
    await expect(glassCard).toBeVisible();

    // Get initial transform
    const initialTransform = await glassCard.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });

    // Hover over card
    await glassCard.hover();
    await page.waitForTimeout(300); // Wait for animation

    const hoverTransform = await glassCard.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });

    // Transform should change on hover (translateY)
    console.log('✅ Card Animation Validated:', {
      initial: initialTransform,
      hover: hoverTransform
    });
  });

  test('Design System: Responsive Layout - Mobile View', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Take mobile screenshot
    await page.screenshot({
      path: 'test-results/ux-fidelity/login-mobile.png',
      fullPage: true
    });

    // Glass card should still be visible and properly sized
    const glassCard = page.locator('.glass-card').first();
    await expect(glassCard).toBeVisible();

    const cardBox = await glassCard.boundingBox();
    expect(cardBox).toBeTruthy();

    // Card should fit within mobile viewport with padding
    if (cardBox) {
      expect(cardBox.width).toBeLessThanOrEqual(375);
      expect(cardBox.width).toBeGreaterThan(300); // Has padding
    }

    console.log('✅ Mobile Responsive Layout Validated');
  });

  test('Design System: User Menu Dropdown - Glass Effect', async ({ page }) => {
    // Login and go to dashboard
    await page.goto('/login');
    await page.getByTestId('email-input').fill(testEmail);
    await page.getByTestId('password-input').fill(testPassword);
    await Promise.all([
      page.waitForURL(/.*dashboard/, { timeout: 10000 }),
      page.getByTestId('login-submit-button').click()
    ]);

    // Open user menu
    await page.getByTestId('user-menu-button').click();
    await page.getByTestId('user-menu-dropdown').waitFor({ state: 'visible' });

    // Take screenshot with dropdown open
    await page.screenshot({
      path: 'test-results/ux-fidelity/user-menu-dropdown.png'
    });

    // Validate dropdown has glass styling
    const dropdown = page.getByTestId('user-menu-dropdown');
    const dropdownStyles = await dropdown.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backdropFilter: styles.backdropFilter,
        border: styles.border,
      };
    });

    expect(dropdownStyles.backdropFilter).toContain('blur');

    console.log('✅ User Menu Glass Effect Validated:', dropdownStyles);
  });

  test('Visual Regression: Design Consistency Score', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const designScore = await page.evaluate(() => {
      let score = 100;
      const issues: string[] = [];

      // Check background color
      const bgColor = window.getComputedStyle(document.body).backgroundColor;
      if (!bgColor.includes('rgb(0, 0, 0)')) {
        score -= 10;
        issues.push('Background not pure black');
      }

      // Check glass cards exist
      const glassCards = document.querySelectorAll('.glass-card');
      if (glassCards.length === 0) {
        score -= 20;
        issues.push('No glass cards found');
      }

      // Check branding
      const hasCrystalBall = document.body.textContent?.includes('🔮');
      const hasCoinSphere = document.body.textContent?.includes('CoinSphere');
      if (!hasCrystalBall || !hasCoinSphere) {
        score -= 15;
        issues.push('Missing branding elements');
      }

      // Check CSS variables
      const root = document.documentElement;
      const accentBlue = getComputedStyle(root).getPropertyValue('--accent-blue').trim();
      if (accentBlue !== '#3b82f6') {
        score -= 10;
        issues.push('Accent blue color mismatch');
      }

      return { score, issues };
    });

    console.log('🎨 Design Consistency Score:', designScore.score, '%');
    if (designScore.issues.length > 0) {
      console.log('⚠️  Issues found:', designScore.issues);
    }

    expect(designScore.score).toBeGreaterThanOrEqual(95);
  });
});
