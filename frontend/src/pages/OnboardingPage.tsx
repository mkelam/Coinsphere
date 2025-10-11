import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import {
  Wallet,
  Link2,
  Upload,
  PenLine,
  ArrowRight,
  CheckCircle2,
  Loader2,
  TrendingUp,
  Shield,
  Zap,
  Target,
} from "lucide-react"

type OnboardingStep = "welcome" | "connect" | "syncing" | "complete"

type UserType = "beginner" | "trader" | "whale" | null

type DataSource =
  | "exchange"
  | "wallet"
  | "csv"
  | "manual"
  | null

export function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>("welcome")
  const [userType, setUserType] = useState<UserType>(null)
  const [dataSource, setDataSource] = useState<DataSource>(null)
  const [syncProgress, setSyncProgress] = useState(0)
  const { user } = useAuth()
  const navigate = useNavigate()

  // Welcome step
  const WelcomeStep = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-8">
        <div className="text-6xl mb-4">🔮</div>
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Coinsphere, {user?.firstName || "Trader"}!
        </h1>
        <p className="text-xl text-white/70">
          Let's get your portfolio set up in less than 2 minutes
        </p>
      </div>

      <GlassCard hover={false} className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">I am a...</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setUserType("beginner")}
            className={`p-6 rounded-xl border transition-all ${
              userType === "beginner"
                ? "bg-[#3b82f6]/20 border-[#3b82f6]"
                : "bg-white/[0.03] border-white/10 hover:bg-white/[0.05]"
            }`}
            data-testid="user-type-beginner"
          >
            <Target className="w-8 h-8 text-[#3b82f6] mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Crypto Beginner</h3>
            <p className="text-sm text-white/60">
              Just starting my crypto journey
            </p>
          </button>

          <button
            onClick={() => setUserType("trader")}
            className={`p-6 rounded-xl border transition-all ${
              userType === "trader"
                ? "bg-[#3b82f6]/20 border-[#3b82f6]"
                : "bg-white/[0.03] border-white/10 hover:bg-white/[0.05]"
            }`}
            data-testid="user-type-trader"
          >
            <TrendingUp className="w-8 h-8 text-[#10b981] mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Active Trader</h3>
            <p className="text-sm text-white/60">
              Trading regularly across exchanges
            </p>
          </button>

          <button
            onClick={() => setUserType("whale")}
            className={`p-6 rounded-xl border transition-all ${
              userType === "whale"
                ? "bg-[#3b82f6]/20 border-[#3b82f6]"
                : "bg-white/[0.03] border-white/10 hover:bg-white/[0.05]"
            }`}
            data-testid="user-type-whale"
          >
            <Shield className="w-8 h-8 text-[#f59e0b] mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Serious Investor</h3>
            <p className="text-sm text-white/60">
              Managing a substantial portfolio
            </p>
          </button>
        </div>
      </GlassCard>

      <Button
        onClick={() => setStep("connect")}
        disabled={!userType}
        size="lg"
        className="min-w-[200px]"
        data-testid="welcome-continue"
      >
        Continue
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>

      <div className="mt-8 flex items-center justify-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
        <div className="w-3 h-3 rounded-full bg-white/20"></div>
        <div className="w-3 h-3 rounded-full bg-white/20"></div>
        <div className="w-3 h-3 rounded-full bg-white/20"></div>
      </div>
    </div>
  )

  // Connect data source step
  const ConnectStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Connect Your Portfolio</h1>
        <p className="text-lg text-white/70">
          Choose how you'd like to import your holdings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <GlassCard
          hover={true}
          className={`cursor-pointer transition-all ${
            dataSource === "exchange"
              ? "ring-2 ring-[#3b82f6]"
              : ""
          }`}
          onClick={() => setDataSource("exchange")}
          data-testid="source-exchange"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[#3b82f6]/20">
              <Link2 className="w-6 h-6 text-[#3b82f6]" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">
                Connect Exchange
              </h3>
              <p className="text-white/60 mb-4">
                Sync holdings from Binance, Coinbase, Kraken & 20+ exchanges
              </p>
              <div className="flex items-center gap-2 text-sm text-[#10b981]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Real-time sync</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#10b981] mt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Automatic updates</span>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          hover={true}
          className={`cursor-pointer transition-all ${
            dataSource === "wallet"
              ? "ring-2 ring-[#3b82f6]"
              : ""
          }`}
          onClick={() => setDataSource("wallet")}
          data-testid="source-wallet"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[#10b981]/20">
              <Wallet className="w-6 h-6 text-[#10b981]" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">
                Add Wallet Address
              </h3>
              <p className="text-white/60 mb-4">
                Track on-chain holdings from MetaMask, Ledger, Trust Wallet
              </p>
              <div className="flex items-center gap-2 text-sm text-[#10b981]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Multi-chain support</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#10b981] mt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Read-only (secure)</span>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          hover={true}
          className={`cursor-pointer transition-all ${
            dataSource === "csv" ? "ring-2 ring-[#3b82f6]" : ""
          }`}
          onClick={() => setDataSource("csv")}
          data-testid="source-csv"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[#f59e0b]/20">
              <Upload className="w-6 h-6 text-[#f59e0b]" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Upload CSV</h3>
              <p className="text-white/60 mb-4">
                Import transaction history from any exchange or wallet
              </p>
              <div className="flex items-center gap-2 text-sm text-[#10b981]">
                <CheckCircle2 className="w-4 h-4" />
                <span>One-time import</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#10b981] mt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Full history</span>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          hover={true}
          className={`cursor-pointer transition-all ${
            dataSource === "manual"
              ? "ring-2 ring-[#3b82f6]"
              : ""
          }`}
          onClick={() => setDataSource("manual")}
          data-testid="source-manual"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-white/10">
              <PenLine className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">
                Add Manually
              </h3>
              <p className="text-white/60 mb-4">
                Enter your holdings manually for complete control
              </p>
              <div className="flex items-center gap-2 text-sm text-[#10b981]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Quick setup</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#10b981] mt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Full privacy</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="flex items-center justify-between">
        <Button
          onClick={() => setStep("welcome")}
          variant="outline"
          data-testid="connect-back"
        >
          Back
        </Button>

        <Button
          onClick={() => {
            setStep("syncing")
            // Simulate sync progress
            let progress = 0
            const interval = setInterval(() => {
              progress += 10
              setSyncProgress(progress)
              if (progress >= 100) {
                clearInterval(interval)
                setTimeout(() => setStep("complete"), 500)
              }
            }, 300)
          }}
          disabled={!dataSource}
          size="lg"
          data-testid="connect-continue"
        >
          Connect & Sync
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
        <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
        <div className="w-3 h-3 rounded-full bg-white/20"></div>
        <div className="w-3 h-3 rounded-full bg-white/20"></div>
      </div>
    </div>
  )

  // Syncing progress step
  const SyncingStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <GlassCard hover={false} className="py-12">
        <Loader2 className="w-16 h-16 text-[#3b82f6] mx-auto mb-6 animate-spin" />
        <h1 className="text-3xl font-bold mb-4">
          Syncing Your Portfolio...
        </h1>
        <p className="text-lg text-white/70 mb-8">
          This may take a few moments
        </p>

        <div className="max-w-md mx-auto mb-6">
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#3b82f6] to-[#10b981] transition-all duration-300 rounded-full"
              style={{ width: `${syncProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-white/50 mt-2">{syncProgress}%</p>
        </div>

        <div className="space-y-3 max-w-sm mx-auto text-left">
          <div
            className={`flex items-center gap-3 ${
              syncProgress >= 20 ? "text-white" : "text-white/30"
            }`}
          >
            {syncProgress >= 20 ? (
              <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-white/30"></div>
            )}
            <span>Connecting to data source</span>
          </div>

          <div
            className={`flex items-center gap-3 ${
              syncProgress >= 40 ? "text-white" : "text-white/30"
            }`}
          >
            {syncProgress >= 40 ? (
              <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-white/30"></div>
            )}
            <span>Fetching your holdings</span>
          </div>

          <div
            className={`flex items-center gap-3 ${
              syncProgress >= 60 ? "text-white" : "text-white/30"
            }`}
          >
            {syncProgress >= 60 ? (
              <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-white/30"></div>
            )}
            <span>Calculating portfolio value</span>
          </div>

          <div
            className={`flex items-center gap-3 ${
              syncProgress >= 80 ? "text-white" : "text-white/30"
            }`}
          >
            {syncProgress >= 80 ? (
              <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-white/30"></div>
            )}
            <span>Analyzing risk metrics</span>
          </div>

          <div
            className={`flex items-center gap-3 ${
              syncProgress >= 100 ? "text-white" : "text-white/30"
            }`}
          >
            {syncProgress >= 100 ? (
              <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-white/30"></div>
            )}
            <span>Finalizing setup</span>
          </div>
        </div>
      </GlassCard>

      <div className="mt-8 flex items-center justify-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
        <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
        <div className="w-3 h-3 rounded-full bg-[#3b82f6] animate-pulse"></div>
        <div className="w-3 h-3 rounded-full bg-white/20"></div>
      </div>
    </div>
  )

  // Complete step
  const CompleteStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#10b981]/20 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-[#10b981]" />
        </div>
        <h1 className="text-4xl font-bold mb-4">You're All Set! 🎉</h1>
        <p className="text-xl text-white/70">
          Your portfolio has been successfully synced
        </p>
      </div>

      <GlassCard hover={false} className="mb-8">
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <div className="text-3xl font-bold text-[#10b981]">
              $24,567.89
            </div>
            <div className="text-sm text-white/50">Total Value</div>
          </div>
          <div>
            <div className="text-3xl font-bold">12</div>
            <div className="text-sm text-white/50">Assets</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#10b981]">
              +12.4%
            </div>
            <div className="text-sm text-white/50">24h Change</div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="font-semibold mb-4">What's Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-white/[0.03]">
              <Zap className="w-6 h-6 text-[#f59e0b] mx-auto mb-2" />
              <div className="font-medium mb-1">Set Price Alerts</div>
              <div className="text-white/50 text-xs">
                Get notified when assets hit your targets
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03]">
              <TrendingUp className="w-6 h-6 text-[#3b82f6] mx-auto mb-2" />
              <div className="font-medium mb-1">View AI Predictions</div>
              <div className="text-white/50 text-xs">
                See ML-powered price forecasts
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03]">
              <Shield className="w-6 h-6 text-[#10b981] mx-auto mb-2" />
              <div className="font-medium mb-1">Check Risk Scores</div>
              <div className="text-white/50 text-xs">
                Understand your portfolio risk
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      <Button
        onClick={() => navigate("/dashboard")}
        size="lg"
        className="min-w-[250px]"
        data-testid="complete-dashboard"
      >
        Go to Dashboard
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>

      <div className="mt-8 flex items-center justify-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
        <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
        <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
        <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
      </div>

      <p className="mt-6 text-sm text-white/50">
        Need help?{" "}
        <button
          onClick={() => navigate("/help")}
          className="text-[#3b82f6] hover:underline"
        >
          Visit our Help Center
        </button>
      </p>
    </div>
  )

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      {step === "welcome" && <WelcomeStep />}
      {step === "connect" && <ConnectStep />}
      {step === "syncing" && <SyncingStep />}
      {step === "complete" && <CompleteStep />}
    </div>
  )
}
