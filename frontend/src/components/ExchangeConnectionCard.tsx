import { useState } from 'react';
import { RefreshCw, Trash2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { ExchangeConnection } from '../services/api';
import { GlassCard } from './glass-card';
import { Button } from './ui/button';

interface ExchangeConnectionCardProps {
  connection: ExchangeConnection;
  onSync: (connectionId: string) => Promise<void>;
  onDisconnect: (connectionId: string) => Promise<void>;
}

export function ExchangeConnectionCard({ connection, onSync, onDisconnect }: ExchangeConnectionCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync(connection.id);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to disconnect ${connection.label}?`)) {
      return;
    }

    setDisconnecting(true);
    try {
      await onDisconnect(connection.id);
    } finally {
      setDisconnecting(false);
    }
  };

  const getStatusIcon = () => {
    switch (connection.status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-[#10B981]" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-[#EF4444]" />;
      case 'disabled':
        return <Clock className="w-5 h-5 text-[#F59E0B]" />;
      default:
        return <AlertCircle className="w-5 h-5 text-white/40" />;
    }
  };

  const getStatusColor = () => {
    switch (connection.status) {
      case 'active':
        return 'text-[#10B981]';
      case 'error':
        return 'text-[#EF4444]';
      case 'disabled':
        return 'text-[#F59E0B]';
      default:
        return 'text-white/40';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <GlassCard hover={true} className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Exchange Logo Placeholder */}
          <div className="w-12 h-12 bg-white/[0.05] rounded-lg flex items-center justify-center border border-white/10">
            <span className="text-2xl font-bold text-white">
              {connection.exchange.charAt(0).toUpperCase()}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">{connection.label}</h3>
            <p className="text-sm text-white/50 capitalize">{connection.exchange}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium capitalize ${getStatusColor()}`}>
            {connection.status}
          </span>
        </div>
      </div>

      {/* Last Sync */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-white/50">Last Sync:</span>
          <span className="text-white/70">{formatDate(connection.lastSyncAt)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-white/50">Auto-Sync:</span>
          <span className="text-white/70">{connection.autoSync ? 'Enabled' : 'Disabled'}</span>
        </div>

        {connection.lastError && (
          <div className="mt-2 p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg text-sm text-[#EF4444]">
            <strong className="font-semibold">Error:</strong> {connection.lastError}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSync}
          disabled={syncing || disconnecting}
          variant="outline"
          className="flex-1 border-white/10 text-white/70 hover:text-white hover:bg-white/[0.05]"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>

        <Button
          onClick={handleDisconnect}
          disabled={syncing || disconnecting}
          className="bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </GlassCard>
  );
}
