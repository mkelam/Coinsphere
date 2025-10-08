/**
 * Degen Risk Scoring Engine
 * Calculates comprehensive risk scores (0-100) for crypto assets
 * Lower scores = safer, Higher scores = riskier (more "degen")
 */

import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { toDecimal, divide, subtract, toNumber } from '../utils/decimal.js';
import Decimal from 'decimal.js';

interface RiskScoreResult {
  overallScore: number; // 0-100
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'extreme';
  components: {
    liquidityScore: number;
    volatilityScore: number;
    marketCapScore: number;
    volumeScore: number;
  };
  analysis: {
    summary: string;
    warnings: string[];
    insights: string[];
  };
}

export class RiskEngine {
  /**
   * Calculate comprehensive risk score for a token
   */
  async calculateRiskScore(tokenId: string): Promise<RiskScoreResult> {
    try {
      const token = await prisma.token.findUnique({
        where: { id: tokenId },
      });

      if (!token) {
        throw new Error('Token not found');
      }

      // Get historical data for volatility analysis
      const historicalData = await this.getHistoricalData(tokenId, 7); // 7 days

      // Calculate component scores
      const liquidityScore = this.calculateLiquidityScore(token);
      const volatilityScore = this.calculateVolatilityScore(historicalData);
      const marketCapScore = this.calculateMarketCapScore(token.marketCap || 0);
      const volumeScore = this.calculateVolumeScore(
        token.volume24h || 0,
        token.marketCap || 0
      );

      // Calculate weighted overall score
      const overallScore = this.calculateOverallScore({
        liquidityScore,
        volatilityScore,
        marketCapScore,
        volumeScore,
      });

      // Determine risk level
      const riskLevel = this.determineRiskLevel(overallScore);

      // Generate analysis
      const analysis = this.generateAnalysis(
        token,
        overallScore,
        {
          liquidityScore,
          volatilityScore,
          marketCapScore,
          volumeScore,
        }
      );

      const result = {
        overallScore,
        riskLevel,
        components: {
          liquidityScore,
          volatilityScore,
          marketCapScore,
          volumeScore,
        },
        analysis,
      };

      // Store risk score in database
      await this.storeRiskScore(tokenId, result);

      return result;
    } catch (error) {
      logger.error('Error calculating risk score:', error);
      throw error;
    }
  }

  /**
   * Calculate liquidity score based on volume and market cap (using Decimal for precision)
   */
  private calculateLiquidityScore(token: any): number {
    const volume24h = toDecimal(token.volume24h);
    const marketCap = toDecimal(token.marketCap).greaterThan(0) ? toDecimal(token.marketCap) : new Decimal(1);

    // Volume to market cap ratio (higher is better for liquidity)
    const volumeToMarketCapRatio = divide(volume24h, marketCap).toNumber();

    // Score: 0-100 (0 = highly liquid, 100 = illiquid/risky)
    if (volumeToMarketCapRatio > 0.5) return 10; // Very liquid
    if (volumeToMarketCapRatio > 0.2) return 25; // Good liquidity
    if (volumeToMarketCapRatio > 0.1) return 40; // Moderate
    if (volumeToMarketCapRatio > 0.05) return 60; // Low liquidity
    if (volumeToMarketCapRatio > 0.01) return 80; // Very low
    return 95; // Extremely illiquid (risky)
  }

  /**
   * Calculate volatility score from historical price data (using Decimal for precision)
   */
  private calculateVolatilityScore(data: any[]): number {
    if (data.length < 2) return 50; // Default moderate score

    // Calculate daily returns using Decimal
    const returns: Decimal[] = [];
    for (let i = 1; i < data.length; i++) {
      const currentClose = toDecimal(data[i].close);
      const previousClose = toDecimal(data[i - 1].close);

      if (previousClose.greaterThan(0)) {
        const dailyReturn = divide(subtract(currentClose, previousClose), previousClose);
        returns.push(dailyReturn);
      }
    }

    if (returns.length === 0) return 50;

    // Calculate mean
    let sum = new Decimal(0);
    for (const r of returns) {
      sum = sum.plus(r);
    }
    const mean = sum.dividedBy(returns.length);

    // Calculate variance
    let varianceSum = new Decimal(0);
    for (const r of returns) {
      const diff = r.minus(mean);
      varianceSum = varianceSum.plus(diff.times(diff));
    }
    const variance = varianceSum.dividedBy(returns.length);

    // Standard deviation
    const stdDev = new Decimal(Math.sqrt(variance.toNumber()));

    // Convert to percentage
    const volatilityPercent = stdDev.times(100).toNumber();

    // Score: 0-100 (higher volatility = higher risk)
    if (volatilityPercent < 2) return 15; // Very stable
    if (volatilityPercent < 5) return 30; // Stable
    if (volatilityPercent < 10) return 50; // Moderate volatility
    if (volatilityPercent < 20) return 70; // High volatility
    if (volatilityPercent < 40) return 85; // Very high volatility
    return 95; // Extreme volatility (very risky)
  }

  /**
   * Calculate market cap score (using Decimal for precision)
   */
  private calculateMarketCapScore(marketCap: number | Decimal): number {
    // Larger market cap = more established = lower risk
    const mcap = toDecimal(marketCap).toNumber();

    if (mcap > 100_000_000_000) return 10; // $100B+ (BTC, ETH)
    if (mcap > 10_000_000_000) return 20; // $10B+ (Top 20)
    if (mcap > 1_000_000_000) return 35; // $1B+ (Top 100)
    if (mcap > 100_000_000) return 55; // $100M+ (Mid cap)
    if (mcap > 10_000_000) return 75; // $10M+ (Small cap)
    if (mcap > 1_000_000) return 90; // $1M+ (Micro cap - very risky)
    return 98; // < $1M (Extreme risk/scam potential)
  }

