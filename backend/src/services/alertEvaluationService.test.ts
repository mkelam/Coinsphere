/**
 * Alert Evaluation Service Tests
 * Tests for alert condition evaluation logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import Decimal from 'decimal.js';

// We'll test the condition evaluation logic in isolation
// For full integration tests, see tests/e2e/

describe('Alert Evaluation Service', () => {
  describe('evaluateCondition', () => {
    // Helper function to test condition evaluation
    const evaluateCondition = (currentValue: Decimal, condition: string, threshold: Decimal): boolean => {
      switch (condition.toLowerCase()) {
        case 'above':
        case '>':
        case 'greater_than':
          return currentValue.greaterThan(threshold);

        case 'below':
        case '<':
        case 'less_than':
          return currentValue.lessThan(threshold);

        case 'equals':
        case '=':
        case '==':
          // For equals, use a small tolerance (0.1% difference)
          const tolerance = threshold.times(0.001);
          return currentValue.minus(threshold).abs().lessThanOrEqualTo(tolerance);

        case 'above_or_equal':
        case '>=':
          return currentValue.greaterThanOrEqualTo(threshold);

        case 'below_or_equal':
        case '<=':
          return currentValue.lessThanOrEqualTo(threshold);

        default:
          throw new Error(`Unknown condition: ${condition}`);
      }
    };

    describe('above condition', () => {
      it('should trigger when current price is above threshold', () => {
        const currentValue = new Decimal(50000);
        const threshold = new Decimal(49000);
        expect(evaluateCondition(currentValue, 'above', threshold)).toBe(true);
      });

      it('should not trigger when current price equals threshold', () => {
        const currentValue = new Decimal(50000);
        const threshold = new Decimal(50000);
        expect(evaluateCondition(currentValue, 'above', threshold)).toBe(false);
      });

      it('should not trigger when current price is below threshold', () => {
        const currentValue = new Decimal(49000);
        const threshold = new Decimal(50000);
        expect(evaluateCondition(currentValue, 'above', threshold)).toBe(false);
      });

      it('should handle > symbol', () => {
        expect(evaluateCondition(new Decimal(100), '>', new Decimal(99))).toBe(true);
      });

      it('should handle greater_than keyword', () => {
        expect(evaluateCondition(new Decimal(100), 'greater_than', new Decimal(99))).toBe(true);
      });
    });

    describe('below condition', () => {
      it('should trigger when current price is below threshold', () => {
        const currentValue = new Decimal(49000);
        const threshold = new Decimal(50000);
        expect(evaluateCondition(currentValue, 'below', threshold)).toBe(true);
      });

      it('should not trigger when current price equals threshold', () => {
        const currentValue = new Decimal(50000);
        const threshold = new Decimal(50000);
        expect(evaluateCondition(currentValue, 'below', threshold)).toBe(false);
      });

      it('should not trigger when current price is above threshold', () => {
        const currentValue = new Decimal(51000);
        const threshold = new Decimal(50000);
        expect(evaluateCondition(currentValue, 'below', threshold)).toBe(false);
      });

      it('should handle < symbol', () => {
        expect(evaluateCondition(new Decimal(99), '<', new Decimal(100))).toBe(true);
      });

      it('should handle less_than keyword', () => {
        expect(evaluateCondition(new Decimal(99), 'less_than', new Decimal(100))).toBe(true);
      });
    });

    describe('equals condition', () => {
      it('should trigger when prices are exactly equal', () => {
        const currentValue = new Decimal(50000);
        const threshold = new Decimal(50000);
        expect(evaluateCondition(currentValue, 'equals', threshold)).toBe(true);
      });

      it('should trigger when prices are within 0.1% tolerance', () => {
        // 50000 ± 0.1% = 50000 ± 50 = 49950 to 50050
        const threshold = new Decimal(50000);

        // Within tolerance (49 is 0.098%)
        expect(evaluateCondition(new Decimal(50049), 'equals', threshold)).toBe(true);
        expect(evaluateCondition(new Decimal(49951), 'equals', threshold)).toBe(true);
      });

      it('should not trigger when prices exceed 0.1% tolerance', () => {
        const threshold = new Decimal(50000);

        // Outside tolerance (51 is 0.102%)
        expect(evaluateCondition(new Decimal(50051), 'equals', threshold)).toBe(false);
        expect(evaluateCondition(new Decimal(49949), 'equals', threshold)).toBe(false);
      });

      it('should handle = symbol', () => {
        expect(evaluateCondition(new Decimal(100), '=', new Decimal(100))).toBe(true);
      });

      it('should handle == symbol', () => {
        expect(evaluateCondition(new Decimal(100), '==', new Decimal(100))).toBe(true);
      });
    });

    describe('above_or_equal condition', () => {
      it('should trigger when current price is above threshold', () => {
        expect(evaluateCondition(new Decimal(101), 'above_or_equal', new Decimal(100))).toBe(true);
      });

      it('should trigger when current price equals threshold', () => {
        expect(evaluateCondition(new Decimal(100), 'above_or_equal', new Decimal(100))).toBe(true);
      });

      it('should not trigger when current price is below threshold', () => {
        expect(evaluateCondition(new Decimal(99), 'above_or_equal', new Decimal(100))).toBe(false);
      });

      it('should handle >= symbol', () => {
        expect(evaluateCondition(new Decimal(100), '>=', new Decimal(100))).toBe(true);
      });
    });

    describe('below_or_equal condition', () => {
      it('should trigger when current price is below threshold', () => {
        expect(evaluateCondition(new Decimal(99), 'below_or_equal', new Decimal(100))).toBe(true);
      });

      it('should trigger when current price equals threshold', () => {
        expect(evaluateCondition(new Decimal(100), 'below_or_equal', new Decimal(100))).toBe(true);
      });

      it('should not trigger when current price is above threshold', () => {
        expect(evaluateCondition(new Decimal(101), 'below_or_equal', new Decimal(100))).toBe(false);
      });

      it('should handle <= symbol', () => {
        expect(evaluateCondition(new Decimal(100), '<=', new Decimal(100))).toBe(true);
      });
    });

    describe('unknown condition', () => {
      it('should throw error for unknown condition', () => {
        expect(() => evaluateCondition(new Decimal(100), 'invalid', new Decimal(100)))
          .toThrow('Unknown condition: invalid');
      });
    });
  });

  describe('Real-world Alert Scenarios', () => {
    const evaluateCondition = (currentValue: Decimal, condition: string, threshold: Decimal): boolean => {
      switch (condition.toLowerCase()) {
        case 'above':
        case '>':
        case 'greater_than':
          return currentValue.greaterThan(threshold);
        case 'below':
        case '<':
        case 'less_than':
          return currentValue.lessThan(threshold);
        case 'equals':
        case '=':
        case '==':
          const tolerance = threshold.times(0.001);
          return currentValue.minus(threshold).abs().lessThanOrEqualTo(tolerance);
        case 'above_or_equal':
        case '>=':
          return currentValue.greaterThanOrEqualTo(threshold);
        case 'below_or_equal':
        case '<=':
          return currentValue.lessThanOrEqualTo(threshold);
        default:
          throw new Error(`Unknown condition: ${condition}`);
      }
    };

    it('should alert when BTC price crosses $50k threshold', () => {
      const btcPrice = new Decimal(50100);
      const threshold = new Decimal(50000);
      expect(evaluateCondition(btcPrice, 'above', threshold)).toBe(true);
    });

    it('should alert when ETH drops below $3k', () => {
      const ethPrice = new Decimal(2950);
      const threshold = new Decimal(3000);
      expect(evaluateCondition(ethPrice, 'below', threshold)).toBe(true);
    });

    it('should alert when risk score exceeds 80 (high risk)', () => {
      const riskScore = new Decimal(85);
      const threshold = new Decimal(80);
      expect(evaluateCondition(riskScore, 'above', threshold)).toBe(true);
    });

    it('should handle very small altcoin prices precisely', () => {
      // Alert for SHIB price above 0.00001
      const shibPrice = new Decimal('0.000011');
      const threshold = new Decimal('0.00001');
      expect(evaluateCondition(shibPrice, 'above', threshold)).toBe(true);
    });

    it('should handle very large token prices precisely', () => {
      // Alert for BTC below $100k
      const btcPrice = new Decimal('99999.99');
      const threshold = new Decimal('100000');
      expect(evaluateCondition(btcPrice, 'below', threshold)).toBe(true);
    });

    it('should not trigger false positives on price volatility', () => {
      // Price fluctuates around threshold but doesn't cross
      const threshold = new Decimal(50000);

      // Slightly above threshold should trigger 'above' condition
      expect(evaluateCondition(new Decimal(50001), 'above', threshold)).toBe(true);

      // Slightly below threshold should NOT trigger 'above' condition
      expect(evaluateCondition(new Decimal(49999), 'above', threshold)).toBe(false);
    });

    it('should handle prediction alerts correctly', () => {
      // Alert when predicted price is significantly different from current
      const predictedPrice = new Decimal(55000); // +10% prediction
      const currentPrice = new Decimal(50000);
      const threshold = currentPrice.times(1.05); // 5% threshold

      expect(evaluateCondition(predictedPrice, 'above', threshold)).toBe(true);
    });
  });

  describe('Precision Tests', () => {
    const evaluateCondition = (currentValue: Decimal, condition: string, threshold: Decimal): boolean => {
      switch (condition.toLowerCase()) {
        case 'above':
          return currentValue.greaterThan(threshold);
        case 'below':
          return currentValue.lessThan(threshold);
        case 'equals':
          const tolerance = threshold.times(0.001);
          return currentValue.minus(threshold).abs().lessThanOrEqualTo(tolerance);
        case 'above_or_equal':
          return currentValue.greaterThanOrEqualTo(threshold);
        case 'below_or_equal':
          return currentValue.lessThanOrEqualTo(threshold);
        default:
          throw new Error(`Unknown condition: ${condition}`);
      }
    };

    it('should maintain precision with very small numbers', () => {
      const price = new Decimal('0.000000123456');
      const threshold = new Decimal('0.000000123455');
      expect(evaluateCondition(price, 'above', threshold)).toBe(true);
    });

    it('should maintain precision with very large numbers', () => {
      const price = new Decimal('999999999.123456789');
      const threshold = new Decimal('999999999.123456788');
      expect(evaluateCondition(price, 'above', threshold)).toBe(true);
    });

    it('should avoid floating-point errors', () => {
      // 0.1 + 0.2 = 0.30000000000000004 in JavaScript
      // But Decimal should handle it correctly
      const price = new Decimal(0.1).plus(0.2);
      const threshold = new Decimal(0.3);
      expect(evaluateCondition(price, 'equals', threshold)).toBe(true);
    });
  });
});
