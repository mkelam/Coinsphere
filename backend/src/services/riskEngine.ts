/**
 * Degen Risk Scoring Engine
 * Calculates comprehensive risk scores (0-100) for crypto assets
 * Lower scores = safer, Higher scores = riskier (more "degen")
 */

import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { toDecimal, divide, subtract, toNumber } from '../utils/decimal.js';
import Decimal from 'decimal.js';
import { cryptocompareService } from './cryptocompare.js';

interface RiskScoreResult {
  overallScore: number; // 0-100
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'extreme';
  components: {
    liquidityScore: number;
    volatilityScore: number;
    marketCapScore: number;
    volumeScore: number;
    socialSentimentScore: number; // NEW: Social sentiment risk (0-100)
    galaxyScore?: number; // NEW: Raw Galaxy Score from LunarCrush (0-100)
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

      // Get social sentiment data (Galaxy Score)
      const socialData = await this.getSocialSentimentData(token.symbol);

      // Calculate component scores
      const liquidityScore = this.calculateLiquidityScore(token);
      const volatilityScore = this.calculateVolatilityScore(historicalData);
      const marketCapScore = this.calculateMarketCapScore(token.marketCap || 0);
      const volumeScore = this.calculateVolumeScore(
        token.volume24h || 0,
        token.marketCap || 0
      );
      const socialSentimentScore = this.calculateSocialSentimentScore(socialData);

      // Calculate weighted overall score
      const overallScore = this.calculateOverallScore({
        liquidityScore,
        volatilityScore,
        marketCapScore,
        volumeScore,
        socialSentimentScore,
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
          socialSentimentScore,
          galaxyScore: socialData.galaxyScore,
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
          socialSentimentScore,
          galaxyScore: socialData.galaxyScore,
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
   * Get social sentiment data from LunarCrush/CryptoCompare
   */
  private async getSocialSentimentData(symbol: string): Promise<{
    galaxyScore: number;
    sentiment: number;
    socialVolume: number;
    tweets24h: number;
  }> {
    try {
      // Get detailed social stats from CryptoCompare
      const socialStats = await cryptocompareService.getSocialStatsDetailed(symbol);

      return {
        galaxyScore: socialStats.galaxy_score || 50, // Default to neutral if no data
        sentiment: socialStats.sentiment || 0,
        socialVolume: socialStats.social_volume || 0,
        tweets24h: socialStats.tweets_24h || 0,
      };
    } catch (error) {
      logger.warn(`Could not fetch social data for ${symbol}, using defaults:`, error);
      return {
        galaxyScore: 50, // Neutral default
        sentiment: 0,
        socialVolume: 0,
        tweets24h: 0,
      };
    }
  }

  /**
   * Calculate social sentiment risk score based on Galaxy Score and social metrics
   * Lower Galaxy Score = Higher Risk
   * High social volume spikes = Potential pump & dump risk
   */
  private calculateSocialSentimentScore(socialData: {
    galaxyScore: number;
    sentiment: number;
    socialVolume: number;
    tweets24h: number;
  }): number {
    const { galaxyScore, sentiment, socialVolume, tweets24h } = socialData;

    // Base score: Invert Galaxy Score (high Galaxy Score = low risk)
    // Galaxy Score 100 = safest (score 10), Galaxy Score 0 = riskiest (score 90)
    let baseScore = 100 - galaxyScore;

    // Sentiment modifier: Negative sentiment increases risk
    // Sentiment ranges from -1 (bearish) to +1 (bullish)
    // Extremely negative or extremely positive can both be risky
    const sentimentRisk = Math.abs(sentiment) > 0.7 ? 15 : Math.abs(sentiment) > 0.5 ? 10 : 0;

    // Social volume spike detection (potential pump & dump)
    // Very high social volume relative to typical coins can indicate manipulation
    let spikeRisk = 0;
    if (socialVolume > 1_000_000) {
      spikeRisk = 20; // Massive hype = potential dump incoming
    } else if (socialVolume > 500_000) {
      spikeRisk = 15;
    } else if (socialVolume > 100_000) {
      spikeRisk = 10;
    } else if (socialVolume < 1000 && galaxyScore < 30) {
      spikeRisk = 25; // Low social activity + low score = very risky/unknown coin
    }

    // Twitter activity check
    let twitterRisk = 0;
    if (tweets24h === 0 && galaxyScore < 40) {
      twitterRisk = 20; // No social presence = very risky
    } else if (tweets24h < 100) {
      twitterRisk = 10; // Low activity
    }

    // Combined score
    const combinedScore = baseScore + sentimentRisk + spikeRisk + twitterRisk;

    // Cap at 100
    return Math.min(Math.round(combinedScore), 100);
  }

  /**
   * Calculate weighted overall score (including social sentiment)
   */
  private calculateOverallScore(components: {
    liquidityScore: number;
    volatilityScore: number;
    marketCapScore: number;
    volumeScore: number;
    socialSentimentScore: number;
  }): number {
    // Weighted average (adjusted to include social sentiment)
    const weights = {
      liquidity: 0.20,        // 20%
      volatility: 0.25,       // 25%
      marketCap: 0.25,        // 25%
      volume: 0.15,           // 15%
      socialSentiment: 0.15,  // 15% - NEW: Social sentiment weight
    };

    const weighted =
      components.liquidityScore * weights.liquidity +
      components.volatilityScore * weights.volatility +
      components.marketCapScore * weights.marketCap +
      components.volumeScore * weights.volume +
      components.socialSentimentScore * weights.socialSentiment;

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
   * Generate human-readable analysis (including social sentiment)
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

    // Social sentiment warnings (NEW)
    if (components.socialSentimentScore > 70) {
      if (components.galaxyScore && components.galaxyScore < 30) {
        warnings.push(`Low social sentiment (Galaxy Score: ${components.galaxyScore}/100) - limited community support`);
      } else {
        warnings.push('Social sentiment indicates elevated risk - watch for pump & dump patterns');
      }
    } else if (components.socialSentimentScore > 50) {
      warnings.push('Moderate social risk - monitor community sentiment closely');
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

    // Social sentiment insights (NEW)
    if (components.galaxyScore && components.galaxyScore > 70) {
      insights.push(`Strong community support (Galaxy Score: ${components.galaxyScore}/100)`);
    } else if (components.galaxyScore && components.galaxyScore > 50) {
      insights.push(`Moderate community engagement (Galaxy Score: ${components.galaxyScore}/100)`);
    }

    if (components.socialSentimentScore < 30) {
      insights.push('Positive social sentiment indicates healthy community interest');
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
