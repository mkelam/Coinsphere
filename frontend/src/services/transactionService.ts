import api from "./api"

export type TransactionType = "buy" | "sell" | "transfer" | "receive"

export interface Transaction {
  id: string
  type: TransactionType
  asset: string
  assetSymbol: string
  amount: number
  pricePerUnit: number
  totalValue: number
  fee: number
  date: string
  portfolio: string
  exchange: string
  notes?: string
}

export interface CreateTransactionRequest {
  type: TransactionType
  asset: string
  assetSymbol: string
  amount: number
  pricePerUnit: number
  fee: number
  date: string
  portfolio: string
  exchange: string
  notes?: string
}

export interface UpdateTransactionRequest {
  type: TransactionType
  amount: number
  pricePerUnit: number
  fee: number
  date: string
  portfolio: string
  exchange: string
  notes?: string
}

export const transactionService = {
  /**
   * Get all transactions for the authenticated user
   */
  async getAll(): Promise<Transaction[]> {
    const response = await api.get<{ transactions: Transaction[] }>("/transactions")
    return response.data.transactions
  },

  /**
   * Get transactions for a specific portfolio
   */
  async getByPortfolio(portfolioId: string): Promise<Transaction[]> {
    const response = await api.get<{ transactions: Transaction[] }>(
      `/portfolios/${portfolioId}/transactions`
    )
    return response.data.transactions
  },

  /**
   * Get a single transaction by ID
   */
  async getById(id: string): Promise<Transaction> {
    const response = await api.get<{ transaction: Transaction }>(
      `/transactions/${id}`
    )
    return response.data.transaction
  },

  /**
   * Create a new transaction
   */
  async create(data: CreateTransactionRequest): Promise<Transaction> {
    const response = await api.post<{ transaction: Transaction }>(
      "/transactions",
      data
    )
    return response.data.transaction
  },

  /**
   * Update an existing transaction
   */
  async update(id: string, data: UpdateTransactionRequest): Promise<Transaction> {
    const response = await api.put<{ transaction: Transaction }>(
      `/transactions/${id}`,
      data
    )
    return response.data.transaction
  },

  /**
   * Delete a transaction
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`)
  },

  /**
   * Get transaction statistics
   */
  async getStats(): Promise<{
    totalBuys: number
    totalSells: number
    totalFees: number
    transactionCount: number
  }> {
    const response = await api.get<{
      stats: {
        totalBuys: number
        totalSells: number
        totalFees: number
        transactionCount: number
      }
    }>("/transactions/stats")
    return response.data.stats
  },
}
