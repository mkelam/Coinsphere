/**
 * Prediction Modal Component
 * Shows detailed AI predictions with visualizations for 7d, 14d, and 30d timeframes
 */

import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Target, Brain, AlertTriangle, Loader2 } from 'lucide-react';

interface PredictionData {
  symbol: string;
  timeframe: string;
  prediction: {
    direction: string;
    confidence: string;
    confidenceScore: number;
    targetPrice: number;
    targetPriceRange: {
      low: number;
      high: number;
    };
    currentPrice: number;
    potentialGain: number;
  };
  indicators: {
    rsi: number;
    macd: string;
    volumeTrend: string;
    socialSentiment: number;
  };
  explanation: string;
  ensemble_metadata?: {
    method: string;
    models_used: number;
    model_names: string[];
  };
  generated_at: string;
  model_version: string;
}

interface PredictionModalProps {
  symbol: string;
  name: string;
  currentPrice: number;
  image: string;
  onClose: () => void;
}

export function PredictionModal({ symbol, name, currentPrice, image, onClose }: PredictionModalProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<'7d' | '14d' | '30d'>('7d');
  const [predictions, setPredictions] = useState<Record<string, PredictionData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useEnsemble, setUseEnsemble] = useState(true);

  // Fetch predictions for all timeframes
  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      setError(null);

      try {
        const timeframes = ['7d', '14d', '30d'];
        const endpoint = useEnsemble ? '/predict/ensemble' : '/predict';

        const results = await Promise.all(
          timeframes.map(async (tf) => {
            try {
              const response = await fetch(`http://localhost:8000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  symbol: symbol.toUpperCase(),
                  timeframe: tf,
                  ensemble_method: 'weighted_average',
                  min_confidence: 0.3
                }),
              });

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }

              return { timeframe: tf, data: await response.json() };
            } catch (err) {
              console.error(`Failed to fetch ${tf} prediction:`, err);
              return { timeframe: tf, data: null };
            }
          })
        );

        const predictionsMap: Record<string, PredictionData> = {};
        results.forEach(({ timeframe, data }) => {
          if (data) {
            predictionsMap[timeframe] = data;
          }
        });

        setPredictions(predictionsMap);
      } catch (err: any) {
        setError(err.message || 'Failed to load predictions');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [symbol, useEnsemble]);

  const activePrediction = predictions[activeTimeframe];

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-[#10b981]';
      case 'medium': return 'text-[#3b82f6]';
      case 'low': return 'text-[#f59e0b]';
      default: return 'text-white/70';
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish': return 'text-[#10b981]';
      case 'bearish': return 'text-[#ef4444]';
      case 'neutral': return 'text-white/70';
      default: return 'text-white/70';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <img src={image} alt={name} className="w-12 h-12 rounded-full" />
            <div>
              <h2 className="text-2xl font-bold text-white">{name}</h2>
              <p className="text-white/60">{symbol.toUpperCase()} • {formatPrice(currentPrice)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white/70" />
          </button>
        </div>

        {/* Timeframe & Model Selector */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {(['7d', '14d', '30d'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTimeframe(tf)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTimeframe === tf
                      ? 'bg-[#3b82f6] text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useEnsemble}
                  onChange={(e) => setUseEnsemble(e.target.checked)}
                  className="rounded border-white/30 bg-white/10 text-[#3b82f6]"
                />
                <Brain className="w-4 h-4" />
                Ensemble Model
              </label>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#3b82f6]" />
              <p className="text-white/70">Loading AI predictions...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[#ef4444]" />
              <p className="text-[#ef4444]">{error}</p>
            </div>
          </div>
        ) : activePrediction ? (
          <div className="p-6 space-y-6">
            {/* Main Prediction Card */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {activePrediction.prediction.direction === 'bullish' ? (
                    <TrendingUp className="w-8 h-8 text-[#10b981]" />
                  ) : activePrediction.prediction.direction === 'bearish' ? (
                    <TrendingDown className="w-8 h-8 text-[#ef4444]" />
                  ) : (
                    <Target className="w-8 h-8 text-white/70" />
                  )}
                  <div>
                    <h3 className={`text-2xl font-bold capitalize ${getDirectionColor(activePrediction.prediction.direction)}`}>
                      {activePrediction.prediction.direction}
                    </h3>
                    <p className="text-white/60 text-sm">
                      {activeTimeframe.toUpperCase()} Forecast
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <span className={`text-sm font-medium ${getConfidenceColor(activePrediction.prediction.confidence)}`}>
                      {activePrediction.prediction.confidence.toUpperCase()}
                    </span>
                    <span className="text-2xl font-bold text-white">
                      {Math.round(activePrediction.prediction.confidenceScore * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-white/50">Model Confidence</p>
                </div>
              </div>

              {/* Price Targets */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">Current Price</p>
                  <p className="text-lg font-bold text-white">
                    {formatPrice(activePrediction.prediction.currentPrice)}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">Target Price</p>
                  <p className="text-lg font-bold text-[#3b82f6]">
                    {formatPrice(activePrediction.prediction.targetPrice)}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">Potential</p>
                  <p className={`text-lg font-bold ${
                    activePrediction.prediction.potentialGain > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                  }`}>
                    {activePrediction.prediction.potentialGain > 0 ? '+' : ''}
                    {activePrediction.prediction.potentialGain.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                  <span>Low: {formatPrice(activePrediction.prediction.targetPriceRange.low)}</span>
                  <span>High: {formatPrice(activePrediction.prediction.targetPriceRange.high)}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ef4444] via-[#3b82f6] to-[#10b981]"
                    style={{
                      width: `${Math.min(100, Math.max(0,
                        ((activePrediction.prediction.targetPrice - activePrediction.prediction.targetPriceRange.low) /
                         (activePrediction.prediction.targetPriceRange.high - activePrediction.prediction.targetPriceRange.low)) * 100
                      ))}%`
                    }}
                  />
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-sm text-white/80 leading-relaxed">
                  {activePrediction.explanation}
                </p>
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-xs text-white/50 mb-2">RSI</p>
                <p className={`text-xl font-bold ${
                  activePrediction.indicators.rsi > 70 ? 'text-[#ef4444]' :
                  activePrediction.indicators.rsi < 30 ? 'text-[#10b981]' :
                  'text-white'
                }`}>
                  {activePrediction.indicators.rsi.toFixed(1)}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {activePrediction.indicators.rsi > 70 ? 'Overbought' :
                   activePrediction.indicators.rsi < 30 ? 'Oversold' :
                   'Neutral'}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-xs text-white/50 mb-2">MACD</p>
                <p className={`text-lg font-bold capitalize ${
                  activePrediction.indicators.macd === 'bullish' ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}>
                  {activePrediction.indicators.macd}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-xs text-white/50 mb-2">Volume</p>
                <p className={`text-lg font-bold capitalize ${
                  activePrediction.indicators.volumeTrend === 'increasing' ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}>
                  {activePrediction.indicators.volumeTrend}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-xs text-white/50 mb-2">Sentiment</p>
                <p className={`text-xl font-bold ${
                  activePrediction.indicators.socialSentiment > 0.6 ? 'text-[#10b981]' :
                  activePrediction.indicators.socialSentiment < 0.4 ? 'text-[#ef4444]' :
                  'text-white'
                }`}>
                  {(activePrediction.indicators.socialSentiment * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Ensemble Metadata (if available) */}
            {activePrediction.ensemble_metadata && (
              <div className="bg-[#3b82f6]/10 rounded-lg p-4 border border-[#3b82f6]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-[#3b82f6]" />
                  <h4 className="text-sm font-semibold text-[#3b82f6]">Ensemble Prediction</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/50">Method</p>
                    <p className="text-white font-medium capitalize">
                      {activePrediction.ensemble_metadata.method.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/50">Models Combined</p>
                    <p className="text-white font-medium">
                      {activePrediction.ensemble_metadata.models_used}
                    </p>
                  </div>
                </div>
                {activePrediction.ensemble_metadata.model_names && (
                  <div className="mt-3">
                    <p className="text-xs text-white/50 mb-1">Models:</p>
                    <div className="flex flex-wrap gap-1">
                      {activePrediction.ensemble_metadata.model_names.map((model, idx) => (
                        <span key={idx} className="text-xs bg-[#3b82f6]/20 text-[#3b82f6] px-2 py-1 rounded">
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Model Info */}
            <div className="text-center text-xs text-white/40">
              <p>Model: {activePrediction.model_version}</p>
              <p>Generated: {new Date(activePrediction.generated_at).toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <div className="p-12 flex items-center justify-center">
            <p className="text-white/70">No prediction data available for {activeTimeframe}</p>
          </div>
        )}
      </div>
    </div>
  );
}
