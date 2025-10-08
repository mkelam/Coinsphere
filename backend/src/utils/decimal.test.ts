/**
 * Decimal Utility Tests
 * Tests for decimal.js wrapper functions ensuring precision in financial calculations
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  toDecimal,
  multiply,
  add,
  subtract,
  divide,
  percentage,
  roundTo,
  toNumber,
  weightedAverage,
  sum,
  compare,
  max,
  min,
  isZero,
  isPositive,
  isNegative,
} from './decimal.js';

describe('Decimal Utility Functions', () => {
  describe('toDecimal', () => {
    it('should convert number to Decimal', () => {
      const result = toDecimal(123.456);
      expect(result).toBeInstanceOf(Decimal);
      expect(result.toString()).toBe('123.456');
    });

    it('should convert string to Decimal', () => {
      const result = toDecimal('123.456');
      expect(result).toBeInstanceOf(Decimal);
      expect(result.toString()).toBe('123.456');
    });

    it('should handle null as zero', () => {
      const result = toDecimal(null);
      expect(result.toString()).toBe('0');
    });

    it('should handle undefined as zero', () => {
      const result = toDecimal(undefined);
      expect(result.toString()).toBe('0');
    });

    it('should preserve Decimal instance', () => {
      const decimal = new Decimal(123.456);
      const result = toDecimal(decimal);
      expect(result).toBe(decimal);
    });
  });

  describe('multiply', () => {
    it('should multiply two numbers precisely', () => {
      const result = multiply(0.1, 0.2);
      expect(result.toString()).toBe('0.02'); // NOT 0.020000000000000004
    });

    it('should handle large numbers', () => {
      const result = multiply(123456789.12345678, 987654321.87654321);
      expect(result.toString()).toBe('121932632103337090.6816367594445938');
    });

    it('should handle very small numbers', () => {
      const result = multiply(0.00000001, 0.00000001);
      expect(result.toString()).toBe('1e-16');
    });
  });

  describe('add', () => {
    it('should add two numbers precisely', () => {
      const result = add(0.1, 0.2);
      expect(result.toString()).toBe('0.3'); // NOT 0.30000000000000004
    });

    it('should handle accumulation correctly', () => {
      let total = new Decimal(0);
      for (let i = 0; i < 100; i++) {
        total = add(total, 0.1);
      }
      expect(total.toString()).toBe('10'); // NOT 9.99999999999998
    });
  });

  describe('subtract', () => {
    it('should subtract two numbers precisely', () => {
      const result = subtract(0.3, 0.1);
      expect(result.toString()).toBe('0.2');
    });

    it('should handle negative results', () => {
      const result = subtract(100, 200);
      expect(result.toString()).toBe('-100');
    });
  });

  describe('divide', () => {
    it('should divide two numbers precisely', () => {
      const result = divide(1, 3);
      // Check that it has 28 digits of precision
      expect(result.toString().length).toBeGreaterThan(20);
    });

    it('should throw on division by zero', () => {
      expect(() => divide(100, 0)).toThrow('Division by zero');
    });

    it('should handle very small divisors', () => {
      const result = divide(1, 0.00001);
      expect(result.toString()).toBe('100000');
    });
  });

  describe('percentage', () => {
    it('should calculate percentage correctly', () => {
      const result = percentage(25, 100);
      expect(result.toString()).toBe('25');
    });

    it('should handle zero total as zero', () => {
      const result = percentage(25, 0);
      expect(result.toString()).toBe('0');
    });

    it('should calculate precise percentages', () => {
      const result = percentage(1, 3);
      expect(toNumber(result, 2)).toBe(33.33);
    });
  });

  describe('weightedAverage', () => {
    it('should calculate weighted average for cost basis', () => {
      // Old holding: 10 tokens @ $100 = $1000
      // New purchase: 5 tokens @ $120 = $600
      // Weighted avg: $1600 / 15 = $106.67
      const result = weightedAverage(100, 10, 120, 5);
      expect(toNumber(result, 2)).toBe(106.67);
    });

    it('should handle zero weights as zero', () => {
      const result = weightedAverage(100, 0, 200, 0);
      expect(result.toString()).toBe('0');
    });

    it('should handle single non-zero weight', () => {
      const result = weightedAverage(100, 0, 200, 10);
      expect(result.toString()).toBe('200');
    });
  });

  describe('roundTo', () => {
    it('should round to 2 decimal places by default', () => {
      const result = roundTo(123.456789);
      expect(result.toString()).toBe('123.46');
    });

    it('should round to specified decimal places', () => {
      const result = roundTo(123.456789, 4);
      expect(result.toString()).toBe('123.4568');
    });

    it('should use ROUND_HALF_UP', () => {
      expect(roundTo(1.5).toString()).toBe('2');
      expect(roundTo(2.5).toString()).toBe('3');
    });
  });

  describe('toNumber', () => {
    it('should convert Decimal to number with rounding', () => {
      const decimal = new Decimal(123.456789);
      const result = toNumber(decimal, 2);
      expect(result).toBe(123.46);
      expect(typeof result).toBe('number');
    });
  });

  describe('sum', () => {
    it('should sum array of values precisely', () => {
      const values = [0.1, 0.2, 0.3, 0.4, 0.5];
      const result = sum(values);
      expect(result.toString()).toBe('1.5'); // NOT 1.4999999999999998
    });

    it('should handle empty array as zero', () => {
      const result = sum([]);
      expect(result.toString()).toBe('0');
    });
  });

  describe('compare', () => {
    it('should return 1 when first is greater', () => {
      expect(compare(100, 50)).toBe(1);
    });

    it('should return -1 when first is less', () => {
      expect(compare(50, 100)).toBe(-1);
    });

    it('should return 0 when equal', () => {
      expect(compare(100, 100)).toBe(0);
    });
  });

  describe('max', () => {
    it('should return maximum value', () => {
      const result = max(100, 200);
      expect(result.toString()).toBe('200');
    });
  });

  describe('min', () => {
    it('should return minimum value', () => {
      const result = min(100, 200);
      expect(result.toString()).toBe('100');
    });
  });

  describe('isZero', () => {
    it('should return true for zero', () => {
      expect(isZero(0)).toBe(true);
      expect(isZero('0')).toBe(true);
    });

    it('should return false for non-zero', () => {
      expect(isZero(0.1)).toBe(false);
    });
  });

  describe('isPositive', () => {
    it('should return true for positive numbers', () => {
      expect(isPositive(100)).toBe(true);
    });

    it('should return false for zero and negative', () => {
      expect(isPositive(0)).toBe(false);
      expect(isPositive(-100)).toBe(false);
    });
  });

  describe('isNegative', () => {
    it('should return true for negative numbers', () => {
      expect(isNegative(-100)).toBe(true);
    });

    it('should return false for zero and positive', () => {
      expect(isNegative(0)).toBe(false);
      expect(isNegative(100)).toBe(false);
    });
  });

  describe('Financial Accuracy Tests', () => {
    it('should prevent floating-point errors in portfolio calculations', () => {
      // Simulate portfolio calculation
      const holdings = [
        { price: 123.45, amount: 10.5 },
        { price: 0.000123, amount: 1000000 },
        { price: 99999.99, amount: 0.001 },
      ];

      let totalValue = new Decimal(0);
      for (const holding of holdings) {
        const value = multiply(holding.price, holding.amount);
        totalValue = add(totalValue, value);
      }

      // Verify precision
      expect(totalValue.toString()).toBe('1419.22225');
    });

    it('should handle tax calculation precision', () => {
      const profitLoss = 12345.67;
      const taxRate = 0.25; // 25%
      const tax = multiply(profitLoss, taxRate);

      expect(toNumber(tax, 2)).toBe(3086.42); // Exact to 2 decimals
    });

    it('should maintain precision through multiple operations', () => {
      // Simulate cost-basis tracking
      let costBasis = new Decimal(0);
      const purchases = [
        { amount: 10, price: 100.50 },
        { amount: 5, price: 120.25 },
        { amount: 15, price: 95.75 },
      ];

      for (const purchase of purchases) {
        const cost = multiply(purchase.amount, purchase.price);
        costBasis = add(costBasis, cost);
      }

      expect(toNumber(costBasis, 2)).toBe(3042.50);
    });
  });
});
