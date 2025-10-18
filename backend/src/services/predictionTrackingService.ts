/**
 * Prediction Tracking Service
 *
 * Stores ML predictions and calculates accuracy after target date
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export interface PredictionData {
  tokenId: string;
  symbol: string;
  timeframe: '7d' | '14d' | '30d';
  direction: 'bullish' | 'bearish' | 'neutral';
  predictedPrice: number;
  priceAtPrediction: number;
  targetPriceRange: {
    low: number;
    high: number;
  };
  confidence: number;
  confidenceScore: number;
  modelVersion: string;
  modelType?: 'single' | 'ensemble';
  ensembleMethod?: 'weighted_average' | 'majority_voting' | 'max_confidence';
  features?: Record<string, any>;
}

/**
 * Store a new prediction for tracking
 */
export async function storePrediction(data: PredictionData): Promise<string> {
  try {
    const timeframeDays = parseInt(data.timeframe.replace('d', ''));
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + timeframeDays);

    const expiresAt = new Date(targetDate);
    expiresAt.setHours(expiresAt.getHours() + 1); // Prediction data expires 1 hour after target

    const prediction = await prisma.prediction.create({
      data: {
        tokenId: data.tokenId,
        timeframe: data.timeframe,
        direction: data.direction,
        predictedPrice: new Prisma.Decimal(data.predictedPrice),
        priceAtPrediction: new Prisma.Decimal(data.priceAtPrediction),
        targetPriceRange: data.targetPriceRange as Prisma.JsonValue,
        confidence: new Prisma.Decimal(data.confidence),
        confidenceScore: new Prisma.Decimal(data.confidenceScore),
        modelVersion: data.modelVersion,
        modelType: data.modelType,
        ensembleMethod: data.ensembleMethod,
        features: data.features as Prisma.JsonValue,
        targetDate,
        expiresAt,
      },
    });

    logger.info(`Stored prediction for ${data.symbol}`, {
      predictionId: prediction.id,
      timeframe: data.timeframe,
      direction: data.direction,
      targetDate: targetDate.toISOString(),
    });

    return prediction.id;
  } catch (error) {
    logger.error('Failed to store prediction:', error);
    throw error;
  }
}

/**
 * Calculate accuracy for predictions that have reached their target date
 */
export async function calculatePredictionAccuracy(): Promise<void> {
  try {
    // Find predictions that have reached target date but haven't been evaluated
    const pendingPredictions = await prisma.prediction.findMany({
      where: {
        targetDate: {
          lte: new Date(),
        },
        outcomeCalculatedAt: null,
      },
      include: {
        token: true,
      },
    });

    logger.info(`Found ${pendingPredictions.length} predictions to evaluate`);

    for (const prediction of pendingPredictions) {
      await evaluatePrediction(prediction.id);
    }

    logger.info(`Completed accuracy calculation for ${pendingPredictions.length} predictions`);
  } catch (error) {
    logger.error('Failed to calculate prediction accuracy:', error);
    throw error;
  }
}

/**
 * Evaluate a single prediction
 */
async function evaluatePrediction(predictionId: string): Promise<void> {
  try {
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
      include: { token: true },
    });

    if (!prediction) {
      throw new Error(`Prediction ${predictionId} not found`);
    }

    // Get actual price at target date from price_data table
    const actualPriceData = await prisma.$queryRaw<Array<{ close: Prisma.Decimal }>>`
      SELECT close
      FROM price_data
      WHERE token_id = ${prediction.tokenId}
        AND time >= ${prediction.targetDate}
      ORDER BY time ASC
      LIMIT 1
    `;

    if (actualPriceData.length === 0) {
      logger.warn(`No price data available for prediction ${predictionId} at target date`);
      return;
    }

    const actualPrice = parseFloat(actualPriceData[0].close.toString());
    const predictedPrice = parseFloat(prediction.predictedPrice.toString());
    const priceAtPrediction = parseFloat(prediction.priceAtPrediction.toString());

    // Calculate if direction was correct
    const predictedDirection = prediction.direction;
    const actualDirection =
      actualPrice > priceAtPrediction
        ? 'bullish'
        : actualPrice < priceAtPrediction
        ? 'bearish'
        : 'neutral';

    const wasCorrect = predictedDirection === actualDirection;

    // Calculate price error percentage
    const priceError = Math.abs((actualPrice - predictedPrice) / actualPrice) * 100;

    // Calculate accuracy score (0-1 scale)
    // Score based on how close the prediction was
    const maxError = 50; // 50% error = 0 score
    const accuracyScore = Math.max(0, 1 - priceError / maxError);

    // Update prediction with outcome
    await prisma.prediction.update({
      where: { id: predictionId },
      data: {
        actualPrice: new Prisma.Decimal(actualPrice),
        wasCorrect,
        accuracyScore: new Prisma.Decimal(accuracyScore),
        priceError: new Prisma.Decimal(priceError),
        outcomeCalculatedAt: new Date(),
      },
    });

    logger.info(`Evaluated prediction ${predictionId}`, {
      symbol: prediction.token.symbol,
      predictedPrice,
      actualPrice,
      wasCorrect,
      accuracyScore,
      priceError,
    });
  } catch (error) {
    logger.error(`Failed to evaluate prediction ${predictionId}:`, error);
    throw error;
  }
}

