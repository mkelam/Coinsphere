import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Enable sending cookies with requests (for CORS)
  timeout: 10000,
})

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request interceptor to add auth token and CSRF token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add CSRF token for state-changing operations
    const csrfToken = localStorage.getItem('csrfToken')
    if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
      config.headers['X-CSRF-Token'] = csrfToken
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        // No refresh token, logout user
        processQueue(error, null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        // Attempt to refresh token
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        })

        const { accessToken, refreshToken: newRefreshToken } = data

        // Update tokens
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
        }

        // Process queued requests
        processQueue(null, accessToken)

        // Retry original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        processQueue(refreshError, null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  subscriptionTier: string
  createdAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface ApiError {
  error: string
  details?: any
}

// Helper function to fetch CSRF token
const fetchCsrfToken = async (): Promise<void> => {
  try {
    const { data } = await api.get<{ csrfToken: string }>('/csrf-token')
    localStorage.setItem('csrfToken', data.csrfToken)
  } catch (error) {
    console.error('Failed to fetch CSRF token', error)
  }
}

// Authentication API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials)

    // Fetch CSRF token after successful login
    await fetchCsrfToken()

    return data
  },

  signup: async (userData: SignupRequest): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', userData)

    // Fetch CSRF token after successful signup
    await fetchCsrfToken()

    return data
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me')
    return data
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('csrfToken')
  },
}

// Exchange Connection Types
export interface ExchangeConnection {
  id: string
  exchange: string
  label: string
  status: string
  lastSyncAt: string | null
  lastError: string | null
  autoSync: boolean
  createdAt: string
}

export interface SupportedExchange {
  id: string
  name: string
  requiresPassphrase: boolean
}

export interface ConnectExchangeRequest {
  exchange: string
  apiKey: string
  apiSecret: string
  passphrase?: string
  label?: string
}

export interface TestConnectionRequest {
  exchange: string
  apiKey: string
  apiSecret: string
  passphrase?: string
}

export interface ExchangeResponse {
  success: boolean
  message: string
  connectionId?: string
}

// Exchange API
export const exchangeApi = {
  getSupportedExchanges: async (): Promise<{ exchanges: SupportedExchange[] }> => {
    const { data } = await api.get('/exchanges/supported')
    return data
  },

  testConnection: async (request: TestConnectionRequest): Promise<ExchangeResponse> => {
    const { data } = await api.post('/exchanges/test', request)
    return data
  },

  connectExchange: async (request: ConnectExchangeRequest): Promise<ExchangeResponse> => {
    const { data } = await api.post('/exchanges/connect', request)
    return data
  },

  getConnections: async (): Promise<{ connections: ExchangeConnection[] }> => {
    const { data } = await api.get('/exchanges/connections')
    return data
  },

  syncConnection: async (connectionId: string): Promise<ExchangeResponse> => {
    const { data } = await api.post(`/exchanges/connections/${connectionId}/sync`)
    return data
  },

  disconnectExchange: async (connectionId: string): Promise<ExchangeResponse> => {
    const { data } = await api.delete(`/exchanges/connections/${connectionId}`)
    return data
  },

  syncAll: async (): Promise<ExchangeResponse> => {
    const { data } = await api.post('/exchanges/sync-all')
    return data
  },
}

// Token Types
export interface Token {
  id: string
  symbol: string
  name: string
  blockchain: string
  logoUrl?: string
  currentPrice?: number
  priceChange24h?: number
  priceChangePercent24h?: number
  marketCap?: number
  volume24h?: number
  high24h?: number
  low24h?: number
  ath?: number
  athDate?: string
  atl?: number
  atlDate?: string
  circulatingSupply?: number
  maxSupply?: number
  totalSupply?: number
  lastUpdated?: string
}

export interface PricePoint {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Prediction {
  id?: string
  symbol: string
  currentPrice: number
  predictedPrice: number
  predictionChange: number
  predictionChangePercent: number
  confidence: number
  daysAhead: number
  createdAt?: string
  timestamp: string
}

export interface RiskScore {
  id?: string
  symbol: string
  riskScore: number
  riskLevel: string  // conservative, moderate, degen
  volatility: number
  createdAt?: string
  timestamp: string
}

// Token API
export const tokenApi = {
  /**
   * Get all tokens
   */
  getAllTokens: async (): Promise<Token[]> => {
    const { data } = await api.get<Token[]>('/tokens')
    return data
  },

  /**
   * Get single token by symbol
   */
  getToken: async (symbol: string): Promise<Token> => {
    const { data } = await api.get<Token>(`/tokens/${symbol}`)
    return data
  },

  /**
   * Get price history for a token
   */
  getPriceHistory: async (
    symbol: string,
    timeframe: string = '7d'
  ): Promise<PricePoint[]> => {
    const { data } = await api.get<PricePoint[]>(`/tokens/${symbol}/history`, {
      params: { timeframe }
    })
    return data
  },

  /**
   * Search tokens by query
   */
  searchTokens: async (query: string): Promise<Token[]> => {
    const { data } = await api.get<Token[]>('/tokens/search', {
      params: { q: query }
    })
    return data
  },
}

// ML Service URL
const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8000'

// Prediction API (backend proxies to ML service)
export const predictionApi = {
  /**
   * Get price prediction for a symbol
   * Backend will fetch from ML service or cache
   */
  getPrediction: async (symbol: string, daysAhead: number = 7): Promise<Prediction> => {
    const { data } = await api.get<Prediction>(`/predictions/${symbol}`, {
      params: { daysAhead }
    })
    return data
  },

  /**
   * Get risk score for a symbol
   * Backend will fetch from ML service or cache
   */
  getRiskScore: async (symbol: string): Promise<RiskScore> => {
    const { data } = await api.get<RiskScore>(`/risk/${symbol}`)
    return data
  },

  /**
   * Direct call to ML service (if backend proxy doesn't exist yet)
   */
  getPredictionDirect: async (
    symbol: string,
    historicalPrices: number[],
    daysAhead: number = 7
  ): Promise<Prediction> => {
    const { data } = await axios.post<Prediction>(`${ML_SERVICE_URL}/predict`, {
      symbol,
      historical_prices: historicalPrices,
      days_ahead: daysAhead
    })
    return data
  },

  /**
   * Direct call to ML service for risk score
   */
  getRiskScoreDirect: async (
    symbol: string,
    historicalPrices: number[]
  ): Promise<RiskScore> => {
    const { data } = await axios.post<RiskScore>(`${ML_SERVICE_URL}/risk-score`, {
      symbol,
      historical_prices: historicalPrices
    })
    return data
  },
}

export default api
