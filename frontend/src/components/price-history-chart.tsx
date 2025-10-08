import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/services/api"

interface PriceHistoryChartProps {
  symbol: string
  timeframe?: '24h' | '7d' | '30d' | '1y'
}

interface PriceDataPoint {
  time: string
  price: number
  formattedTime: string
}

export function PriceHistoryChart({ symbol, timeframe = '7d' }: PriceHistoryChartProps) {
  const [data, setData] = useState<PriceDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch price history from backend
        const response = await api.get(`/tokens/${symbol}/history`, {
          params: { timeframe },
        })

        const priceData = response.data.priceHistory || []

        // Format data for chart
        const formattedData = priceData.map((point: any) => ({
          time: point.time,
          price: point.close,
          formattedTime: formatTime(point.time, timeframe),
        }))

        setData(formattedData)
      } catch (err) {
        console.error('Error fetching price history:', err)
        setError('Failed to load price history')
        // Fallback to mock data for demo
        setData(generateMockData(timeframe))
      } finally {
        setLoading(false)
      }
    }

    fetchPriceHistory()
  }, [symbol, timeframe])

  const formatTime = (timestamp: string, tf: string) => {
    const date = new Date(timestamp)
    if (tf === '24h') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (tf === '7d' || tf === '30d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }
  }

  const generateMockData = (tf: string): PriceDataPoint[] => {
    const now = new Date()
    const points: PriceDataPoint[] = []
    let count = tf === '24h' ? 24 : tf === '7d' ? 7 : tf === '30d' ? 30 : 12

    let basePrice = symbol === 'BTC' ? 120000 : symbol === 'ETH' ? 4400 : 220

    for (let i = count; i >= 0; i--) {
      const time = new Date(now.getTime() - i * (tf === '24h' ? 3600000 : 86400000))
      const randomChange = (Math.random() - 0.5) * basePrice * 0.05
      const price = basePrice + randomChange

      points.push({
        time: time.toISOString(),
        price: parseFloat(price.toFixed(2)),
        formattedTime: formatTime(time.toISOString(), tf),
      })
    }

    return points
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3">
          <p className="text-sm font-medium">{payload[0].payload.formattedTime}</p>
          <p className="text-lg font-bold text-primary">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{symbol} Price History</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{symbol} Price History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const minPrice = Math.min(...data.map(d => d.price))
  const maxPrice = Math.max(...data.map(d => d.price))
  const priceChange = data.length > 1 ? data[data.length - 1].price - data[0].price : 0
  const priceChangePercent = data.length > 1 ? (priceChange / data[0].price) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{symbol} Price History</CardTitle>
          <div className="text-right">
            <p className={`text-lg font-bold ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {timeframe === '24h' ? 'Last 24 hours' :
               timeframe === '7d' ? 'Last 7 days' :
               timeframe === '30d' ? 'Last 30 days' : 'Last year'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis
              dataKey="formattedTime"
              stroke="rgba(255, 255, 255, 0.5)"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              domain={[minPrice * 0.98, maxPrice * 1.02]}
              stroke="rgba(255, 255, 255, 0.5)"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              stroke={priceChange >= 0 ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              name="Price"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
