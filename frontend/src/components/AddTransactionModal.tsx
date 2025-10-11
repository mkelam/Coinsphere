import { useState } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { X, Search } from "lucide-react"

type TransactionType = "buy" | "sell" | "transfer" | "receive"

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (transaction: {
    type: TransactionType
    asset: string
    assetSymbol: string
    amount: number
    pricePerUnit: number
    fee: number
    date: string
    portfolio: string
    exchange: string
    notes?: string
  }) => void
  portfolios: Array<{ id: string; name: string }>
}

// Mock popular crypto assets
const POPULAR_ASSETS = [
  { symbol: "BTC", name: "Bitcoin", icon: "₿" },
  { symbol: "ETH", name: "Ethereum", icon: "Ξ" },
  { symbol: "USDT", name: "Tether", icon: "₮" },
  { symbol: "BNB", name: "Binance Coin", icon: "Ⓑ" },
  { symbol: "SOL", name: "Solana", icon: "◎" },
  { symbol: "ADA", name: "Cardano", icon: "₳" },
  { symbol: "XRP", name: "Ripple", icon: "✕" },
  { symbol: "DOGE", name: "Dogecoin", icon: "Ð" },
  { symbol: "DOT", name: "Polkadot", icon: "●" },
  { symbol: "MATIC", name: "Polygon", icon: "Ⓜ" },
]

const EXCHANGES = [
  "Binance",
  "Coinbase",
  "Kraken",
  "Gemini",
  "KuCoin",
  "Bybit",
  "OKX",
  "HTX",
  "Manual Entry",
  "Other",
]

