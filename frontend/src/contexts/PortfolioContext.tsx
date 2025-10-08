import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { portfolioApi, PortfolioSummary, Portfolio } from '@/services/portfolio'
import { useAuth } from './AuthContext'

interface PortfolioContextType {
  portfolioSummary: PortfolioSummary | null
  currentPortfolio: Portfolio | null
  isLoading: boolean
  error: string | null
  refreshPortfolios: () => Promise<void>
  selectPortfolio: (portfolioId: string) => Promise<void>
  createPortfolio: (name: string, description?: string) => Promise<Portfolio>
  addHolding: (portfolioId: string, tokenSymbol: string, amount: number, averageBuyPrice?: number) => Promise<void>
  removeHolding: (portfolioId: string, holdingId: string) => Promise<void>
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null)
  const [currentPortfolio, setCurrentPortfolio] = useState<Portfolio | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  const refreshPortfolios = async () => {
    if (!isAuthenticated) {
      setPortfolioSummary(null)
      setCurrentPortfolio(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const summary = await portfolioApi.getPortfolios()
      setPortfolioSummary(summary)

      // Auto-select first portfolio if none selected
      if (summary.portfolios.length > 0 && !currentPortfolio) {
        setCurrentPortfolio(summary.portfolios[0])
      }
    } catch (err: any) {
      console.error('Failed to fetch portfolios:', err)
      setError(err.response?.data?.error || 'Failed to load portfolios')
    } finally {
      setIsLoading(false)
    }
  }

  const selectPortfolio = async (portfolioId: string) => {
    try {
      const portfolio = await portfolioApi.getPortfolio(portfolioId)
      setCurrentPortfolio(portfolio)
    } catch (err: any) {
      console.error('Failed to fetch portfolio:', err)
      setError(err.response?.data?.error || 'Failed to load portfolio')
    }
  }

  const createPortfolio = async (name: string, description?: string): Promise<Portfolio> => {
    try {
      const portfolio = await portfolioApi.createPortfolio({ name, description })
      await refreshPortfolios()
      return portfolio
    } catch (err: any) {
      console.error('Failed to create portfolio:', err)
      throw new Error(err.response?.data?.error || 'Failed to create portfolio')
    }
  }

  const addHolding = async (
    portfolioId: string,
    tokenSymbol: string,
    amount: number,
    averageBuyPrice?: number
  ) => {
    try {
      await portfolioApi.addHolding(portfolioId, { tokenSymbol, amount, averageBuyPrice })
      await refreshPortfolios()
      if (currentPortfolio?.id === portfolioId) {
        await selectPortfolio(portfolioId)
      }
    } catch (err: any) {
      console.error('Failed to add holding:', err)
      throw new Error(err.response?.data?.error || 'Failed to add holding')
    }
  }

  const removeHolding = async (portfolioId: string, holdingId: string) => {
    try {
      await portfolioApi.removeHolding(portfolioId, holdingId)
      await refreshPortfolios()
      if (currentPortfolio?.id === portfolioId) {
        await selectPortfolio(portfolioId)
      }
    } catch (err: any) {
      console.error('Failed to remove holding:', err)
      throw new Error(err.response?.data?.error || 'Failed to remove holding')
    }
  }

  // Load portfolios on mount and when auth changes
  useEffect(() => {
    refreshPortfolios()
  }, [isAuthenticated])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      refreshPortfolios()
    }, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const value: PortfolioContextType = {
    portfolioSummary,
    currentPortfolio,
    isLoading,
    error,
    refreshPortfolios,
    selectPortfolio,
    createPortfolio,
    addHolding,
    removeHolding,
  }

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export function usePortfolio() {
  const context = useContext(PortfolioContext)
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider')
  }
  return context
}