  /**
   * Calculate volume score (volume relative to market cap using Decimal)
   */
  private calculateVolumeScore(volume24h: number | Decimal, marketCap: number | Decimal): number {
    const mcap = toDecimal(marketCap);
    if (mcap.isZero()) return 100; // No market cap = maximum risk

    const vol = toDecimal(volume24h);
    const volumeRatio = divide(vol, mcap).toNumber();

    // Healthy volume ratio indicates active trading
    if (volumeRatio > 0.3) return 15; // Very healthy volume
    if (volumeRatio > 0.15) return 25; // Good volume
    if (volumeRatio > 0.05) return 40; // Moderate volume
    if (volumeRatio > 0.01) return 60; // Low volume
    if (volumeRatio > 0.001) return 80; // Very low volume (risky)
    return 95; // Extremely low volume (very risky)
  }

  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(components: {
    liquidityScore: number;
    volatilityScore: number;
    marketCapScore: number;
    volumeScore: number;
  }): number {
    // Weighted average (can adjust weights based on importance)
    const weights = {
      liquidity: 0.25,
      volatility: 0.30,
      marketCap: 0.30,
      volume: 0.15,
    };

    const weighted =
      components.liquidityScore * weights.liquidity +
      components.volatilityScore * weights.volatility +
      components.marketCapScore * weights.marketCap +
      components.volumeScore * weights.volume;

    return Math.round(weighted);
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): 'safe' | 'low' | 'medium' | 'high' | 'extreme' {
    if (score < 20) return 'safe';
    if (score < 40) return 'low';
    if (score < 60) return 'medium';
    if (score < 80) return 'high';
    return 'extreme';
  }

  /**
   * Generate human-readable analysis
   */
  private generateAnalysis(
    token: any,
    overallScore: number,
    components: any
  ) {
    const warnings: string[] = [];
    const insights: string[] = [];

    // Market Cap warnings
    if (components.marketCapScore > 70) {
      warnings.push(
        `Low market cap ($${(token.marketCap / 1_000_000).toFixed(1)}M) - higher risk of manipulation`
      );
    }

    // Volatility warnings
    if (components.volatilityScore > 70) {
      warnings.push('High price volatility detected - expect large price swings');
    }

    // Liquidity warnings
    if (components.liquidityScore > 70) {
      warnings.push('Low liquidity - may be difficult to exit positions quickly');
    }

    // Volume warnings
    if (components.volumeScore > 70) {
      warnings.push('Low trading volume - price may not reflect true market value');
    }

    // Positive insights
    if (components.marketCapScore < 30) {
      insights.push('Established market cap provides stability');
    }

    if (components.volatilityScore < 30) {
      insights.push('Price volatility is relatively low');
    }

    if (components.liquidityScore < 30) {
      insights.push('Good liquidity supports easy trading');
    }

    // Generate summary
    let summary = '';
    if (overallScore < 20) {
      summary = `${token.symbol} shows low risk characteristics with strong fundamentals and market presence.`;
    } else if (overallScore < 40) {
      summary = `${token.symbol} has moderate-low risk. Suitable for balanced portfolios.`;
    } else if (overallScore < 60) {
      summary = `${token.symbol} carries medium risk. Due diligence recommended before investing.`;
    } else if (overallScore < 80) {
      summary = `${token.symbol} is high risk. Only invest what you can afford to lose.`;
    } else {
      summary = `${token.symbol} is EXTREMELY HIGH RISK. This is a highly speculative "degen" play.`;
    }

    return {
      summary,
      warnings: warnings.length > 0 ? warnings : ['No major warnings detected'],
      insights: insights.length > 0 ? insights : ['Conduct your own research before investing'],
    };
  }

  /**
   * Get historical data for analysis
   */
  private async getHistoricalData(tokenId: string, days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const data = await prisma.priceData.findMany({
      where: {
        tokenId,
        time: { gte: since },
      },
      orderBy: { time: 'asc' },
    });

    return data;
  }

  /**
   * Store risk score in database
   */
  private async storeRiskScore(tokenId: string, result: RiskScoreResult) {
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.riskScore.create({
        data: {
          tokenId,
          overallScore: result.overallScore,
          liquidityScore: result.components.liquidityScore,
          volatilityScore: result.components.volatilityScore,
          contractScore: null, // TODO: Add contract analysis
          holderScore: null, // TODO: Add holder distribution analysis
          analysis: result.analysis as any,
          expiresAt,
        },
      });

      logger.info(`Stored risk score for token ${tokenId}: ${result.overallScore}/100`);
    } catch (error) {
      logger.error('Error storing risk score:', error);
    }
  }

  /**
   * Get cached risk score if available and not expired
   */
  async getCachedRiskScore(tokenId: string): Promise<RiskScoreResult | null> {
    try {
      const cached = await prisma.riskScore.findFirst({
        where: {
          tokenId,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!cached) return null;

      return {
        overallScore: cached.overallScore,
        riskLevel: this.determineRiskLevel(cached.overallScore),
        components: {
          liquidityScore: cached.liquidityScore || 50,
          volatilityScore: cached.volatilityScore || 50,
          marketCapScore: 50, // Recalculate if needed
          volumeScore: 50,
        },
        analysis: cached.analysis as any,
      };
    } catch (error) {
      logger.error('Error fetching cached risk score:', error);
      return null;
    }
  }
}

export const riskEngine = new RiskEngine();
