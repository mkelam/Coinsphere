import { useState } from 'react';
import { X, PlayCircle, Calendar, DollarSign, Target, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RunBacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategyId: string;
  strategyName: string;
  onSubmit: (config: BacktestConfig) => void;
}

export interface BacktestConfig {
  strategyId: string;
  symbols: string[];
  startDate: string;
  endDate: string;
  timeframe: string;
  initialCapital: number;
  positionSizePct: number;
  maxPortfolioHeat: number;
  maxDrawdownLimit: number;
  makerFee: number;
  takerFee: number;
  slippagePct: number;
  latencyMs: number;
}

const AVAILABLE_SYMBOLS = [
  'BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX',
  'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'NEAR', 'AAVE'
];

const TIMEFRAMES = [
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
  { value: '1w', label: '1 Week' },
];

export function RunBacktestModal({ isOpen, onClose, strategyId, strategyName, onSubmit }: RunBacktestModalProps) {
  const [config, setConfig] = useState<BacktestConfig>({
    strategyId,
    symbols: ['ETH'],
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    timeframe: '4h',
    initialCapital: 10000,
    positionSizePct: 0.05,
    maxPortfolioHeat: 0.25,
    maxDrawdownLimit: 0.20,
    makerFee: 0.001,
    takerFee: 0.001,
    slippagePct: 0.005,
    latencyMs: 100,
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'risk' | 'costs'>('basic');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  const toggleSymbol = (symbol: string) => {
    setConfig(prev => ({
      ...prev,
      symbols: prev.symbols.includes(symbol)
        ? prev.symbols.filter(s => s !== symbol)
        : [...prev.symbols, symbol]
    }));
  };

  const updateConfig = (field: keyof BacktestConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-[#3b82f6]" />
              Run Backtest
            </h2>
            <p className="text-white/60 text-sm mt-1">Strategy: {strategyName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-6">
          {[
            { id: 'basic', label: 'Basic Config', icon: Calendar },
            { id: 'risk', label: 'Risk Management', icon: Target },
            { id: 'costs', label: 'Trading Costs', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-[#3b82f6]'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Basic Configuration Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Symbol Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Symbols to Test ({config.symbols.length} selected)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_SYMBOLS.map((symbol) => (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => toggleSymbol(symbol)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        config.symbols.includes(symbol)
                          ? 'bg-[#3b82f6] text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-white/50 mt-2">Select one or more symbols to backtest</p>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={config.startDate}
                    onChange={(e) => updateConfig('startDate', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#3b82f6]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={config.endDate}
                    onChange={(e) => updateConfig('endDate', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#3b82f6]"
                  />
                </div>
              </div>

              {/* Timeframe */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Timeframe
                </label>
                <select
                  value={config.timeframe}
                  onChange={(e) => updateConfig('timeframe', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#3b82f6]"
                >
                  {TIMEFRAMES.map((tf) => (
                    <option key={tf.value} value={tf.value} className="bg-[#0A0E27]">
                      {tf.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Initial Capital */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Initial Capital (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="number"
                    value={config.initialCapital}
                    onChange={(e) => updateConfig('initialCapital', parseFloat(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#3b82f6]"
                    min="100"
                    step="100"
                  />
                </div>
                <p className="text-xs text-white/50 mt-1">Starting capital for the backtest</p>
              </div>
            </div>
          )}

          {/* Risk Management Tab */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              {/* Position Size */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Position Size (% of capital)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0.01"
                    max="0.20"
                    step="0.01"
                    value={config.positionSizePct}
                    onChange={(e) => updateConfig('positionSizePct', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center font-medium">
                    {(config.positionSizePct * 100).toFixed(0)}%
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Amount of capital to risk per trade (recommended: 1-10%)
                </p>
              </div>

              {/* Max Portfolio Heat */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Max Portfolio Heat (% of capital at risk)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0.05"
                    max="0.50"
                    step="0.05"
                    value={config.maxPortfolioHeat}
                    onChange={(e) => updateConfig('maxPortfolioHeat', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center font-medium">
                    {(config.maxPortfolioHeat * 100).toFixed(0)}%
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Maximum total exposure across all open positions
                </p>
              </div>

              {/* Max Drawdown Limit */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Max Drawdown Limit (% loss to stop trading)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0.05"
                    max="0.50"
                    step="0.05"
                    value={config.maxDrawdownLimit}
                    onChange={(e) => updateConfig('maxDrawdownLimit', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center font-medium">
                    {(config.maxDrawdownLimit * 100).toFixed(0)}%
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Stop all trading if drawdown exceeds this limit
                </p>
              </div>

              {/* Risk Summary */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-3">Risk Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Risk per trade:</span>
                    <span className="text-white font-medium">
                      ${(config.initialCapital * config.positionSizePct).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Max simultaneous positions:</span>
                    <span className="text-white font-medium">
                      {Math.floor(config.maxPortfolioHeat / config.positionSizePct)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Stop trading at drawdown:</span>
                    <span className="text-red-400 font-medium">
                      ${(config.initialCapital * config.maxDrawdownLimit).toFixed(2)} loss
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trading Costs Tab */}
          {activeTab === 'costs' && (
            <div className="space-y-6">
              {/* Maker Fee */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Maker Fee (%)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={(config.makerFee * 100).toFixed(3)}
                    onChange={(e) => updateConfig('makerFee', parseFloat(e.target.value) / 100)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#3b82f6]"
                    min="0"
                    max="1"
                    step="0.001"
                  />
                  <span className="text-white/60">%</span>
                </div>
                <p className="text-xs text-white/50 mt-1">Fee for limit orders (typical: 0.1%)</p>
              </div>

              {/* Taker Fee */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Taker Fee (%)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={(config.takerFee * 100).toFixed(3)}
                    onChange={(e) => updateConfig('takerFee', parseFloat(e.target.value) / 100)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#3b82f6]"
                    min="0"
                    max="1"
                    step="0.001"
                  />
                  <span className="text-white/60">%</span>
                </div>
                <p className="text-xs text-white/50 mt-1">Fee for market orders (typical: 0.1%)</p>
              </div>

              {/* Slippage */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Slippage (%)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={(config.slippagePct * 100).toFixed(3)}
                    onChange={(e) => updateConfig('slippagePct', parseFloat(e.target.value) / 100)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#3b82f6]"
                    min="0"
                    max="5"
                    step="0.001"
                  />
                  <span className="text-white/60">%</span>
                </div>
                <p className="text-xs text-white/50 mt-1">Price movement during execution (typical: 0.5%)</p>
              </div>

              {/* Latency */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Order Latency (milliseconds)
                </label>
                <input
                  type="number"
                  value={config.latencyMs}
                  onChange={(e) => updateConfig('latencyMs', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#3b82f6]"
                  min="0"
                  max="5000"
                  step="10"
                />
                <p className="text-xs text-white/50 mt-1">
                  Execution delay to simulate real trading (typical: 100-500ms)
                </p>
              </div>

              {/* Cost Presets */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Quick Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig('makerFee', 0.001);
                      updateConfig('takerFee', 0.001);
                      updateConfig('slippagePct', 0.002);
                      updateConfig('latencyMs', 50);
                    }}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
                  >
                    Low Cost
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig('makerFee', 0.001);
                      updateConfig('takerFee', 0.001);
                      updateConfig('slippagePct', 0.005);
                      updateConfig('latencyMs', 100);
                    }}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
                  >
                    Realistic
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig('makerFee', 0.002);
                      updateConfig('takerFee', 0.002);
                      updateConfig('slippagePct', 0.010);
                      updateConfig('latencyMs', 200);
                    }}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
                  >
                    Conservative
                  </button>
                </div>
              </div>

              {/* Cost Impact Summary */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-3">Estimated Cost Impact</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Total fees per trade:</span>
                    <span className="text-orange-400 font-medium">
                      {((config.makerFee + config.takerFee) * 100).toFixed(3)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Total slippage per trade:</span>
                    <span className="text-orange-400 font-medium">
                      {(config.slippagePct * 2 * 100).toFixed(3)}% (entry + exit)
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2">
                    <span className="text-white font-medium">Total cost per round trip:</span>
                    <span className="text-red-400 font-bold">
                      {((config.makerFee + config.takerFee + config.slippagePct * 2) * 100).toFixed(3)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <div className="text-sm text-white/60">
            {config.symbols.length} symbol{config.symbols.length !== 1 ? 's' : ''} •
            {' '}{config.timeframe} timeframe •
            {' '}${config.initialCapital.toLocaleString()} capital
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#3b82f6] hover:bg-[#3b82f6]/80 text-white"
              disabled={config.symbols.length === 0}
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Run Backtest
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
