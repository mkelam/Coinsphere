import { test, expect } from '@playwright/test';
import { randomBytes } from 'crypto';

/**
 * Simplified E2E Tests: Authentication Flow
 *
 * Testing with full URLs to ensure correct endpoint access
 */

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/v1`;

let testEmail: string;
let testPassword: string;
let accessToken: string;
let refreshToken: string;

test.describe('Simplified Authentication E2E Flow', () => {
  test.beforeAll(() => {
    const randomId = randomBytes(8).toString('hex');
    testEmail = `simplified+${randomId}@coinsphere.com`;
    testPassword = 'SecureP@ssw0rd123!';
  });

  test('01. Health check', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/health`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('02. Register new user', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    });

    console.log('Register response status:', response.status());
    console.log('Register response body:', await response.text());

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.accessToken).toBeDefined();

    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
  });

  test('03. Login', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.accessToken).toBeDefined();

    accessToken = data.accessToken;
  });

  test('04. Access protected route', async ({ request }) => {
    const response = await request.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.user.email).toBe(testEmail);
  });
});
