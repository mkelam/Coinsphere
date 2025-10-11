/**
 * Decimal Utility for Precise Monetary Calculations
 * NO FLOATS ALLOWED - Prevents silent data corruption
 */

import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 28,        // 28 significant digits
  rounding: Decimal.ROUND_HALF_UP,  // Standard rounding
  toExpNeg: -9,         // Scientific notation threshold
  toExpPos: 21,
  maxE: 9e15,
  minE: -9e15,
});

/**
 * Convert any value to Decimal safely
 */
export function toDecimal(value: number | string | Decimal | null | undefined): Decimal {
  if (value === null || value === undefined) {
    return new Decimal(0);
  }
  // If already a Decimal, return it directly (preserve instance)
  if (value instanceof Decimal) {
    return value;
  }
  return new Decimal(value);
}

/**
 * Multiply with precision
 */
export function multiply(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return toDecimal(a).times(toDecimal(b));
}

/**
 * Add with precision
 */
export function add(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return toDecimal(a).plus(toDecimal(b));
}

/**
 * Subtract with precision
 */
export function subtract(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

/**
 * Divide with precision
 */
export function divide(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  const divisor = toDecimal(b);
  if (divisor.isZero()) {
    throw new Error('Division by zero');
  }
  return toDecimal(a).dividedBy(divisor);
}

/**
 * Calculate percentage
 */
export function percentage(value: number | string | Decimal, total: number | string | Decimal): Decimal {
  const totalDecimal = toDecimal(total);
  if (totalDecimal.isZero()) {
    return new Decimal(0);
  }
  return toDecimal(value).dividedBy(totalDecimal).times(100);
}

/**
 * Round to specified decimal places (default 2 for currency)
 */
export function roundTo(value: number | string | Decimal, decimalPlaces: number = 2): Decimal {
  return toDecimal(value).toDecimalPlaces(decimalPlaces);
}

/**
 * Convert Decimal to number (for JSON serialization)
 * ONLY use for final output, never for calculations
 */
export function toNumber(value: Decimal, decimalPlaces: number = 2): number {
  return roundTo(value, decimalPlaces).toNumber();
}

/**
 * Convert Decimal to string with fixed decimal places
 */
export function toString(value: Decimal, decimalPlaces: number = 2): string {
  return roundTo(value, decimalPlaces).toFixed(decimalPlaces);
}

/**
 * Calculate weighted average
 * Used for cost-basis calculations
 */
export function weightedAverage(
  value1: number | string | Decimal,
  weight1: number | string | Decimal,
  value2: number | string | Decimal,
  weight2: number | string | Decimal
): Decimal {
  const v1 = toDecimal(value1);
  const w1 = toDecimal(weight1);
  const v2 = toDecimal(value2);
  const w2 = toDecimal(weight2);

  const totalWeight = w1.plus(w2);
  if (totalWeight.isZero()) {
    return new Decimal(0);
  }

  const weightedSum = v1.times(w1).plus(v2.times(w2));
  return weightedSum.dividedBy(totalWeight);
}

/**
 * Sum an array of values with precision
 */
export function sum(values: (number | string | Decimal)[]): Decimal {
  return values.reduce<Decimal>(
    (acc, val) => acc.plus(toDecimal(val)),
    new Decimal(0)
  );
}

/**
 * Check if value is positive
 */
export function isPositive(value: number | string | Decimal): boolean {
  return toDecimal(value).greaterThan(0);
}

/**
 * Check if value is zero
 */
export function isZero(value: number | string | Decimal): boolean {
  return toDecimal(value).isZero();
}

/**
 * Check if value is negative
 */
export function isNegative(value: number | string | Decimal): boolean {
  return toDecimal(value).lessThan(0);
}

/**
 * Compare two values
 */
export function compare(a: number | string | Decimal, b: number | string | Decimal): number {
  return toDecimal(a).comparedTo(toDecimal(b));
}

/**
 * Get max of two values
 */
export function max(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  const aDecimal = toDecimal(a);
  const bDecimal = toDecimal(b);
  return aDecimal.greaterThan(bDecimal) ? aDecimal : bDecimal;
}

/**
 * Get min of two values
 */
export function min(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  const aDecimal = toDecimal(a);
  const bDecimal = toDecimal(b);
  return aDecimal.lessThan(bDecimal) ? aDecimal : bDecimal;
}

export { Decimal };
