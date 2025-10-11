import { useState, useEffect } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { X, Trash2, AlertTriangle } from "lucide-react"

type TransactionType = "buy" | "sell" | "transfer" | "receive"

interface Transaction {
  id: string
  type: TransactionType
  asset: string
  assetSymbol: string
  amount: number
  pricePerUnit: number
  totalValue: number
  fee: number
  date: string
  portfolio: string
  exchange: string
  notes?: string
}

interface EditTransactionModalProps {
  isOpen: boolean
  transaction: Transaction | null
  onClose: () => void
  onSave: (
    id: string,
    updates: {
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
    }
  ) => void
  onDelete: (id: string) => void
  portfolios: Array<{ id: string; name: string }>
}

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

export function EditTransactionModal({
  isOpen,
  transaction,
  onClose,
  onSave,
  onDelete,
  portfolios,
}: EditTransactionModalProps) {
  const [type, setType] = useState<TransactionType>("buy")
  const [amount, setAmount] = useState("")
  const [pricePerUnit, setPricePerUnit] = useState("")
  const [fee, setFee] = useState("")
  const [date, setDate] = useState("")
  const [portfolio, setPortfolio] = useState("")
  const [exchange, setExchange] = useState("Coinbase")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Populate form when transaction changes
  useEffect(() => {
    if (transaction) {
      setType(transaction.type)
      setAmount(transaction.amount.toString())
      setPricePerUnit(transaction.pricePerUnit.toString())
      setFee(transaction.fee.toString())
      setDate(new Date(transaction.date).toISOString().slice(0, 16))

      // Find portfolio ID from name
      const foundPortfolio = portfolios.find((p) => p.name === transaction.portfolio)
      setPortfolio(foundPortfolio?.id || portfolios[0]?.id || "")

      setExchange(transaction.exchange)
      setNotes(transaction.notes || "")
      setErrors({})
      setShowDeleteConfirm(false)
    }
  }, [transaction, portfolios])

  if (!isOpen || !transaction) return null

  const handleSave = () => {
    // Validation
    const newErrors: Record<string, string> = {}

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
    onSave(transaction.id, {
      type,
      asset: transaction.asset,
      assetSymbol: transaction.assetSymbol,
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

  const handleDelete = () => {
    onDelete(transaction.id)
    handleClose()
  }

  const handleClose = () => {
    setShowDeleteConfirm(false)
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
          <div>
            <h2 className="text-2xl font-bold">Edit Transaction</h2>
            <p className="text-sm text-white/60 mt-1">
              {transaction.assetSymbol} • {new Date(transaction.date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            data-testid="edit-transaction-modal-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mb-6 p-4 rounded-lg bg-[#ef4444]/20 border border-[#ef4444]/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-[#ef4444] mb-2">
                  Delete Transaction?
                </h4>
                <p className="text-sm text-white/80 mb-3">
                  This will permanently delete this {transaction.type} transaction for{" "}
                  {transaction.amount} {transaction.assetSymbol}. This action cannot be undone.
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
                    data-testid="confirm-delete-transaction"
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

          {/* Asset Display (Read-only) */}
          <div>
            <label className="block text-sm font-medium mb-2">Asset</label>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <div className="font-semibold">{transaction.assetSymbol}</div>
              <div className="text-sm text-white/60">{transaction.asset}</div>
            </div>
            <p className="mt-1 text-xs text-white/50">
              Asset cannot be changed. Delete and create a new transaction if needed.
            </p>
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
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          {/* Delete Button */}
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={showDeleteConfirm}
            className="text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444]/10"
            data-testid="delete-transaction-button"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Transaction
          </Button>

          {/* Save/Cancel */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="save-transaction">
              Save Changes
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