/**
 * Get accuracy metrics for a specific token
 */
export async function getTokenAccuracy(tokenId: string, days: number = 30) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const predictions = await prisma.prediction.findMany({
      where: {
        tokenId,
        outcomeCalculatedAt: {
          gte: since,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (predictions.length === 0) {
      return {
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        averageAccuracyScore: 0,
        averagePriceError: 0,
        byTimeframe: {},
        byDirection: {},
      };
    }

    const correctPredictions = predictions.filter((p) => p.wasCorrect).length;
    const accuracy = (correctPredictions / predictions.length) * 100;

    const averageAccuracyScore =
      predictions.reduce((sum, p) => sum + parseFloat(p.accuracyScore?.toString() || '0'), 0) /
      predictions.length;

    const averagePriceError =
      predictions.reduce((sum, p) => sum + parseFloat(p.priceError?.toString() || '0'), 0) /
      predictions.length;

    // Group by timeframe
    const byTimeframe = predictions.reduce((acc, p) => {
      const tf = p.timeframe;
      if (!acc[tf]) {
        acc[tf] = { total: 0, correct: 0, accuracy: 0 };
      }
      acc[tf].total++;
      if (p.wasCorrect) acc[tf].correct++;
      acc[tf].accuracy = (acc[tf].correct / acc[tf].total) * 100;
      return acc;
    }, {} as Record<string, { total: number; correct: number; accuracy: number }>);

    // Group by direction
    const byDirection = predictions.reduce((acc, p) => {
      const dir = p.direction;
      if (!acc[dir]) {
        acc[dir] = { total: 0, correct: 0, accuracy: 0 };
      }
      acc[dir].total++;
      if (p.wasCorrect) acc[dir].correct++;
      acc[dir].accuracy = (acc[dir].correct / acc[dir].total) * 100;
      return acc;
    }, {} as Record<string, { total: number; correct: number; accuracy: number }>);

    return {
      totalPredictions: predictions.length,
      correctPredictions,
      accuracy,
      averageAccuracyScore,
      averagePriceError,
      byTimeframe,
      byDirection,
    };
  } catch (error) {
    logger.error('Failed to get token accuracy:', error);
    throw error;
  }
}

/**
 * Get overall accuracy metrics across all tokens
 */
export async function getOverallAccuracy(days: number = 30) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const predictions = await prisma.prediction.findMany({
      where: {
        outcomeCalculatedAt: {
          gte: since,
        },
      },
      include: {
        token: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (predictions.length === 0) {
      return {
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        averageAccuracyScore: 0,
        averagePriceError: 0,
        byToken: {},
        byTimeframe: {},
        byModelVersion: {},
        recentPredictions: [],
      };
    }

    const correctPredictions = predictions.filter((p) => p.wasCorrect).length;
    const accuracy = (correctPredictions / predictions.length) * 100;

    const averageAccuracyScore =
      predictions.reduce((sum, p) => sum + parseFloat(p.accuracyScore?.toString() || '0'), 0) /
      predictions.length;

    const averagePriceError =
      predictions.reduce((sum, p) => sum + parseFloat(p.priceError?.toString() || '0'), 0) /
      predictions.length;

    // Group by token
    const byToken = predictions.reduce((acc, p) => {
      const symbol = p.token.symbol;
      if (!acc[symbol]) {
        acc[symbol] = { total: 0, correct: 0, accuracy: 0 };
      }
      acc[symbol].total++;
      if (p.wasCorrect) acc[symbol].correct++;
      acc[symbol].accuracy = (acc[symbol].correct / acc[symbol].total) * 100;
      return acc;
    }, {} as Record<string, { total: number; correct: number; accuracy: number }>);

    // Group by timeframe
    const byTimeframe = predictions.reduce((acc, p) => {
      const tf = p.timeframe;
      if (!acc[tf]) {
        acc[tf] = { total: 0, correct: 0, accuracy: 0 };
      }
      acc[tf].total++;
      if (p.wasCorrect) acc[tf].correct++;
      acc[tf].accuracy = (acc[tf].correct / acc[tf].total) * 100;
      return acc;
    }, {} as Record<string, { total: number; correct: number; accuracy: number }>);

    // Group by model version
    const byModelVersion = predictions.reduce((acc, p) => {
      const mv = p.modelVersion;
      if (!acc[mv]) {
        acc[mv] = { total: 0, correct: 0, accuracy: 0 };
      }
      acc[mv].total++;
      if (p.wasCorrect) acc[mv].correct++;
      acc[mv].accuracy = (acc[mv].correct / acc[mv].total) * 100;
      return acc;
    }, {} as Record<string, { total: number; correct: number; accuracy: number }>);

    // Get recent predictions (last 20)
    const recentPredictions = predictions.slice(0, 20).map((p) => ({
      id: p.id,
      symbol: p.token.symbol,
      timeframe: p.timeframe,
      direction: p.direction,
      predictedPrice: parseFloat(p.predictedPrice.toString()),
      actualPrice: parseFloat(p.actualPrice?.toString() || '0'),
      wasCorrect: p.wasCorrect,
      accuracyScore: parseFloat(p.accuracyScore?.toString() || '0'),
      priceError: parseFloat(p.priceError?.toString() || '0'),
      createdAt: p.createdAt,
      targetDate: p.targetDate,
    }));

    return {
      totalPredictions: predictions.length,
      correctPredictions,
      accuracy,
      averageAccuracyScore,
      averagePriceError,
      byToken,
      byTimeframe,
      byModelVersion,
      recentPredictions,
    };
  } catch (error) {
    logger.error('Failed to get overall accuracy:', error);
    throw error;
  }
}

/**
 * Get prediction history for a specific token
 */
export async function getPredictionHistory(tokenId: string, limit: number = 50) {
  try {
    const predictions = await prisma.prediction.findMany({
      where: {
        tokenId,
      },
      include: {
        token: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return predictions.map((p) => ({
      id: p.id,
      symbol: p.token.symbol,
      timeframe: p.timeframe,
      direction: p.direction,
      predictedPrice: parseFloat(p.predictedPrice.toString()),
      priceAtPrediction: parseFloat(p.priceAtPrediction.toString()),
      targetPriceRange: p.targetPriceRange as { low: number; high: number },
      confidence: parseFloat(p.confidence.toString()),
      confidenceScore: parseFloat(p.confidenceScore.toString()),
      modelVersion: p.modelVersion,
      modelType: p.modelType,
      ensembleMethod: p.ensembleMethod,
      actualPrice: p.actualPrice ? parseFloat(p.actualPrice.toString()) : null,
      wasCorrect: p.wasCorrect,
      accuracyScore: p.accuracyScore ? parseFloat(p.accuracyScore.toString()) : null,
      priceError: p.priceError ? parseFloat(p.priceError.toString()) : null,
      createdAt: p.createdAt,
      targetDate: p.targetDate,
      outcomeCalculatedAt: p.outcomeCalculatedAt,
    }));
  } catch (error) {
    logger.error('Failed to get prediction history:', error);
    throw error;
  }
}

export const predictionTrackingService = {
  storePrediction,
  calculatePredictionAccuracy,
  getTokenAccuracy,
  getOverallAccuracy,
  getPredictionHistory,
};
