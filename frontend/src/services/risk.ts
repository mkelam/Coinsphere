import api from './api'

export interface RiskComponents {
  liquidityScore: number
  volatilityScore: number
  marketCapScore: number
  volumeScore: number
}

export interface RiskAnalysis {
  summary: string
  warnings: string[]
  insights: string[]
}

export interface RiskScore {
  overallScore: number
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'extreme'
  components: RiskComponents
  analysis: RiskAnalysis
}

export interface RiskScoreResponse {
  symbol: string
  name: string
  riskScore: RiskScore
  timestamp: string
}

export interface BatchRiskScoreRequest {
  symbols: string[]
}

export interface BatchRiskScoreResponse {
  scores: RiskScoreResponse[]
  timestamp: string
}

// Risk Scoring API
export const riskApi = {
  // Get risk score for a single token
  getRiskScore: async (symbol: string): Promise<RiskScoreResponse> => {
    const { data } = await api.get<RiskScoreResponse>(`/risk/${symbol}`)
    return data
  },

  // Get risk scores for multiple tokens
  getBatchRiskScores: async (
    symbols: string[]
  ): Promise<BatchRiskScoreResponse> => {
    const { data} = await api.post<BatchRiskScoreResponse>('/risk/batch', {
      symbols,
    })
    return data
  },
}

export default riskApi
