import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Direct exports for convenience
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret || secret === 'change-this-in-production') {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('FATAL: JWT_SECRET not set or using default value in production');
        }
        console.warn('⚠️  WARNING: Using default JWT_SECRET in development - NOT FOR PRODUCTION');
        return 'change-this-in-production';
      }
      if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters');
      }
      return secret;
    })(),
    refreshSecret: (() => {
      const secret = process.env.JWT_REFRESH_SECRET;
      if (!secret || secret.includes('change-this')) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('FATAL: JWT_REFRESH_SECRET not set or using default value in production');
        }
        console.warn('⚠️  WARNING: Using default JWT_REFRESH_SECRET in development - NOT FOR PRODUCTION');
        return 'change-this-refresh-secret-in-production';
      }
      if (secret.length < 32) {
        throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
      }
      return secret;
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },

  api: {
    coingecko: process.env.COINGECKO_API_KEY || '',
    cryptocompare: process.env.CRYPTOCOMPARE_API_KEY || '',
    lunarcrush: process.env.LUNARCRUSH_API_KEY || '',
    sendgrid: process.env.SENDGRID_API_KEY || '',
  },

  payfast: {
    merchantId: process.env.PAYFAST_MERCHANT_ID || '25263515',
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || 'cyxcghcf5hsbl',
    passphrase: process.env.PAYFAST_PASSPHRASE || '',
    sandbox: process.env.PAYFAST_SANDBOX === 'true',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '"CryptoSense" <noreply@cryptosense.io>',
  },

  email: {
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    fromEmail: process.env.SMTP_FROM || '"Coinsphere" <noreply@coinsphere.io>',
  },

  twoFactorEncryptionKey: (() => {
    const key = process.env.TWO_FACTOR_ENCRYPTION_KEY;
    if (!key) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: TWO_FACTOR_ENCRYPTION_KEY not set in production');
      }
      console.warn('⚠️  WARNING: Using default 2FA encryption key in development - NOT FOR PRODUCTION');
      // Generate a random key for development
      return Buffer.from(Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))).toString('hex');
    }
    if (Buffer.from(key, 'hex').length !== 32) {
      throw new Error('TWO_FACTOR_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
    return key;
  })(),
};
