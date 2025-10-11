import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Header } from "@/components/header"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { Check, CreditCard, Download, Calendar } from "lucide-react"

interface PricingTier {
  name: string
  price: number
  period: string
  features: string[]
  current?: boolean
  popular?: boolean
}

// ZAR Pricing (South African Rand) - Exchange rate: 1 USD ≈ 18 ZAR
const tiers: PricingTier[] = [
  {
    name: "Free",
    price: 0,
    period: "forever",
    features: [
      "Up to 3 portfolios",
      "Basic price tracking",
      "7-day price history",
      "Email support",
    ],
  },
  {
    name: "Plus",
    price: 179.99, // ZAR (≈ $10 USD)
    period: "month",
    features: [
      "Unlimited portfolios",
      "Real-time price alerts",
      "30-day price history",
      "Basic AI predictions",
      "Priority email support",
    ],
  },
  {
    name: "Pro",
    price: 359.99, // ZAR (≈ $20 USD)
    period: "month",
    popular: true,
    features: [
      "Everything in Plus",
      "Advanced AI predictions",
      "Degen Risk Scores",
      "1-year price history",
      "Custom alerts",
      "API access",
      "Priority support",
    ],
  },
  {
    name: "Power Trader",
    price: 899.99, // ZAR (≈ $50 USD)
    period: "month",
    features: [
      "Everything in Pro",
      "Real-time WebSocket feeds",
      "Advanced analytics",
      "Unlimited API calls",
      "White-glove support",
      "Early feature access",
    ],
  },
]

interface Invoice {
  id: string
  date: string
  amount: number
  status: "paid" | "pending" | "failed"
  downloadUrl?: string
}

const mockInvoices: Invoice[] = [
  {
    id: "INV-2025-001",
    date: "2025-09-01",
    amount: 359.99, // ZAR
    status: "paid",
    downloadUrl: "#",
  },
  {
    id: "INV-2025-002",
    date: "2025-10-01",
    amount: 359.99, // ZAR
    status: "paid",
    downloadUrl: "#",
  },
]

export function BillingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)

  const currentTier = user?.subscriptionTier || "free"

  const handleUpgrade = async (tierName: string) => {
    if (tierName.toLowerCase() === "free") return

    setLoading(tierName)
    try {
      // Navigate to checkout page with tier selection
      navigate(`/checkout?plan=${tierName.toLowerCase().replace(" ", "-")}`)
    } finally {
      setLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    // Navigate to PayFast subscription management
    try {
      const response = await fetch('http://localhost:3001/api/v1/payments/payfast/manage', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'X-CSRF-Token': localStorage.getItem('csrfToken') || '',
        },
      })

      if (!response.ok) {
        console.error('Failed to get management URL')
        return
      }

      const data = await response.json()
      if (data.managementUrl) {
        window.open(data.managementUrl, "_blank")
      }
    } catch (error) {
      console.error('Error accessing subscription management:', error)
    }
  }

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Download invoice PDF
    console.log("Downloading invoice:", invoice.id)
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
          <p className="text-white/60">Manage your subscription and billing information</p>
        </div>

        {/* Current Subscription */}
        <GlassCard hover={false} className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Current Subscription</h2>
              <p className="text-white/60">You are currently on the <span className="text-[#3b82f6] font-semibold capitalize">{currentTier}</span> plan</p>
            </div>
            {currentTier !== "free" && (
              <Button
                onClick={handleManageSubscription}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Subscription
              </Button>
            )}
          </div>

          {currentTier !== "free" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div>
                <p className="text-sm text-white/60 mb-1">Next Billing Date</p>
                <div className="flex items-center text-white">
                  <Calendar className="w-4 h-4 mr-2 text-[#3b82f6]" />
                  <span className="font-medium">November 1, 2025</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-white/60 mb-1">Amount</p>
                <span className="text-2xl font-bold text-white">
                  R{tiers.find(t => t.name.toLowerCase() === currentTier)?.price || 0}
                </span>
                <span className="text-white/60 text-sm">/month</span>
              </div>
              <div>
                <p className="text-sm text-white/60 mb-1">Payment Method</p>
                <div className="flex items-center text-white">
                  <CreditCard className="w-4 h-4 mr-2 text-[#3b82f6]" />
                  <span className="font-medium">•••• 4242</span>
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Pricing Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <GlassCard
                key={tier.name}
                hover={false}
                className={`relative ${
                  tier.popular ? "border-[#3b82f6] border-2" : ""
                } ${currentTier === tier.name.toLowerCase() ? "border-[#10B981] border-2" : ""}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-[#3b82f6] text-white text-xs font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                {currentTier === tier.name.toLowerCase() && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-[#10B981] text-white text-xs font-semibold">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-white">R{tier.price}</span>
                    <span className="text-white/60 ml-2">/{tier.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="w-5 h-5 text-[#10B981] mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(tier.name)}
                  disabled={
                    currentTier === tier.name.toLowerCase() ||
                    loading === tier.name
                  }
                  className={`w-full ${
                    tier.popular
                      ? "bg-[#3b82f6] hover:bg-[#3b82f6]/90"
                      : "bg-white/10 hover:bg-white/20"
                  } text-white font-medium transition-colors disabled:opacity-50`}
                >
                  {loading === tier.name
                    ? "Processing..."
                    : currentTier === tier.name.toLowerCase()
                    ? "Current Plan"
                    : tier.name === "Free"
                    ? "Downgrade"
                    : "Upgrade"}
                </Button>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Billing History */}
        {currentTier !== "free" && (
          <GlassCard hover={false}>
            <h2 className="text-xl font-semibold text-white mb-6">Billing History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white/70">Invoice</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white/70">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white/70">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white/70">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-white/70">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-sm font-mono text-white">{invoice.id}</td>
                      <td className="py-4 px-4 text-sm text-white/80">
                        {new Date(invoice.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-sm text-white font-medium">R{invoice.amount.toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            invoice.status === "paid"
                              ? "bg-[#10B981]/10 text-[#10B981]"
                              : invoice.status === "pending"
                              ? "bg-[#F59E0B]/10 text-[#F59E0B]"
                              : "bg-[#EF4444]/10 text-[#EF4444]"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          onClick={() => handleDownloadInvoice(invoice)}
                          variant="ghost"
                          size="sm"
                          className="text-[#3b82f6] hover:text-[#3b82f6]/80 hover:bg-white/5"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </main>
    </div>
  )
}
