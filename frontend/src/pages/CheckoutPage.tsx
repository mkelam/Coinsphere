import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Header } from "@/components/header"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { Check, Lock, CreditCard, AlertCircle } from "lucide-react"

interface PlanDetails {
  name: string
  price: number
  period: string
  features: string[]
}

// ZAR Pricing (South African Rand) - Exchange rate: 1 USD ≈ 18 ZAR
const plans: Record<string, PlanDetails> = {
  plus: {
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
  pro: {
    name: "Pro",
    price: 359.99, // ZAR (≈ $20 USD)
    period: "month",
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
  "power-trader": {
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
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const planParam = searchParams.get("plan") || "pro"
  const plan = plans[planParam] || plans.pro

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Payment form state
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState(user?.firstName || "")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [billingZip, setBillingZip] = useState("")

  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // No external payment scripts needed for PayFast

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return v.substring(0, 2) + " / " + v.substring(2, 4)
    }
    return v
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    if (formatted.length <= 19) {
      setCardNumber(formatted)
    }
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value)
    if (formatted.length <= 7) {
      setExpiry(formatted)
    }
  }

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/gi, "")
    if (value.length <= 4) {
      setCvc(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions")
      return
    }

    if (cardNumber.replace(/\s/g, "").length !== 16) {
      setError("Please enter a valid card number")
      return
    }

    if (!expiry.match(/^\d{2}\s\/\s\d{2}$/)) {
      setError("Please enter a valid expiry date (MM / YY)")
      return
    }

    if (cvc.length < 3) {
      setError("Please enter a valid CVC code")
      return
    }

    setLoading(true)

    try {
      // Create PayFast payment request
      const response = await fetch('http://localhost:3001/api/v1/payments/payfast/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'X-CSRF-Token': localStorage.getItem('csrfToken') || '',
        },
        body: JSON.stringify({
          plan: planParam,
          name_first: cardName.split(' ')[0] || '',
          name_last: cardName.split(' ').slice(1).join(' ') || '',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create payment')
      }

      const data = await response.json()

      // Redirect to PayFast payment page
      window.location.href = data.paymentUrl
    } catch (err: any) {
      setError(err.message || "Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Purchase</h1>
          <p className="text-white/60">Subscribe to unlock premium features</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <GlassCard hover={false}>
              <h2 className="text-xl font-semibold text-white mb-6">Payment Information</h2>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-start">
                  <AlertCircle className="w-5 h-5 text-[#EF4444] mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#EF4444]">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Card Number */}
                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-white/70">Card Number</Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      required
                      className="w-full px-4 py-3 pl-12 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  </div>
                </div>

                {/* Cardholder Name */}
                <div className="space-y-2">
                  <Label htmlFor="cardName" className="text-white/70">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>

                {/* Expiry and CVC */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-white/70">Expiry Date</Label>
                    <Input
                      id="expiry"
                      type="text"
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM / YY"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc" className="text-white/70">CVC</Label>
                    <Input
                      id="cvc"
                      type="text"
                      value={cvc}
                      onChange={handleCvcChange}
                      placeholder="123"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    />
                  </div>
                </div>

                {/* Billing Zip */}
                <div className="space-y-2">
                  <Label htmlFor="billingZip" className="text-white/70">Billing ZIP Code</Label>
                  <Input
                    id="billingZip"
                    type="text"
                    value={billingZip}
                    onChange={(e) => setBillingZip(e.target.value)}
                    placeholder="12345"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-white/[0.03] border border-white/10">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-[#3b82f6] focus:ring-2 focus:ring-white/20"
                  />
                  <label htmlFor="terms" className="text-sm text-white/70">
                    I agree to the{" "}
                    <a href="/terms" className="text-[#3b82f6] hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-[#3b82f6] hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-semibold text-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    "Processing..."
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Pay R{plan.price} / {plan.period}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-white/50">
                  Payments are processed securely by PayFast. Your card information is never stored on our servers.
                </p>
              </form>
            </GlassCard>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <GlassCard hover={false} className="sticky top-8">
              <h2 className="text-xl font-semibold text-white mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name} Plan</h3>
                  <p className="text-sm text-white/60">Billed monthly</p>
                </div>

                <div className="space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start">
                      <Check className="w-4 h-4 text-[#10B981] mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="flex justify-between text-white/70">
                  <span>Subtotal</span>
                  <span>R{plan.price}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>VAT (15%)</span>
                  <span>R{(plan.price * 0.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-white pt-3 border-t border-white/10">
                  <span>Total</span>
                  <span>R{(plan.price * 1.15).toFixed(2)}</span>
                </div>
                <p className="text-xs text-white/50">
                  Due today, then R{(plan.price * 1.15).toFixed(2)}/{plan.period} thereafter
                </p>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20">
                <p className="text-sm text-white/70">
                  <span className="font-semibold text-white">Cancel anytime.</span> No hidden fees or long-term commitments.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  )
}
