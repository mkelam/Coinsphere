import { useEffect, useState } from "react"
import { transactionsApi, Transaction } from "@/services/transactions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { usePortfolio } from "@/contexts/PortfolioContext"

export function TransactionHistory() {
  const { currentPortfolio } = usePortfolio()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const data = await transactionsApi.getTransactions(currentPortfolio?.id, 20)
        setTransactions(data.transactions)
      } catch (err) {
        setError('Failed to load transactions')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (currentPortfolio) {
      fetchTransactions()
    }
  }, [currentPortfolio])

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'buy':
        return 'bg-green-500'
      case 'sell':
        return 'bg-red-500'
      case 'transfer_in':
        return 'bg-blue-500'
      case 'transfer_out':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getTypeLabel = (type: Transaction['type']) => {
    return type.replace('_', ' ').toUpperCase()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No transactions yet. Start by adding a transaction to track your portfolio.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-4">
                {tx.token?.logoUrl && (
                  <img
                    src={tx.token.logoUrl}
                    alt={tx.token.symbol}
                    className="h-10 w-10 rounded-full"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tx.token?.symbol || 'Unknown'}</span>
                    <Badge className={getTypeColor(tx.type)}>
                      {getTypeLabel(tx.type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(tx.timestamp)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {tx.type === 'buy' || tx.type === 'transfer_in' ? '+' : '-'}
                  {tx.amount.toFixed(4)} {tx.token?.symbol}
                </p>
                <p className="text-sm text-muted-foreground">
                  @ {formatCurrency(tx.price)}
                  {tx.fee > 0 && ` (Fee: ${formatCurrency(tx.fee)})`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
