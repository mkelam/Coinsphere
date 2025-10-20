/**
 * Backtesting Dashboard - Phase 1
 *
 * Comprehensive view of:
 * - Data ingestion status
 * - Trading strategies
 * - Backtest runs and results
 * - Performance analytics
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { RunBacktestModal, BacktestConfig } from '@/components/RunBacktestModal';
import {
  Database,
  TrendingUp,
  BarChart3,
  Activity,
  PlayCircle,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';

interface DashboardData {
  summary: {
    strategiesCount: number;
    backtestsByStatus: Array<{
      status: string;
      count: number;
      avg_return: number | null;
      avg_sharpe: number | null;
    }>;
    dataCoverage: {
      symbols_count: number;
      timeframes_count: number;
      total_records: number;
      earliest_data: string | null;
      latest_data: string | null;
    };
  };
  recentBacktests: Array<{
    id: string;
    name: string;
    status: string;
    total_return_pct: number | null;
    sharpe_ratio: number | null;
    win_rate: number | null;
    created_at: string;
    strategy_name: string;
  }>;
  topStrategies: Array<{
    id: string;
    name: string;
    total_score: number;
    archetype: string;
    backtest_count: number;
    avg_sharpe: number | null;
    avg_return: number | null;
    tested_symbols: string[] | null;
  }>;
}

interface DataStatus {
  symbol: string;
  timeframe: string;
  dataPoints: number;
  earliestDate: string;
  latestDate: string;
  dataSource: string;
  daysOfData: number;
}

export default function BacktestingDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dataStatus, setDataStatus] = useState<DataStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBacktestModal, setShowBacktestModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<{ id: string; name: string } | null>(null);
  const [runningBacktest, setRunningBacktest] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
    fetchDataStatus();
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      const response = await fetch('http://localhost:3001/api/v1/backtesting/dashboard');
      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDataStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/backtesting/data-status');
      const result = await response.json();
      if (result.success) {
        setDataStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch data status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-[#10b981]';
      case 'running':
        return 'text-[#3b82f6]';
      case 'pending':
        return 'text-white/50';
      case 'failed':
        return 'text-[#ef4444]';
      default:
        return 'text-white/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-[#10b981]" />;
      case 'running':
        return <Activity className="h-4 w-4 text-[#3b82f6] animate-pulse" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-white/50" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-[#ef4444]" />;
      default:
        return null;
    }
  };

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

  const handleRunBacktest = (strategy: { id: string; name: string }) => {
    setSelectedStrategy(strategy);
    setShowBacktestModal(true);
  };

  const handleSubmitBacktest = async (config: BacktestConfig) => {
    setRunningBacktest(true);
    try {
      console.log('Sending backtest request:', config);

      const response = await fetch('http://localhost:3001/api/v1/backtesting/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      console.log('Backtest response:', result);

      if (result.success) {
        const backtestId = result.data?.backtestId;
        console.log('Extracted backtestId:', backtestId);

        if (!backtestId) {
          alert('Backtest completed but no ID was returned. Check console for details.');
          console.error('Missing backtestId in response:', result);
          return;
        }

        setShowBacktestModal(false);
        setSelectedStrategy(null);
        // Navigate to the results page
        console.log('Navigating to:', `/backtesting/results/${backtestId}`);
        navigate(`/backtesting/results/${backtestId}`);
      } else {
        alert(`Backtest failed: ${result.error}${result.details ? '\n\n' + result.details : ''}`);
      }
    } catch (error: any) {
      console.error('Backtest request error:', error);
      alert(`Error running backtest: ${error.message}`);
    } finally {
      setRunningBacktest(false);
    }
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
                  <p className="text-white/70">Loading dashboard...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </Layout>
    );
  }

  if (!dashboardData) {
    return (
      <Layout>
        <div className="min-h-screen bg-transparent">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="glass-card p-8">
              <div className="text-center">
                <XCircle className="h-12 w-12 text-[#ef4444] mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Failed to load dashboard</h2>
                <p className="text-white/70 mb-6">Unable to fetch backtesting data</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-[#3b82f6] hover:bg-[#3b82f6]/80"
                >
                  Retry
                </Button>
              </div>
            </div>
          </main>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-transparent">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-white">Backtesting Dashboard</h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchDashboardData(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-[#3b82f6]/80 text-white rounded-lg transition-colors backdrop-blur-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
            <p className="text-white/60">
              Phase 1 - Strategy validation and backtesting infrastructure
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Strategies Card */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-sm">Strategies</span>
                <TrendingUp className="w-5 h-5 text-white/40" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {dashboardData.summary.strategiesCount}
              </div>
              <p className="text-xs text-white/50">Validated (Score ≥70)</p>
            </div>

            {/* Data Points Card */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-sm">Data Points</span>
                <Database className="w-5 h-5 text-white/40" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {(Number(dashboardData.summary.dataCoverage.total_records) / 1000).toFixed(1)}K
              </div>
              <p className="text-xs text-white/50">
                {dashboardData.summary.dataCoverage.symbols_count} symbols, {dashboardData.summary.dataCoverage.timeframes_count} timeframes
              </p>
            </div>

            {/* Backtests Card */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-sm">Backtests</span>
                <BarChart3 className="w-5 h-5 text-white/40" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {dashboardData.summary.backtestsByStatus.reduce((sum, s) => sum + Number(s.count), 0)}
              </div>
              <p className="text-xs text-white/50">
                {dashboardData.summary.backtestsByStatus.find(s => s.status === 'completed')?.count || 0} completed
              </p>
            </div>

            {/* Avg Sharpe Card */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-sm">Avg Sharpe</span>
                <Activity className="w-5 h-5 text-white/40" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {formatNumber(
                  dashboardData.summary.backtestsByStatus.find(s => s.status === 'completed')?.avg_sharpe
                )}
              </div>
              <p className="text-xs text-white/50">From completed runs</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="glass-card mb-6">
            <div className="flex border-b border-white/10">
              {['overview', 'strategies', 'backtests', 'data'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? 'text-white border-b-2 border-[#3b82f6]'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  {tab === 'data' ? 'Data Status' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Strategies */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Top Performing Strategies</h2>
                <div className="space-y-3">
                  {dashboardData.topStrategies.map((strategy, index) => (
                    <div key={strategy.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-medium text-white">{strategy.name}</p>
                            {strategy.tested_symbols && strategy.tested_symbols.length > 0 && (
                              <span className="px-2 py-1 bg-[#3b82f6] text-white text-xs rounded-md font-semibold">
                                {strategy.tested_symbols.join(', ')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-white/50 capitalize">
                            {strategy.archetype.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-white/50">Score</p>
                          <p className="text-lg font-bold text-white">{formatNumber(Number(strategy.total_score), 0)}/100</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRunBacktest({ id: strategy.id, name: strategy.name })}
                          className="bg-[#3b82f6] hover:bg-[#3b82f6]/80"
                        >
                          <PlayCircle className="w-4 h-4 mr-1" />
                          Run Backtest
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Backtests */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Backtests</h2>
                {dashboardData.recentBacktests.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-white/30" />
                    <p className="text-white/60 mb-4">No backtests yet</p>
                    <Button className="bg-[#3b82f6] hover:bg-[#3b82f6]/80">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Create First Backtest
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.recentBacktests.map((backtest) => (
                      <div key={backtest.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(backtest.status)}
                            <div>
                              <p className="font-medium text-white">{backtest.name}</p>
                              <p className="text-sm text-white/50">
                                {backtest.strategy_name} • {formatDate(backtest.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-6">
                            <div className="text-right">
                              <p className="text-xs text-white/50">Return</p>
                              <p className={`font-bold ${(backtest.total_return_pct || 0) > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                {formatPercent(backtest.total_return_pct)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/50">Sharpe</p>
                              <p className="font-bold text-white">{formatNumber(backtest.sharpe_ratio)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'strategies' && (
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">All Trading Strategies</h2>
                <p className="text-white/60">{dashboardData.topStrategies.length} validated strategies</p>
              </div>
              <div className="space-y-4">
                {dashboardData.topStrategies.map((strategy) => (
                  <div key={strategy.id} className="p-5 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-medium text-white">{strategy.name}</h3>
                          {strategy.tested_symbols && strategy.tested_symbols.length > 0 && (
                            <span className="px-2 py-1 bg-[#3b82f6] text-white text-xs rounded-md font-semibold">
                              {strategy.tested_symbols.join(', ')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/50 capitalize">{strategy.archetype.replace('_', ' ')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-white/10 rounded text-sm text-white">
                          Score: {formatNumber(Number(strategy.total_score), 0)}/100
                        </div>
                        <Button
                          onClick={() => handleRunBacktest({ id: strategy.id, name: strategy.name })}
                          className="bg-[#3b82f6] hover:bg-[#3b82f6]/80"
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Run Backtest
                        </Button>
                      </div>
                    </div>
                    {strategy.backtest_count > 0 && (
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-white/50">Backtests:</span>{' '}
                          <span className="text-white font-medium">{strategy.backtest_count}</span>
                        </div>
                        {strategy.avg_sharpe && (
                          <div>
                            <span className="text-white/50">Avg Sharpe:</span>{' '}
                            <span className="text-white font-medium">{formatNumber(Number(strategy.avg_sharpe))}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'backtests' && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-6">All Backtests</h2>
              {dashboardData.recentBacktests.length === 0 ? (
                <div className="text-center py-16">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-white/30" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Backtests Yet</h3>
                  <p className="text-white/60 mb-6">Run your first backtest to validate your strategies</p>
                  <Button className="bg-[#3b82f6] hover:bg-[#3b82f6]/80">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Create First Backtest
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentBacktests.map((backtest) => (
                    <div key={backtest.id} className="p-5 bg-white/5 rounded-lg border border-white/10 hover:bg-white/[0.07] transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(backtest.status)}
                            <h3 className="font-medium text-white">{backtest.name}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(backtest.status)} bg-white/10`}>
                              {backtest.status}
                            </span>
                          </div>
                          <p className="text-sm text-white/50">{backtest.strategy_name}</p>
                          <p className="text-xs text-white/40 mt-1">Created: {formatDate(backtest.created_at)}</p>
                        </div>
                        <div className="flex gap-8">
                          <div className="text-right">
                            <p className="text-xs text-white/50 mb-1">Total Return</p>
                            <p className={`text-lg font-bold ${(backtest.total_return_pct || 0) > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                              {formatPercent(backtest.total_return_pct)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-white/50 mb-1">Sharpe Ratio</p>
                            <p className="text-lg font-bold text-white">{formatNumber(backtest.sharpe_ratio)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-white/50 mb-1">Win Rate</p>
                            <p className="text-lg font-bold text-white">{formatPercent(backtest.win_rate)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Data Coverage</h2>
                  <p className="text-white/60 text-sm">Historical market data available for backtesting</p>
                </div>
                <Button className="bg-[#3b82f6] hover:bg-[#3b82f6]/80">
                  <Download className="w-4 h-4 mr-2" />
                  Ingest Data
                </Button>
              </div>

              {dataStatus.length === 0 ? (
                <div className="text-center py-16">
                  <Database className="h-16 w-16 mx-auto mb-4 text-white/30" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Historical Data</h3>
                  <p className="text-white/60 mb-6">Ingest OHLCV data from CoinGecko or Binance to begin backtesting</p>
                  <Button className="bg-[#3b82f6] hover:bg-[#3b82f6]/80">
                    <Download className="w-4 h-4 mr-2" />
                    Ingest Historical Data
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dataStatus.map((data, index) => (
                    <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-white text-lg">{data.symbol}</p>
                          <p className="text-sm text-white/50">{data.timeframe} timeframe</p>
                        </div>
                        <div className="px-3 py-1 bg-white/10 rounded text-sm text-white">
                          {data.dataSource}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-white/50 mb-1">Data Points</p>
                          <p className="font-medium text-white">{data.dataPoints.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/50 mb-1">Days of Data</p>
                          <p className="font-medium text-white">{data.daysOfData}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/50 mb-1">Earliest</p>
                          <p className="font-medium text-white">{formatDate(data.earliestDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/50 mb-1">Latest</p>
                          <p className="font-medium text-white">{formatDate(data.latestDate)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Backtest Configuration Modal */}
        {selectedStrategy && (
          <RunBacktestModal
            isOpen={showBacktestModal}
            onClose={() => {
              setShowBacktestModal(false);
              setSelectedStrategy(null);
            }}
            strategyId={selectedStrategy.id}
            strategyName={selectedStrategy.name}
            onSubmit={handleSubmitBacktest}
          />
        )}
      </div>
    </Layout>
  );
}
