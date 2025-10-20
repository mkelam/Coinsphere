import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Header } from '@/components/header';
import {
  Activity,
  Zap,
  TrendingUp,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  Loader2,
  BarChart3,
  Wifi,
  WifiOff,
  Wallet,
  TrendingDown,
  DollarSign,
} from 'lucide-react';

interface McpStatus {
  mcp: {
    enabled: boolean;
    connected: boolean;
    status: string;
  };
  rest: {
    available: boolean;
    status: string;
  };
  activeMode: string;
  timestamp: string;
}

interface McpMetrics {
  uptime: {
    totalSeconds: number;
    percentage: number;
    lastConnected: number | null;
    lastDisconnected: number | null;
  };
  latency: {
    current: number;
    average: number;
    min: number | null;
    max: number;
    samples: number;
  };
  reconnections: {
    total: number;
    successful: number;
    failed: number;
    lastAttempt: number | null;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    mcpCount: number;
    restCount: number;
  };
  history: {
    latency: Array<{ timestamp: number; value: number }>;
    connections: Array<{
      timestamp: number;
      event: string;
      details?: string;
    }>;
  };
}

interface NansenHealth {
  healthy: boolean;
  service: string;
}

interface NansenWallet {
  id: string;
  address: string;
  nansenLabel: string;
  blockchain: string;
  totalTradesAnalyzed: number;
  winRate: string;
  avgHoldTimeDays: string;
  avgPositionSizeUsd: string;
  totalProfitUsd: string;
  sharpeRatio: string;
  primaryTokens: string[];
  tradingFrequency: string;
  socialLeadingScore: string;
  behaviorType: string;
  verificationStatus: string;
}

interface DashboardData {
  lunarcrushStatus: McpStatus | null;
  lunarcrushMetrics: McpMetrics | null;
  nansenHealth: NansenHealth | null;
  nansenWallets: NansenWallet[];
}

