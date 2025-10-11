import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import crypto from 'crypto';
import { z } from 'zod';

const router = Router();

// PayFast Configuration (from Payfast.txt)
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || '25263515';
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || 'cyxcghcf5hsbl';
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || ''; // Optional passphrase for additional security
const PAYFAST_SANDBOX = process.env.PAYFAST_SANDBOX === 'true';
const PAYFAST_URL = PAYFAST_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';

// Plan pricing mapping (ZAR - South African Rand)
// Exchange rate: 1 USD ≈ 18 ZAR (as of 2025)
const PLAN_PRICING: Record<string, { amount: number; usdAmount: number; name: string; description: string }> = {
  'plus': {
    amount: 179.99, // ZAR (≈ $10 USD)
    usdAmount: 9.99,
    name: 'Plus Plan',
    description: 'Unlimited portfolios, real-time alerts, AI predictions',
  },
  'pro': {
    amount: 359.99, // ZAR (≈ $20 USD)
    usdAmount: 19.99,
    name: 'Pro Plan',
    description: 'Advanced AI, Degen Risk Scores, 1-year history, API access',
  },
  'power-trader': {
    amount: 899.99, // ZAR (≈ $50 USD)
    usdAmount: 49.99,
    name: 'Power Trader Plan',
    description: 'Real-time WebSocket, advanced analytics, unlimited API',
  },
};

/**
 * Generate PayFast signature for payment verification
 */
function generateSignature(data: Record<string, any>, passphrase: string = ''): string {
  // Create parameter string
  let pfOutput = '';
  for (const key in data) {
    if (data.hasOwnProperty(key) && data[key] !== '') {
      pfOutput += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, '+')}&`;
    }
  }

  // Remove last ampersand
  let getString = pfOutput.slice(0, -1);

  // Add passphrase if set
  if (passphrase !== '') {
    getString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }

  // Generate MD5 hash
  return crypto.createHash('md5').update(getString).digest('hex');
}

/**
 * POST /api/v1/payments/payfast/checkout
 * Create a PayFast payment request
 */
const checkoutSchema = z.object({
  plan: z.enum(['plus', 'pro', 'power-trader']),
  name_first: z.string().optional(),
  name_last: z.string().optional(),
});

router.post('/payfast/checkout', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { plan, name_first, name_last } = checkoutSchema.parse(req.body);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const planDetails = PLAN_PRICING[plan];
    if (!planDetails) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // Generate unique payment reference
    const paymentRef = `SUB-${userId.slice(0, 8)}-${Date.now()}`;

    // Calculate amount with VAT (15% in South Africa)
    const VAT_RATE = 0.15;
    const amountWithVAT = planDetails.amount * (1 + VAT_RATE);

    // Create payment data for PayFast
    const paymentData = {
      // Merchant details
      merchant_id: PAYFAST_MERCHANT_ID,
      merchant_key: PAYFAST_MERCHANT_KEY,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?payment=cancelled&plan=${plan}`,
      notify_url: `${process.env.APP_URL || 'http://localhost:3001'}/api/v1/payments/payfast/notify`,

      // Buyer details
      name_first: name_first || user.firstName || 'User',
      name_last: name_last || user.lastName || '',
      email_address: user.email,

      // Transaction details
      m_payment_id: paymentRef,
      amount: amountWithVAT.toFixed(2), // Amount including VAT
      item_name: planDetails.name,
      item_description: planDetails.description,

      // Subscription details
      subscription_type: '1', // 1 = Subscription
      billing_date: new Date().toISOString().split('T')[0],
      recurring_amount: amountWithVAT.toFixed(2), // Recurring amount with VAT
      frequency: '3', // 3 = Monthly
      cycles: '0', // 0 = Until cancelled
    };

    // Generate signature
    const signature = generateSignature(paymentData, PAYFAST_PASSPHRASE);

    // Store payment intent in database
    await prisma.paymentIntent.create({
      data: {
        userId,
        provider: 'payfast',
        referenceId: paymentRef,
        amount: amountWithVAT, // Store amount with VAT
        currency: 'ZAR',
        plan,
        status: 'pending',
        metadata: {
          planName: planDetails.name,
          email: user.email,
          baseAmount: planDetails.amount,
          vatRate: VAT_RATE,
          vatAmount: (planDetails.amount * VAT_RATE),
        },
      },
    });

    logger.info(`Created PayFast payment intent for user ${userId}, plan: ${plan}, ref: ${paymentRef}`);

    // Build PayFast payment URL with parameters
    const params = new URLSearchParams({
      ...paymentData,
      signature,
    });

    res.json({
      paymentUrl: `${PAYFAST_URL}?${params.toString()}`,
      paymentRef,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    logger.error('Error creating PayFast checkout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/payments/payfast/notify
 * PayFast ITN (Instant Transaction Notification) webhook
 */
router.post('/payfast/notify', async (req: Request, res: Response) => {
  try {
    const pfData = req.body;

    logger.info('Received PayFast ITN notification:', pfData);

    // Verify signature
    const signature = pfData.signature;
    delete pfData.signature;

    const calculatedSignature = generateSignature(pfData, PAYFAST_PASSPHRASE);

    if (signature !== calculatedSignature) {
      logger.error('Invalid PayFast signature');
      return res.status(400).send('Invalid signature');
    }

    // Verify payment status
    const paymentStatus = pfData.payment_status;
    const paymentRef = pfData.m_payment_id;

    // Find payment intent
    const paymentIntent = await prisma.paymentIntent.findFirst({
      where: { referenceId: paymentRef },
    });

    if (!paymentIntent) {
      logger.error(`Payment intent not found for ref: ${paymentRef}`);
      return res.status(404).send('Payment not found');
    }

    // Update payment status
    if (paymentStatus === 'COMPLETE') {
      await prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          metadata: {
            ...paymentIntent.metadata,
            pfPaymentId: pfData.pf_payment_id,
            paymentStatus: pfData.payment_status,
          },
        },
      });

      // Update user subscription
      await prisma.user.update({
        where: { id: paymentIntent.userId },
        data: {
          subscriptionTier: paymentIntent.plan,
          subscriptionStatus: 'active',
        },
      });

      logger.info(`Payment completed for user ${paymentIntent.userId}, plan: ${paymentIntent.plan}`);
    } else if (paymentStatus === 'CANCELLED') {
      await prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: { status: 'cancelled' },
      });

      logger.info(`Payment cancelled for ref: ${paymentRef}`);
    } else {
      logger.warn(`Unknown payment status: ${paymentStatus} for ref: ${paymentRef}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error processing PayFast notification:', error);
    res.status(500).send('Error processing notification');
  }
});

/**
 * GET /api/v1/payments/payfast/manage
 * Get PayFast subscription management URL
 */
router.get('/payfast/manage', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // In PayFast, users manage subscriptions through their account
    const managementUrl = PAYFAST_SANDBOX
      ? 'https://sandbox.payfast.co.za/eng/login'
      : 'https://www.payfast.co.za/eng/login';

    res.json({ managementUrl });
  } catch (error) {
    logger.error('Error getting PayFast management URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/payments/history
 * Get user payment history
 */
router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const payments = await prisma.paymentIntent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ payments });
  } catch (error) {
    logger.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
