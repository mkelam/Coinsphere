import { useState } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface CreatePortfolioModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (portfolio: {
    name: string
    icon: string
    currency: string
    description: string
  }) => void
  currentPortfolioCount: number
  maxPortfolios: number
}

const PORTFOLIO_ICONS = [
  "💼", "🏦", "💰", "🚀", "📈", "💎", "🔥", "⚡",
  "🌟", "🎯", "🏆", "💵", "🪙", "📊", "🔮", "🌙",
]

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "BTC", symbol: "₿", name: "Bitcoin" },
]

export function CreatePortfolioModal({
  isOpen,
  onClose,
  onSave,
  currentPortfolioCount,
  maxPortfolios,
}: CreatePortfolioModalProps) {
  const [name, setName] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("💼")
  const [currency, setCurrency] = useState("USD")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({})

  if (!isOpen) return null

  const handleSave = () => {
    // Validation
    const newErrors: { name?: string; description?: string } = {}

    if (!name.trim()) {
      newErrors.name = "Portfolio name is required"
    } else if (name.trim().length < 2) {
      newErrors.name = "Portfolio name must be at least 2 characters"
    } else if (name.trim().length > 50) {
      newErrors.name = "Portfolio name must be less than 50 characters"
    }

    if (description.length > 200) {
      newErrors.description = "Description must be less than 200 characters"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Check portfolio limit
    if (currentPortfolioCount >= maxPortfolios) {
      alert("You've reached your portfolio limit. Please upgrade your plan.")
      return
    }

    // Save portfolio
    onSave({
      name: name.trim(),
      icon: selectedIcon,
      currency,
      description: description.trim(),
    })

    // Reset form
    setName("")
    setSelectedIcon("💼")
    setCurrency("USD")
    setDescription("")
    setErrors({})
  }

  const handleClose = () => {
    setName("")
    setSelectedIcon("💼")
    setCurrency("USD")
    setDescription("")
    setErrors({})
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <GlassCard hover={false} className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Create New Portfolio</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            data-testid="create-portfolio-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portfolio Limit Warning */}
        {currentPortfolioCount >= maxPortfolios && (
          <div className="mb-6 p-4 rounded-lg bg-[#ef4444]/20 border border-[#ef4444]/30">
            <p className="text-sm text-[#ef4444]">
              ⚠️ You've reached your portfolio limit ({currentPortfolioCount}/{maxPortfolios}).
              Please upgrade your plan to create more portfolios.
            </p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Portfolio Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Portfolio Name <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors({ ...errors, name: undefined })
              }}
              placeholder="e.g., Main Portfolio, Trading, DeFi Investments"
              maxLength={50}
              className={`w-full px-4 py-3 bg-white/[0.03] border rounded-lg focus:outline-none focus:ring-2 text-white placeholder-white/40 ${
                errors.name
                  ? "border-[#ef4444] focus:ring-[#ef4444]"
                  : "border-white/10 focus:ring-[#3b82f6]"
              }`}
              data-testid="portfolio-name-input"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-[#ef4444]">{errors.name}</p>
            )}
            <p className="mt-1 text-xs text-white/50">{name.length}/50 characters</p>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Portfolio Icon
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PORTFOLIO_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`aspect-square p-3 rounded-lg text-2xl transition-all ${
                    selectedIcon === icon
                      ? "bg-[#3b82f6]/20 ring-2 ring-[#3b82f6] scale-110"
                      : "bg-white/[0.03] hover:bg-white/[0.05] border border-white/10"
                  }`}
                  data-testid={`icon-${icon}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Base Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-white"
              data-testid="currency-select"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code} className="bg-gray-900">
                  {curr.symbol} {curr.name} ({curr.code})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-white/50">
              All portfolio values will be displayed in this currency
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) setErrors({ ...errors, description: undefined })
              }}
              placeholder="Add notes about this portfolio's purpose or strategy..."
              rows={3}
              maxLength={200}
              className={`w-full px-4 py-3 bg-white/[0.03] border rounded-lg focus:outline-none focus:ring-2 text-white placeholder-white/40 resize-none ${
                errors.description
                  ? "border-[#ef4444] focus:ring-[#ef4444]"
                  : "border-white/10 focus:ring-[#3b82f6]"
              }`}
              data-testid="portfolio-description-input"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-[#ef4444]">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-white/50">{description.length}/200 characters</p>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium mb-2">Preview</label>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedIcon}</div>
                <div className="flex-1">
                  <div className="font-semibold">
                    {name || "Portfolio Name"}
                  </div>
                  <div className="text-sm text-white/60">
                    {description || "No description"}
                  </div>
                  <div className="text-xs text-white/40 mt-1">
                    Currency: {CURRENCIES.find((c) => c.code === currency)?.symbol}{" "}
                    {currency}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
          <Button
            variant="outline"
            onClick={handleClose}
            data-testid="create-portfolio-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={currentPortfolioCount >= maxPortfolios}
            data-testid="create-portfolio-save"
          >
            Create Portfolio
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
