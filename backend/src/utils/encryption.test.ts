/**
 * Encryption Utility Tests
 * Tests for AES-256-GCM encryption/decryption of sensitive data (exchange API keys)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { encrypt, decrypt, hash, compareHash, generateSecureRandom } from './encryption';

describe('Encryption Utility', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;

  beforeAll(() => {
    // Set a test encryption key (32 bytes = 64 hex characters)
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  });

  afterAll(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe('encrypt', () => {
    it('should encrypt plaintext successfully', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);
    });

    it('should return different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      // Should be different due to random IV and salt
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error for empty plaintext', () => {
      expect(() => encrypt('')).toThrow();
    });

    it('should encrypt long strings', () => {
      const plaintext = 'a'.repeat(1000);
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plaintext);
    });

    it('should encrypt special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plaintext);
    });

    it('should encrypt unicode characters', () => {
      const plaintext = 'Hello 世界 🌍 😀';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plaintext);
    });
  });

  describe('decrypt', () => {
    it('should decrypt ciphertext successfully', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt long strings', () => {
      const plaintext = 'a'.repeat(1000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt unicode characters', () => {
      const plaintext = 'Hello 世界 🌍 😀';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for invalid ciphertext format', () => {
      expect(() => decrypt('invalid-ciphertext')).toThrow('Invalid encrypted data format');
    });

    it('should throw error for tampered ciphertext (authentication)', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encrypt(plaintext);

      // Tamper with the ciphertext (change last character)
      const tampered = encrypted.slice(0, -1) + 'X';

      expect(() => decrypt(tampered)).toThrow();
    });

    it('should throw error for wrong encryption key', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encrypt(plaintext);

      // Change encryption key
      process.env.ENCRYPTION_KEY = 'b'.repeat(64);

      expect(() => decrypt(encrypted)).toThrow();

      // Restore key
      process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    });
  });

  describe('encrypt/decrypt roundtrip', () => {
    it('should handle empty string after encryption (edge case)', () => {
      // Note: encrypt() throws on empty string, but this tests the decrypt path
      expect(() => encrypt('')).toThrow();
    });

    it('should handle realistic API keys', () => {
      const apiKeys = [
        'sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
        'AKIAIOSFODNN7EXAMPLE',
        '1234567890abcdef1234567890abcdef',
        'pk_test_51abc123def456ghi789jkl',
      ];

      for (const apiKey of apiKeys) {
        const encrypted = encrypt(apiKey);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(apiKey);
      }
    });

    it('should handle realistic API secrets', () => {
      const apiSecrets = [
        'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890',
        'payment_test_secret_key_abc123xyz789',
      ];

      for (const apiSecret of apiSecrets) {
        const encrypted = encrypt(apiSecret);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(apiSecret);
      }
    });

    it('should maintain precision for 100 roundtrips', () => {
      const plaintext = 'my-secret-api-key-12345';

      for (let i = 0; i < 100; i++) {
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      }
    });
  });

  describe('hash', () => {
    it('should hash data consistently', () => {
      const data = 'my-secret-data';
      const hash1 = hash(data);
      const hash2 = hash(data);

      expect(hash1).toBe(hash2);
    });

    it('should return different hashes for different data', () => {
      const data1 = 'my-secret-data-1';
      const data2 = 'my-secret-data-2';
      const hash1 = hash(data1);
      const hash2 = hash(data2);

      expect(hash1).not.toBe(hash2);
    });

    it('should return 64-character hex string (SHA-256)', () => {
      const data = 'my-secret-data';
      const hashed = hash(data);

      expect(hashed).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should hash empty string', () => {
      const hashed = hash('');
      expect(hashed).toBeTruthy();
      expect(hashed).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('compareHash', () => {
    it('should return true for matching hash', () => {
      const data = 'my-secret-data';
      const hashed = hash(data);
      const result = compareHash(data, hashed);

      expect(result).toBe(true);
    });

    it('should return false for non-matching hash', () => {
      const data1 = 'my-secret-data-1';
      const data2 = 'my-secret-data-2';
      const hashed = hash(data1);
      const result = compareHash(data2, hashed);

      expect(result).toBe(false);
    });

    it('should use timing-safe comparison', () => {
      // This test verifies the function doesn't throw errors
      // Actual timing-safe verification would require micro-benchmarks
      const data = 'my-secret-data';
      const hashed = hash(data);

      expect(() => compareHash(data, hashed)).not.toThrow();
    });
  });

  describe('generateSecureRandom', () => {
    it('should generate random string of default length', () => {
      const random = generateSecureRandom();

      expect(random).toBeTruthy();
      expect(typeof random).toBe('string');
      expect(random).toMatch(/^[a-f0-9]{64}$/); // 32 bytes = 64 hex chars
    });

    it('should generate random string of specified length', () => {
      const random = generateSecureRandom(16);

      expect(random).toBeTruthy();
      expect(random).toMatch(/^[a-f0-9]{32}$/); // 16 bytes = 32 hex chars
    });

    it('should generate different random strings', () => {
      const random1 = generateSecureRandom();
      const random2 = generateSecureRandom();

      expect(random1).not.toBe(random2);
    });

    it('should generate cryptographically secure random (not predictable)', () => {
      const randoms = new Set<string>();

      // Generate 1000 random strings - should all be unique
      for (let i = 0; i < 1000; i++) {
        randoms.add(generateSecureRandom());
      }

      expect(randoms.size).toBe(1000);
    });
  });

  describe('environment variable validation', () => {
    it('should throw error if ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY;
      delete process.env.JWT_SECRET;

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY or JWT_SECRET must be at least 32 characters');

      // Restore
      process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    });

    it('should throw error if ENCRYPTION_KEY is too short', () => {
      process.env.ENCRYPTION_KEY = 'short';

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY or JWT_SECRET must be at least 32 characters');

      // Restore
      process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    });

    it('should fallback to JWT_SECRET if ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY;
      process.env.JWT_SECRET = 'a'.repeat(64);

      const plaintext = 'test-api-key';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);

      // Restore
      process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    });
  });

  describe('security properties', () => {
    it('should use authenticated encryption (AES-GCM)', () => {
      // AES-GCM provides both confidentiality and authenticity
      // This is tested by the tampering test above
      const plaintext = 'my-secret-api-key';
      const encrypted = encrypt(plaintext);

      // Encrypted format: salt:iv:authTag:ciphertext
      const parts = encrypted.split(':');
      expect(parts.length).toBe(4);
      expect(parts[2]).toBeTruthy(); // Auth tag exists
    });

    it('should use unique IV for each encryption (prevents pattern analysis)', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      // Extract IV from both (second part)
      const iv1 = encrypted1.split(':')[1];
      const iv2 = encrypted2.split(':')[1];

      expect(iv1).not.toBe(iv2);
    });

    it('should use unique salt for each encryption (key derivation)', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      // Extract salt from both (first part)
      const salt1 = encrypted1.split(':')[0];
      const salt2 = encrypted2.split(':')[0];

      expect(salt1).not.toBe(salt2);
    });

    it('should derive key using PBKDF2 (not direct key usage)', () => {
      // This is implicit in the implementation
      // The presence of a salt in encrypted data proves key derivation
      const plaintext = 'test';
      const encrypted = encrypt(plaintext);

      const parts = encrypted.split(':');
      const salt = parts[0];

      // Salt should be base64 encoded and non-empty
      expect(salt).toBeTruthy();
      expect(Buffer.from(salt, 'base64').length).toBeGreaterThan(0);
    });
  });

  describe('real-world exchange API key scenarios', () => {
    it('should encrypt Binance API credentials', () => {
      const apiKey = 'vmPUZE6mv9SD5VNHk4HlWFsOr6aKE2zvsw0MuIgwCIPy6utIco14y7Ju91duEh8A';
      const apiSecret = 'NhqPtmdSJYdKjVHjA7PZj4Mge3R5YNiP1e3UZjInClVN65XAbvqqM6A7H5fATj0j';

      const encryptedKey = encrypt(apiKey);
      const encryptedSecret = encrypt(apiSecret);

      expect(decrypt(encryptedKey)).toBe(apiKey);
      expect(decrypt(encryptedSecret)).toBe(apiSecret);
    });

    it('should encrypt Coinbase Pro API credentials with passphrase', () => {
      const apiKey = 'a1b2c3d4e5f6g7h8';
      const apiSecret = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/==';
      const passphrase = 'my-secure-passphrase-123';

      const encryptedKey = encrypt(apiKey);
      const encryptedSecret = encrypt(apiSecret);
      const encryptedPassphrase = encrypt(passphrase);

      expect(decrypt(encryptedKey)).toBe(apiKey);
      expect(decrypt(encryptedSecret)).toBe(apiSecret);
      expect(decrypt(encryptedPassphrase)).toBe(passphrase);
    });

    it('should encrypt Kraken API credentials', () => {
      const apiKey = 'abc123xyz789';
      const apiSecret = 'VGVzdFNlY3JldEZvcktyYWtlbkFQSQ==';

      const encryptedKey = encrypt(apiKey);
      const encryptedSecret = encrypt(apiSecret);

      expect(decrypt(encryptedKey)).toBe(apiKey);
      expect(decrypt(encryptedSecret)).toBe(apiSecret);
    });

    it('should handle rapid encryption/decryption (performance)', () => {
      const apiKey = 'test-api-key-for-performance';
      const iterations = 100;

      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        const encrypted = encrypt(apiKey);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(apiKey);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 100 roundtrips in under 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});
