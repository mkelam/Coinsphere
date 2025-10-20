import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Target, Award, AlertCircle, Loader2, Calendar, Clock, BarChart3, Activity } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';

interface BacktestData {
  config: {
    id: string;
    name: string;
    description: string;
    strategyName: string;
    strategyArchetype: string;
    startDate: string;
    endDate: string;
    timeframe: string;
    initialCapital: number;
    status: string;
  };
  performance: {
    initialCapital: number;
    finalCapital: number;
    totalReturn: number;
    totalReturnPct: number;
    maxDrawdown: number;
    maxDrawdownPct: number;
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
  };
  metrics: {
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    expectancy: number;
    kellyCriterion: number;
    payoffRatio: number;
    maxDrawdownPct: number;
    avgDrawdownPct: number;
    maxDrawdownDuration: number;
    profitFactor: number;
    recoveryFactor: number;
    ulcerIndex: number;
    consecutiveWins: number;
    consecutiveLosses: number;
    winStreakAvg: number;
    loseStreakAvg: number;
  };
  trades: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    avgPnL: number;
    avgWinner: number;
    avgLoser: number;
    largestWin: number;
    largestLoss: number;
    avgHoldTimeHours: number;
    totalFees: number;
    totalSlippage: number;
    profitFactor: number;
    list: Array<{
      id: string;
      symbol: string;
      entryTime: string;
      exitTime: string;
      entryPrice: number;
      exitPrice: number;
      positionSize: number;
      pnlUsd: number;
      pnlPct: number;
      feesPaid: number;
      slippageCost: number;
      holdTimeHours: number;
      entryReason: string;
      exitReason: string;
    }>;
  };
  equity: Array<{
    timestamp: string;
    value: number;
    drawdown: number;
  }>;
}

