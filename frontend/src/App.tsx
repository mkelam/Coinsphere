import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Header } from "@/components/header"
import { PortfolioHero } from "@/components/portfolio-hero"
import { QuickActions } from "@/components/quick-actions"
import { AssetAllocation } from "@/components/asset-allocation"
import { HoldingsTable } from "@/components/holdings-table"
import { RecentTransactions } from "@/components/recent-transactions"
import { LoginPage } from "@/pages/LoginPage"
import { SignupPage } from "@/pages/SignupPage"
import { ProtectedRoute } from "@/components/ProtectedRoute"

function DashboardPage() {
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

export default function App() {
  return (
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
      </Routes>
    </BrowserRouter>
  )
}
