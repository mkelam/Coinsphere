/**
 * Paper Trading Dashboard
 * Real-time monitoring of Token Unlock Front-Running strategy
 */

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertCircle,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Timer,
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

interface StrategyOverview {
  strategy: {
    id: string;
    name: string;
    status: string;
    winRate: number;
    riskRewardRatio: number;
    avgHoldTime: string;
  };
  executionState: {
    isActive: boolean;
    mode: string;
    currentCapital: number;
    allocatedCapital: number;
    totalPnl: number;
    realizedPnl: number;
    unrealizedPnl: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number | null;
    sharpeRatio: number | null;
    maxDrawdown: number | null;
    currentOpenPositions: number;
    maxOpenPositions: number;
    dailyLossLimit: number;
    dailyLossCurrent: number;
    lastTradeAt: string | null;
    startedAt: string;
  } | null;
}

interface UnlockEvent {
  id: string;
  token: {
    id: string;
    symbol: string;
    name: string;
    currentPrice: number;
    marketCap: number;
  };
  unlockDate: string;
  unlockAmount: number;
  percentOfSupply: number;
  circulatingSupply: number;
  category: string | null;
  description: string | null;
  source: string;
  timeUntil: {
    hours: number;
    days: number;
  };
  status: 'entry_window' | 'too_close' | 'waiting' | 'passed';
}

interface TradingSignal {
  id: string;
  action: string;
  symbol: string;
  strength: number | null;
  reasoning: string | null;
  executed: boolean;
  createdAt: string;
}

interface Position {
  id: string;
  symbol: string;
  side: string;
  entryPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number | null;
  status: string;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  createdAt: string;
  closedAt: string | null;
}

