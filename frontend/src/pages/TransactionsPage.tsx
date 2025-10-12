import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Breadcrumb } from "@/components/Breadcrumb"
import { useToast } from "@/contexts/ToastContext"
import { AddTransactionModal } from "@/components/AddTransactionModal"
import { EditTransactionModal } from "@/components/EditTransactionModal"
import { transactionService, Transaction, TransactionType } from "@/services/transactionService"
import { portfolioService } from "@/services/portfolioService"
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  Repeat,
} from "lucide-react"

export function TransactionsPage() {
  const toast = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [portfolios, setPortfolios] = useState<Array<{ id: string; name: string }>>([])
  const [, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [filterType, setFilterType] = useState<TransactionType | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch transactions and portfolios from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [transactionsData, portfoliosData] = await Promise.all([
          transactionService.getAll(),
          portfolioService.getAll(),
        ])
        setTransactions(transactionsData)
        setPortfolios(portfoliosData.map((p) => ({ id: p.id, name: p.name })))
      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast.error(error.message || "Failed to load transactions")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])


  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case "buy":
        return <ArrowDownLeft className="w-4 h-4 text-[#10b981]" />
      case "sell":
        return <ArrowUpRight className="w-4 h-4 text-[#ef4444]" />
      case "transfer":
        return <Repeat className="w-4 h-4 text-[#3b82f6]" />
      case "receive":
        return <TrendingDown className="w-4 h-4 text-[#10b981]" />
    }
  }

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case "buy":
        return "text-[#10b981]"
      case "sell":
        return "text-[#ef4444]"
      case "transfer":
        return "text-[#3b82f6]"
      case "receive":
        return "text-[#10b981]"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleAddTransaction = async (newTransaction: {
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
  }) => {
    try {
      const transaction = await transactionService.create(newTransaction)
      setTransactions([transaction, ...transactions])
      setShowAddModal(false)
      toast.success(`${newTransaction.type.charAt(0).toUpperCase() + newTransaction.type.slice(1)} transaction added: ${newTransaction.amount} ${newTransaction.assetSymbol}`)
    } catch (error: any) {
      console.error("Error adding transaction:", error)
      toast.error(error.message || "Failed to add transaction")
    }
  }

  const handleEditTransaction = async (
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
  ) => {
    try {
      const updatedTransaction = await transactionService.update(id, updates)
      setTransactions(
        transactions.map((tx) =>
          tx.id === id ? updatedTransaction : tx
        )
      )
      setEditingTransaction(null)
      toast.success(`Transaction updated: ${updates.amount} ${updates.assetSymbol}`)
    } catch (error: any) {
      console.error("Error updating transaction:", error)
      toast.error(error.message || "Failed to update transaction")
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    const deletedTransaction = transactions.find((tx) => tx.id === id)

    try {
      await transactionService.delete(id)
      setTransactions(transactions.filter((tx) => tx.id !== id))
      setEditingTransaction(null)
      toast.success(`Transaction deleted: ${deletedTransaction?.amount} ${deletedTransaction?.assetSymbol}`)
    } catch (error: any) {
      console.error("Error deleting transaction:", error)
      toast.error(error.message || "Failed to delete transaction")
    }
  }

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === "all" || tx.type === filterType
    const matchesSearch =
      searchQuery === "" ||
      tx.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.assetSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.portfolio.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const totalBuys = transactions
    .filter((tx) => tx.type === "buy")
    .reduce((sum, tx) => sum + tx.totalValue, 0)

  const totalSells = transactions
    .filter((tx) => tx.type === "sell")
    .reduce((sum, tx) => sum + tx.totalValue, 0)

  const totalFees = transactions.reduce((sum, tx) => sum + tx.fee, 0)

  return (
    <div className="min-h-screen bg-transparent">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: 'Portfolios', path: '/portfolios' },
            { label: 'Transactions' }
          ]}
          className="mb-6"
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Transactions</h1>
            <p className="text-white/60">
              Track and manage your trading history
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            size="lg"
            data-testid="add-transaction-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Transaction
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <GlassCard hover={false}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/60 mb-1">Total Buys</div>
                <div className="text-2xl font-bold text-[#10b981]">
                  ${totalBuys.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#10b981]/20">
                <TrendingDown className="w-6 h-6 text-[#10b981]" />
              </div>
            </div>
          </GlassCard>

          <GlassCard hover={false}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/60 mb-1">Total Sells</div>
                <div className="text-2xl font-bold text-[#ef4444]">
                  ${totalSells.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#ef4444]/20">
                <TrendingUp className="w-6 h-6 text-[#ef4444]" />
              </div>
            </div>
          </GlassCard>

          <GlassCard hover={false}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/60 mb-1">Total Fees</div>
                <div className="text-2xl font-bold">
                  ${totalFees.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/10">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Filters & Search */}
        <GlassCard hover={false} className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-white placeholder-white/40"
                data-testid="transaction-search"
              />
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                size="sm"
                data-testid="filter-all"
              >
                All
              </Button>
              <Button
                variant={filterType === "buy" ? "default" : "outline"}
                onClick={() => setFilterType("buy")}
                size="sm"
                data-testid="filter-buy"
              >
                Buy
              </Button>
              <Button
                variant={filterType === "sell" ? "default" : "outline"}
                onClick={() => setFilterType("sell")}
                size="sm"
                data-testid="filter-sell"
              >
                Sell
              </Button>
              <Button
                variant={filterType === "transfer" ? "default" : "outline"}
                onClick={() => setFilterType("transfer")}
                size="sm"
                data-testid="filter-transfer"
              >
                Transfer
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Transactions Table */}
        <GlassCard hover={false}>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">No transactions found</h3>
              <p className="text-white/60 mb-6">
                {searchQuery || filterType !== "all"
                  ? "Try adjusting your filters"
                  : "Add your first transaction to get started"}
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-white/60">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-white/60">
                      Asset
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">
                      Amount
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">
                      Price
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">
                      Total Value
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">
                      Fee
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-white/60">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-white/60">
                      Portfolio
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                      onClick={() => setEditingTransaction(tx)}
                      data-testid={`transaction-row-${tx.id}`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(tx.type)}
                          <span className={`capitalize ${getTypeColor(tx.type)}`}>
                            {tx.type}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{tx.assetSymbol}</div>
                          <div className="text-sm text-white/50">{tx.asset}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono">
                        {tx.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 8,
                        })}
                      </td>
                      <td className="py-4 px-4 text-right font-mono">
                        ${tx.pricePerUnit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-right font-mono">
                        ${tx.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-right text-white/60 font-mono">
                        ${tx.fee.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-sm text-white/60">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <div className="truncate max-w-[150px]">{tx.portfolio}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredTransactions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm text-white/60">
              <div>
                Showing {filteredTransactions.length} of {transactions.length}{" "}
                transactions
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Add Transaction Modal */}
        <AddTransactionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddTransaction}
          portfolios={portfolios}
        />

        {/* Edit Transaction Modal */}
        <EditTransactionModal
          isOpen={!!editingTransaction}
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          portfolios={portfolios}
        />
      </main>
    </div>
  )
}
