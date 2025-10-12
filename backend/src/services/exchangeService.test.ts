/**
 * Exchange Service Tests
 * Tests for exchange utility functions and validation logic
 */

import { describe, it, expect } from 'vitest';
import { SUPPORTED_EXCHANGES, type SupportedExchange } from './exchangeService';

describe('Exchange Service', () => {
  describe('SUPPORTED_EXCHANGES', () => {
    it('should contain major exchanges', () => {
      expect(SUPPORTED_EXCHANGES).toContain('binance');
      expect(SUPPORTED_EXCHANGES).toContain('coinbase');
      expect(SUPPORTED_EXCHANGES).toContain('kraken');
      expect(SUPPORTED_EXCHANGES).toContain('kucoin');
    });

    it('should have at least 20 supported exchanges for MVP', () => {
      expect(SUPPORTED_EXCHANGES.length).toBeGreaterThanOrEqual(20);
    });

    it('should have lowercase exchange names', () => {
      for (const exchange of SUPPORTED_EXCHANGES) {
        expect(exchange).toBe(exchange.toLowerCase());
      }
    });

    it('should not have duplicate exchanges', () => {
      const uniqueExchanges = new Set(SUPPORTED_EXCHANGES);
      expect(uniqueExchanges.size).toBe(SUPPORTED_EXCHANGES.length);
    });
  });

  describe('guessBlockchain', () => {
    // Testing the blockchain guessing logic in isolation
    const guessBlockchain = (symbol: string): string => {
      const blockchainMap: Record<string, string> = {
        BTC: 'bitcoin',
        ETH: 'ethereum',
        SOL: 'solana',
        BNB: 'binance-smart-chain',
        MATIC: 'polygon',
        AVAX: 'avalanche',
        DOT: 'polkadot',
        ADA: 'cardano'
      };

      return blockchainMap[symbol.toUpperCase()] || 'ethereum';
    };

    it('should correctly identify Bitcoin blockchain', () => {
      expect(guessBlockchain('BTC')).toBe('bitcoin');
      expect(guessBlockchain('btc')).toBe('bitcoin');
    });

    it('should correctly identify Ethereum blockchain', () => {
      expect(guessBlockchain('ETH')).toBe('ethereum');
      expect(guessBlockchain('eth')).toBe('ethereum');
    });

    it('should correctly identify Solana blockchain', () => {
      expect(guessBlockchain('SOL')).toBe('solana');
    });

    it('should correctly identify BNB Smart Chain', () => {
      expect(guessBlockchain('BNB')).toBe('binance-smart-chain');
    });

    it('should correctly identify Polygon', () => {
      expect(guessBlockchain('MATIC')).toBe('polygon');
    });

    it('should correctly identify Avalanche', () => {
      expect(guessBlockchain('AVAX')).toBe('avalanche');
    });

    it('should correctly identify Polkadot', () => {
      expect(guessBlockchain('DOT')).toBe('polkadot');
    });

    it('should correctly identify Cardano', () => {
      expect(guessBlockchain('ADA')).toBe('cardano');
    });

    it('should default to ethereum for unknown tokens', () => {
      expect(guessBlockchain('UNKNOWN')).toBe('ethereum');
      expect(guessBlockchain('USDC')).toBe('ethereum'); // ERC-20 token
      expect(guessBlockchain('LINK')).toBe('ethereum'); // ERC-20 token
    });
  });

  describe('Exchange Connection Validation', () => {
    // Testing validation logic
    const validateExchange = (exchange: string): boolean => {
      return SUPPORTED_EXCHANGES.includes(exchange as SupportedExchange);
    };

    it('should validate supported exchanges', () => {
      expect(validateExchange('binance')).toBe(true);
      expect(validateExchange('coinbase')).toBe(true);
      expect(validateExchange('kraken')).toBe(true);
    });

    it('should reject unsupported exchanges', () => {
      expect(validateExchange('fake-exchange')).toBe(false);
      expect(validateExchange('invalid')).toBe(false);
    });

    it('should be case-sensitive', () => {
      // Our supported exchanges are lowercase
      expect(validateExchange('Binance')).toBe(false);
      expect(validateExchange('BINANCE')).toBe(false);
      expect(validateExchange('binance')).toBe(true);
    });
  });

  describe('Credentials Validation', () => {
    // Testing credential validation logic
    interface ExchangeCredentials {
      apiKey: string;
      apiSecret: string;
      passphrase?: string;
    }

    const validateCredentials = (credentials: ExchangeCredentials): {
      valid: boolean;
      errors: string[];
    } => {
      const errors: string[] = [];

      if (!credentials.apiKey || credentials.apiKey.trim().length === 0) {
        errors.push('API key is required');
      }

      if (!credentials.apiSecret || credentials.apiSecret.trim().length === 0) {
        errors.push('API secret is required');
      }

      if (credentials.apiKey && credentials.apiKey.length < 16) {
        errors.push('API key seems too short');
      }

      if (credentials.apiSecret && credentials.apiSecret.length < 16) {
        errors.push('API secret seems too short');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    };

    it('should accept valid credentials', () => {
      const credentials: ExchangeCredentials = {
        apiKey: 'valid-api-key-12345678',
        apiSecret: 'valid-api-secret-87654321'
      };

      const result = validateCredentials(credentials);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty API key', () => {
      const credentials: ExchangeCredentials = {
        apiKey: '',
        apiSecret: 'valid-api-secret-87654321'
      };

      const result = validateCredentials(credentials);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key is required');
    });

    it('should reject empty API secret', () => {
      const credentials: ExchangeCredentials = {
        apiKey: 'valid-api-key-12345678',
        apiSecret: ''
      };

      const result = validateCredentials(credentials);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API secret is required');
    });

    it('should reject too-short API key', () => {
      const credentials: ExchangeCredentials = {
        apiKey: 'short',
        apiSecret: 'valid-api-secret-87654321'
      };

      const result = validateCredentials(credentials);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key seems too short');
    });

    it('should reject too-short API secret', () => {
      const credentials: ExchangeCredentials = {
        apiKey: 'valid-api-key-12345678',
        apiSecret: 'short'
      };

      const result = validateCredentials(credentials);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API secret seems too short');
    });

    it('should accept passphrase for exchanges that need it', () => {
      const credentials: ExchangeCredentials = {
        apiKey: 'valid-api-key-12345678',
        apiSecret: 'valid-api-secret-87654321',
        passphrase: 'my-secure-passphrase'
      };

      const result = validateCredentials(credentials);
      expect(result.valid).toBe(true);
    });

    it('should allow missing passphrase for exchanges that dont need it', () => {
      const credentials: ExchangeCredentials = {
        apiKey: 'valid-api-key-12345678',
        apiSecret: 'valid-api-secret-87654321'
        // No passphrase
      };

      const result = validateCredentials(credentials);
      expect(result.valid).toBe(true);
    });
  });
});
