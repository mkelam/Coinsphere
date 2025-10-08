import { GlassCard } from "./glass-card"
import { usePortfolio } from "@/contexts/PortfolioContext"

export function HoldingsTable() {
  const { currentPortfolio, isLoading } = usePortfolio()

  const holdings = currentPortfolio?.holdings || []

  if (isLoading) {
    return (
      <GlassCard hover={false}>
        <h2 className="text-lg font-semibold mb-4">Holdings</h2>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-white/[0.05] rounded"></div>
          ))}
        </div>
      </GlassCard>
    )
  }

  if (holdings.length === 0) {
    return (
      <GlassCard hover={false}>
        <h2 className="text-lg font-semibold mb-4">Holdings</h2>
        <div className="text-center py-8 text-white/50">
          <p>No holdings yet</p>
          <p className="text-sm mt-2">Add your first crypto holding to get started</p>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard hover={false}>
      <h2 className="text-lg font-semibold mb-4">Holdings</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-white/50 border-b border-white/5">
              <th className="pb-3 font-medium">Asset</th>
              <th className="pb-3 font-medium text-right">Amount</th>
              <th className="pb-3 font-medium text-right">Value</th>
              <th className="pb-3 font-medium text-right">P/L</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => {
              const isPositive = holding.profitLoss >= 0
              return (
                <tr
                  key={holding.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="py-3">
                    <div>
                      <div className="font-semibold">{holding.token.symbol}</div>
                      <div className="text-sm text-white/50">{holding.token.name}</div>
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono text-sm">
                    {holding.amount.toLocaleString('en-US', { maximumFractionDigits: 8 })}
                  </td>
                  <td className="py-3 text-right font-mono font-semibold">
                    ${holding.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3 text-right font-mono text-sm ${isPositive ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                    {isPositive ? '+' : ''}${holding.profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <div className="text-xs">
                      ({isPositive ? '+' : ''}{holding.profitLossPercentage.toFixed(2)}%)
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
