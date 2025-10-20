/**
 * Performance Metrics Calculator
 * Phase 1 - Backtesting Infrastructure
 *
 * Calculates advanced performance metrics for backtest results:
 * - Sharpe Ratio (risk-adjusted returns)
 * - Sortino Ratio (downside risk-adjusted returns)
 * - Calmar Ratio (return / max drawdown)
 * - MAR Ratio (managed account ratio)
 * - Maximum Adverse Excursion (MAE)
 * - Maximum Favorable Excursion (MFE)
 * - Expectancy & Kelly Criterion
 */

import { TradeResult } from '../services/positionManager.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PerformanceMetrics {
  // Risk-Adjusted Returns
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  calmarRatio: number | null;
  marRatio: number | null;

  // Win/Loss Analysis
  expectancy: number; // Average profit per trade
  kellyCriterion: number; // Optimal position size
  payoffRatio: number; // Avg win / Avg loss

  // Drawdown Metrics
  maxDrawdownPct: number;
  avgDrawdownPct: number;
  maxDrawdownDuration: number; // Days

  // Trade Quality
  profitFactor: number;
  recoveryFactor: number; // Net profit / Max drawdown
  ulcerIndex: number | null; // Drawdown volatility

  // Consistency
  consecutiveWins: number;
  consecutiveLosses: number;
  winStreakAvg: number;
  loseStreakAvg: number;
}

export interface EquityPoint {
  timestamp: Date;
  value: number;
  drawdown: number;
}

// ============================================================================
// PERFORMANCE METRICS CALCULATOR
// ============================================================================

/**
 * Calculate comprehensive performance metrics
 */
export function calculatePerformanceMetrics(
  trades: TradeResult[],
  equityCurve: EquityPoint[],
  initialCapital: number
): PerformanceMetrics {
  if (trades.length === 0) {
    return getEmptyMetrics();
  }

  // Calculate risk-adjusted returns
  const sharpeRatio = calculateSharpeRatio(trades);
  const sortinoRatio = calculateSortinoRatio(trades);
  const calmarRatio = calculateCalmarRatio(trades, equityCurve, initialCapital);
  const marRatio = calmarRatio; // Same as Calmar for now

  // Calculate win/loss metrics
  const expectancy = calculateExpectancy(trades);
  const kellyCriterion = calculateKellyCriterion(trades);
  const payoffRatio = calculatePayoffRatio(trades);

  // Calculate drawdown metrics
  const drawdownMetrics = calculateDrawdownMetrics(equityCurve);

  // Calculate trade quality
  const profitFactor = calculateProfitFactor(trades);
  const recoveryFactor = calculateRecoveryFactor(trades, drawdownMetrics.maxDrawdownPct, initialCapital);
  const ulcerIndex = calculateUlcerIndex(equityCurve);

  // Calculate consistency metrics
  const streaks = calculateWinLossStreaks(trades);

  return {
    sharpeRatio,
    sortinoRatio,
    calmarRatio,
    marRatio,
    expectancy,
    kellyCriterion,
    payoffRatio,
    ...drawdownMetrics,
    profitFactor,
    recoveryFactor,
    ulcerIndex,
    ...streaks
  };
}

// ============================================================================
// SHARPE RATIO
// ============================================================================

/**
 * Sharpe Ratio: (Average Return - Risk Free Rate) / Standard Deviation
 * Measures risk-adjusted returns considering all volatility
 */
export function calculateSharpeRatio(
  trades: TradeResult[],
  riskFreeRate: number = 0.02 // 2% annual risk-free rate
): number | null {
  if (trades.length < 10) {
    return null; // Need at least 10 trades for meaningful calculation
  }

  const returns = trades.map(t => t.pnlPct);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

  // Calculate standard deviation
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return null;
  }

  // Annualize the Sharpe ratio
  const avgHoldTimeDays = trades.reduce((sum, t) => sum + t.holdTimeHours, 0) / trades.length / 24;
  const tradesPerYear = 365 / avgHoldTimeDays;

  // Sharpe = (Return - RiskFree) / StdDev * sqrt(N periods per year)
  const annualizedExcessReturn = avgReturn - (riskFreeRate / tradesPerYear);
  const sharpeRatio = (annualizedExcessReturn * Math.sqrt(tradesPerYear)) / stdDev;

  return sharpeRatio;
}

// ============================================================================
// SORTINO RATIO
// ============================================================================

/**
 * Sortino Ratio: (Average Return - Risk Free Rate) / Downside Deviation
 * Only penalizes downside volatility, not upside
 */
