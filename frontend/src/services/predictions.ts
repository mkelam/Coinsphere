import api from './api'

export interface TechnicalIndicators {
  rsi?: number
  macd?: {
    value: number
    signal: string
  }
  bollingerBands?: {
    position: string
  }
  volumeTrend?: string
}

export interface Prediction {
  predictedPrice: number
  change: number
  changePercent: number
  confidence: number
  direction: 'bullish' | 'bearish' | 'neutral'
  factors: string[]
  technicalIndicators: TechnicalIndicators
  modelVersion: string
}

export interface PredictionResponse {
  symbol: string
  name: string
  currentPrice: number
  prediction: Prediction
  timeframe: string
  timestamp: string
}

export interface BatchPredictionRequest {
  symbols: string[]
  timeframe?: string
}

export interface BatchPredictionResponse {
  predictions: PredictionResponse[]
  timestamp: string
}

// Predictions API
export const predictionsApi = {
  // Get prediction for a single token
  getPrediction: async (
    symbol: string,
    timeframe: string = '24h'
  ): Promise<PredictionResponse> => {
    const { data } = await api.get<PredictionResponse>(
      `/predictions/${symbol}`,
      { params: { timeframe } }
    )
    return data
  },

  // Get predictions for multiple tokens
  getBatchPredictions: async (
    symbols: string[],
    timeframe: string = '24h'
  ): Promise<BatchPredictionResponse> => {
    const { data } = await api.post<BatchPredictionResponse>(
      '/predictions/batch',
      { symbols, timeframe }
    )
    return data
  },

  // Get prediction history for a token
  getPredictionHistory: async (
    symbol: string,
    limit: number = 30
  ): Promise<any> => {
    const { data } = await api.get(`/predictions/${symbol}/history`, {
      params: { limit },
    })
    return data
  },
}

export default predictionsApi
