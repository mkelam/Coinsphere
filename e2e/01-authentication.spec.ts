import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testEmail = `e2e-test-${Date.now()}@coinsphere.com`;
  const testPassword = 'TestPassword123!';
  const testFirstName = 'E2E';
  const testLastName = 'Test';

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Coinsphere|CryptoSense/);
    await expect(page.getByRole('heading', { name: /sign in|log in/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill('invalid-email');
    await page.getByPlaceholder(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Should see error message
    await expect(page.getByText(/invalid|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /sign up|create account/i }).click();
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.getByRole('heading', { name: /sign up|create account/i })).toBeVisible();
  });

  test('should successfully register a new user', async ({ page }) => {
    await page.goto('/signup');

    // Fill registration form
    await page.getByPlaceholder(/email/i).fill(testEmail);
    await page.getByPlaceholder(/password/i).first().fill(testPassword);
    await page.getByPlaceholder(/first.*name/i).fill(testFirstName);
    await page.getByPlaceholder(/last.*name/i).fill(testLastName);

    // Submit form
    await page.getByRole('button', { name: /sign up|create account|register/i }).click();

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Should see dashboard elements
    await expect(page.getByText(/portfolio|total value/i)).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with created account', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.getByPlaceholder(/email/i).fill(testEmail);
    await page.getByPlaceholder(/password/i).fill(testPassword);

    // Submit form
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Should see dashboard elements
    await expect(page.getByText(/portfolio|total value/i)).toBeVisible({ timeout: 5000 });
  });

  test('should persist authentication after page reload', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill(testEmail);
    await page.getByPlaceholder(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Reload page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/portfolio|total value/i)).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill(testEmail);
    await page.getByPlaceholder(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Logout
    await page.getByRole('button', { name: /logout|sign out/i }).click();

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
