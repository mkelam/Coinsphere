import api from './api'

export interface Transaction {
  id: string
  portfolioId: string
  tokenId: string
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out'
  amount: number
  price: number
  fee: number
  notes?: string
  timestamp: string
  token?: {
    symbol: string
    name: string
    logoUrl?: string
    currentPrice?: number
  }
  portfolio?: {
    name: string
  }
}

export interface CreateTransactionRequest {
  portfolioId: string
  tokenSymbol: string
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out'
  amount: number
  price: number
  fee?: number
  notes?: string
  timestamp?: string
}

export interface TransactionsResponse {
  transactions: Transaction[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

export interface BulkTransactionRequest {
  portfolioId: string
  transactions: Omit<CreateTransactionRequest, 'portfolioId'>[]
}

export const transactionsApi = {
  getTransactions: async (portfolioId?: string, limit = 50, offset = 0): Promise<TransactionsResponse> => {
    const params = new URLSearchParams()
    if (portfolioId) params.append('portfolioId', portfolioId)
    params.append('limit', limit.toString())
    params.append('offset', offset.toString())

    const { data } = await api.get<TransactionsResponse>(`/transactions?${params.toString()}`)
    return data
  },

  getTransaction: async (id: string): Promise<{ transaction: Transaction }> => {
    const { data } = await api.get<{ transaction: Transaction }>(`/transactions/${id}`)
    return data
  },

  createTransaction: async (transaction: CreateTransactionRequest): Promise<{ transaction: Transaction }> => {
    const { data } = await api.post<{ transaction: Transaction }>('/transactions', transaction)
    return data
  },

  updateTransaction: async (id: string, updates: Partial<CreateTransactionRequest>): Promise<{ transaction: Transaction }> => {
    const { data } = await api.put<{ transaction: Transaction }>(`/transactions/${id}`, updates)
    return data
  },

  deleteTransaction: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`)
  },

  bulkCreate: async (request: BulkTransactionRequest): Promise<{ success: number; errors: any[]; transactions: Transaction[] }> => {
    const { data } = await api.post<{ success: number; errors: any[]; transactions: Transaction[] }>('/transactions/bulk', request)
    return data
  },
}