export default function PaperTradingDashboard() {
  const [overview, setOverview] = useState<StrategyOverview | null>(null);
  const [unlocks, setUnlocks] = useState<UnlockEvent[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [overviewRes, unlocksRes, signalsRes, positionsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/paper-trading/overview`),
        axios.get(`${API_BASE_URL}/paper-trading/unlocks?days=30`),
        axios.get(`${API_BASE_URL}/paper-trading/signals?limit=10`),
        axios.get(`${API_BASE_URL}/paper-trading/positions?limit=10`),
      ]);

      setOverview(overviewRes.data.data);
      setUnlocks(unlocksRes.data.data);
      setSignals(signalsRes.data.data);
      setPositions(positionsRes.data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toFixed(2);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getStatusBadge = (status: UnlockEvent['status']) => {
    switch (status) {
      case 'entry_window':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
            <Target className="w-3 h-3 mr-1" />
            Entry Window
          </Badge>
        );
      case 'too_close':
        return (
          <Badge variant="destructive" className="bg-red-500/10 text-red-500">
            <AlertCircle className="w-3 h-3 mr-1" />
            Too Close
          </Badge>
        );
      case 'waiting':
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
            <Clock className="w-3 h-3 mr-1" />
            Waiting
          </Badge>
        );
      case 'passed':
        return (
          <Badge variant="outline" className="text-gray-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Passed
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-white/60">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const state = overview?.executionState;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Paper Trading Dashboard</h1>
            <p className="text-white/60 mt-1">Token Unlock Front-Running Strategy</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <Button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Strategy Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Status</CardTitle>
              <Activity className="w-4 h-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {state?.isActive ? (
                  <Badge className="bg-green-500/20 text-green-400">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    ACTIVE
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-red-500/20 text-red-400">
                    <XCircle className="w-3 h-3 mr-1" />
                    INACTIVE
                  </Badge>
                )}
                <Badge variant="outline" className="text-white/60">
                  {state?.mode.toUpperCase() || 'N/A'}
                </Badge>
              </div>
              <p className="text-xs text-white/40 mt-2">
                Win Rate (Backtest): {formatPercent(overview?.strategy.winRate || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Capital</CardTitle>
              <DollarSign className="w-4 h-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(state?.currentCapital || 0)}
              </div>
              <p className="text-xs text-white/40 mt-1">
                Allocated: {formatCurrency(state?.allocatedCapital || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Total P&L</CardTitle>
              {(state?.totalPnl || 0) >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${(state?.totalPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {(state?.totalPnl || 0) >= 0 ? '+' : ''}
                {formatCurrency(state?.totalPnl || 0)}
              </div>
              <div className="flex gap-2 mt-1 text-xs">
                <span className="text-white/40">
                  Realized: {formatCurrency(state?.realizedPnl || 0)}
                </span>
                <span className="text-white/40">
                  Unrealized: {formatCurrency(state?.unrealizedPnl || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Performance</CardTitle>
              <Target className="w-4 h-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{state?.totalTrades || 0}</div>
              <div className="flex gap-2 mt-1 text-xs">
                <span className="text-green-400">W: {state?.winningTrades || 0}</span>
                <span className="text-red-400">L: {state?.losingTrades || 0}</span>
                <span className="text-white/40">
                  Rate: {state?.winRate ? formatPercent(state.winRate) : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="unlocks" className="w-full">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="unlocks">
              Upcoming Unlocks{' '}
              {unlocks.filter((u) => u.status === 'entry_window').length > 0 && (
                <Badge className="ml-2 bg-amber-500/20 text-amber-400 text-xs">
                  {unlocks.filter((u) => u.status === 'entry_window').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="signals">
              Signals{' '}
              {signals.length > 0 && (
                <Badge className="ml-2 bg-blue-500/20 text-blue-400 text-xs">{signals.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="positions">
              Positions{' '}
              {state && state.currentOpenPositions > 0 && (
                <Badge className="ml-2 bg-green-500/20 text-green-400 text-xs">
                  {state.currentOpenPositions}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Unlocks Tab */}
          <TabsContent value="unlocks" className="mt-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Token Unlock Events (Next 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {unlocks.length === 0 ? (
                  <div className="text-center py-12 text-white/40">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming unlock events</p>
                    <p className="text-xs mt-2">Run the add-token-unlock-events script to populate data</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {unlocks.map((unlock) => (
                      <div
                        key={unlock.id}
                        className={`p-4 rounded-lg border ${
                          unlock.status === 'entry_window'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-white">
                                {unlock.token.symbol}
                              </h3>
                              <span className="text-white/60 text-sm">{unlock.token.name}</span>
                              {getStatusBadge(unlock.status)}
                            </div>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-white/40">Unlock Date</p>
                                <p className="text-white font-medium">
                                  {new Date(unlock.unlockDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-white/40">Time Until</p>
                                <p className="text-white font-medium">
                                  {unlock.timeUntil.days}d ({unlock.timeUntil.hours}h)
                                </p>
                              </div>
                              <div>
                                <p className="text-white/40">Amount</p>
                                <p className="text-white font-medium">
                                  {formatNumber(Number(unlock.unlockAmount))}
                                </p>
                              </div>
                              <div>
                                <p className="text-white/40">% of Supply</p>
                                <p className="text-white font-medium">
                                  {unlock.percentOfSupply}%
                                </p>
                              </div>
                            </div>
                            {unlock.description && (
                              <p className="mt-2 text-xs text-white/60">{unlock.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signals Tab */}
          <TabsContent value="signals" className="mt-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Recent Trading Signals</CardTitle>
              </CardHeader>
              <CardContent>
                {signals.length === 0 ? (
                  <div className="text-center py-12 text-white/40">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No signals generated yet</p>
                    <p className="text-xs mt-2">Signals will appear when tokens enter 24-48h window</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {signals.map((signal) => (
                      <div
                        key={signal.id}
                        className="p-4 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge
                              className={
                                signal.action === 'buy'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }
                            >
                              {signal.action.toUpperCase()}
                            </Badge>
                            <span className="text-white font-semibold">{signal.symbol}</span>
                            {signal.strength && (
                              <span className="text-xs text-white/60">
                                Strength: {signal.strength.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {signal.executed ? (
                              <Badge className="bg-green-500/20 text-green-400">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Executed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-white/60">
                                <Timer className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                            <span className="text-xs text-white/40">
                              {new Date(signal.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {signal.reasoning && (
                          <p className="mt-2 text-sm text-white/60">{signal.reasoning}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Positions Tab */}
          <TabsContent value="positions" className="mt-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Recent Positions</CardTitle>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <div className="text-center py-12 text-white/40">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No positions yet</p>
                    <p className="text-xs mt-2">Positions will appear when signals are executed</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {positions.map((pos) => (
                      <div
                        key={pos.id}
                        className="p-4 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="text-white font-semibold">{pos.symbol}</h4>
                            <Badge
                              className={
                                pos.side === 'long'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }
                            >
                              {pos.side.toUpperCase()}
                            </Badge>
                            <Badge
                              variant={pos.status === 'open' ? 'default' : 'outline'}
                              className={
                                pos.status === 'open'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'text-white/60'
                              }
                            >
                              {pos.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div
                            className={`text-lg font-bold ${Number(pos.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {Number(pos.pnl) >= 0 ? '+' : ''}
                            {formatCurrency(Number(pos.pnl))}{' '}
                            {pos.pnlPercent && `(${Number(pos.pnlPercent).toFixed(2)}%)`}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-white/40">Entry Price</p>
                            <p className="text-white font-medium">${Number(pos.entryPrice).toFixed(6)}</p>
                          </div>
                          <div>
                            <p className="text-white/40">Quantity</p>
                            <p className="text-white font-medium">{Number(pos.quantity).toFixed(4)}</p>
                          </div>
                          <div>
                            <p className="text-white/40">Stop Loss</p>
                            <p className="text-white font-medium">
                              {pos.stopLossPrice ? `$${Number(pos.stopLossPrice).toFixed(6)}` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/40">Take Profit</p>
                            <p className="text-white font-medium">
                              {pos.takeProfitPrice ? `$${Number(pos.takeProfitPrice).toFixed(6)}` : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-white/40">
                          Opened: {new Date(pos.createdAt).toLocaleString()}
                          {pos.closedAt && ` • Closed: ${new Date(pos.closedAt).toLocaleString()}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
