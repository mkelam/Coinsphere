import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Link2 } from 'lucide-react';
import { Header } from '@/components/header';
import { GlassCard } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingScreen';
import { ConnectExchangeModal } from '@/components/ConnectExchangeModal';
import { ExchangeConnectionCard } from '@/components/ExchangeConnectionCard';
import { exchangeApi, ExchangeConnection } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function ExchangeConnectionsPage() {
  const [connections, setConnections] = useState<ExchangeConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const { connections: data } = await exchangeApi.getConnections();
      setConnections(data);
    } catch (error) {
      showToast('Failed to load exchange connections', 'error');
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      await exchangeApi.syncAll();
      showToast('All exchanges synced successfully', 'success');
      await loadConnections();
    } catch (error) {
      showToast('Failed to sync exchanges', 'error');
      console.error('Failed to sync all:', error);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSync = async (connectionId: string) => {
    try {
      await exchangeApi.syncConnection(connectionId);
      showToast('Exchange synced successfully', 'success');
      await loadConnections();
    } catch (error) {
      showToast('Failed to sync exchange', 'error');
      console.error('Failed to sync connection:', error);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      await exchangeApi.disconnectExchange(connectionId);
      showToast('Exchange disconnected successfully', 'success');
      await loadConnections();
    } catch (error) {
      showToast('Failed to disconnect exchange', 'error');
      console.error('Failed to disconnect:', error);
    }
  };

  const handleConnectSuccess = () => {
    showToast('Exchange connected successfully!', 'success');
    loadConnections();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Exchange Connections</h1>
          <p className="text-white/60">
            Connect your exchange accounts to automatically sync your portfolio holdings
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setShowConnectModal(true)}
            className="bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Exchange
          </Button>

          {connections.length > 0 && (
            <Button
              onClick={handleSyncAll}
              disabled={syncingAll}
              variant="outline"
              className="border-white/10 text-white/70 hover:text-white hover:bg-white/[0.05]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncingAll ? 'animate-spin' : ''}`} />
              {syncingAll ? 'Syncing All...' : 'Sync All'}
            </Button>
          )}
        </div>

        {/* Connections Grid */}
        {connections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {connections.map((connection) => (
              <ExchangeConnectionCard
                key={connection.id}
                connection={connection}
                onSync={handleSync}
                onDisconnect={handleDisconnect}
              />
            ))}
          </div>
        ) : (
          <GlassCard hover={false} className="p-12 text-center mb-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-white/[0.05] rounded-full flex items-center justify-center border border-white/10">
                <Link2 className="w-8 h-8 text-white/50" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Exchange Connections
                </h3>
                <p className="text-white/60 mb-6">
                  Connect your first exchange to start syncing your portfolio automatically
                </p>
                <Button
                  onClick={() => setShowConnectModal(true)}
                  className="bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Your First Exchange
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Security Notice */}
        <GlassCard hover={false} className="p-6 bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            Security Information
          </h3>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex gap-3">
              <span className="text-[#3B82F6] mt-1">•</span>
              <span>All API credentials are encrypted using AES-256-GCM before storage</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#3B82F6] mt-1">•</span>
              <span>We recommend using read-only API keys without withdrawal permissions</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#3B82F6] mt-1">•</span>
              <span>Your credentials are never shared with third parties</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#3B82F6] mt-1">•</span>
              <span>Auto-sync runs every 5 minutes by default</span>
            </li>
          </ul>
        </GlassCard>
      </main>

      {/* Connect Exchange Modal */}
      <ConnectExchangeModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={handleConnectSuccess}
      />
    </div>
  );
}
