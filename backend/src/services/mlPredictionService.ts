/**
 * ML Prediction Service
 * Integrates with ML service for AI-powered price predictions and risk scoring
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SERVICE_TIMEOUT = parseInt(process.env.ML_SERVICE_TIMEOUT || '30000');

interface PredictionRequest {
  symbol: string;
  timeframe: '7d' | '14d' | '30d';
}

interface PredictionResponse {
  symbol: string;
  timeframe: string;
  prediction: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: 'low' | 'medium' | 'high';
    confidenceScore: number;
    targetPrice: number;
    targetPriceRange: {
      low: number;
      high: number;
    };
    currentPrice: number;
    potentialGain: number;
  };
  indicators: {
    rsi: number;
    macd: 'bullish' | 'bearish' | 'neutral';
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    socialSentiment: number;
  };
  explanation: string;
  historical_accuracy: {
    last30Days: number;
    last90Days: number;
  };
  generated_at: string;
  expires_at: string;
  model_version: string;
}

interface RiskScoreRequest {
  symbol: string;
}

interface RiskScoreResponse {
  symbol: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'extreme';
  risk_factors: {
    [key: string]: {
      value: number;
      score: number;
      risk: string;
    };
  };
  warnings: string[];
  analyzed_at: string;
  cache_expires_at: string;
}

interface ModelInfo {
  symbol: string;
  status: string;
  model_version: string;
  last_trained: string | null;
  accuracy_7d: number | null;
  checkpoint_path: string | null;
}

class MLPredictionService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ML_SERVICE_URL,
      timeout: ML_SERVICE_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          logger.error(`ML Service Error: ${error.response.status}`, {
            data: error.response.data,
            url: error.config?.url,
          });
        } else if (error.request) {
          logger.error('ML Service: No response received', {
            url: error.config?.url,
          });
        } else {
          logger.error(`ML Service Request Error: ${error.message}`);
        }
        throw error;
      }
    );

    logger.info(`ML Prediction Service initialized (URL: ${ML_SERVICE_URL})`);
  }

  /**
   * Check if ML service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      logger.error('ML Service health check failed', error);
      return false;
    }
  }

  /**
   * Get AI price prediction for a cryptocurrency
   *
   * @param symbol - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
   * @param timeframe - Prediction timeframe ('7d', '14d', '30d')
   * @returns Prediction response with confidence score and target price
   */
  async getPrediction(
    symbol: string,
    timeframe: '7d' | '14d' | '30d' = '7d'
  ): Promise<PredictionResponse> {
    try {
      logger.info(`Fetching prediction for ${symbol} (${timeframe})`);

      const response = await this.client.post<PredictionResponse>('/predict', {
        symbol: symbol.toUpperCase(),
        timeframe,
      });

      logger.info(
        `Prediction received for ${symbol}: ${response.data.prediction.direction} (${response.data.prediction.confidenceScore})`
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Model not trained for ${symbol}`);
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.detail || 'Invalid request');
      }

      throw new Error(`Failed to get prediction: ${error.message}`);
    }
  }

  /**
   * Get degen risk score for a cryptocurrency
   *
   * @param symbol - Cryptocurrency symbol
   * @returns Risk score (0-100) with factor breakdown
   */
  async getRiskScore(symbol: string): Promise<RiskScoreResponse> {
    try {
      logger.info(`Fetching risk score for ${symbol}`);

      const response = await this.client.post<RiskScoreResponse>('/risk-score', {
        symbol: symbol.toUpperCase(),
      });

      logger.info(
        `Risk score received for ${symbol}: ${response.data.risk_score}/100 (${response.data.risk_level})`
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.detail || 'Invalid request');
      }

      throw new Error(`Failed to get risk score: ${error.message}`);
    }
  }

  /**
   * Get model information for a symbol
   *
   * @param symbol - Cryptocurrency symbol
   * @returns Model metadata and training status
   */
  async getModelInfo(symbol: string): Promise<ModelInfo> {
    try {
      const response = await this.client.get<ModelInfo>(`/models/${symbol.toUpperCase()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get model info: ${error.message}`);
    }
  }

  /**
   * Clear cached predictions for a symbol (after model retraining)
   *
   * @param symbol - Cryptocurrency symbol
   */
  async clearModelCache(symbol: string): Promise<void> {
    try {
      await this.client.delete(`/models/${symbol.toUpperCase()}/cache`);
      logger.info(`Cleared cache for ${symbol}`);
    } catch (error: any) {
      logger.error(`Failed to clear cache for ${symbol}:`, error);
      throw new Error(`Failed to clear model cache: ${error.message}`);
    }
  }

  /**
   * Get predictions for multiple symbols in parallel
   *
   * @param symbols - Array of cryptocurrency symbols
   * @param timeframe - Prediction timeframe
   * @returns Array of predictions
   */
  async getBatchPredictions(
    symbols: string[],
    timeframe: '7d' | '14d' | '30d' = '7d'
  ): Promise<PredictionResponse[]> {
    try {
      logger.info(`Fetching batch predictions for ${symbols.length} symbols`);

      const promises = symbols.map((symbol) =>
        this.getPrediction(symbol, timeframe).catch((error) => {
          logger.warn(`Prediction failed for ${symbol}: ${error.message}`);
          return null;
        })
      );

      const results = await Promise.all(promises);

      // Filter out failed predictions
      const successful = results.filter((r): r is PredictionResponse => r !== null);

      logger.info(
        `Batch predictions complete: ${successful.length}/${symbols.length} successful`
      );

      return successful;
    } catch (error: any) {
      throw new Error(`Failed to get batch predictions: ${error.message}`);
    }
  }

  /**
   * Get risk scores for multiple symbols in parallel
   *
   * @param symbols - Array of cryptocurrency symbols
   * @returns Array of risk scores
   */
  async getBatchRiskScores(symbols: string[]): Promise<RiskScoreResponse[]> {
    try {
      logger.info(`Fetching batch risk scores for ${symbols.length} symbols`);

      const promises = symbols.map((symbol) =>
        this.getRiskScore(symbol).catch((error) => {
          logger.warn(`Risk score failed for ${symbol}: ${error.message}`);
          return null;
        })
      );

      const results = await Promise.all(promises);

      // Filter out failed scores
      const successful = results.filter((r): r is RiskScoreResponse => r !== null);

      logger.info(
        `Batch risk scores complete: ${successful.length}/${symbols.length} successful`
      );

      return successful;
    } catch (error: any) {
      throw new Error(`Failed to get batch risk scores: ${error.message}`);
    }
  }

  /**
   * Format prediction for API response
   * Converts ML service response to backend API format
   */
  formatPredictionForAPI(prediction: PredictionResponse) {
    return {
      symbol: prediction.symbol,
      timeframe: prediction.timeframe,
      prediction: {
        direction: prediction.prediction.direction,
        confidence: prediction.prediction.confidence,
        confidenceScore: prediction.prediction.confidenceScore,
        targetPrice: prediction.prediction.targetPrice,
        targetPriceRange: prediction.prediction.targetPriceRange,
        currentPrice: prediction.prediction.currentPrice,
        potentialGain: prediction.prediction.potentialGain,
      },
      indicators: prediction.indicators,
      explanation: prediction.explanation,
      historicalAccuracy: {
        last30Days: prediction.historical_accuracy.last30Days,
        last90Days: prediction.historical_accuracy.last90Days,
      },
      generatedAt: prediction.generated_at,
      expiresAt: prediction.expires_at,
      modelVersion: prediction.model_version,
    };
  }

  /**
   * Format risk score for API response
   */
  formatRiskScoreForAPI(riskScore: RiskScoreResponse) {
    return {
      symbol: riskScore.symbol,
      riskScore: riskScore.risk_score,
      riskLevel: riskScore.risk_level,
      riskFactors: riskScore.risk_factors,
      warnings: riskScore.warnings,
      analyzedAt: riskScore.analyzed_at,
      cacheExpiresAt: riskScore.cache_expires_at,
    };
  }
}

// Export singleton instance
export const mlPredictionService = new MLPredictionService();

// Export types
export type {
  PredictionRequest,
  PredictionResponse,
  RiskScoreRequest,
  RiskScoreResponse,
  ModelInfo,
};
