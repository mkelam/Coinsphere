import { GlassCard } from "./glass-card"

export function HoldingsTable() {
  const holdings = [
    { symbol: "BTC", name: "Bitcoin", amount: "0.5", value: "$17,500", change: "+3.2%", positive: true },
    { symbol: "ETH", name: "Ethereum", amount: "10", value: "$18,500", change: "+5.8%", positive: true },
    { symbol: "SOL", name: "Solana", amount: "50", value: "$8,790", change: "-1.2%", positive: false },
    { symbol: "USDC", name: "USD Coin", amount: "2,602", value: "$2,602", change: "0.0%", positive: true },
  ]

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
              <th className="pb-3 font-medium text-right">24h</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => (
              <tr
                key={holding.symbol}
                className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
              >
                <td className="py-3">
                  <div>
                    <div className="font-semibold">{holding.symbol}</div>
                    <div className="text-sm text-white/50">{holding.name}</div>
                  </div>
                </td>
                <td className="py-3 text-right font-mono text-sm">{holding.amount}</td>
                <td className="py-3 text-right font-mono font-semibold">{holding.value}</td>
                <td
                  className={`py-3 text-right font-mono text-sm ${holding.positive ? "text-[#10B981]" : "text-[#EF4444]"}`}
                >
                  {holding.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
