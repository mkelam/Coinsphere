import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { exchangeApi, SupportedExchange, ConnectExchangeRequest } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

interface ConnectExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConnectExchangeModal({ isOpen, onClose, onSuccess }: ConnectExchangeModalProps) {
  const [exchanges, setExchanges] = useState<SupportedExchange[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<string>('');
  const [formData, setFormData] = useState<ConnectExchangeRequest>({
    exchange: '',
    apiKey: '',
    apiSecret: '',
    passphrase: '',
    label: '',
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadExchanges();
    }
  }, [isOpen]);

  const loadExchanges = async () => {
    try {
      const { exchanges } = await exchangeApi.getSupportedExchanges();
      setExchanges(exchanges);
    } catch (err) {
      console.error('Failed to load exchanges:', err);
    }
  };

  const handleExchangeSelect = (exchangeId: string) => {
    setSelectedExchange(exchangeId);
    setFormData({
      ...formData,
      exchange: exchangeId,
      label: `${exchangeId.charAt(0).toUpperCase() + exchangeId.slice(1)} Account`,
    });
    setTestResult(null);
    setError('');
  };

  const handleInputChange = (field: keyof ConnectExchangeRequest, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleTestConnection = async () => {
    if (!formData.exchange || !formData.apiKey || !formData.apiSecret) {
      setError('Please fill in all required fields');
      return;
    }

    setTestingConnection(true);
    setTestResult(null);
    setError('');

    try {
      const result = await exchangeApi.testConnection({
        exchange: formData.exchange,
        apiKey: formData.apiKey,
        apiSecret: formData.apiSecret,
        passphrase: formData.passphrase,
      });

      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Connection test failed',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleConnect = async () => {
    if (!testResult?.success) {
      setError('Please test the connection first');
      return;
    }

    setConnecting(true);
    setError('');

    try {
      await exchangeApi.connectExchange(formData);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to connect exchange');
    } finally {
      setConnecting(false);
    }
  };

  const handleClose = () => {
    setSelectedExchange('');
    setFormData({
      exchange: '',
      apiKey: '',
      apiSecret: '',
      passphrase: '',
      label: '',
    });
    setTestResult(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const selectedExchangeInfo = exchanges.find((ex) => ex.id === selectedExchange);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-900 border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Connect Exchange</h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Exchange Selection */}
          {!selectedExchange && (
            <div>
              <p className="text-slate-300 mb-4">
                Select an exchange to connect your account
              </p>
              <div className="grid grid-cols-2 gap-4">
                {exchanges.map((exchange) => (
                  <button
                    key={exchange.id}
                    onClick={() => handleExchangeSelect(exchange.id)}
                    className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-left transition-colors"
                  >
                    <div className="font-semibold text-white mb-1">{exchange.name}</div>
                    <div className="text-sm text-slate-400">
                      {exchange.requiresPassphrase && 'Requires passphrase'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Connection Form */}
          {selectedExchange && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  {selectedExchangeInfo?.name}
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedExchange('')}
                  className="text-slate-400"
                >
                  Change Exchange
                </Button>
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Connection Label (optional)
                </label>
                <Input
                  type="text"
                  value={formData.label}
                  onChange={(e) => handleInputChange('label', e.target.value)}
                  placeholder="My Binance Account"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) => handleInputChange('apiKey', e.target.value)}
                  placeholder="Enter your API key"
                  className="bg-slate-800 border-slate-700 text-white font-mono"
                />
              </div>

              {/* API Secret */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  API Secret <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  value={formData.apiSecret}
                  onChange={(e) => handleInputChange('apiSecret', e.target.value)}
                  placeholder="Enter your API secret"
                  className="bg-slate-800 border-slate-700 text-white font-mono"
                />
              </div>

              {/* Passphrase (conditional) */}
              {selectedExchangeInfo?.requiresPassphrase && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Passphrase <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={formData.passphrase}
                    onChange={(e) => handleInputChange('passphrase', e.target.value)}
                    placeholder="Enter your passphrase"
                    className="bg-slate-800 border-slate-700 text-white font-mono"
                  />
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  🔒 Your API credentials are encrypted using AES-256-GCM before storage.
                  We recommend using read-only API keys without withdrawal permissions.
                </p>
              </div>

              {/* Test Result */}
              {testResult && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    testResult.success
                      ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                      : 'bg-red-500/10 border border-red-500/30 text-red-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="text-sm">{testResult.message}</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-red-300">{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleTestConnection}
                  disabled={testingConnection || !formData.apiKey || !formData.apiSecret}
                  variant="outline"
                  className="flex-1"
                >
                  {testingConnection ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={!testResult?.success || connecting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Exchange'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
