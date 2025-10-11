import api from "./api"

export interface Portfolio {
  id: string
  name: string
  icon: string
  currency: string
  description?: string
  totalValue: number
  change24h: number
  changePercent24h: number
  assetCount: number
  transactionCount: number
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface CreatePortfolioRequest {
  name: string
  icon: string
  currency: string
  description?: string
}

export interface UpdatePortfolioRequest {
  name: string
  icon: string
  currency: string
  description?: string
}

export const portfolioService = {
  /**
   * Get all portfolios for the authenticated user
   */
  async getAll(): Promise<Portfolio[]> {
    const response = await api.get<{ portfolios: Portfolio[] }>("/portfolios")
    return response.data.portfolios
  },

  /**
   * Get a single portfolio by ID
   */
  async getById(id: string): Promise<Portfolio> {
    const response = await api.get<{ portfolio: Portfolio }>(`/portfolios/${id}`)
    return response.data.portfolio
  },

  /**
   * Create a new portfolio
   */
  async create(data: CreatePortfolioRequest): Promise<Portfolio> {
    const response = await api.post<{ portfolio: Portfolio }>("/portfolios", data)
    return response.data.portfolio
  },

  /**
   * Update an existing portfolio
   */
  async update(id: string, data: UpdatePortfolioRequest): Promise<Portfolio> {
    const response = await api.put<{ portfolio: Portfolio }>(
      `/portfolios/${id}`,
      data
    )
    return response.data.portfolio
  },

  /**
   * Delete a portfolio
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/portfolios/${id}`)
  },

  /**
   * Set a portfolio as active
   */
  async setActive(id: string): Promise<Portfolio> {
    const response = await api.post<{ portfolio: Portfolio }>(
      `/portfolios/${id}/set-active`,
      {}
    )
    return response.data.portfolio
  },
}