export function calculateSortinoRatio(
  trades: TradeResult[],
  riskFreeRate: number = 0.02
): number | null {
  if (trades.length < 10) {
    return null;
  }

  const returns = trades.map(t => t.pnlPct);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

  // Calculate downside deviation (only negative returns)
  const negativeReturns = returns.filter(r => r < 0);
  if (negativeReturns.length === 0) {
    return null; // No losing trades
  }

  const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length;
  const downsideDeviation = Math.sqrt(downsideVariance);

  if (downsideDeviation === 0) {
    return null;
  }

  // Annualize
  const avgHoldTimeDays = trades.reduce((sum, t) => sum + t.holdTimeHours, 0) / trades.length / 24;
  const tradesPerYear = 365 / avgHoldTimeDays;

  const annualizedExcessReturn = avgReturn - (riskFreeRate / tradesPerYear);
  const sortinoRatio = (annualizedExcessReturn * Math.sqrt(tradesPerYear)) / downsideDeviation;

  return sortinoRatio;
}

// ============================================================================
// CALMAR RATIO
// ============================================================================

/**
 * Calmar Ratio: Annual Return / Maximum Drawdown
 * Measures return relative to worst drawdown
 */
export function calculateCalmarRatio(
  trades: TradeResult[],
  equityCurve: EquityPoint[],
  initialCapital: number
): number | null {
  if (trades.length === 0 || equityCurve.length === 0) {
    return null;
  }

  // Calculate total return
  const finalCapital = equityCurve[equityCurve.length - 1].value;
  const totalReturn = (finalCapital - initialCapital) / initialCapital;

  // Find max drawdown
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    if (Math.abs(point.drawdown) > maxDrawdown) {
      maxDrawdown = Math.abs(point.drawdown);
    }
  }

  if (maxDrawdown === 0) {
    return null;
  }

  // Annualize return
  const firstDate = equityCurve[0].timestamp;
  const lastDate = equityCurve[equityCurve.length - 1].timestamp;
  const daysElapsed = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
  const yearsElapsed = daysElapsed / 365;

  const annualizedReturn = Math.pow(1 + totalReturn, 1 / yearsElapsed) - 1;

  return annualizedReturn / maxDrawdown;
}

// ============================================================================
// EXPECTANCY & KELLY CRITERION
// ============================================================================

/**
 * Expectancy: Average profit per trade
 */
export function calculateExpectancy(trades: TradeResult[]): number {
  if (trades.length === 0) {
    return 0;
  }

  return trades.reduce((sum, t) => sum + t.pnlUsd, 0) / trades.length;
}

/**
 * Kelly Criterion: Optimal position size
 * Formula: (Win Rate * Avg Win - (1 - Win Rate) * Avg Loss) / Avg Win
 */
export function calculateKellyCriterion(trades: TradeResult[]): number {
  const winners = trades.filter(t => t.pnlUsd > 0);
  const losers = trades.filter(t => t.pnlUsd < 0);

  if (winners.length === 0 || losers.length === 0) {
    return 0;
  }

  const winRate = winners.length / trades.length;
  const avgWin = winners.reduce((sum, t) => sum + t.pnlPct, 0) / winners.length;
  const avgLoss = Math.abs(losers.reduce((sum, t) => sum + t.pnlPct, 0) / losers.length);

  if (avgWin === 0) {
    return 0;
  }

  const kelly = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;

  // Cap Kelly at 0.25 (quarter Kelly) for safety
  return Math.max(0, Math.min(kelly, 0.25));
}

/**
 * Payoff Ratio: Average Win / Average Loss
 */
export function calculatePayoffRatio(trades: TradeResult[]): number {
  const winners = trades.filter(t => t.pnlUsd > 0);
  const losers = trades.filter(t => t.pnlUsd < 0);

  if (winners.length === 0 || losers.length === 0) {
    return 0;
  }

  const avgWin = winners.reduce((sum, t) => sum + Math.abs(t.pnlUsd), 0) / winners.length;
  const avgLoss = losers.reduce((sum, t) => sum + Math.abs(t.pnlUsd), 0) / losers.length;

  return avgLoss === 0 ? 0 : avgWin / avgLoss;
}

// ============================================================================
// DRAWDOWN METRICS
// ============================================================================

/**
 * Calculate comprehensive drawdown metrics
 */
export function calculateDrawdownMetrics(equityCurve: EquityPoint[]): {
  maxDrawdownPct: number;
  avgDrawdownPct: number;
  maxDrawdownDuration: number;
} {
  if (equityCurve.length === 0) {
    return {
      maxDrawdownPct: 0,
      avgDrawdownPct: 0,
      maxDrawdownDuration: 0
    };
  }

  let maxDrawdown = 0;
  let drawdownSum = 0;
  let drawdownCount = 0;
  let currentDrawdownStart: Date | null = null;
  let maxDrawdownDuration = 0;

  for (let i = 0; i < equityCurve.length; i++) {
    const point = equityCurve[i];
    const drawdown = Math.abs(point.drawdown);

    // Track max drawdown
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }

    // Track average drawdown
    if (drawdown > 0) {
      drawdownSum += drawdown;
      drawdownCount++;

      // Track drawdown duration
      if (currentDrawdownStart === null) {
        currentDrawdownStart = point.timestamp;
      }
    } else if (currentDrawdownStart !== null) {
      // Drawdown ended, calculate duration
      const duration = (point.timestamp.getTime() - currentDrawdownStart.getTime()) / (1000 * 60 * 60 * 24);
      if (duration > maxDrawdownDuration) {
        maxDrawdownDuration = duration;
      }
      currentDrawdownStart = null;
    }
  }

  return {
    maxDrawdownPct: maxDrawdown,
    avgDrawdownPct: drawdownCount > 0 ? drawdownSum / drawdownCount : 0,
    maxDrawdownDuration
  };
}

