import { APIRequestContext } from '@playwright/test';

export interface AuthContext {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  userId: string;
  email: string;
}

/**
 * Get authenticated context with both JWT and CSRF tokens
 * This is required for all protected API endpoints
 */
export async function getAuthenticatedContext(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<AuthContext> {
  // 1. Login to get access token
  const loginResponse = await request.post('http://localhost:3001/api/v1/auth/login', {
    data: { email, password },
  });

  if (!loginResponse.ok()) {
    const error = await loginResponse.json();
    throw new Error(`Login failed: ${JSON.stringify(error)}`);
  }

  const loginData = await loginResponse.json();
  const { accessToken, refreshToken, user } = loginData;

  // 2. Get CSRF token (requires authentication)
  const csrfResponse = await request.get('http://localhost:3001/api/v1/csrf-token', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!csrfResponse.ok()) {
    const error = await csrfResponse.json();
    throw new Error(`CSRF token fetch failed: ${JSON.stringify(error)}`);
  }

  const csrfData = await csrfResponse.json();
  const { csrfToken } = csrfData;

  return {
    accessToken,
    refreshToken,
    csrfToken,
    userId: user.id,
    email: user.email,
  };
}

/**
 * Get headers for authenticated requests
 * Includes both JWT and CSRF tokens
 */
export function getAuthHeaders(ctx: AuthContext) {
  return {
    Authorization: `Bearer ${ctx.accessToken}`,
    'X-CSRF-Token': ctx.csrfToken,
  };
}

/**
 * Create a test user for E2E tests
 * Returns auth context for the new user
 */
export async function createTestUser(
  request: APIRequestContext,
  emailPrefix: string = 'test'
): Promise<AuthContext> {
  const email = `${emailPrefix}-${Date.now()}@coinsphere.com`;
  const password = 'TestPassword123!';

  const registerResponse = await request.post('http://localhost:3001/api/v1/auth/register', {
    data: {
      email,
      password,
      firstName: 'Test',
      lastName: 'User',
    },
  });

  if (!registerResponse.ok()) {
    const error = await registerResponse.json();
    throw new Error(`User registration failed: ${JSON.stringify(error)}`);
  }

  // Registration returns tokens, but we still need to get CSRF token
  return getAuthenticatedContext(request, email, password);
}

/**
 * Cleanup test user (optional - for tests that want to clean up)
 */
export async function deleteTestUser(
  request: APIRequestContext,
  ctx: AuthContext
): Promise<void> {
  try {
    await request.delete(`http://localhost:3001/api/v1/users/${ctx.userId}`, {
      headers: getAuthHeaders(ctx),
    });
  } catch (error) {
    console.warn(`Failed to delete test user ${ctx.email}:`, error);
  }
}