export default function McpDataDashboard() {
  const [data, setData] = useState<DashboardData>({
    lunarcrushStatus: null,
    lunarcrushMetrics: null,
    nansenHealth: null,
    nansenWallets: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [statusRes, metricsRes, nansenRes, walletsRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/social/mcp/status'),
        fetch('http://localhost:3001/api/v1/social/mcp/metrics'),
        fetch('http://localhost:3001/api/v1/trading-research/nansen/health'),
        fetch('http://localhost:3001/api/v1/trading-research/wallets?limit=10'),
      ]);

      const [statusData, metricsData, nansenData, walletsData] = await Promise.all([
        statusRes.json(),
        metricsRes.json(),
        nansenRes.json(),
        walletsRes.json(),
      ]);

      setData({
        lunarcrushStatus: statusData,
        lunarcrushMetrics: metricsData.metrics,
        nansenHealth: nansenData.data,
        nansenWallets: walletsData.data?.wallets || [],
      });
    } catch (error) {
      console.error('Failed to fetch MCP data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-transparent">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
            </div>
          </main>
        </div>
      </Layout>
    );
  }

  const { lunarcrushStatus, lunarcrushMetrics, nansenHealth, nansenWallets } = data;

  // Calculate uptime percentage color
  const getUptimeColor = (percentage: number) => {
    if (percentage >= 95) return 'text-[#10b981]';
    if (percentage >= 80) return 'text-[#f59e0b]';
    return 'text-[#ef4444]';
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Layout>
      <div className="min-h-screen bg-transparent">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">MCP Data Dashboard</h1>
              <p className="text-white/60">
                Real-time monitoring of LunarCrush and Nansen MCP integrations
              </p>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-[#3b82f6]/80 disabled:bg-[#3b82f6]/50 text-white rounded-lg transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Service Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* LunarCrush MCP Status */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#3b82f6]" />
                  LunarCrush MCP
                </h2>
                {lunarcrushStatus?.mcp.connected ? (
                  <Wifi className="w-5 h-5 text-[#10b981]" />
                ) : (
                  <WifiOff className="w-5 h-5 text-[#ef4444]" />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">SSE Connection</span>
                  <div className="flex items-center gap-2">
                    {lunarcrushStatus?.mcp.connected ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-[#10b981]" />
                        <span className="text-[#10b981] font-medium">
                          Connected
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-[#ef4444]" />
                        <span className="text-[#ef4444] font-medium">
                          Disconnected
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">REST API</span>
                  <div className="flex items-center gap-2">
                    {lunarcrushStatus?.rest.available ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-[#10b981]" />
                        <span className="text-[#10b981] font-medium">
                          Available
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-[#f59e0b]" />
                        <span className="text-[#f59e0b] font-medium">
                          Unavailable
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-white/70 text-sm">Active Mode</span>
                  <span className="text-white font-medium">
                    {lunarcrushStatus?.activeMode || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Nansen MCP Status */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#3b82f6]" />
                  Nansen MCP
                </h2>
                {nansenHealth?.healthy ? (
                  <CheckCircle className="w-5 h-5 text-[#10b981]" />
                ) : (
                  <XCircle className="w-5 h-5 text-[#ef4444]" />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Service Status</span>
                  <div className="flex items-center gap-2">
                    {nansenHealth?.healthy ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-[#10b981]" />
                        <span className="text-[#10b981] font-medium">Healthy</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-[#ef4444]" />
                        <span className="text-[#ef4444] font-medium">
                          Unavailable
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-white/70 text-sm">Endpoint</span>
                  <span className="text-white/50 text-xs font-mono">
                    mcp.nansen.ai/ra/mcp/
                  </span>
                </div>

                <div className="bg-white/5 rounded-lg p-3 mt-3">
                  <p className="text-white/50 text-xs">
                    Smart Money wallet discovery and on-chain analytics
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="glass-card mb-6">
            <div className="flex border-b border-white/10">
              {['overview', 'performance', 'connections', 'nansen-data'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? 'text-white border-b-2 border-[#3b82f6]'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  {tab === 'nansen-data' ? 'Nansen Data' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Uptime Card */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/70 text-sm">Uptime</span>
                  <Activity className="w-5 h-5 text-white/40" />
                </div>
                <div
                  className={`text-3xl font-bold mb-1 ${getUptimeColor(
                    lunarcrushMetrics?.uptime.percentage || 0
                  )}`}
                >
                  {lunarcrushMetrics?.uptime.percentage.toFixed(2)}%
                </div>
                <p className="text-xs text-white/50">
                  {formatDuration(lunarcrushMetrics?.uptime.totalSeconds || 0)}
                </p>
              </div>

              {/* Reconnections Card */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/70 text-sm">Reconnections</span>
                  <RefreshCw className="w-5 h-5 text-white/40" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {lunarcrushMetrics?.reconnections.total || 0}
                </div>
                <p className="text-xs text-white/50">
                  {lunarcrushMetrics?.reconnections.successful || 0} successful,{' '}
                  {lunarcrushMetrics?.reconnections.failed || 0} failed
                </p>
              </div>

              {/* Total Requests Card */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/70 text-sm">Total Requests</span>
                  <BarChart3 className="w-5 h-5 text-white/40" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {lunarcrushMetrics?.requests.total || 0}
                </div>
                <p className="text-xs text-white/50">
                  MCP: {lunarcrushMetrics?.requests.mcpCount || 0}, REST:{' '}
                  {lunarcrushMetrics?.requests.restCount || 0}
                </p>
              </div>

              {/* Average Latency Card */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/70 text-sm">Avg Latency</span>
                  <Zap className="w-5 h-5 text-white/40" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {lunarcrushMetrics?.latency.average
                    ? `${lunarcrushMetrics.latency.average.toFixed(0)}ms`
                    : 'N/A'}
                </div>
                <p className="text-xs text-white/50">
                  {lunarcrushMetrics?.latency.samples || 0} samples
                </p>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Latency Statistics */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#3b82f6]" />
                  Latency Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-white/50 text-xs mb-1">Current</p>
                    <p className="text-2xl font-bold text-white">
                      {lunarcrushMetrics?.latency.current
                        ? `${lunarcrushMetrics.latency.current}ms`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/50 text-xs mb-1">Average</p>
                    <p className="text-2xl font-bold text-white">
                      {lunarcrushMetrics?.latency.average
                        ? `${lunarcrushMetrics.latency.average.toFixed(0)}ms`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/50 text-xs mb-1">Min</p>
                    <p className="text-2xl font-bold text-[#10b981]">
                      {lunarcrushMetrics?.latency.min !== null &&
                      lunarcrushMetrics?.latency.min !== Infinity
                        ? `${lunarcrushMetrics.latency.min}ms`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/50 text-xs mb-1">Max</p>
                    <p className="text-2xl font-bold text-[#ef4444]">
                      {lunarcrushMetrics?.latency.max
                        ? `${lunarcrushMetrics.latency.max}ms`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Statistics */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#3b82f6]" />
                  Request Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70 text-sm">Total Requests</span>
                      <span className="text-white font-bold text-xl">
                        {lunarcrushMetrics?.requests.total || 0}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3b82f6]"
                        style={{
                          width: `${
                            lunarcrushMetrics?.requests.total
                              ? ((lunarcrushMetrics.requests.successful || 0) /
                                  lunarcrushMetrics.requests.total) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      {lunarcrushMetrics?.requests.total
                        ? (
                            ((lunarcrushMetrics.requests.successful || 0) /
                              lunarcrushMetrics.requests.total) *
                            100
                          ).toFixed(1)
                        : 0}
                      % success rate
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70 text-sm">MCP vs REST</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 text-xs">MCP</span>
                        <span className="text-white font-medium">
                          {lunarcrushMetrics?.requests.mcpCount || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 text-xs">REST</span>
                        <span className="text-white font-medium">
                          {lunarcrushMetrics?.requests.restCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#3b82f6]" />
                Connection History
              </h3>

              {/* Connection Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/50 text-xs mb-1">Last Connected</p>
                  <p className="text-white font-medium">
                    {formatTimestamp(lunarcrushMetrics?.uptime.lastConnected || null)}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/50 text-xs mb-1">Last Disconnected</p>
                  <p className="text-white font-medium">
                    {formatTimestamp(lunarcrushMetrics?.uptime.lastDisconnected || null)}
                  </p>
                </div>
              </div>

              {/* Connection Events */}
              <div className="space-y-2">
                <p className="text-white/70 text-sm mb-3">Recent Events</p>
                {lunarcrushMetrics?.history.connections &&
                lunarcrushMetrics.history.connections.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {lunarcrushMetrics.history.connections
                      .slice()
                      .reverse()
                      .map((event, idx) => {
                        const getEventIcon = () => {
                          switch (event.event) {
                            case 'connected':
                              return (
                                <CheckCircle className="w-4 h-4 text-[#10b981]" />
                              );
                            case 'disconnected':
                              return <XCircle className="w-4 h-4 text-[#ef4444]" />;
                            case 'reconnect_attempt':
                              return (
                                <RefreshCw className="w-4 h-4 text-[#f59e0b]" />
                              );
                            case 'reconnect_success':
                              return (
                                <CheckCircle className="w-4 h-4 text-[#10b981]" />
                              );
                            case 'reconnect_failed':
                              return (
                                <AlertCircle className="w-4 h-4 text-[#ef4444]" />
                              );
                            default:
                              return (
                                <Activity className="w-4 h-4 text-white/40" />
                              );
                          }
                        };

                        const getEventLabel = () => {
                          switch (event.event) {
                            case 'connected':
                              return 'Connected';
                            case 'disconnected':
                              return 'Disconnected';
                            case 'reconnect_attempt':
                              return 'Reconnection Attempt';
                            case 'reconnect_success':
                              return 'Reconnection Successful';
                            case 'reconnect_failed':
                              return 'Reconnection Failed';
                            default:
                              return event.event;
                          }
                        };

                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 bg-white/5 rounded-lg p-3"
                          >
                            {getEventIcon()}
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium">
                                {getEventLabel()}
                              </p>
                              {event.details && (
                                <p className="text-white/50 text-xs">
                                  {event.details}
                                </p>
                              )}
                            </div>
                            <span className="text-white/40 text-xs">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/50">
                    No connection events recorded
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'nansen-data' && (
            <div className="space-y-6">
              {/* Nansen Wallets Header */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-[#3b82f6]" />
                    Smart Money Wallets from Nansen
                  </h3>
                  <div className="text-white/70 text-sm">
                    {nansenWallets.length} wallets discovered
                  </div>
                </div>
                <p className="text-white/50 text-sm">
                  Top-performing wallets identified via Nansen with verified on-chain trading history
                </p>
              </div>

              {/* Wallets Grid */}
              {nansenWallets.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {nansenWallets.map((wallet) => (
                    <div key={wallet.id} className="glass-card p-6">
                      {/* Wallet Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-[#3b82f6]/20 text-[#3b82f6] rounded-full text-xs font-medium">
                              {wallet.nansenLabel}
                            </span>
                            <span className="px-2 py-0.5 bg-white/10 text-white/70 rounded text-xs">
                              {wallet.blockchain}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-white/70 text-sm font-mono">
                              {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 8)}
                            </code>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            wallet.behaviorType === 'leading_indicator'
                              ? 'text-[#10b981]'
                              : 'text-[#f59e0b]'
                          }`}>
                            {(parseFloat(wallet.socialLeadingScore) * 100).toFixed(1)}%
                          </div>
                          <p className="text-white/50 text-xs">Social Leading</p>
                        </div>
                      </div>

                      {/* Wallet Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-[#10b981]" />
                            <p className="text-white/50 text-xs">Win Rate</p>
                          </div>
                          <p className="text-white font-bold text-lg">
                            {(parseFloat(wallet.winRate) * 100).toFixed(0)}%
                          </p>
                        </div>

                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-[#3b82f6]" />
                            <p className="text-white/50 text-xs">Total Profit</p>
                          </div>
                          <p className="text-white font-bold text-lg">
                            ${(parseInt(wallet.totalProfitUsd) / 1000000).toFixed(2)}M
                          </p>
                        </div>

                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4 text-[#f59e0b]" />
                            <p className="text-white/50 text-xs">Sharpe Ratio</p>
                          </div>
                          <p className="text-white font-bold text-lg">
                            {parseFloat(wallet.sharpeRatio).toFixed(1)}
                          </p>
                        </div>

                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-white/40" />
                            <p className="text-white/50 text-xs">Avg Hold</p>
                          </div>
                          <p className="text-white font-bold text-lg">
                            {parseFloat(wallet.avgHoldTimeDays).toFixed(1)}d
                          </p>
                        </div>
                      </div>

                      {/* Additional Stats */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-white/50">Trades: </span>
                            <span className="text-white font-medium">{wallet.totalTradesAnalyzed}</span>
                          </div>
                          <div>
                            <span className="text-white/50">Avg Position: </span>
                            <span className="text-white font-medium">
                              ${(parseInt(wallet.avgPositionSizeUsd) / 1000).toFixed(0)}K
                            </span>
                          </div>
                          <div>
                            <span className="text-white/50">Frequency: </span>
                            <span className="text-white font-medium capitalize">
                              {wallet.tradingFrequency.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Primary Tokens */}
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-white/50 text-xs mb-2">Primary Tokens</p>
                        <div className="flex flex-wrap gap-2">
                          {wallet.primaryTokens.map((token, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-white/10 text-white rounded text-xs font-medium"
                            >
                              {token}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-12 text-center">
                  <Database className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-semibold mb-2">No Wallet Data Available</h3>
                  <p className="text-white/50 text-sm">
                    Run wallet discovery to populate Nansen smart money data
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
