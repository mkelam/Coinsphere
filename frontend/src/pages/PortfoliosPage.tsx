import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, MoreVertical, TrendingUp, TrendingDown } from "lucide-react"
import { Header } from "@/components/header"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { LoadingSpinner } from "@/components/LoadingScreen"
import { CreatePortfolioModal } from "@/components/CreatePortfolioModal"
import { EditPortfolioModal } from "@/components/EditPortfolioModal"
import { portfolioService, Portfolio } from "@/services/portfolioService"

export function PortfoliosPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null)

  // Fetch portfolios from API
  useEffect(() => {
    const fetchPortfolios = async () => {
      setLoading(true)
      try {
        const data = await portfolioService.getAll()
        setPortfolios(data)
      } catch (error: any) {
        console.error("Error fetching portfolios:", error)
        toast.error(error.message || "Failed to load portfolios")
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolios()
  }, [])

  const getTierLimit = () => {
    const tier = user?.subscriptionTier || 'free'
    switch (tier) {
      case 'free': return 5
      case 'plus': return 25
      case 'pro': return Infinity
      case 'power': return Infinity
      default: return 5
    }
  }

  const canCreatePortfolio = portfolios.length < getTierLimit()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - then.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const handleSetActive = async (portfolioId: string) => {
    try {
      await portfolioService.setActive(portfolioId)
      setPortfolios(portfolios.map(p => ({
        ...p,
        isActive: p.id === portfolioId
      })))
      toast.success("Active portfolio updated!")
    } catch (error: any) {
      console.error("Error setting active portfolio:", error)
      toast.error(error.message || "Failed to set active portfolio")
    }
  }

  const handleViewDashboard = (portfolioId: string) => {
    navigate('/dashboard', { state: { portfolioId } })
  }

  const handleCreatePortfolio = async (newPortfolio: {
    name: string
    icon: string
    currency: string
    description: string
  }) => {
    try {
      const portfolio = await portfolioService.create(newPortfolio)
      setPortfolios([...portfolios, portfolio])
      setShowCreateModal(false)
      toast.success(`Portfolio "${newPortfolio.name}" created successfully!`)
    } catch (error: any) {
      console.error("Error creating portfolio:", error)
      toast.error(error.message || "Failed to create portfolio")
    }
  }

  const handleEditPortfolio = async (
    id: string,
    updates: {
      name: string
      icon: string
      currency: string
      description: string
    }
  ) => {
    try {
      const updatedPortfolio = await portfolioService.update(id, updates)
      setPortfolios(
        portfolios.map((p) =>
          p.id === id ? updatedPortfolio : p
        )
      )
      setEditingPortfolio(null)
      toast.success(`Portfolio "${updates.name}" updated successfully!`)
    } catch (error: any) {
      console.error("Error updating portfolio:", error)
      toast.error(error.message || "Failed to update portfolio")
    }
  }

  const handleDeletePortfolio = async (id: string) => {
    const deletedPortfolio = portfolios.find((p) => p.id === id)

    try {
      await portfolioService.delete(id)
      setPortfolios(portfolios.filter((p) => p.id !== id))
      setEditingPortfolio(null)
      toast.success(`Portfolio "${deletedPortfolio?.name}" deleted successfully!`)
    } catch (error: any) {
      console.error("Error deleting portfolio:", error)
      toast.error(error.message || "Failed to delete portfolio")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">My Portfolios</h1>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={!canCreatePortfolio}
            className="px-4 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            data-testid="new-portfolio-button"
          >
            <Plus className="w-5 h-5" />
            New Portfolio
          </Button>
        </div>

        {/* Empty State */}
        {portfolios.length === 0 && (
          <GlassCard hover={false} className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-white mb-2">No portfolios yet</h2>
            <p className="text-white/70 mb-6">Create your first portfolio to start tracking your crypto holdings</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-medium transition-colors"
            >
              + Create Portfolio
            </Button>
          </GlassCard>
        )}

        {/* Portfolio Cards */}
        <div className="space-y-4 mb-6">
          {portfolios.map((portfolio) => (
            <GlassCard
              key={portfolio.id}
              hover={false}
              className={`${portfolio.isActive ? 'border-[#3b82f6] border-2' : ''}`}
              data-testid="portfolio-card"
              data-active={portfolio.isActive}
            >
              <div className="flex items-start justify-between">
                {/* Portfolio Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-4xl">{portfolio.icon}</div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-white" data-testid="portfolio-name">
                        {portfolio.name}
                      </h3>
                      {portfolio.isActive && (
                        <span className="px-2 py-1 text-xs font-medium bg-[#3b82f6]/20 text-[#3b82f6] rounded" data-testid="active-badge">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Value and Change */}
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-white mb-1" data-testid="portfolio-value">
                        {formatCurrency(portfolio.totalValue)}
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${portfolio.changePercent24h >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`} data-testid="portfolio-change">
                        {portfolio.changePercent24h >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>
                          {formatCurrency(Math.abs(portfolio.change24h))} ({portfolio.changePercent24h >= 0 ? '+' : ''}{portfolio.changePercent24h.toFixed(2)}%)
                        </span>
                        <span className="text-white/50 ml-1">24h</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-white/70 border-t border-white/10 pt-4">
                      <div>
                        <span className="text-white/50">Assets:</span> <span className="text-white">{portfolio.assetCount}</span>
                      </div>
                      <div>
                        <span className="text-white/50">Transactions:</span> <span className="text-white">{portfolio.transactionCount}</span>
                      </div>
                      <div>
                        <span className="text-white/50">Created:</span> <span className="text-white">{new Date(portfolio.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-white/50">Updated:</span> <span className="text-white">{formatTimeAgo(portfolio.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-4">
                      <Button
                        onClick={() => handleViewDashboard(portfolio.id)}
                        className="px-4 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white text-sm font-medium transition-colors"
                      >
                        View Dashboard
                      </Button>
                      <Button
                        onClick={() => setEditingPortfolio(portfolio)}
                        className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-white text-sm transition-colors"
                        data-testid="edit-portfolio-button"
                      >
                        Edit
                      </Button>
                      {!portfolio.isActive && (
                        <Button
                          onClick={() => handleSetActive(portfolio.id)}
                          className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-white text-sm transition-colors"
                          data-testid="set-active-button"
                        >
                          Set as Active
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu */}
                <button
                  className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                  data-testid="portfolio-menu"
                >
                  <MoreVertical className="w-5 h-5 text-white/70" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Tier Limit Banner */}
        {portfolios.length > 0 && (
          <GlassCard hover={false} className="bg-white/[0.03]" data-testid="tier-limit-banner">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">
                  You're on the <span className="text-white font-medium capitalize">{user?.subscriptionTier || 'Free'}</span> plan
                  {' '}({portfolios.length}/{getTierLimit() === Infinity ? '∞' : getTierLimit()} portfolios used)
                </p>
              </div>
              {user?.subscriptionTier === 'free' && (
                <Button
                  onClick={() => navigate('/pricing')}
                  className="px-4 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white text-sm font-medium transition-colors"
                  data-testid="upgrade-cta"
                >
                  Upgrade to Plus for 25 portfolios →
                </Button>
              )}
            </div>
          </GlassCard>
        )}
      </main>

      {/* Create Portfolio Modal */}
      <CreatePortfolioModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreatePortfolio}
        currentPortfolioCount={portfolios.length}
        maxPortfolios={getTierLimit()}
      />

      {/* Edit Portfolio Modal */}
      <EditPortfolioModal
        isOpen={!!editingPortfolio}
        portfolio={editingPortfolio}
        onClose={() => setEditingPortfolio(null)}
        onSave={handleEditPortfolio}
        onDelete={handleDeletePortfolio}
      />
    </div>
  )
}
