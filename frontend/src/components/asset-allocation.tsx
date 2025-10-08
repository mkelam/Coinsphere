import { GlassCard } from "./glass-card"

export function AssetAllocation() {
  const assets = [
    { symbol: "BTC", percentage: 45, color: "#F7931A" },
    { symbol: "ETH", percentage: 30, color: "#627EEA" },
    { symbol: "SOL", percentage: 15, color: "#14F195" },
    { symbol: "USDC", percentage: 10, color: "#2775CA" },
  ]

  return (
    <GlassCard hover={false}>
      <h2 className="text-lg font-semibold mb-4">Asset Allocation</h2>

      <div className="space-y-3">
        {assets.map((asset) => (
          <div key={asset.symbol} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{asset.symbol}</span>
              <span className="text-white/70">{asset.percentage}%</span>
            </div>
            <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${asset.percentage}%`,
                  backgroundColor: asset.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
