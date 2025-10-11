import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Star, TrendingUp, TrendingDown, Lock } from "lucide-react"
import { Header } from "@/components/header"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { PriceHistoryChart } from "@/components/price-history-chart"
import { Breadcrumb } from "@/components/Breadcrumb"
import { useAuth } from "@/contexts/AuthContext"
import { LoadingSpinner } from "@/components/LoadingScreen"

type Tab = 'overview' | 'predictions' | 'risk' | 'holdings' | 'news'

interface AssetData {
  symbol: string
  name: string
  icon: string
  currentPrice: number
  change24h: number
  changePercent24h: number
  marketCap: number
  volume24h: number
  athPrice: number
  athDate: string
  atlPrice: number
  atlDate: string
  circulatingSupply: number
  maxSupply: number
  totalSupply: number
}

export function AssetDetailPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'overview')
  const [loading, setLoading] = useState(true)
  const [asset, setAsset] = useState<AssetData | null>(null)
  const [chartTimeframe, setChartTimeframe] = useState('7d')

  const isPro = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'power'

  useEffect(() => {
    const fetchAssetData = async () => {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/tokens/${symbol}`)
      // const data = await response.json()

      // Mock data
      const mockData: AssetData = {
        symbol: symbol?.toUpperCase() || 'BTC',
        name: symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : symbol === 'SOL' ? 'Solana' : 'Unknown',
        icon: '₿',
        currentPrice: 67234.50,
        change24h: 1234.20,
        changePercent24h: 1.87,
        marketCap: 1320000000000,
        volume24h: 42300000000,
        athPrice: 69000,
        athDate: 'Nov 2021',
        atlPrice: 67.81,
        atlDate: 'Jul 2013',
        circulatingSupply: 19800000,
        maxSupply: 21000000,
        totalSupply: 19800000
      }

      setAsset(mockData)
      setLoading(false)
    }

    fetchAssetData()
  }, [symbol])

  useEffect(() => {
    // Update URL when tab changes
    setSearchParams({ tab: activeTab })
  }, [activeTab, setSearchParams])

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  if (loading || !asset) {
    return (
      <div className="min-h-screen bg-transparent">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: 'Assets', path: '/dashboard' },
            { label: asset.name }
          ]}
          className="mb-6"
        />
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Asset Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{asset.icon}</span>
              <div>
                <h1 className="text-3xl font-bold text-white" data-testid="asset-name">
                  {asset.name} ({asset.symbol})
                </h1>
              </div>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-white" data-testid="asset-price">
                {formatCurrency(asset.currentPrice)}
              </span>
              <span
                className={`flex items-center gap-1 text-lg ${
                  asset.changePercent24h >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}
                data-testid="asset-change-24h"
              >
                {asset.changePercent24h >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                {formatCurrency(Math.abs(asset.change24h))} ({asset.changePercent24h >= 0 ? '+' : ''}
                {asset.changePercent24h.toFixed(2)}%) 24h
              </span>
            </div>
          </div>

          <Button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-white transition-colors">
            <Star className="w-5 h-5" />
            Watch
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 border-b border-white/10 mb-6">
          {(['overview', 'predictions', 'risk', 'holdings', 'news'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'text-white border-[#3b82f6]'
                  : 'text-white/50 border-transparent hover:text-white/70'
              }`}
              data-testid={`tab-${tab}`}
            >
              <div className="flex items-center gap-2">
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {(tab === 'predictions' || tab === 'risk') && !isPro && (
                  <Lock className="w-3 h-3" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div data-testid={`${activeTab}-content`}>
          {activeTab === 'overview' && <OverviewTab asset={asset} chartTimeframe={chartTimeframe} setChartTimeframe={setChartTimeframe} />}
          {activeTab === 'predictions' && <PredictionsTab asset={asset} isPro={isPro} />}
          {activeTab === 'risk' && <RiskTab asset={asset} isPro={isPro} />}
          {activeTab === 'holdings' && <HoldingsTab asset={asset} />}
          {activeTab === 'news' && <NewsTab asset={asset} />}
        </div>
      </main>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ asset, chartTimeframe, setChartTimeframe }: { asset: AssetData, chartTimeframe: string, setChartTimeframe: (tf: string) => void }) {
  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  }

  const formatNumber = (value: number) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <div className="space-y-6">
      {/* Price Chart */}
      <GlassCard hover={false} data-testid="price-chart">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Price Chart</h2>
          <div className="flex items-center gap-2">
            {['1D', '7D', '30D', '90D', '1Y', 'ALL'].map((tf) => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf.toLowerCase())}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  chartTimeframe === tf.toLowerCase()
                    ? 'bg-[#3b82f6] text-white'
                    : 'bg-white/[0.05] text-white/70 hover:bg-white/[0.10]'
                }`}
                data-testid={`timeframe-${tf.toLowerCase()}`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <PriceHistoryChart symbol={asset.symbol} timeframe={chartTimeframe} />
      </GlassCard>

      {/* Market Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard hover={false}>
          <h3 className="text-lg font-semibold text-white mb-4">Market Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/50 text-sm">Market Cap</span>
              <span className="text-white font-medium" data-testid="market-cap">{formatCurrency(asset.marketCap)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50 text-sm">24h Volume</span>
              <span className="text-white font-medium" data-testid="volume-24h">{formatCurrency(asset.volume24h)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50 text-sm">All-Time High</span>
              <span className="text-white font-medium">{formatCurrency(asset.athPrice)} ({asset.athDate})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50 text-sm">All-Time Low</span>
              <span className="text-white font-medium">{formatCurrency(asset.atlPrice)} ({asset.atlDate})</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <h3 className="text-lg font-semibold text-white mb-4">Supply Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/50 text-sm">Circulating Supply</span>
              <span className="text-white font-medium" data-testid="circulating-supply">{formatNumber(asset.circulatingSupply)} {asset.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50 text-sm">Max Supply</span>
              <span className="text-white font-medium">{formatNumber(asset.maxSupply)} {asset.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50 text-sm">Total Supply</span>
              <span className="text-white font-medium">{formatNumber(asset.totalSupply)} {asset.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50 text-sm">% of Max Mined</span>
              <span className="text-white font-medium">{((asset.circulatingSupply / asset.maxSupply) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

// Predictions Tab Component
function PredictionsTab({ asset, isPro }: { asset: AssetData, isPro: boolean }) {
  const navigate = useNavigate()
  const [timeframe, setTimeframe] = useState('7d')

  if (!isPro) {
    return (
      <div className="relative">
        <div className="filter blur-sm pointer-events-none" data-testid="paywall-overlay">
          <GlassCard hover={false}>
            <div className="space-y-4">
              <div className="text-2xl font-bold text-white">$72,450</div>
              <div className="text-[#10b981]">+$5,216 (+7.8%)</div>
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
              <div className="h-4 bg-white/10 rounded w-1/2"></div>
            </div>
          </GlassCard>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <GlassCard hover={false} className="max-w-md text-center">
            <Lock className="w-12 h-12 text-[#3b82f6] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">AI Predictions Available on Pro Plan</h3>
            <p className="text-white/70 mb-6">
              Unlock AI-powered price predictions with confidence scores and technical indicators
            </p>
            <Button
              onClick={() => navigate('/pricing')}
              className="px-6 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-medium transition-colors"
              data-testid="upgrade-button"
            >
              Upgrade to Pro →
            </Button>
          </GlassCard>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <GlassCard hover={false} data-testid="prediction-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">AI Price Prediction</h2>
          <div className="flex items-center gap-2">
            {['7D', '14D', '30D'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf.toLowerCase())}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  timeframe === tf.toLowerCase()
                    ? 'bg-[#3b82f6] text-white'
                    : 'bg-white/[0.05] text-white/70 hover:bg-white/[0.10]'
                }`}
                data-testid={`timeframe-${tf.toLowerCase()}`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="text-sm text-white/50 mb-2">Predicted Price</div>
            <div className="text-4xl font-bold text-white mb-2" data-testid="predicted-price">$72,450</div>
            <div className="text-sm text-white/70">Current Price: $67,234</div>
            <div className="text-lg text-[#10b981] mt-2">Expected Change: +$5,216 (+7.8%)</div>
          </div>

          <div>
            <div className="text-sm text-white/50 mb-2">Confidence</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#10b981]" style={{ width: '82%' }}></div>
              </div>
              <span className="text-white font-medium" data-testid="confidence-score">82% (High)</span>
            </div>
          </div>

          <div>
            <div className="text-sm text-white/50 mb-2">Direction</div>
            <div className="flex items-center gap-2 text-[#10b981]" data-testid="direction">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">BULLISH</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="text-sm font-semibold text-white mb-3">Key Indicators Supporting This Prediction:</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2" data-testid="indicator-rsi">
                <span className="text-[#10b981]">✓</span>
                <span className="text-white/70">RSI: 58 (Neutral, room to grow)</span>
              </div>
              <div className="flex items-start gap-2" data-testid="indicator-macd">
                <span className="text-[#10b981]">✓</span>
                <span className="text-white/70">MACD: Bullish crossover detected</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#10b981]">✓</span>
                <span className="text-white/70">Volume: +23% above 30-day average</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#10b981]">✓</span>
                <span className="text-white/70">Social Sentiment: 72% positive</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#f59e0b]">⚠</span>
                <span className="text-white/70">Resistance Level: $70,000 (watch closely)</span>
              </div>
            </div>
          </div>

          <Button className="w-full px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-white transition-colors">
            📊 View Model Transparency
          </Button>
        </div>
      </GlassCard>

      <GlassCard hover={false}>
        <h3 className="text-lg font-semibold text-white mb-4">Historical Accuracy</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/70">7-Day Predictions</span>
              <span className="text-white">76% accurate</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#10b981]" style={{ width: '76%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/70">14-Day Predictions</span>
              <span className="text-white">68% accurate</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#3b82f6]" style={{ width: '68%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/70">30-Day Predictions</span>
              <span className="text-white">61% accurate</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#f59e0b]" style={{ width: '61%' }}></div>
            </div>
          </div>
          <div className="text-xs text-white/50 mt-4">Last updated: 2 hours ago</div>
        </div>
      </GlassCard>
    </div>
  )
}

// Risk Tab Component
function RiskTab({ asset, isPro }: { asset: AssetData, isPro: boolean }) {
  const navigate = useNavigate()

  if (!isPro) {
    return (
      <div className="relative">
        <div className="filter blur-sm pointer-events-none">
          <GlassCard hover={false}>
            <div className="space-y-4">
              <div className="text-4xl font-bold text-white">18 / 100</div>
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
              <div className="h-4 bg-white/10 rounded w-1/2"></div>
            </div>
          </GlassCard>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <GlassCard hover={false} className="max-w-md text-center">
            <Lock className="w-12 h-12 text-[#3b82f6] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Risk Analysis Available on Pro Plan</h3>
            <p className="text-white/70 mb-6">
              Get comprehensive degen risk scores with detailed factor breakdowns
            </p>
            <Button
              onClick={() => navigate('/pricing')}
              className="px-6 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-medium transition-colors"
            >
              Upgrade to Pro →
            </Button>
          </GlassCard>
        </div>
      </div>
    )
  }

  const riskScore = 18
  const getRiskColor = (score: number) => {
    if (score < 30) return '#10b981'
    if (score < 60) return '#f59e0b'
    if (score < 80) return '#fb923c'
    return '#ef4444'
  }

  const getRiskLevel = (score: number) => {
    if (score < 30) return 'LOW RISK'
    if (score < 60) return 'MEDIUM RISK'
    if (score < 80) return 'HIGH RISK'
    return 'EXTREME RISK'
  }

  return (
    <div className="space-y-6">
      <GlassCard hover={false}>
        <h2 className="text-xl font-semibold text-white mb-6">Degen Risk Score</h2>

        <div className="mb-6">
          <div className="text-5xl font-bold mb-2" style={{ color: getRiskColor(riskScore) }} data-testid="risk-score">
            {riskScore} / 100
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
            <div className="h-full transition-all" style={{ width: `${riskScore}%`, backgroundColor: getRiskColor(riskScore) }}></div>
          </div>
          <div className="text-lg font-semibold" style={{ color: getRiskColor(riskScore) }} data-testid="risk-level">
            {getRiskLevel(riskScore)}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-sm text-white/70 mb-3">{asset.name} is considered {getRiskLevel(riskScore)} due to:</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-[#10b981]">✓</span>
              <span className="text-white/70">Largest market cap ($1.32T)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#10b981]">✓</span>
              <span className="text-white/70">High liquidity (24h vol: $42B)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#10b981]">✓</span>
              <span className="text-white/70">Low volatility (30-day: 2.3%)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#10b981]">✓</span>
              <span className="text-white/70">Established project (since 2009)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#10b981]">✓</span>
              <span className="text-white/70">Listed on 200+ exchanges</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#10b981]">✓</span>
              <span className="text-white/70">Decentralized governance</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <div className="text-sm font-semibold text-white mb-4">Risk Breakdown</div>
          <div className="space-y-3">
            {[
              { label: 'Market Risk', score: 5, level: 'Very Low' },
              { label: 'Liquidity Risk', score: 3, level: 'Very Low' },
              { label: 'Volatility Risk', score: 8, level: 'Low' },
              { label: 'Project Risk', score: 2, level: 'Very Low' },
              { label: 'Regulatory Risk', score: 15, level: 'Low' }
            ].map((factor) => (
              <div key={factor.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">{factor.label}</span>
                  <span className="text-white">{factor.score}/100 ({factor.level})</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full" style={{ width: `${factor.score}%`, backgroundColor: getRiskColor(factor.score) }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

// Holdings Tab Component
function HoldingsTab({ asset }: { asset: AssetData }) {
  return (
    <div className="space-y-6">
      <GlassCard hover={false} data-testid="holdings-content">
        <h2 className="text-xl font-semibold text-white mb-6">Your {asset.symbol} Holdings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm text-white/50 pb-3">Portfolio</th>
                <th className="text-right text-sm text-white/50 pb-3">Amount</th>
                <th className="text-right text-sm text-white/50 pb-3">Value</th>
                <th className="text-right text-sm text-white/50 pb-3">P&L</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="py-4 text-white">Personal Holdings</td>
                <td className="py-4 text-right text-white">0.5 {asset.symbol}</td>
                <td className="py-4 text-right text-white">$33,617</td>
                <td className="py-4 text-right text-[#10b981]">+$2,450</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-4 text-white">Trading Portfolio</td>
                <td className="py-4 text-right text-white">0.25 {asset.symbol}</td>
                <td className="py-4 text-right text-white">$16,808</td>
                <td className="py-4 text-right text-[#10b981]">+$892</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-4 text-white">DeFi Experiments</td>
                <td className="py-4 text-right text-white">0.1 {asset.symbol}</td>
                <td className="py-4 text-right text-white">$6,723</td>
                <td className="py-4 text-right text-[#ef4444]">-$124</td>
              </tr>
              <tr className="font-semibold">
                <td className="py-4 text-white">Total</td>
                <td className="py-4 text-right text-white">0.85 {asset.symbol}</td>
                <td className="py-4 text-right text-white">$57,148</td>
                <td className="py-4 text-right text-[#10b981]">+$3,218</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Button className="mt-6 px-4 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white transition-colors">
          + Add {asset.symbol} Holding
        </Button>
      </GlassCard>

      <GlassCard hover={false}>
        <h2 className="text-lg font-semibold text-white mb-4">Recent {asset.symbol} Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm text-white/50 pb-3">Date</th>
                <th className="text-left text-sm text-white/50 pb-3">Type</th>
                <th className="text-right text-sm text-white/50 pb-3">Amount</th>
                <th className="text-right text-sm text-white/50 pb-3">Price</th>
                <th className="text-right text-sm text-white/50 pb-3">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="py-3 text-sm text-white/70">Oct 5, 2025</td>
                <td className="py-3 text-sm text-[#10b981]">Buy</td>
                <td className="py-3 text-right text-sm text-white">0.1 {asset.symbol}</td>
                <td className="py-3 text-right text-sm text-white/70">$66,500</td>
                <td className="py-3 text-right text-sm text-white">$6,650</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 text-sm text-white/70">Sep 28, 2025</td>
                <td className="py-3 text-sm text-[#ef4444]">Sell</td>
                <td className="py-3 text-right text-sm text-white">0.05 {asset.symbol}</td>
                <td className="py-3 text-right text-sm text-white/70">$65,200</td>
                <td className="py-3 text-right text-sm text-white">$3,260</td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-white/70">Sep 15, 2025</td>
                <td className="py-3 text-sm text-[#10b981]">Buy</td>
                <td className="py-3 text-right text-sm text-white">0.2 {asset.symbol}</td>
                <td className="py-3 text-right text-sm text-white/70">$62,100</td>
                <td className="py-3 text-right text-sm text-white">$12,420</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Button className="mt-4 text-sm text-[#3b82f6] hover:text-[#3b82f6]/80 transition-colors">
          View All Transactions →
        </Button>
      </GlassCard>
    </div>
  )
}

// News Tab Component
function NewsTab({ asset }: { asset: AssetData }) {
  const newsItems = [
    {
      title: `${asset.name} Breaks $67K as ETF Inflows Surge`,
      source: 'CoinDesk',
      time: '2 hours ago'
    },
    {
      title: `BlackRock's ${asset.name} ETF Sees Record $500M Daily Inflow`,
      source: 'Bloomberg',
      time: '5 hours ago'
    },
    {
      title: `Analysts Predict ${asset.symbol} Could Reach $75K by Year End`,
      source: 'Cointelegraph',
      time: '1 day ago'
    }
  ]

  return (
    <div className="space-y-4">
      <GlassCard hover={false}>
        <h2 className="text-xl font-semibold text-white mb-6">Latest {asset.name} News</h2>
        <div className="space-y-4">
          {newsItems.map((item, idx) => (
            <div key={idx} className="pb-4 border-b border-white/10 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">{item.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