export default function BacktestResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<BacktestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBacktestResults() {
      try {
        const response = await fetch(`http://localhost:3001/api/v1/backtesting/results/${id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to load backtest results');
        }

        setData(result.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchBacktestResults();
    }
  }, [id]);

  const formatNumber = (num: number | null | undefined, decimals = 2) => {
    if (num === null || num === undefined) return 'N/A';
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return 'N/A';
    return numValue.toFixed(decimals);
  };

  const formatPercent = (num: number | null | undefined) => {
    if (num === null || num === undefined) return 'N/A';
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return 'N/A';
    const formatted = (numValue * 100).toFixed(2);
    return `${Number(formatted) > 0 ? '+' : ''}${formatted}%`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-transparent">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="glass-card p-8">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#3b82f6]" />
                  <p className="text-white/70">Loading backtest results...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="min-h-screen bg-transparent">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="glass-card p-8 max-w-md">
                <div className="flex items-center gap-3 text-[#ef4444] mb-4">
                  <AlertCircle className="w-6 h-6" />
                  <h2 className="text-xl font-semibold text-white">Error Loading Results</h2>
                </div>
                <p className="text-white/60 mb-6">{error || 'Failed to retrieve backtest results'}</p>
                <Button
                  onClick={() => navigate('/backtesting')}
                  className="bg-[#3b82f6] hover:bg-[#3b82f6]/80 w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Backtesting
                </Button>
              </div>
            </div>
          </main>
        </div>
      </Layout>
    );
  }

  const isProfit = data.performance.totalReturnPct > 0;

  return (
    <Layout>
      <div className="min-h-screen bg-transparent">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/backtesting')}
              className="mb-4 text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Backtesting
            </Button>

            <div className="glass-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">{data.config.name}</h1>
                  <p className="text-white/60 mb-4">{data.config.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-white/40" />
                      <span className="text-white/50">Strategy:</span>
                      <span className="text-white font-medium">{data.config.strategyName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white/40" />
                      <span className="text-white/50">Timeframe:</span>
                      <span className="text-white font-medium">{data.config.timeframe}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white/40" />
                      <span className="text-white/50">Period:</span>
                      <span className="text-white font-medium">
                        {formatDate(data.config.startDate)} - {formatDate(data.config.endDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`px-8 py-6 rounded-lg ${isProfit ? 'bg-[#10b981]/10' : 'bg-[#ef4444]/10'} border ${isProfit ? 'border-[#10b981]/20' : 'border-[#ef4444]/20'}`}>
                  <div className="text-sm text-white/60 mb-2 text-center">Total Return</div>
                  <div className={`text-4xl font-bold flex items-center gap-3 ${isProfit ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {isProfit ? <TrendingUp className="w-10 h-10" /> : <TrendingDown className="w-10 h-10" />}
                    {formatPercent(data.performance.totalReturnPct)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-sm">Initial Capital</span>
                <DollarSign className="w-5 h-5 text-white/40" />
              </div>
              <p className="text-3xl font-bold text-white">${data.performance.initialCapital.toLocaleString()}</p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-sm">Final Capital</span>
                <DollarSign className="w-5 h-5 text-[#10b981]" />
              </div>
              <p className="text-3xl font-bold text-white">${data.performance.finalCapital.toLocaleString()}</p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-sm">Win Rate</span>
                <Target className="w-5 h-5 text-white/40" />
              </div>
              <p className="text-3xl font-bold text-white">{formatPercent(data.performance.winRate)}</p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-sm">Sharpe Ratio</span>
                <Award className="w-5 h-5 text-white/40" />
              </div>
              <p className="text-3xl font-bold text-white">{formatNumber(data.performance.sharpeRatio)}</p>
            </div>
          </div>

          {/* Performance Metrics Grid */}
          <div className="glass-card p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-white/70" />
              Performance Metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Risk-Adjusted Returns */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Sharpe Ratio</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(data.metrics.sharpeRatio, 3)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Sortino Ratio</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(data.metrics.sortinoRatio, 3)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Calmar Ratio</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(data.metrics.calmarRatio, 3)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Ulcer Index</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(data.metrics.ulcerIndex)}</p>
              </div>

              {/* Position Sizing & Expectancy */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Kelly Criterion</p>
                <p className="text-2xl font-semibold text-white">{formatPercent(data.metrics.kellyCriterion)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Expectancy</p>
                <p className="text-2xl font-semibold text-white">${formatNumber(data.metrics.expectancy)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Payoff Ratio</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(data.metrics.payoffRatio)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Profit Factor</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(data.metrics.profitFactor)}</p>
              </div>

              {/* Drawdown Metrics */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Max Drawdown</p>
                <p className="text-2xl font-semibold text-[#ef4444]">{formatPercent(data.metrics.maxDrawdownPct)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Avg Drawdown</p>
                <p className="text-2xl font-semibold text-[#ef4444]">{formatPercent(data.metrics.avgDrawdownPct)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Max DD Duration</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(data.metrics.maxDrawdownDuration, 0)}h</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Recovery Factor</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(data.metrics.recoveryFactor, 3)}</p>
              </div>

              {/* Consistency */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Max Win Streak</p>
                <p className="text-2xl font-semibold text-[#10b981]">{data.metrics.consecutiveWins}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Max Loss Streak</p>
                <p className="text-2xl font-semibold text-[#ef4444]">{data.metrics.consecutiveLosses}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Avg Win Streak</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(data.metrics.winStreakAvg, 1)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Avg Loss Streak</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(data.metrics.loseStreakAvg, 1)}</p>
              </div>
            </div>
          </div>

          {/* Trade Statistics */}
          <div className="glass-card p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-white/70" />
              Trade Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Total Trades</p>
                <p className="text-2xl font-semibold text-white">{data.trades.totalTrades}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Winners</p>
                <p className="text-2xl font-semibold text-[#10b981]">{data.trades.winningTrades}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Losers</p>
                <p className="text-2xl font-semibold text-[#ef4444]">{data.trades.losingTrades}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Avg Winner</p>
                <p className="text-2xl font-semibold text-[#10b981]">${formatNumber(data.trades.avgWinner)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Avg Loser</p>
                <p className="text-2xl font-semibold text-[#ef4444]">${formatNumber(data.trades.avgLoser)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Largest Win</p>
                <p className="text-2xl font-semibold text-[#10b981]">${formatNumber(data.trades.largestWin)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Largest Loss</p>
                <p className="text-2xl font-semibold text-[#ef4444]">${formatNumber(data.trades.largestLoss)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Avg Hold Time</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(data.trades.avgHoldTimeHours / 24, 1)}d</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Total Fees</p>
                <p className="text-2xl font-semibold text-white/70">${formatNumber(data.trades.totalFees)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 uppercase mb-2">Total Slippage</p>
                <p className="text-2xl font-semibold text-white/70">${formatNumber(data.trades.totalSlippage)}</p>
              </div>
            </div>
          </div>

          {/* Trade History Table */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              Trade History ({data.trades.list.length} trades)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-white/60">Symbol</th>
                    <th className="px-4 py-3 text-left font-medium text-white/60">Entry</th>
                    <th className="px-4 py-3 text-left font-medium text-white/60">Exit</th>
                    <th className="px-4 py-3 text-right font-medium text-white/60">Entry Price</th>
                    <th className="px-4 py-3 text-right font-medium text-white/60">Exit Price</th>
                    <th className="px-4 py-3 text-right font-medium text-white/60">Size</th>
                    <th className="px-4 py-3 text-right font-medium text-white/60">P&L ($)</th>
                    <th className="px-4 py-3 text-right font-medium text-white/60">P&L (%)</th>
                    <th className="px-4 py-3 text-right font-medium text-white/60">Hold (h)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data.trades.list.map((trade) => (
                    <tr key={trade.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{trade.symbol}</td>
                      <td className="px-4 py-3 text-white/60">{formatDate(trade.entryTime)}</td>
                      <td className="px-4 py-3 text-white/60">{formatDate(trade.exitTime)}</td>
                      <td className="px-4 py-3 text-right text-white">${formatNumber(trade.entryPrice)}</td>
                      <td className="px-4 py-3 text-right text-white">${formatNumber(trade.exitPrice)}</td>
                      <td className="px-4 py-3 text-right text-white">{formatNumber(trade.positionSize, 4)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${trade.pnlUsd >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                        ${formatNumber(trade.pnlUsd)}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${trade.pnlPct >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                        {formatPercent(trade.pnlPct)}
                      </td>
                      <td className="px-4 py-3 text-right text-white/60">{trade.holdTimeHours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
