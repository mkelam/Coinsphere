import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Check, X, ChevronDown, ChevronUp } from "lucide-react"
import { Header } from "@/components/header"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

interface PricingTier {
  id: string
  name: string
  price: {
    monthly: number
    annual: number
  }
  popular?: boolean
  features: {
    text: string
    included: boolean
  }[]
}

// ZAR Pricing (South African Rand) - Exchange rate: 1 USD ≈ 18 ZAR
const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    features: [
      { text: '5 portfolios', included: true },
      { text: '100 transactions/month', included: true },
      { text: '30-day history', included: true },
      { text: 'AI predictions', included: false },
      { text: 'Risk scores', included: false },
      { text: 'Real-time alerts', included: false },
      { text: 'API access', included: false }
    ]
  },
  {
    id: 'plus',
    name: 'Plus',
    price: { monthly: 179.99, annual: 1727.88 }, // ZAR (≈ $10 USD monthly)
    popular: true,
    features: [
      { text: '25 portfolios', included: true },
      { text: '1K transactions/month', included: true },
      { text: '1-year history', included: true },
      { text: 'Basic predictions', included: true },
      { text: 'Risk scores', included: false },
      { text: '10 alerts', included: true },
      { text: 'API access', included: false }
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 359.99, annual: 3455.88 }, // ZAR (≈ $20 USD monthly)
    features: [
      { text: 'Unlimited portfolios', included: true },
      { text: 'Unlimited transactions', included: true },
      { text: 'Full history', included: true },
      { text: 'AI predictions', included: true },
      { text: 'Risk scores', included: true },
      { text: '100 alerts', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: false }
    ]
  },
  {
    id: 'power',
    name: 'Power Trader',
    price: { monthly: 899.99, annual: 8639.88 }, // ZAR (≈ $50 USD monthly)
    features: [
      { text: 'Unlimited portfolios', included: true },
      { text: 'Unlimited transactions', included: true },
      { text: 'Full history', included: true },
      { text: 'Advanced AI predictions', included: true },
      { text: 'Risk scores', included: true },
      { text: 'Unlimited alerts', included: true },
      { text: 'API access', included: true },
      { text: 'White-label support', included: true },
      { text: 'Dedicated support', included: true }
    ]
  }
]

const faqs = [
  {
    question: 'Can I upgrade or downgrade anytime?',
    answer: 'Yes! You can change plans at any time. If you upgrade, you\'ll be charged a prorated amount for the remainder of your billing period. If you downgrade, the change will take effect at the end of your current billing period.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard) via PayFast, a secure South African payment gateway.'
  },
  {
    question: 'How accurate are the AI predictions?',
    answer: 'Our AI models achieve 76% accuracy on 7-day predictions, 68% on 14-day, and 61% on 30-day forecasts (based on the last 90 days). We continuously retrain our models and publish accuracy metrics transparently.'
  },
  {
    question: 'What happens if I cancel my subscription?',
    answer: 'You\'ll retain access to all paid features until the end of your billing period. After that, your account will automatically downgrade to the Free plan, and your data will be preserved.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes! We offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied for any reason, contact support within 30 days of your purchase for a full refund.'
  }
]

export function PricingPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const currentTier = user?.subscriptionTier || 'free'

  const handleUpgrade = (tierId: string) => {
    if (!isAuthenticated) {
      navigate(`/signup?redirect=/checkout&tier=${tierId}`)
      return
    }

    if (tierId === currentTier) {
      return // Already on this plan
    }

    navigate(`/checkout?tier=${tierId}&billing=${billingPeriod}`)
  }

  const getMonthlyPrice = (tier: PricingTier) => {
    if (billingPeriod === 'monthly') {
      return tier.price.monthly
    }
    return tier.price.annual / 12
  }

  const getButtonText = (tierId: string) => {
    if (tierId === currentTier) {
      return 'Current Plan'
    }
    return 'Upgrade'
  }

  const getButtonDisabled = (tierId: string) => {
    return tierId === currentTier
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Unlock AI-Powered Insights
          </h1>
          <p className="text-xl text-white/70 mb-8">
            Choose the plan that fits your trading style
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white/[0.05] border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-[#3b82f6] text-white'
                  : 'text-white/70 hover:text-white'
              }`}
              data-testid="billing-toggle-monthly"
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'annual'
                  ? 'bg-[#3b82f6] text-white'
                  : 'text-white/70 hover:text-white'
              }`}
              data-testid="billing-toggle-annual"
            >
              Annual
              <span className="text-xs bg-[#10b981]/20 text-[#10b981] px-2 py-1 rounded">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {pricingTiers.map((tier) => (
            <GlassCard
              key={tier.id}
              hover={false}
              className={`relative ${tier.popular ? 'border-[#3b82f6] border-2' : ''}`}
              data-testid={`tier-${tier.id}`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-[#3b82f6] text-white text-xs font-semibold rounded-full" data-testid="popular-badge">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-4">{tier.name}</h3>

                {/* Price */}
                <div className="mb-2">
                  <span className="text-4xl font-bold text-white" data-testid="price">
                    R{getMonthlyPrice(tier).toFixed(2)}
                  </span>
                  <span className="text-white/50 text-sm">/mo</span>
                </div>

                {billingPeriod === 'annual' && tier.price.annual > 0 && (
                  <div className="text-sm text-white/50" data-testid="annual-total">
                    R{tier.price.annual.toFixed(2)}/year
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-white/30 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? 'text-white' : 'text-white/50'}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handleUpgrade(tier.id)}
                disabled={getButtonDisabled(tier.id)}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                  getButtonDisabled(tier.id)
                    ? 'bg-white/[0.05] text-white/50 cursor-not-allowed'
                    : 'bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white'
                }`}
                data-testid="cta-button"
              >
                {getButtonText(tier.id)}
              </Button>
            </GlassCard>
          ))}
        </div>

        {/* Trust Signals */}
        <GlassCard hover={false} className="mb-12">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span>Bank-level encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📱</span>
              <span>Multi-device sync</span>
            </div>
          </div>
        </GlassCard>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <GlassCard key={idx} hover={false}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="text-white font-medium pr-4">{faq.question}</span>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-white/70 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/70 flex-shrink-0" />
                  )}
                </button>

                {expandedFaq === idx && (
                  <div className="mt-4 pt-4 border-t border-white/10 text-white/70">
                    {faq.answer}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
