import { useEffect } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { Header } from "@/components/header"
import { Layout } from "@/components/Layout"
import { PortfolioHero } from "@/components/portfolio-hero"
import { QuickActions } from "@/components/quick-actions"
import { AssetAllocation } from "@/components/asset-allocation"
import { HoldingsTable } from "@/components/holdings-table"
import { MarketInsights } from "@/components/market-insights"
import { TransactionHistory } from "@/components/transaction-history"
import { PriceHistoryChart } from "@/components/price-history-chart"
import { usePortfolio } from "@/contexts/PortfolioContext"
import { LoadingSpinner } from "@/components/LoadingScreen"
import { GlassCard } from "@/components/glass-card"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    currentPortfolio,
    portfolioSummary,
    isLoading,
    error,
    selectPortfolio
  } = usePortfolio()

  // Handle portfolio selection from URL or location state
  useEffect(() => {
    const portfolioIdFromState = location.state?.portfolioId
    const portfolioIdFromUrl = searchParams.get('portfolioId')
    const portfolioId = portfolioIdFromUrl || portfolioIdFromState

    if (portfolioId && portfolioId !== currentPortfolio?.id) {
      selectPortfolio(portfolioId)
    }
  }, [location.state, searchParams, currentPortfolio?.id, selectPortfolio])

  // Get top asset for market insights (or default to BTC)
  const topAsset = currentPortfolio?.holdings?.[0]?.token?.symbol || 'BTC'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner />
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <GlassCard hover={false} className="text-center py-12">
            <div className="text-red-500 mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-white mb-2">Error Loading Portfolio</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <Button onClick={() => navigate('/portfolios')}>
              Go to Portfolios
            </Button>
          </GlassCard>
        </main>
      </div>
    )
  }

  // No portfolios exist - show onboarding prompt
  if (!portfolioSummary || portfolioSummary.portfolios.length === 0) {
    return (
      <div className="min-h-screen bg-transparent">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <GlassCard hover={false} className="text-center py-16">
            <div className="text-6xl mb-6">📊</div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome to Coinsphere!
            </h1>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Create your first portfolio to start tracking your crypto holdings with AI-powered predictions and risk analysis.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate('/onboarding')}
                size="lg"
                className="min-w-[200px]"
              >
                <Plus className="w-5 h-5 mr-2" />
                Get Started
              </Button>
              <Button
                onClick={() => navigate('/portfolios')}
                variant="outline"
                size="lg"
              >
                Browse Features
              </Button>
            </div>
          </GlassCard>
        </main>
      </div>
    )
  }

  // No current portfolio selected - shouldn't happen but handle gracefully
  if (!currentPortfolio) {
    return (
      <div className="min-h-screen bg-transparent">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <GlassCard hover={false} className="text-center py-12">
            <h2 className="text-xl font-semibold text-white mb-4">No Portfolio Selected</h2>
            <p className="text-white/70 mb-6">Please select a portfolio to view</p>
            <Button onClick={() => navigate('/portfolios')}>
              View Portfolios
            </Button>
          </GlassCard>
        </main>
      </div>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-transparent">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Portfolio Hero - Shows total value and 24h change */}
          <PortfolioHero />

          {/* Quick Actions */}
          <QuickActions />

          {/* Market Insights - Shows predictions for top holding or BTC */}
          {currentPortfolio.holdings && currentPortfolio.holdings.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Market Insights</h2>
              <MarketInsights symbol={topAsset} />
            </div>
          )}

          {/* Price History Chart for top asset */}
          {currentPortfolio.holdings && currentPortfolio.holdings.length > 0 && (
            <div className="mb-6">
              <PriceHistoryChart symbol={topAsset} timeframe="7d" />
            </div>
          )}

          {/* Asset Allocation and Holdings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AssetAllocation />
            <HoldingsTable />
          </div>

          {/* Transaction History */}
          <TransactionHistory />
        </main>
      </div>
    </Layout>
  )
}