export function AddTransactionModal({
  isOpen,
  onClose,
  onSave,
  portfolios,
}: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>("buy")
  const [assetSearch, setAssetSearch] = useState("")
  const [selectedAsset, setSelectedAsset] = useState<{
    symbol: string
    name: string
  } | null>(null)
  const [amount, setAmount] = useState("")
  const [pricePerUnit, setPricePerUnit] = useState("")
  const [fee, setFee] = useState("")
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
  )
  const [portfolio, setPortfolio] = useState(portfolios[0]?.id || "")
  const [exchange, setExchange] = useState("Coinbase")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const filteredAssets = POPULAR_ASSETS.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(assetSearch.toLowerCase()) ||
      asset.name.toLowerCase().includes(assetSearch.toLowerCase())
  )

  const handleSave = () => {
    // Validation
    const newErrors: Record<string, string> = {}

    if (!selectedAsset) {
      newErrors.asset = "Please select an asset"
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0"
    }

    if (!pricePerUnit || parseFloat(pricePerUnit) < 0) {
      newErrors.pricePerUnit = "Price must be 0 or greater"
    }

    if (fee && parseFloat(fee) < 0) {
      newErrors.fee = "Fee must be 0 or greater"
    }

    if (!portfolio) {
      newErrors.portfolio = "Please select a portfolio"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Save transaction
    onSave({
      type,
      asset: selectedAsset!.name,
      assetSymbol: selectedAsset!.symbol,
      amount: parseFloat(amount),
      pricePerUnit: parseFloat(pricePerUnit),
      fee: fee ? parseFloat(fee) : 0,
      date,
      portfolio: portfolios.find((p) => p.id === portfolio)?.name || portfolio,
      exchange,
      notes: notes.trim(),
    })

    handleClose()
  }

  const handleClose = () => {
    // Reset form
    setType("buy")
    setAssetSearch("")
    setSelectedAsset(null)
    setAmount("")
    setPricePerUnit("")
    setFee("")
    setDate(new Date().toISOString().slice(0, 16))
    setPortfolio(portfolios[0]?.id || "")
    setExchange("Coinbase")
    setNotes("")
    setErrors({})
    onClose()
  }

  const totalValue =
    amount && pricePerUnit
      ? (parseFloat(amount) * parseFloat(pricePerUnit)).toFixed(2)
      : "0.00"

  const totalWithFee =
    amount && pricePerUnit
      ? (
          parseFloat(amount) * parseFloat(pricePerUnit) +
          (fee ? parseFloat(fee) : 0)
        ).toFixed(2)
      : "0.00"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <GlassCard
        hover={false}
        className="max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Add Transaction</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            data-testid="add-transaction-modal-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Transaction Type <span className="text-[#ef4444]">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["buy", "sell", "transfer", "receive"] as TransactionType[]).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-4 py-3 rounded-lg font-medium capitalize transition-all ${
                      type === t
                        ? "bg-[#3b82f6] text-white"
                        : "bg-white/[0.03] border border-white/10 hover:bg-white/[0.05]"
                    }`}
                    data-testid={`type-${t}`}
                  >
                    {t}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Asset Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Asset <span className="text-[#ef4444]">*</span>
            </label>

            {!selectedAsset ? (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    placeholder="Search by symbol or name..."
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-white placeholder-white/40"
                    data-testid="asset-search"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                  {filteredAssets.map((asset) => (
                    <button
                      key={asset.symbol}
                      onClick={() => {
                        setSelectedAsset(asset)
                        setErrors({ ...errors, asset: "" })
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors text-left"
                      data-testid={`asset-${asset.symbol}`}
                    >
                      <span className="text-2xl">{asset.icon}</span>
                      <div>
                        <div className="font-medium">{asset.symbol}</div>
                        <div className="text-xs text-white/50">{asset.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/10">
                <span className="text-3xl">
                  {POPULAR_ASSETS.find((a) => a.symbol === selectedAsset.symbol)
                    ?.icon || "🪙"}
                </span>
                <div className="flex-1">
                  <div className="font-semibold">{selectedAsset.symbol}</div>
                  <div className="text-sm text-white/60">{selectedAsset.name}</div>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="px-3 py-1 rounded text-sm bg-white/[0.05] hover:bg-white/[0.10] border border-white/10"
                >
                  Change
                </button>
              </div>
            )}
            {errors.asset && (
              <p className="mt-1 text-sm text-[#ef4444]">{errors.asset}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  if (errors.amount) setErrors({ ...errors, amount: "" })
                }}
                placeholder="0.00"
                className={`w-full px-4 py-3 bg-white/[0.03] border rounded-lg focus:outline-none focus:ring-2 text-white placeholder-white/40 ${
                  errors.amount
                    ? "border-[#ef4444] focus:ring-[#ef4444]"
                    : "border-white/10 focus:ring-[#3b82f6]"
                }`}
                data-testid="amount-input"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-[#ef4444]">{errors.amount}</p>
              )}
            </div>

            {/* Price Per Unit */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Price Per Unit <span className="text-[#ef4444]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  value={pricePerUnit}
                  onChange={(e) => {
                    setPricePerUnit(e.target.value)
                    if (errors.pricePerUnit)
                      setErrors({ ...errors, pricePerUnit: "" })
                  }}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-3 bg-white/[0.03] border rounded-lg focus:outline-none focus:ring-2 text-white placeholder-white/40 ${
                    errors.pricePerUnit
                      ? "border-[#ef4444] focus:ring-[#ef4444]"
                      : "border-white/10 focus:ring-[#3b82f6]"
                  }`}
                  data-testid="price-input"
                />
              </div>
              {errors.pricePerUnit && (
                <p className="mt-1 text-sm text-[#ef4444]">{errors.pricePerUnit}</p>
              )}
            </div>
          </div>

          {/* Fee */}
          <div>
            <label className="block text-sm font-medium mb-2">Fee (Optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                $
              </span>
              <input
                type="number"
                step="any"
                value={fee}
                onChange={(e) => {
                  setFee(e.target.value)
                  if (errors.fee) setErrors({ ...errors, fee: "" })
                }}
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-3 bg-white/[0.03] border rounded-lg focus:outline-none focus:ring-2 text-white placeholder-white/40 ${
                  errors.fee
                    ? "border-[#ef4444] focus:ring-[#ef4444]"
                    : "border-white/10 focus:ring-[#3b82f6]"
                }`}
                data-testid="fee-input"
              />
            </div>
            {errors.fee && (
              <p className="mt-1 text-sm text-[#ef4444]">{errors.fee}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Date & Time <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-white"
                data-testid="date-input"
              />
            </div>

            {/* Portfolio */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Portfolio <span className="text-[#ef4444]">*</span>
              </label>
              <select
                value={portfolio}
                onChange={(e) => {
                  setPortfolio(e.target.value)
                  if (errors.portfolio) setErrors({ ...errors, portfolio: "" })
                }}
                className={`w-full px-4 py-3 bg-white/[0.03] border rounded-lg focus:outline-none focus:ring-2 text-white ${
                  errors.portfolio
                    ? "border-[#ef4444] focus:ring-[#ef4444]"
                    : "border-white/10 focus:ring-[#3b82f6]"
                }`}
                data-testid="portfolio-select"
              >
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id} className="bg-gray-900">
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.portfolio && (
                <p className="mt-1 text-sm text-[#ef4444]">{errors.portfolio}</p>
              )}
            </div>
          </div>

          {/* Exchange */}
          <div>
            <label className="block text-sm font-medium mb-2">Exchange/Source</label>
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-white"
              data-testid="exchange-select"
            >
              {EXCHANGES.map((ex) => (
                <option key={ex} value={ex} className="bg-gray-900">
                  {ex}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={2}
              maxLength={500}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-white placeholder-white/40 resize-none"
              data-testid="notes-input"
            />
            <p className="mt-1 text-xs text-white/50">{notes.length}/500 characters</p>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
            <h4 className="font-semibold mb-3">Transaction Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Subtotal:</span>
                <span className="font-mono">${totalValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Fee:</span>
                <span className="font-mono">${fee || "0.00"}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="font-semibold">Total:</span>
                <span className="font-mono font-semibold">${totalWithFee}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="save-transaction">
            Add Transaction
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
