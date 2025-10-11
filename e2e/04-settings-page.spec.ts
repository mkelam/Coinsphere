import { test, expect } from '@playwright/test';

test.describe('Settings Page Features', () => {
  const timestamp = Date.now();
  const testEmail = `e2e-settings-${timestamp}@coinsphere.com`;
  const testPassword = 'TestPassword123!';
  const testFirstName = 'Settings';
  const testLastName = 'Tester';

  // Create user once before all tests
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/signup');
    await page.getByTestId('firstname-input').fill(testFirstName);
    await page.getByTestId('lastname-input').fill(testLastName);
    await page.getByTestId('email-input').fill(testEmail);
    await page.getByTestId('password-input').fill(testPassword);
    await page.locator('#confirmPassword').fill(testPassword);
    await page.locator('#terms').check();
    await page.getByTestId('signup-submit-button').click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByTestId('email-input').fill(testEmail);
    await page.getByTestId('password-input').fill(testPassword);
    await page.getByTestId('login-submit-button').click();

    // Wait for navigation to dashboard and ensure we're logged in
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });

    // Wait a moment for authentication to settle
    await page.waitForTimeout(500);

    // Navigate to settings page via user menu
    // Click user menu button
    await page.getByTestId('user-menu-button').click();

    // Wait for dropdown to appear
    await expect(page.getByTestId('user-menu-dropdown')).toBeVisible();

    // Click settings button
    await page.getByTestId('settings-button').click();

    // Wait for settings page to load
    await expect(page).toHaveURL(/.*settings/, { timeout: 5000 });
  });

  test('should display settings page with all sections', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();

    // Check all card sections are visible
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Notification Settings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Account Information' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Danger Zone' })).toBeVisible();
  });

  test('should display user profile information', async ({ page }) => {
    // Check profile fields are populated
    const firstNameInput = page.locator('#firstName');
    const lastNameInput = page.locator('#lastName');
    const emailInput = page.locator('#email');

    await expect(firstNameInput).toHaveValue(testFirstName);
    await expect(lastNameInput).toHaveValue(testLastName);
    await expect(emailInput).toHaveValue(testEmail);
  });

  test('should update profile information successfully', async ({ page }) => {
    // Update profile fields
    const newFirstName = 'UpdatedFirst';
    const newLastName = 'UpdatedLast';

    await page.locator('#firstName').clear();
    await page.locator('#firstName').fill(newFirstName);
    await page.locator('#lastName').clear();
    await page.locator('#lastName').fill(newLastName);

    // Click Save Changes button in Profile Settings section
    const profileCard = page.locator('text=Profile Settings').locator('..').locator('..');
    await profileCard.getByRole('button', { name: /save changes/i }).click();

    // Wait for success message
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 5000 });

    // Verify values are still updated after form submission
    await expect(page.locator('#firstName')).toHaveValue(newFirstName);
    await expect(page.locator('#lastName')).toHaveValue(newLastName);
  });

  test('should validate email format in profile update', async ({ page }) => {
    // Try to update with invalid email
    await page.locator('#email').clear();
    await page.locator('#email').fill('invalid-email');

    const profileCard = page.locator('text=Profile Settings').locator('..').locator('..');
    await profileCard.getByRole('button', { name: /save changes/i }).click();

    // HTML5 validation should prevent submission
    const emailInput = page.locator('#email');
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should show password mismatch error', async ({ page }) => {
    // Fill password fields with mismatched passwords
    await page.locator('#currentPassword').fill('OldPassword123!');
    await page.locator('#newPassword').fill('NewPassword123!');
    await page.locator('#confirmPassword').fill('DifferentPassword123!');

    // Click Change Password button
    const passwordCard = page.locator('text=Change Password').locator('..').locator('..');
    await passwordCard.getByRole('button', { name: /change password/i }).click();

    // Check for error message
    await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: 5000 });
  });

  test('should validate password minimum length', async ({ page }) => {
    // Fill password fields with short password
    await page.locator('#currentPassword').fill('OldPassword123!');
    await page.locator('#newPassword').fill('Short1!');
    await page.locator('#confirmPassword').fill('Short1!');

    // Click Change Password button
    const passwordCard = page.locator('text=Change Password').locator('..').locator('..');
    await passwordCard.getByRole('button', { name: /change password/i }).click();

    // Check for error message
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible({ timeout: 5000 });
  });

  test('should change password successfully with valid inputs', async ({ page }) => {
    // Fill password fields correctly
    await page.locator('#currentPassword').fill(testPassword);
    await page.locator('#newPassword').fill('NewTestPassword123!');
    await page.locator('#confirmPassword').fill('NewTestPassword123!');

    // Click Change Password button
    const passwordCard = page.locator('text=Change Password').locator('..').locator('..');
    await passwordCard.getByRole('button', { name: /change password/i }).click();

    // Check for success message
    await expect(page.getByText(/password changed successfully/i)).toBeVisible({ timeout: 5000 });

    // Verify fields are cleared after successful change
    await expect(page.locator('#currentPassword')).toHaveValue('');
    await expect(page.locator('#newPassword')).toHaveValue('');
    await expect(page.locator('#confirmPassword')).toHaveValue('');
  });

  test('should toggle notification preferences', async ({ page }) => {
    // Find notification switches
    const emailNotificationSwitch = page.locator('#email-notifications');
    const priceAlertsSwitch = page.locator('#price-alerts');
    const portfolioUpdatesSwitch = page.locator('#portfolio-updates');

    // Check initial states (should all be on by default)
    await expect(emailNotificationSwitch).toBeChecked();
    await expect(priceAlertsSwitch).toBeChecked();
    await expect(portfolioUpdatesSwitch).toBeChecked();

    // Toggle email notifications off
    await emailNotificationSwitch.click();
    await expect(emailNotificationSwitch).not.toBeChecked();

    // Toggle email notifications back on
    await emailNotificationSwitch.click();
    await expect(emailNotificationSwitch).toBeChecked();

    // Toggle all switches off
    await priceAlertsSwitch.click();
    await portfolioUpdatesSwitch.click();

    await expect(priceAlertsSwitch).not.toBeChecked();
    await expect(portfolioUpdatesSwitch).not.toBeChecked();
  });

  test('should display account information', async ({ page }) => {
    // Check account information is displayed
    await expect(page.getByText('Account Created')).toBeVisible();
    await expect(page.getByText('Subscription Tier')).toBeVisible();
    await expect(page.getByText('Account ID')).toBeVisible();

    // Verify subscription tier shows 'free'
    const subscriptionTier = page.locator('text=Subscription Tier').locator('..').getByText(/free/i);
    await expect(subscriptionTier).toBeVisible();
  });

  test('should display danger zone with delete account button', async ({ page }) => {
    // Check danger zone section
    await expect(page.getByRole('heading', { name: 'Danger Zone' })).toBeVisible();

    // Check delete account button exists and is disabled
    const deleteButton = page.getByRole('button', { name: /delete account/i });
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toBeDisabled();

    // Check safety message
    await expect(page.getByText(/this action is permanently disabled for safety/i)).toBeVisible();
  });

  test('should show loading states during form submissions', async ({ page }) => {
    // Test profile update loading state
    await page.locator('#firstName').clear();
    await page.locator('#firstName').fill('LoadingTest');

    const profileCard = page.locator('text=Profile Settings').locator('..').locator('..');
    const saveButton = profileCard.getByRole('button', { name: /save changes/i });

    // Click and check for loading text
    await saveButton.click();
    await expect(saveButton).toHaveText(/saving/i);

    // Wait for completion
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 5000 });
    await expect(saveButton).toHaveText(/save changes/i);
  });

  test('should maintain form state after navigation', async ({ page }) => {
    // Update some fields
    const newFirstName = 'NavigationTest';
    await page.locator('#firstName').clear();
    await page.locator('#firstName').fill(newFirstName);

    // Navigate away
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate back to settings
    await page.goto('/settings');
    await expect(page).toHaveURL(/.*settings/);

    // Check if original value is restored (form should reset)
    await expect(page.locator('#firstName')).toHaveValue(testFirstName);
  });

  test('should handle rapid notification toggle clicks', async ({ page }) => {
    const emailNotificationSwitch = page.locator('#email-notifications');

    // Rapid toggle test
    for (let i = 0; i < 5; i++) {
      await emailNotificationSwitch.click({ force: true });
      await page.waitForTimeout(100);
    }

    // Final state should be stable (off, since we started with on and clicked 5 times)
    await expect(emailNotificationSwitch).not.toBeChecked();
  });

  test('should display responsive layout on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Check all sections are still visible
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible();

    // Check form fields are accessible
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();

    // Scroll to bottom section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole('heading', { name: 'Danger Zone' })).toBeVisible();
  });
});
