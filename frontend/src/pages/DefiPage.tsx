/**
 * DeFi Page - DeFi Portfolio Dashboard
 * Displays user's DeFi positions across all protocols
 */

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, TrendingUp, Layers, DollarSign, AlertCircle, Wallet } from 'lucide-react';
import { defiService, DefiPosition, DefiProtocol } from '../services/defiService';
import { DefiProtocolCard } from '../components/DefiProtocolCard';
import { DefiPositionTable } from '../components/DefiPositionTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ConnectWallet } from '../components/ConnectWallet';
import { useWallet } from '../contexts/WalletContext';
import { Button } from '../components/ui/button';
import { CHAIN_NAMES } from '../lib/wagmi';

export function DefiPage() {
  const { address, isConnected, chainId } = useWallet();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [positions, setPositions] = useState<DefiPosition[]>([]);
  const [protocols, setProtocols] = useState<DefiProtocol[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Fetch DeFi data
  const fetchDefiData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [positionsData, protocolsData, statsData] = await Promise.all([
        defiService.getPositions(),
        defiService.getProtocols(),
        defiService.getStats(),
      ]);

      setPositions(positionsData.positions);
      setProtocols(protocolsData);
      setStats(statsData);
      setLastSync(statsData.lastSync ? new Date(statsData.lastSync) : null);
    } catch (err: any) {
      console.error('Error fetching DeFi data:', err);
      setError(err.response?.data?.message || 'Failed to load DeFi data');
    } finally {
      setLoading(false);
    }
  };

  // Manual sync
  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);

      const result = await defiService.syncPositions();

      // Refresh data after sync
      await fetchDefiData();

      // Show success message
      if (result.summary.errors > 0) {
        setError(`Synced ${result.summary.success} wallet(s), ${result.summary.errors} failed`);
      }
    } catch (err: any) {
      console.error('Error syncing DeFi positions:', err);
      setError(err.response?.data?.message || 'Failed to sync DeFi positions');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDefiData();
  }, []);

  // Group positions by protocol
  const positionsByProtocol = positions.reduce((acc, position) => {
    if (position.protocol) {
      const protocolId = position.protocolId;
      if (!acc[protocolId]) {
        acc[protocolId] = {
          protocol: position.protocol,
          positions: [],
          totalValue: 0,
        };
      }
      acc[protocolId].positions.push(position);
      acc[protocolId].totalValue += parseFloat(position.valueUsd);
    }
    return acc;
  }, {} as Record<string, { protocol: DefiProtocol; positions: DefiPosition[]; totalValue: number }>);

  const sortedProtocols = Object.values(positionsByProtocol).sort(
    (a, b) => b.totalValue - a.totalValue
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <div className="glass-card p-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-white/70">Loading DeFi positions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-white">
            DeFi Portfolio
          </h1>
          <div className="flex items-center gap-3">
            {/* Wallet Connection Status */}
            {isConnected ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg backdrop-blur-sm">
                <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse" />
                <span className="text-sm font-medium text-[#10b981]">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <span className="text-xs text-white/60">
                  {chainId && CHAIN_NAMES[chainId]}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWalletModalOpen(true)}
                  className="ml-2 text-xs"
                >
                  Change
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setWalletModalOpen(true)}
                className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#3b82f6]/80 text-white"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
            )}

            {/* Sync Button */}
            <button
              onClick={handleSync}
              disabled={syncing || !isConnected}
              className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#3b82f6]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors backdrop-blur-sm"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Positions'}
            </button>
          </div>
        </div>
        <p className="text-white/60">
          Track your DeFi positions across {protocols.length} protocols
        </p>
        {lastSync && (
          <p className="text-sm text-white/40 mt-1">
            Last synced: {lastSync.toLocaleString()}
          </p>
        )}
      </div>

      {/* Wallet Connect Modal */}
      <ConnectWallet open={walletModalOpen} onOpenChange={setWalletModalOpen} />

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg flex items-start gap-3 backdrop-blur-sm">
          <AlertCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#ef4444]">Error</p>
            <p className="text-sm text-[#ef4444]/80">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Value */}
          <div className="glass-card p-6">
            <p className="text-sm text-white/50 mb-2">Total DeFi Value</p>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#10b981]" />
              <div className="text-2xl font-bold text-white">
                ${parseFloat(stats.totalValue).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          {/* Total Positions */}
          <div className="glass-card p-6">
            <p className="text-sm text-white/50 mb-2">Total Positions</p>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#3b82f6]" />
              <div className="text-2xl font-bold text-white">
                {stats.totalPositions}
              </div>
            </div>
          </div>

          {/* Protocols Used */}
          <div className="glass-card p-6">
            <p className="text-sm text-white/50 mb-2">Protocols Used</p>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <div className="text-2xl font-bold text-white">
                {stats.protocolCount}
              </div>
            </div>
          </div>

          {/* Average APY */}
          <div className="glass-card p-6">
            <p className="text-sm text-white/50 mb-2">Average APY</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#10b981]" />
              <div className="text-2xl font-bold text-[#10b981]">
                {parseFloat(stats.averageApy).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Positions State */}
      {positions.length === 0 && !loading && (
        <div className="glass-card text-center py-12">
          <div className="text-6xl mb-4">🏦</div>
          <h3 className="text-xl font-semibold text-white mb-2">No DeFi Positions Found</h3>
          <p className="text-white/60 mb-6">
            {isConnected
              ? 'Sync to see your DeFi positions across protocols'
              : 'Connect a wallet to track your DeFi positions'
            }
          </p>
          {!isConnected ? (
            <Button
              onClick={() => setWalletModalOpen(true)}
              className="px-6 py-3 bg-[#3b82f6] hover:bg-[#3b82f6]/80 text-white"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          ) : (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-6 py-3 bg-[#3b82f6] text-white rounded-lg hover:bg-[#3b82f6]/80 disabled:opacity-50 transition-colors backdrop-blur-sm"
            >
              {syncing ? 'Syncing...' : 'Sync Positions'}
            </button>
          )}
        </div>
      )}

      {/* Protocol Cards */}
      {sortedProtocols.length > 0 && (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Positions by Protocol
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedProtocols.map(({ protocol, positions, totalValue }) => (
                <DefiProtocolCard
                  key={protocol.id}
                  protocol={protocol}
                  positions={positions}
                  totalValue={totalValue}
                />
              ))}
            </div>
          </div>

          {/* Position Table */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-white">
              All Positions
            </h2>
            <DefiPositionTable positions={positions} />
          </div>
        </>
      )}

      {/* Supported Protocols Info */}
      <div className="mt-8">
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold text-white mb-2">Supported Protocols ({protocols.length})</h3>
          <p className="text-white/60 mb-6">
            We track positions across {protocols.length} DeFi protocols using The Graph
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {protocols.map((protocol) => (
              <div
                key={protocol.id}
                className="flex flex-col items-center gap-2 p-3 border border-white/10 rounded-lg hover:border-[#3b82f6] transition-colors backdrop-blur-sm"
              >
                {protocol.logoUrl ? (
                  <img
                    src={protocol.logoUrl}
                    alt={protocol.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-xl">
                    💼
                  </div>
                )}
                <div className="text-center">
                  <div className="text-xs font-medium text-white">{protocol.name}</div>
                  <div className="text-xs text-white/50">{protocol.blockchain}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
