import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, Award, Activity, Calendar } from 'lucide-react';

interface AccuracyMetrics {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  averageAccuracyScore: number;
  averagePriceError: number;
  byTimeframe: Record<string, { total: number; correct: number; accuracy: number }>;
  byToken: Record<string, { total: number; correct: number; accuracy: number }>;
  byDirection: Record<string, { total: number; correct: number; accuracy: number }>;
  recentPredictions: Array<{
    id: string;
    symbol: string;
    timeframe: string;
    direction: string;
    predictedPrice: number;
    actualPrice: number;
    wasCorrect: boolean;
    accuracyScore: number;
    priceError: number;
    createdAt: string;
    targetDate: string;
  }>;
}

export default function AccuracyPage() {
  const [metrics, setMetrics] = useState<AccuracyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchAccuracyMetrics();
  }, [period]);

  const fetchAccuracyMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/v1/predictions/accuracy/overall?days=${period}`);
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch accuracy metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading accuracy metrics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">No accuracy data available yet</div>
      </div>
    );
  }

  // Prepare chart data
  const timeframeData = Object.entries(metrics.byTimeframe).map(([timeframe, data]) => ({
    timeframe,
    accuracy: data.accuracy,
    total: data.total,
    correct: data.correct,
  }));

  const tokenData = Object.entries(metrics.byToken)
    .map(([symbol, data]) => ({
      symbol,
      accuracy: data.accuracy,
      total: data.total,
    }))
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 10);

  const directionData = Object.entries(metrics.byDirection).map(([direction, data]) => ({
    name: direction.charAt(0).toUpperCase() + direction.slice(1),
    value: data.accuracy,
    total: data.total,
  }));

  const COLORS = {
    bullish: '#10b981',
    bearish: '#ef4444',
    neutral: '#8b5cf6',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Prediction Accuracy Dashboard</h1>
          <p className="text-purple-200">Track ML model performance and prediction accuracy</p>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                period === days
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Last {days} days
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Target className="text-purple-400" size={24} />
              <span className="text-sm text-purple-200">Overall</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {metrics.accuracy.toFixed(1)}%
            </div>
            <div className="text-sm text-purple-200">
              {metrics.correctPredictions}/{metrics.totalPredictions} correct
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Award className="text-green-400" size={24} />
              <span className="text-sm text-purple-200">Avg Score</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {(metrics.averageAccuracyScore * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-purple-200">Prediction quality</div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-yellow-400" size={24} />
              <span className="text-sm text-purple-200">Avg Error</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {metrics.averagePriceError.toFixed(2)}%
            </div>
            <div className="text-sm text-purple-200">Price deviation</div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-blue-400" size={24} />
              <span className="text-sm text-purple-200">Predictions</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {metrics.totalPredictions}
            </div>
            <div className="text-sm text-purple-200">Total evaluated</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Timeframe Accuracy */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Accuracy by Timeframe</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeframeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="timeframe" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="accuracy" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Direction Distribution */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Accuracy by Direction</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={directionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {directionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || '#8b5cf6'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Token Performance */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Top Performing Tokens</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={tokenData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis type="number" stroke="#fff" />
              <YAxis dataKey="symbol" type="category" stroke="#fff" width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="accuracy" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Predictions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Recent Predictions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="pb-3 text-purple-200 font-medium">Symbol</th>
                  <th className="pb-3 text-purple-200 font-medium">Timeframe</th>
                  <th className="pb-3 text-purple-200 font-medium">Direction</th>
                  <th className="pb-3 text-purple-200 font-medium">Predicted</th>
                  <th className="pb-3 text-purple-200 font-medium">Actual</th>
                  <th className="pb-3 text-purple-200 font-medium">Error</th>
                  <th className="pb-3 text-purple-200 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentPredictions.slice(0, 10).map((pred) => (
                  <tr key={pred.id} className="border-b border-white/10">
                    <td className="py-3 text-white font-medium">{pred.symbol}</td>
                    <td className="py-3 text-purple-200">{pred.timeframe}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          pred.direction === 'bullish'
                            ? 'bg-green-500/20 text-green-400'
                            : pred.direction === 'bearish'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}
                      >
                        {pred.direction === 'bullish' && <TrendingUp size={12} />}
                        {pred.direction === 'bearish' && <TrendingDown size={12} />}
                        {pred.direction}
                      </span>
                    </td>
                    <td className="py-3 text-white">${pred.predictedPrice.toLocaleString()}</td>
                    <td className="py-3 text-white">${pred.actualPrice.toLocaleString()}</td>
                    <td className="py-3 text-purple-200">{pred.priceError.toFixed(2)}%</td>
                    <td className="py-3">
                      {pred.wasCorrect ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                          ✓ Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                          ✗ Wrong
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
