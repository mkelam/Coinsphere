import { TrendingUp } from "lucide-react"
import { GlassCard } from "./glass-card"

export function PortfolioHero() {
  return (
    <GlassCard hover={false} className="mb-6">
      <div className="space-y-2">
        <p className="text-sm text-white/50">Total Portfolio Value</p>
        <h1 className="text-5xl font-bold font-mono tracking-tight">$47,392.83</h1>
        <div className="flex items-center gap-2 text-[#10B981]">
          <TrendingUp className="w-5 h-5" />
          <span className="text-xl font-semibold">+$2,487</span>
          <span className="text-lg text-white/70">(+5.52%)</span>
          <span className="text-sm text-white/50 ml-2">24h</span>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <button className="px-4 py-2 rounded-lg bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white text-sm font-medium transition-colors">
          7d
        </button>
        <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors">
          30d
        </button>
        <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors">
          All
        </button>
      </div>
    </GlassCard>
  )
}
