import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Header } from "@/components/header"
import { PortfolioHero } from "@/components/portfolio-hero"
import { QuickActions } from "@/components/quick-actions"
import { AssetAllocation } from "@/components/asset-allocation"
import { HoldingsTable } from "@/components/holdings-table"
import { RecentTransactions } from "@/components/recent-transactions"
import { MarketInsights } from "@/components/market-insights"
import { TransactionHistory } from "@/components/transaction-history"
import { PriceHistoryChart } from "@/components/price-history-chart"
import { LoginPage } from "@/pages/LoginPage"
import { SignupPage } from "@/pages/SignupPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { AlertsPage } from "@/pages/AlertsPage"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { ErrorBoundary } from "@/components/ErrorBoundary"

function DashboardPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PortfolioHero />
        <QuickActions />

        {/* Market Insights - ML Predictions & Risk Scores */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Market Insights</h2>
          <MarketInsights symbol="BTC" />
        </div>

        {/* Price History Chart */}
        <div className="mb-6">
          <PriceHistoryChart symbol="BTC" timeframe="7d" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AssetAllocation />
          <HoldingsTable />
        </div>

        <TransactionHistory />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <AlertsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
