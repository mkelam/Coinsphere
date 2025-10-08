import { TrendingUp, TrendingDown } from "lucide-react"
import { GlassCard } from "./glass-card"
import { usePortfolio } from "@/contexts/PortfolioContext"

export function PortfolioHero() {
  const { portfolioSummary, isLoading } = usePortfolio()

  const totalValue = portfolioSummary?.totalValue || 0
  const change24h = portfolioSummary?.change24h || 0
  const change24hPercentage = portfolioSummary?.change24hPercentage || 0
  const isPositive = change24h >= 0

  if (isLoading) {
    return (
      <GlassCard hover={false} className="mb-6">
        <div className="space-y-2 animate-pulse">
          <p className="text-sm text-white/50">Total Portfolio Value</p>
          <div className="h-14 bg-white/[0.05] rounded w-64"></div>
          <div className="h-8 bg-white/[0.05] rounded w-48"></div>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard hover={false} className="mb-6">
      <div className="space-y-2">
        <p className="text-sm text-white/50">Total Portfolio Value</p>
        <h1 className="text-5xl font-bold font-mono tracking-tight">
          ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h1>
        <div className={`flex items-center gap-2 ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
          {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          <span className="text-xl font-semibold">
            {isPositive ? '+' : ''}${Math.abs(change24h).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-lg text-white/70">
            ({isPositive ? '+' : ''}{change24hPercentage.toFixed(2)}%)
          </span>
          <span className="text-sm text-white/50 ml-2">24h</span>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <button className="px-4 py-2 rounded-lg bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white text-sm font-medium transition-colors">
          7d
        </button>
        <button className="px-4 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-white/70 text-sm font-medium transition-colors">
          30d
        </button>
        <button className="px-4 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-white/70 text-sm font-medium transition-colors">
          All
        </button>
      </div>
    </GlassCard>
  )
}
