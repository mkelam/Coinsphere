import { useEffect, useState } from 'react'
import { GlassCard } from './glass-card'
import { predictionsApi, type PredictionResponse } from '@/services/predictions'
import { riskApi, type RiskScoreResponse } from '@/services/risk'

interface MarketInsightsProps {
  symbol: string
}

export function MarketInsights({ symbol }: MarketInsightsProps) {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [riskScore, setRiskScore] = useState<RiskScoreResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [pred, risk] = await Promise.all([
          predictionsApi.getPrediction(symbol, '24h'),
          riskApi.getRiskScore(symbol),
        ])
        setPrediction(pred)
        setRiskScore(risk)
      } catch (error) {
        console.error('Error fetching market insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [symbol])

  if (loading) {
    return (
      <GlassCard hover={false}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/[0.05] rounded w-48"></div>
          <div className="h-32 bg-white/[0.05] rounded"></div>
        </div>
      </GlassCard>
    )
  }

  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      safe: 'text-[#10B981]',
      low: 'text-[#10B981]',
      medium: 'text-[#FBB042]',
      high: 'text-[#EF4444]',
      extreme: 'text-[#DC2626]',
    }
    return colors[level] || 'text-white/70'
  }

  const getDirectionColor = (direction: string) => {
    if (direction === 'bullish') return 'text-[#10B981]'
    if (direction === 'bearish') return 'text-[#EF4444]'
    return 'text-white/70'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ML Prediction Card */}
      {prediction && (
        <GlassCard hover={false}>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-1">24h Prediction</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono">
                  ${prediction.prediction.predictedPrice.toLocaleString()}
                </span>
                <span className={`text-lg font-semibold ${getDirectionColor(prediction.prediction.direction)}`}>
                  {prediction.prediction.changePercent > 0 ? '+' : ''}
                  {prediction.prediction.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-3 border-t border-white/10">
              <div>
                <p className="text-sm text-white/60">Confidence</p>
                <p className="text-lg font-semibold">{prediction.prediction.confidence}%</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Direction</p>
                <p className={`text-lg font-semibold capitalize ${getDirectionColor(prediction.prediction.direction)}`}>
                  {prediction.prediction.direction}
                </p>
              </div>
            </div>

            {prediction.prediction.technicalIndicators.rsi && (
              <div className="grid grid-cols-3 gap-4 py-3 border-t border-white/10">
                <div>
                  <p className="text-xs text-white/60">RSI</p>
                  <p className="text-sm font-mono">{prediction.prediction.technicalIndicators.rsi.toFixed(1)}</p>
                </div>
                {prediction.prediction.technicalIndicators.macd && (
                  <div>
                    <p className="text-xs text-white/60">MACD</p>
                    <p className="text-sm font-mono capitalize">
                      {prediction.prediction.technicalIndicators.macd.signal}
                    </p>
                  </div>
                )}
                {prediction.prediction.technicalIndicators.volumeTrend && (
                  <div>
                    <p className="text-xs text-white/60">Volume</p>
                    <p className="text-sm font-mono capitalize">
                      {prediction.prediction.technicalIndicators.volumeTrend}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-white/60 mb-2">Key Factors</p>
              <ul className="space-y-1">
                {prediction.prediction.factors.slice(0, 3).map((factor, index) => (
                  <li key={index} className="text-sm text-white/80 flex items-start gap-2">
                    <span className="text-white/40">"</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Risk Score Card */}
      {riskScore && (
        <GlassCard hover={false}>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-1">Degen Risk Score</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold font-mono">
                  {riskScore.riskScore.overallScore}
                </span>
                <div>
                  <span className="text-sm text-white/40">/100</span>
                  <p className={`text-lg font-semibold capitalize ${getRiskColor(riskScore.riskScore.riskLevel)}`}>
                    {riskScore.riskScore.riskLevel} Risk
                  </p>
                </div>
              </div>
            </div>

            <div className="py-3 border-t border-white/10">
              <p className="text-sm text-white/80">{riskScore.riskScore.analysis.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] rounded-lg p-3">
                <p className="text-xs text-white/60">Volatility</p>
                <p className="text-lg font-semibold font-mono">
                  {riskScore.riskScore.components.volatilityScore}
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3">
                <p className="text-xs text-white/60">Liquidity</p>
                <p className="text-lg font-semibold font-mono">
                  {riskScore.riskScore.components.liquidityScore}
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3">
                <p className="text-xs text-white/60">Market Cap</p>
                <p className="text-lg font-semibold font-mono">
                  {riskScore.riskScore.components.marketCapScore}
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3">
                <p className="text-xs text-white/60">Volume</p>
                <p className="text-lg font-semibold font-mono">
                  {riskScore.riskScore.components.volumeScore}
                </p>
              </div>
            </div>

            {riskScore.riskScore.analysis.warnings.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-xs text-white/60 mb-2">Warnings</p>
                <ul className="space-y-1">
                  {riskScore.riskScore.analysis.warnings.slice(0, 2).map((warning, index) => (
                    <li key={index} className="text-sm text-[#EF4444] flex items-start gap-2">
                      <span> </span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
