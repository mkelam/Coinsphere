import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  // Generate timestamp once for ALL tests that need the same user
  const timestamp = Date.now();
  const testEmail = `e2e-test-${timestamp}@coinsphere.com`;
  const testPassword = 'TestPassword123!';
  const testFirstName = 'E2E';
  const testLastName = 'Test';

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Coinsphere|CryptoSense/);

    // Check for page title and subtitle using data-testid
    await expect(page.getByTestId('page-title')).toHaveText('CoinSphere');
    await expect(page.getByTestId('page-subtitle')).toHaveText('Sign in to your account');

    // Check for form inputs
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill('invalid-email');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-submit-button').click();

    // Should see HTML5 validation error (browser will prevent submission)
    const emailInput = page.getByTestId('email-input');
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('signup-link').click();
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.getByTestId('page-title')).toHaveText('CoinSphere');
    await expect(page.getByTestId('page-subtitle')).toHaveText('Create your account');
  });

  test('should successfully register a new user', async ({ page }) => {
    await page.goto('/signup');

    // Fill registration form using data-testid
    await page.getByTestId('firstname-input').fill(testFirstName);
    await page.getByTestId('lastname-input').fill(testLastName);
    await page.getByTestId('email-input').fill(testEmail);
    await page.getByTestId('password-input').fill(testPassword);

    // Fill confirm password (no data-testid, use ID)
    await page.locator('#confirmPassword').fill(testPassword);

    // Accept terms & conditions
    await page.locator('#terms').check();

    // Submit form
    await page.getByTestId('signup-submit-button').click();

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Should see dashboard elements
    await expect(page.getByText('Total Portfolio Value').first()).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with created account', async ({ page }) => {
    await page.goto('/login');

    // Fill login form using data-testid
    await page.getByTestId('email-input').fill(testEmail);
    await page.getByTestId('password-input').fill(testPassword);

    // Submit form and wait for navigation
    await Promise.all([
      page.waitForURL(/.*dashboard/, { timeout: 10000 }),
      page.getByTestId('login-submit-button').click()
    ]);

    // Should see dashboard elements
    await expect(page.getByText('Total Portfolio Value').first()).toBeVisible({ timeout: 5000 });
  });

  test('should persist authentication after page reload', async ({ page }) => {
    // First register a user for this test
    const uniqueEmail = `persist-test-${Date.now()}@coinsphere.com`;
    await page.goto('/signup');
    await page.getByTestId('firstname-input').fill(testFirstName);
    await page.getByTestId('lastname-input').fill(testLastName);
    await page.getByTestId('email-input').fill(uniqueEmail);
    await page.getByTestId('password-input').fill(testPassword);
    await page.locator('#confirmPassword').fill(testPassword);
    await page.locator('#terms').check();
    await page.getByTestId('signup-submit-button').click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Reload page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText('Total Portfolio Value').first()).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // First register a user for this test
    const uniqueEmail = `logout-test-${Date.now()}@coinsphere.com`;
    await page.goto('/signup');
    await page.getByTestId('firstname-input').fill(testFirstName);
    await page.getByTestId('lastname-input').fill(testLastName);
    await page.getByTestId('email-input').fill(uniqueEmail);
    await page.getByTestId('password-input').fill(testPassword);
    await page.locator('#confirmPassword').fill(testPassword);
    await page.locator('#terms').check();
    await page.getByTestId('signup-submit-button').click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Open user menu
    await page.getByTestId('user-menu-button').click();

    // Wait for dropdown to be visible
    await page.getByTestId('user-menu-dropdown').waitFor({ state: 'visible' });

    // Click logout button
    await page.getByTestId('logout-button').click();

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });

  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    // Clear local storage to ensure no auth
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });
});
