import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { ErrorBoundary } from "@/components/ErrorBoundary"

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0A0E27]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-white/60 text-sm">Loading...</p>
    </div>
  </div>
)

// Critical routes - loaded immediately (login/signup for first-time users)
import { LoginPage } from "@/pages/LoginPage"
import { SignupPage } from "@/pages/SignupPage"

// Lazy-loaded routes - split into separate chunks
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then(m => ({ default: m.DashboardPage })))
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then(m => ({ default: m.SettingsPage })))
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })))
const AlertsPage = lazy(() => import("@/pages/AlertsPage").then(m => ({ default: m.AlertsPage })))
const ComponentShowcase = lazy(() => import("@/pages/ComponentShowcase").then(m => ({ default: m.ComponentShowcase })))
const PortfoliosPage = lazy(() => import("@/pages/PortfoliosPage").then(m => ({ default: m.PortfoliosPage })))
const PricingPage = lazy(() => import("@/pages/PricingPage").then(m => ({ default: m.PricingPage })))
const AssetDetailPage = lazy(() => import("@/pages/AssetDetailPage").then(m => ({ default: m.AssetDetailPage })))
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage").then(m => ({ default: m.OnboardingPage })))
const TransactionsPage = lazy(() => import("@/pages/TransactionsPage").then(m => ({ default: m.TransactionsPage })))
const BillingPage = lazy(() => import("@/pages/BillingPage").then(m => ({ default: m.BillingPage })))
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage").then(m => ({ default: m.CheckoutPage })))
const HelpPage = lazy(() => import("@/pages/HelpPage").then(m => ({ default: m.HelpPage })))
const ExchangeConnectionsPage = lazy(() => import("@/pages/ExchangeConnectionsPage"))
const DefiPage = lazy(() => import("@/pages/DefiPage").then(m => ({ default: m.DefiPage })))
const MarketsPage = lazy(() => import("@/pages/MarketsPage").then(m => ({ default: m.MarketsPage })))

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/markets" replace />} />
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
          <Route
            path="/portfolios"
            element={
              <ProtectedRoute>
                <PortfoliosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exchanges"
            element={
              <ProtectedRoute>
                <ExchangeConnectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/defi"
            element={
              <ProtectedRoute>
                <DefiPage />
              </ProtectedRoute>
            }
          />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <TransactionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets/:symbol"
            element={
              <ProtectedRoute>
                <AssetDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <HelpPage />
              </ProtectedRoute>
            }
          />
          <Route path="/showcase" element={<ComponentShowcase />} />
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
