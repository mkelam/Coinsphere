import { useState, useEffect } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { X, Trash2, AlertTriangle } from "lucide-react"

interface Portfolio {
  id: string
  name: string
  icon: string
  currency: string
  description?: string
  totalValue: number
  change24h: number
  changePercent24h: number
  assetCount: number
  transactionCount: number
  createdAt: string
  updatedAt: string
  isActive: boolean
}

interface EditPortfolioModalProps {
  isOpen: boolean
  portfolio: Portfolio | null
  onClose: () => void
  onSave: (
    id: string,
    updates: {
      name: string
      icon: string
      currency: string
      description: string
    }
  ) => void
  onDelete: (id: string) => void
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

export function EditPortfolioModal({
  isOpen,
  portfolio,
  onClose,
  onSave,
  onDelete,
}: EditPortfolioModalProps) {
  const [name, setName] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("💼")
  const [currency, setCurrency] = useState("USD")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Populate form when portfolio changes
  useEffect(() => {
    if (portfolio) {
      setName(portfolio.name)
      setSelectedIcon(portfolio.icon)
      setCurrency(portfolio.currency || "USD")
      setDescription(portfolio.description || "")
      setErrors({})
      setShowDeleteConfirm(false)
    }
  }, [portfolio])

  if (!isOpen || !portfolio) return null

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

    // Save portfolio
    onSave(portfolio.id, {
      name: name.trim(),
      icon: selectedIcon,
      currency,
      description: description.trim(),
    })

    handleClose()
  }

  const handleDelete = () => {
    if (portfolio.isActive) {
      alert(
        "Cannot delete the active portfolio. Please set another portfolio as active first."
      )
      return
    }

    onDelete(portfolio.id)
    handleClose()
  }

  const handleClose = () => {
    setShowDeleteConfirm(false)
    onClose()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <GlassCard hover={false} className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Edit Portfolio</h2>
            <p className="text-sm text-white/60 mt-1">
              Created {formatDate(portfolio.createdAt)} • Last updated{" "}
              {formatDate(portfolio.updatedAt)}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            data-testid="edit-portfolio-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Portfolio Warning */}
        {portfolio.isActive && (
          <div className="mb-6 p-4 rounded-lg bg-[#3b82f6]/20 border border-[#3b82f6]/30">
            <p className="text-sm text-[#3b82f6]">
              ⭐ This is your active portfolio. Changes will affect your dashboard view.
            </p>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mb-6 p-4 rounded-lg bg-[#ef4444]/20 border border-[#ef4444]/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-[#ef4444] mb-2">
                  Delete Portfolio?
                </h4>
                <p className="text-sm text-white/80 mb-3">
                  This will permanently delete "{portfolio.name}" with{" "}
                  {portfolio.assetCount} assets and {portfolio.transactionCount}{" "}
                  transactions. This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDelete}
                    size="sm"
                    className="bg-[#ef4444] hover:bg-[#dc2626]"
                    data-testid="confirm-delete-portfolio"
                  >
                    Delete Permanently
                  </Button>
                </div>
              </div>
            </div>
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

          {/* Portfolio Stats */}
          <div>
            <label className="block text-sm font-medium mb-2">Portfolio Stats</label>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <div>
                <div className="text-xs text-white/50 mb-1">Total Value</div>
                <div className="font-semibold">
                  ${portfolio.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">24h Change</div>
                <div
                  className={`font-semibold ${
                    portfolio.change24h >= 0 ? "text-[#10b981]" : "text-[#ef4444]"
                  }`}
                >
                  {portfolio.change24h >= 0 ? "+" : ""}
                  {portfolio.changePercent24h.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Assets</div>
                <div className="font-semibold">{portfolio.assetCount}</div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Transactions</div>
                <div className="font-semibold">{portfolio.transactionCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          {/* Delete Button */}
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={portfolio.isActive || showDeleteConfirm}
            className="text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444]/10"
            data-testid="delete-portfolio-button"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Portfolio
          </Button>

          {/* Save/Cancel */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="edit-portfolio-cancel"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="edit-portfolio-save">
              Save Changes
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
