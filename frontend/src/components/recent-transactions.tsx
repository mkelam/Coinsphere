import { ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { GlassCard } from "./glass-card"

export function RecentTransactions() {
  const transactions = [
    { type: "buy", symbol: "BTC", amount: "0.05", value: "$1,750", time: "3h ago" },
    { type: "sell", symbol: "ETH", amount: "2.0", value: "$3,700", time: "1d ago" },
    { type: "buy", symbol: "SOL", amount: "25", value: "$4,375", time: "2d ago" },
    { type: "buy", symbol: "USDC", amount: "1,000", value: "$1,000", time: "3d ago" },
  ]

  return (
    <GlassCard hover={false}>
      <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>

      <div className="space-y-3">
        {transactions.map((tx, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${tx.type === "buy" ? "bg-[#10B981]/[0.06]" : "bg-[#EF4444]/[0.06]"}`}>
                {tx.type === "buy" ? (
                  <ArrowUpRight className={`w-4 h-4 text-[#10B981]`} />
                ) : (
                  <ArrowDownLeft className={`w-4 h-4 text-[#EF4444]`} />
                )}
              </div>
              <div>
                <div className="font-medium">
                  {tx.type === "buy" ? "Buy" : "Sell"} {tx.symbol}
                </div>
                <div className="text-sm text-white/50">{tx.amount}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-semibold">{tx.value}</div>
              <div className="text-sm text-white/50">{tx.time}</div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
