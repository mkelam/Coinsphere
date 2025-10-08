import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Encryption for TOTP secrets in database
const ENCRYPTION_KEY = Buffer.from(config.twoFactorEncryptionKey || crypto.randomBytes(32).toString('hex'), 'hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

class TwoFactorService {
  /**
   * Generate a new TOTP secret for a user
   */
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * Generate QR code data URL for user to scan with authenticator app
   */
  async generateQRCode(email: string, secret: string): Promise<string> {
    const appName = 'Coinsphere';
    const otpauth = authenticator.keyuri(email, appName, secret);

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
      return qrCodeDataUrl;
    } catch (error) {
      logger.error('Failed to generate QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify a TOTP token against a secret
   */
  verifyToken(token: string, secret: string): boolean {
    try {
      // Remove spaces and ensure 6-digit format
      const cleanToken = token.replace(/\s/g, '');

      // Verify with window of 1 (allows for 30s time drift)
      const isValid = authenticator.verify({
        token: cleanToken,
        secret,
      });

      return isValid;
    } catch (error) {
      logger.error('Failed to verify TOTP token:', error);
      return false;
    }
  }

  /**
   * Encrypt TOTP secret before storing in database
   */
  encryptSecret(secret: string): string {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

      let encrypted = cipher.update(secret, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:encryptedData
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      logger.error('Failed to encrypt secret:', error);
      throw new Error('Failed to encrypt secret');
    }
  }

  /**
   * Decrypt TOTP secret from database
   */
  decryptSecret(encryptedSecret: string): string {
    try {
      const parts = encryptedSecret.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted secret format');
      }

      const [ivHex, authTagHex, encryptedData] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Failed to decrypt secret:', error);
      throw new Error('Failed to decrypt secret');
    }
  }

  /**
   * Generate backup codes for account recovery
   * Returns an array of 10 one-time use backup codes
   */
  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}

export const twoFactorService = new TwoFactorService();
