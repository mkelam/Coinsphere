import { Header } from "@/components/header"
import { PortfolioHero } from "@/components/portfolio-hero"
import { QuickActions } from "@/components/quick-actions"
import { AssetAllocation } from "@/components/asset-allocation"
import { HoldingsTable } from "@/components/holdings-table"
import { RecentTransactions } from "@/components/recent-transactions"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PortfolioHero />
        <QuickActions />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AssetAllocation />
          <HoldingsTable />
        </div>

        <RecentTransactions />
      </main>
    </div>
  )
}
