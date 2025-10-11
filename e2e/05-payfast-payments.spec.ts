import { test, expect } from '@playwright/test';
import crypto from 'crypto';

// Helper function to get CSRF token
async function getCsrfToken(request: any, token: string): Promise<string> {
  const response = await request.get('http://localhost:3001/api/v1/csrf-token', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok()) {
    throw new Error('Failed to fetch CSRF token');
  }
  const data = await response.json();
  return data.csrfToken;
}

// Helper to generate PayFast signature (matches backend implementation)
function generatePayFastSignature(data: Record<string, any>, passphrase: string = ''): string {
  let pfOutput = '';
  for (const key in data) {
    if (data.hasOwnProperty(key) && data[key] !== '') {
      pfOutput += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, '+')}&`;
    }
  }

  let getString = pfOutput.slice(0, -1);

  if (passphrase !== '') {
    getString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }

  return crypto.createHash('md5').update(getString).digest('hex');
}

test.describe('PayFast Payment Integration E2E Tests', () => {
  const apiBase = 'http://localhost:3001/api/v1';
  let authToken: string;
  let userId: string;
  let paymentRef: string;

  test.beforeAll(async ({ request }) => {
    // Register a test user
    const email = `payfast-test-${Date.now()}@coinsphere.com`;
    const password = 'PayFast123!';

    const response = await request.post(`${apiBase}/auth/register`, {
      data: {
        email,
        password,
        firstName: 'PayFast',
        lastName: 'TestUser',
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    authToken = data.accessToken;
    userId = data.user.id;
  });

  test('should return 401 for unauthenticated checkout request', async ({ request }) => {
    const response = await request.post(`${apiBase}/payments/payfast/checkout`, {
      data: {
        plan: 'plus',
        name_first: 'John',
        name_last: 'Doe',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should create PayFast checkout for Plus plan', async ({ request }) => {
    const response = await request.post(`${apiBase}/payments/payfast/checkout`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        plan: 'plus',
        name_first: 'John',
        name_last: 'Doe',
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('paymentUrl');
    expect(data).toHaveProperty('paymentRef');

    // Verify payment URL structure
    expect(data.paymentUrl).toContain('https://www.payfast.co.za/eng/process');
    expect(data.paymentUrl).toContain('merchant_id=25263515');
    expect(data.paymentUrl).toContain('amount=');
    expect(data.paymentUrl).toContain('item_name=Plus+Plan');

    // Store payment reference for later tests
    paymentRef = data.paymentRef;

    // Verify URL includes subscription parameters
    expect(data.paymentUrl).toContain('subscription_type=1');
    expect(data.paymentUrl).toContain('frequency=3'); // Monthly
    expect(data.paymentUrl).toContain('cycles=0'); // Unlimited

    // Verify signature is present
    expect(data.paymentUrl).toContain('signature=');
  });

  test('should create PayFast checkout for Pro plan', async ({ request }) => {
    const response = await request.post(`${apiBase}/payments/payfast/checkout`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        plan: 'pro',
        name_first: 'Jane',
        name_last: 'Smith',
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('paymentUrl');
    expect(data.paymentUrl).toContain('item_name=Pro+Plan');

    // Pro plan pricing check (R359.99 + 15% VAT = R413.99)
    const url = new URL(data.paymentUrl);
    const amount = url.searchParams.get('amount');
    expect(parseFloat(amount || '0')).toBeCloseTo(413.99, 2);
  });

  test('should create PayFast checkout for Power Trader plan', async ({ request }) => {
    const response = await request.post(`${apiBase}/payments/payfast/checkout`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        plan: 'power-trader',
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.paymentUrl).toContain('item_name=Power+Trader+Plan');

    // Power Trader pricing check (R899.99 + 15% VAT = R1034.99)
    const url = new URL(data.paymentUrl);
    const amount = url.searchParams.get('amount');
    expect(parseFloat(amount || '0')).toBeCloseTo(1034.99, 2);
  });

  test('should reject invalid plan', async ({ request }) => {
    const response = await request.post(`${apiBase}/payments/payfast/checkout`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        plan: 'invalid-plan',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should handle PayFast ITN webhook - successful payment', async ({ request }) => {
    // Simulate PayFast ITN (Instant Transaction Notification)
    const itnData = {
      m_payment_id: paymentRef || `SUB-${userId.slice(0, 8)}-${Date.now()}`,
      pf_payment_id: '12345678',
      payment_status: 'COMPLETE',
      item_name: 'Plus Plan',
      amount_gross: '206.99',
      amount_fee: '-4.99',
      amount_net: '202.00',
      merchant_id: '25263515',
      merchant_key: 'cyxcghcf5hsbl',
    };

    // Generate signature
    const signature = generatePayFastSignature(itnData);

    const response = await request.post(`${apiBase}/payments/payfast/notify`, {
      data: {
        ...itnData,
        signature,
      },
    });

    expect(response.ok()).toBeTruthy();
  });

  test('should reject ITN with invalid signature', async ({ request }) => {
    const itnData = {
      m_payment_id: `SUB-test-${Date.now()}`,
      pf_payment_id: '87654321',
      payment_status: 'COMPLETE',
      item_name: 'Plus Plan',
      amount_gross: '206.99',
      merchant_id: '25263515',
      merchant_key: 'cyxcghcf5hsbl',
      signature: 'invalid-signature-12345',
    };

    const response = await request.post(`${apiBase}/payments/payfast/notify`, {
      data: itnData,
    });

    expect(response.status()).toBe(400);
  });

  test('should handle cancelled payment notification', async ({ request }) => {
    // First create a payment intent
    const checkoutResponse = await request.post(`${apiBase}/payments/payfast/checkout`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        plan: 'plus',
      },
    });

    expect(checkoutResponse.ok()).toBeTruthy();
    const checkoutData = await checkoutResponse.json();
    const cancelledPaymentRef = checkoutData.paymentRef;

    // Now send cancellation notification
    const itnData = {
      m_payment_id: cancelledPaymentRef,
      pf_payment_id: '99999999',
      payment_status: 'CANCELLED',
      item_name: 'Plus Plan',
      merchant_id: '25263515',
      merchant_key: 'cyxcghcf5hsbl',
    };

    const signature = generatePayFastSignature(itnData);

    const response = await request.post(`${apiBase}/payments/payfast/notify`, {
      data: {
        ...itnData,
        signature,
      },
    });

    expect(response.ok()).toBeTruthy();
  });

  test('should get PayFast management URL', async ({ request }) => {
    const response = await request.get(`${apiBase}/payments/payfast/manage`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('managementUrl');
    // In production mode, should return live PayFast URL
    expect(data.managementUrl).toContain('payfast.co.za');
  });

  test('should retrieve payment history', async ({ request }) => {
    const response = await request.get(`${apiBase}/payments/history`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('payments');
    expect(Array.isArray(data.payments)).toBeTruthy();
  });

  test('should return 401 for payment history without auth', async ({ request }) => {
    const response = await request.get(`${apiBase}/payments/history`);
    expect(response.status()).toBe(401);
  });

  test('should validate VAT calculation (15% South Africa)', async ({ request }) => {
    const response = await request.post(`${apiBase}/payments/payfast/checkout`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        plan: 'plus',
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    const url = new URL(data.paymentUrl);
    const amount = parseFloat(url.searchParams.get('amount') || '0');

    // Plus plan: R179.99 * 1.15 = R206.9885 ≈ R206.99
    expect(amount).toBeCloseTo(206.99, 2);
  });

  test('should verify production PayFast URL is used', async ({ request }) => {
    const response = await request.post(`${apiBase}/payments/payfast/checkout`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        plan: 'plus',
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Should use production URL, not sandbox
    expect(data.paymentUrl).toContain('https://www.payfast.co.za/eng/process');
    expect(data.paymentUrl).not.toContain('sandbox.payfast.co.za');
  });

  test('should include correct return and cancel URLs', async ({ request }) => {
    const response = await request.post(`${apiBase}/payments/payfast/checkout`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        plan: 'pro',
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    const url = new URL(data.paymentUrl);

    const returnUrl = url.searchParams.get('return_url');
    const cancelUrl = url.searchParams.get('cancel_url');
    const notifyUrl = url.searchParams.get('notify_url');

    expect(returnUrl).toContain('payment=success');
    expect(cancelUrl).toContain('payment=cancelled');
    expect(notifyUrl).toContain('/api/v1/payments/payfast/notify');
  });

  test('should create unique payment references', async ({ request }) => {
    const response1 = await request.post(`${apiBase}/payments/payfast/checkout`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: { plan: 'plus' },
    });

    const response2 = await request.post(`${apiBase}/payments/payfast/checkout`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: { plan: 'plus' },
    });

    expect(response1.ok()).toBeTruthy();
    expect(response2.ok()).toBeTruthy();

    const data1 = await response1.json();
    const data2 = await response2.json();

    // Payment references should be unique
    expect(data1.paymentRef).not.toBe(data2.paymentRef);
  });
});
