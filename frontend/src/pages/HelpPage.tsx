import { useState } from "react"
import { Header } from "@/components/header"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import {
  ChevronDown,
  ChevronUp,
  Send,
  Mail,
  MessageCircle,
  FileText,
  BookOpen,
  HelpCircle,
} from "lucide-react"

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  {
    category: "Getting Started",
    question: "How do I create my first portfolio?",
    answer:
      "Navigate to the Portfolios page from the dashboard sidebar, then click the 'Create Portfolio' button. Enter a name, select an icon and currency, then start adding transactions to track your crypto holdings.",
  },
  {
    category: "Getting Started",
    question: "How do I add transactions?",
    answer:
      "Go to the Transactions page and click 'Add Transaction'. Select the transaction type (buy, sell, transfer), choose the asset, enter the amount and price, and optionally add fees and notes. The transaction will be automatically linked to your selected portfolio.",
  },
  {
    category: "Features",
    question: "What are Degen Risk Scores?",
    answer:
      "Degen Risk Scores are AI-powered risk assessments (0-100) that analyze token volatility, market sentiment, liquidity, and on-chain metrics to help you understand the risk level of your holdings. Higher scores indicate higher risk.",
  },
  {
    category: "Features",
    question: "How accurate are the AI price predictions?",
    answer:
      "Our AI models use LSTM neural networks trained on historical price data, on-chain metrics, and market sentiment. While predictions provide valuable insights, cryptocurrency markets are highly volatile and predictions should not be considered financial advice. Always do your own research.",
  },
  {
    category: "Features",
    question: "Can I set price alerts?",
    answer:
      "Yes! Go to the Alerts page and create custom price alerts for any tracked asset. You can set target prices for both increases and decreases, and receive notifications via email or in-app when your targets are hit.",
  },
  {
    category: "Billing",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard) and debit cards through our secure payment processor, PayFast. We do not store your card information on our servers.",
  },
  {
    category: "Billing",
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, absolutely! You can cancel your subscription at any time from the Billing page. Your access will continue until the end of your current billing period, and you won't be charged again.",
  },
  {
    category: "Billing",
    question: "Do you offer refunds?",
    answer:
      "We offer a 7-day money-back guarantee for all paid plans. If you're not satisfied within the first 7 days of your subscription, contact support for a full refund.",
  },
  {
    category: "Account",
    question: "How do I change my password?",
    answer:
      "Go to Settings > Security, enter your current password, then enter and confirm your new password. Make sure your new password is at least 8 characters long and includes a mix of letters, numbers, and symbols.",
  },
  {
    category: "Account",
    question: "Is my data secure?",
    answer:
      "Yes! We use industry-standard encryption (AES-256) for data at rest and TLS 1.3 for data in transit. We never store your exchange API keys or wallet private keys. All sensitive operations are logged for security auditing.",
  },
  {
    category: "Technical",
    question: "Which exchanges do you support?",
    answer:
      "We support over 20 major exchanges including Binance, Coinbase, Kraken, KuCoin, and more. You can manually import transactions from any exchange via CSV or add them manually one by one.",
  },
  {
    category: "Technical",
    question: "Do you have an API?",
    answer:
      "Yes! Pro and Power Trader plans include API access. You can programmatically fetch portfolio data, historical prices, and AI predictions. Check our API documentation for details.",
  },
]

const categories = Array.from(new Set(faqs.map((faq) => faq.category)))

export function HelpPage() {
  const { user } = useAuth()
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")

  // Contact form state
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === "All" || faq.category === selectedCategory
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSubmitted(true)
      setSubject("")
      setMessage("")

      setTimeout(() => setSubmitted(false), 5000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Help & Support</h1>
          <p className="text-lg text-white/60">
            Find answers to common questions or get in touch with our team
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <GlassCard className="text-center cursor-pointer hover:scale-105 transition-transform">
            <BookOpen className="w-12 h-12 text-[#3b82f6] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Documentation</h3>
            <p className="text-sm text-white/60">
              Comprehensive guides and tutorials
            </p>
          </GlassCard>

          <GlassCard className="text-center cursor-pointer hover:scale-105 transition-transform">
            <FileText className="w-12 h-12 text-[#10B981] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">API Reference</h3>
            <p className="text-sm text-white/60">
              Technical documentation for developers
            </p>
          </GlassCard>

          <GlassCard className="text-center cursor-pointer hover:scale-105 transition-transform">
            <MessageCircle className="w-12 h-12 text-[#F59E0B] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Community</h3>
            <p className="text-sm text-white/60">
              Join our Discord community
            </p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <GlassCard hover={false}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <HelpCircle className="w-6 h-6 mr-2 text-[#3b82f6]" />
                  Frequently Asked Questions
                </h2>
              </div>

              {/* Search */}
              <div className="mb-6">
                <Input
                  type="search"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  onClick={() => setSelectedCategory("All")}
                  variant={selectedCategory === "All" ? "default" : "outline"}
                  size="sm"
                  className={
                    selectedCategory === "All"
                      ? "bg-[#3b82f6] text-white"
                      : "border-white/20 text-white/70 hover:bg-white/10"
                  }
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    className={
                      selectedCategory === category
                        ? "bg-[#3b82f6] text-white"
                        : "border-white/20 text-white/70 hover:bg-white/10"
                    }
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* FAQ List */}
              <div className="space-y-3">
                {filteredFaqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-white/10 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedFaq(expandedFaq === index ? null : index)
                      }
                      className="w-full px-6 py-4 flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-start text-left">
                        <span className="text-sm font-medium text-[#3b82f6] mr-3 mt-1">
                          {faq.category}
                        </span>
                        <span className="text-white font-medium">{faq.question}</span>
                      </div>
                      {expandedFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-white/50 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/50 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="px-6 py-4 bg-white/[0.02] border-t border-white/10">
                        <p className="text-white/70 text-sm leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {filteredFaqs.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-white/60">
                      No FAQs found. Try a different search term or category.
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-1">
            <GlassCard hover={false} className="sticky top-8">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-[#3b82f6]" />
                Contact Support
              </h2>
              <p className="text-sm text-white/60 mb-6">
                Can't find an answer? Send us a message
              </p>

              {submitted ? (
                <div className="p-6 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-sm text-white/70">
                    We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitContact} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/70">
                      Your Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-white/70">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="How can we help?"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white/70">
                      Message
                    </Label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue or question..."
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}

              {/* Support Hours */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Support Hours
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/70">
                    <span>Mon - Fri</span>
                    <span>9am - 6pm EST</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Sat - Sun</span>
                    <span>Closed</span>
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-3">
                  Pro and Power Trader subscribers get priority support with faster response times.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  )
}
