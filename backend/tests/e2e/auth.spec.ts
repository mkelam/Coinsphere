import { test, expect } from '@playwright/test';
import { randomBytes } from 'crypto';

/**
 * E2E Tests: Authentication Flow
 *
 * Tests complete authentication workflows including:
 * - User registration
 * - Login with credentials
 * - Protected route access
 * - Token refresh
 * - Logout
 */

// Test data
let testEmail: string;
let testPassword: string;
let accessToken: string;
let refreshToken: string;
let userId: string;

test.describe('Authentication E2E Flow', () => {
  test.beforeAll(() => {
    // Generate unique test email to avoid conflicts
    const randomId = randomBytes(8).toString('hex');
    testEmail = `e2etest+${randomId}@coinsphere.com`;
    testPassword = 'SecureP@ssw0rd123!';
  });

  test('01. Health check - API is running', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  test('02. Register new user', async ({ request }) => {
    const response = await request.post('/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        firstName: 'E2E',
        lastName: 'Test',
      },
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testEmail);
    expect(data.user.firstName).toBe('E2E');
    expect(data.user.lastName).toBe('Test');
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
    expect(data.message).toContain('Registration successful');

    // Store tokens for later tests
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
    userId = data.user.id;
  });

  test('03. Duplicate registration should fail', async ({ request }) => {
    const response = await request.post('/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        firstName: 'Duplicate',
        lastName: 'User',
      },
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('already exists');
  });

  test('04. Login with correct credentials', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testEmail);
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();

    // Update tokens
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
  });

  test('05. Login with incorrect password should fail', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: {
        email: testEmail,
        password: 'WrongPassword123!',
      },
    });

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toContain('Invalid credentials');
  });

  test('06. Access protected route with valid token', async ({ request }) => {
    const response = await request.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe(userId);
    expect(data.user.email).toBe(testEmail);
  });

  test('07. Access protected route without token should fail', async ({ request }) => {
    const response = await request.get('/auth/me');

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toContain('unauthorized');
  });

  test('08. Access protected route with invalid token should fail', async ({ request }) => {
    const response = await request.get('/auth/me', {
      headers: {
        Authorization: 'Bearer invalid-token-12345',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('09. Refresh access token', async ({ request }) => {
    const response = await request.post('/auth/refresh', {
      data: {
        refreshToken,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();

    // Token should be different from the old one
    expect(data.accessToken).not.toBe(accessToken);

    // Update tokens
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
  });

  test('10. Update user profile', async ({ request }) => {
    const response = await request.put('/auth/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        firstName: 'E2E Updated',
        lastName: 'Test Updated',
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.user.firstName).toBe('E2E Updated');
    expect(data.user.lastName).toBe('Test Updated');
  });

  test('11. Logout - invalidate tokens', async ({ request }) => {
    const response = await request.post('/auth/logout', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.message).toContain('Logged out successfully');
  });

  test('12. Access protected route after logout should fail', async ({ request }) => {
    const response = await request.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Should fail because token was invalidated on logout
    expect(response.status()).toBe(401);
  });
});

test.describe('Password Management E2E Flow', () => {
  let userEmail: string;
  let userPassword: string;
  let userAccessToken: string;
  let resetToken: string;

  test.beforeAll(() => {
    const randomId = randomBytes(8).toString('hex');
    userEmail = `pwreset+${randomId}@coinsphere.com`;
    userPassword = 'InitialP@ssw0rd123!';
  });

  test('01. Register user for password tests', async ({ request }) => {
    const response = await request.post('/auth/register', {
      data: {
        email: userEmail,
        password: userPassword,
        firstName: 'Password',
        lastName: 'Test',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    userAccessToken = data.accessToken;
  });

  test('02. Change password with correct old password', async ({ request }) => {
    const newPassword = 'NewP@ssw0rd456!';

    const response = await request.post('/auth/change-password', {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
      data: {
        oldPassword: userPassword,
        newPassword,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.message).toContain('Password changed successfully');

    // Update password for future tests
    userPassword = newPassword;
  });

  test('03. Login with new password should work', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: {
        email: userEmail,
        password: userPassword,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.accessToken).toBeDefined();
  });

  test('04. Request password reset', async ({ request }) => {
    const response = await request.post('/auth/forgot-password', {
      data: {
        email: userEmail,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.message).toContain('Password reset email sent');

    // Note: In a real E2E test, you'd need to intercept the email
    // or query the database to get the reset token
    // For now, we're just testing the endpoint responds correctly
  });
});
