import api from './api'

export interface Token {
  id: string
  symbol: string
  name: string
  logoUrl?: string
  currentPrice: number
  priceChange24h: number
  marketCap?: number
  volume24h?: number
}

export interface Holding {
  id: string
  tokenId: string
  amount: number
  averageBuyPrice: number
  token: Token
  currentValue: number
  profitLoss: number
  profitLossPercentage: number
}

export interface Portfolio {
  id: string
  name: string
  description?: string
  holdings: Holding[]
  totalValue: number
  totalProfitLoss: number
  totalProfitLossPercentage: number
}

export interface PortfolioSummary {
  portfolios: Portfolio[]
  totalValue: number
  totalProfitLoss: number
  totalProfitLossPercentage: number
  change24h: number
  change24hPercentage: number
}

export interface CreatePortfolioRequest {
  name: string
  description?: string
}

export interface AddHoldingRequest {
  tokenSymbol: string
  amount: number
  averageBuyPrice?: number
}

// Portfolio API
export const portfolioApi = {
  // Get all portfolios for current user
  getPortfolios: async (): Promise<PortfolioSummary> => {
    const { data } = await api.get<PortfolioSummary>('/portfolios')
    return data
  },

  // Get single portfolio by ID
  getPortfolio: async (portfolioId: string): Promise<Portfolio> => {
    const { data } = await api.get<Portfolio>(`/portfolios/${portfolioId}`)
    return data
  },

  // Create new portfolio
  createPortfolio: async (portfolio: CreatePortfolioRequest): Promise<Portfolio> => {
    const { data } = await api.post<Portfolio>('/portfolios', portfolio)
    return data
  },

  // Add holding to portfolio
  addHolding: async (portfolioId: string, holding: AddHoldingRequest): Promise<Holding> => {
    const { data } = await api.post<Holding>(`/portfolios/${portfolioId}/holdings`, holding)
    return data
  },

  // Remove holding from portfolio
  removeHolding: async (portfolioId: string, holdingId: string): Promise<void> => {
    await api.delete(`/portfolios/${portfolioId}/holdings/${holdingId}`)
  },

  // Update holding amount
  updateHolding: async (
    portfolioId: string,
    holdingId: string,
    updates: { amount?: number; averageBuyPrice?: number }
  ): Promise<Holding> => {
    const { data } = await api.patch<Holding>(`/portfolios/${portfolioId}/holdings/${holdingId}`, updates)
    return data
  },

  // Delete portfolio
  deletePortfolio: async (portfolioId: string): Promise<void> => {
    await api.delete(`/portfolios/${portfolioId}`)
  },
}

// Token API
export const tokenApi = {
  // Get all available tokens
  getTokens: async (): Promise<Token[]> => {
    const { data } = await api.get<Token[]>('/tokens')
    return data
  },

  // Search tokens by symbol or name
  searchTokens: async (query: string): Promise<Token[]> => {
    const { data } = await api.get<Token[]>(`/tokens/search?q=${encodeURIComponent(query)}`)
    return data
  },

  // Get token by symbol
  getTokenBySymbol: async (symbol: string): Promise<Token> => {
    const { data } = await api.get<Token>(`/tokens/${symbol}`)
    return data
  },
}