// ============================================================================
// PROFIT FACTOR & RECOVERY FACTOR
// ============================================================================

/**
 * Profit Factor: Total Wins / Total Losses
 */
export function calculateProfitFactor(trades: TradeResult[]): number {
  const totalWins = trades.filter(t => t.pnlUsd > 0).reduce((sum, t) => sum + t.pnlUsd, 0);
  const totalLosses = Math.abs(trades.filter(t => t.pnlUsd < 0).reduce((sum, t) => sum + t.pnlUsd, 0));

  return totalLosses === 0 ? (totalWins > 0 ? Infinity : 0) : totalWins / totalLosses;
}

/**
 * Recovery Factor: Net Profit / Max Drawdown
 */
export function calculateRecoveryFactor(trades: TradeResult[], maxDrawdownPct: number, initialCapital: number): number {
  const netProfit = trades.reduce((sum, t) => sum + t.pnlUsd, 0);
  const maxDrawdownDollars = maxDrawdownPct * initialCapital;

  return maxDrawdownDollars === 0 ? 0 : netProfit / maxDrawdownDollars;
}

// ============================================================================
// ULCER INDEX
// ============================================================================

/**
 * Ulcer Index: Measures downside volatility
 * Square root of mean of squared drawdowns
 */
export function calculateUlcerIndex(equityCurve: EquityPoint[]): number | null {
  if (equityCurve.length < 10) {
    return null;
  }

  const sumSquaredDrawdowns = equityCurve.reduce(
    (sum, point) => sum + Math.pow(point.drawdown * 100, 2), // Convert to percentage
    0
  );

  const meanSquaredDrawdown = sumSquaredDrawdowns / equityCurve.length;
  return Math.sqrt(meanSquaredDrawdown);
}

// ============================================================================
// WIN/LOSS STREAKS
// ============================================================================

/**
 * Calculate win/loss streak statistics
 */
export function calculateWinLossStreaks(trades: TradeResult[]): {
  consecutiveWins: number;
  consecutiveLosses: number;
  winStreakAvg: number;
  loseStreakAvg: number;
} {
  if (trades.length === 0) {
    return {
      consecutiveWins: 0,
      consecutiveLosses: 0,
      winStreakAvg: 0,
      loseStreakAvg: 0
    };
  }

  let currentWinStreak = 0;
  let currentLoseStreak = 0;
  let maxWinStreak = 0;
  let maxLoseStreak = 0;
  const winStreaks: number[] = [];
  const loseStreaks: number[] = [];

  for (const trade of trades) {
    if (trade.pnlUsd > 0) {
      currentWinStreak++;
      if (currentLoseStreak > 0) {
        loseStreaks.push(currentLoseStreak);
        currentLoseStreak = 0;
      }
      if (currentWinStreak > maxWinStreak) {
        maxWinStreak = currentWinStreak;
      }
    } else {
      currentLoseStreak++;
      if (currentWinStreak > 0) {
        winStreaks.push(currentWinStreak);
        currentWinStreak = 0;
      }
      if (currentLoseStreak > maxLoseStreak) {
        maxLoseStreak = currentLoseStreak;
      }
    }
  }

  // Add final streak
  if (currentWinStreak > 0) winStreaks.push(currentWinStreak);
  if (currentLoseStreak > 0) loseStreaks.push(currentLoseStreak);

  return {
    consecutiveWins: maxWinStreak,
    consecutiveLosses: maxLoseStreak,
    winStreakAvg: winStreaks.length > 0 ? winStreaks.reduce((a, b) => a + b, 0) / winStreaks.length : 0,
    loseStreakAvg: loseStreaks.length > 0 ? loseStreaks.reduce((a, b) => a + b, 0) / loseStreaks.length : 0
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getEmptyMetrics(): PerformanceMetrics {
  return {
    sharpeRatio: null,
    sortinoRatio: null,
    calmarRatio: null,
    marRatio: null,
    expectancy: 0,
    kellyCriterion: 0,
    payoffRatio: 0,
    maxDrawdownPct: 0,
    avgDrawdownPct: 0,
    maxDrawdownDuration: 0,
    profitFactor: 0,
    recoveryFactor: 0,
    ulcerIndex: null,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    winStreakAvg: 0,
    loseStreakAvg: 0
  };
}
