/**
 * Markets Page - Live Crypto Feed
 * Displays top 100 cryptocurrencies with real-time prices, market cap, volume, and 24h changes
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Search, Star, StarOff, Loader2, RefreshCw, Sparkles, Target } from 'lucide-react';
import { Header } from '@/components/header';
import { Layout } from '@/components/Layout';

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  circulating_supply: number;
  total_supply: number | null;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface PricePrediction {
  symbol: string;
  predicted_price_7d: number;
  predicted_price_30d: number;
  confidence: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  bull_target: number;
  bear_target: number;
}

export function MarketsPage() {
  const [cryptos, setCryptos] = useState<CryptoAsset[]>([]);
  const [predictions, setPredictions] = useState<Map<string, PricePrediction>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'market_cap' | 'price' | 'volume' | 'change_24h'>('market_cap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showPredictions, setShowPredictions] = useState(true);

  // Generate AI price predictions (mock implementation - can be replaced with actual ML API)
  const generatePredictions = (cryptos: CryptoAsset[]): Map<string, PricePrediction> => {
    const predictionsMap = new Map<string, PricePrediction>();

    cryptos.forEach(crypto => {
      const currentPrice = crypto.current_price;
      const change24h = crypto.price_change_percentage_24h;
      const change7d = crypto.price_change_percentage_7d || 0;

      // Calculate momentum and sentiment
      const momentum = (change24h * 0.4) + (change7d * 0.6);
      const volatility = Math.abs(change24h - change7d);

      // Determine sentiment
      let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (momentum > 5) sentiment = 'bullish';
      else if (momentum < -5) sentiment = 'bearish';

      // Generate predictions based on momentum and volatility
      const bullMultiplier = 1 + (0.15 + (Math.random() * 0.25)); // 15-40% gain
      const bearMultiplier = 1 - (0.10 + (Math.random() * 0.15)); // 10-25% loss

      // 7-day prediction (short-term momentum)
      const predicted7d = currentPrice * (1 + (momentum / 100) * 1.2);

      // 30-day prediction (longer-term trend)
      const predicted30d = currentPrice * (1 + (momentum / 100) * 2.5);

      // Bull and bear targets
      const bullTarget = currentPrice * bullMultiplier;
      const bearTarget = currentPrice * bearMultiplier;

      // Confidence based on volatility (lower volatility = higher confidence)
      const confidence = Math.max(60, Math.min(95, 85 - (volatility * 2)));

      predictionsMap.set(crypto.symbol.toLowerCase(), {
        symbol: crypto.symbol,
        predicted_price_7d: predicted7d,
        predicted_price_30d: predicted30d,
        confidence: Math.round(confidence),
        sentiment,
        bull_target: bullTarget,
        bear_target: bearTarget,
      });
    });

    return predictionsMap;
  };

  // Fetch top 100 cryptocurrencies
  const fetchCryptos = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Using CoinGecko API (free tier)
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h,7d'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch cryptocurrency data');
      }

      const data = await response.json();
      setCryptos(data);

      // Generate AI predictions
      const predictionsData = generatePredictions(data);
      setPredictions(predictionsData);

      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Error fetching crypto data:', err);
      setError(err.message || 'Failed to load cryptocurrency data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCryptos();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchCryptos(true);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Toggle watchlist
  const toggleWatchlist = (coinId: string) => {
    const newWatchlist = new Set(watchlist);
    if (newWatchlist.has(coinId)) {
      newWatchlist.delete(coinId);
    } else {
      newWatchlist.add(coinId);
    }
    setWatchlist(newWatchlist);
    // TODO: Persist to backend
  };

  // Filter cryptocurrencies
  const filteredCryptos = cryptos.filter(crypto =>
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort cryptocurrencies
  const sortedCryptos = [...filteredCryptos].sort((a, b) => {
    let aValue: number, bValue: number;

    switch (sortBy) {
      case 'price':
        aValue = a.current_price;
        bValue = b.current_price;
        break;
      case 'volume':
        aValue = a.total_volume;
        bValue = b.total_volume;
        break;
      case 'change_24h':
        aValue = a.price_change_percentage_24h;
        bValue = b.price_change_percentage_24h;
        break;
      case 'market_cap':
      default:
        aValue = a.market_cap;
        bValue = b.market_cap;
        break;
    }

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
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
                  <p className="text-white/70">Loading cryptocurrency data...</p>
                </div>
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
              <h1 className="text-3xl font-bold text-white">Cryptocurrency Markets</h1>
              <div className="flex items-center gap-3">
                {/* AI Predictions Toggle */}
                <button
                  onClick={() => setShowPredictions(!showPredictions)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors backdrop-blur-sm ${
                    showPredictions
                      ? 'bg-[#10b981] hover:bg-[#10b981]/80 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Predictions
                </button>

                <button
                  onClick={() => fetchCryptos(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-[#3b82f6]/80 text-white rounded-lg transition-colors backdrop-blur-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-white/60">
                Live prices for the top 100 cryptocurrencies by market cap
              </p>
              {showPredictions && (
                <span className="flex items-center gap-1 text-xs bg-[#10b981]/20 text-[#10b981] px-2 py-1 rounded border border-[#10b981]/30">
                  <Sparkles className="w-3 h-3" />
                  Bull market targets enabled
                </span>
              )}
            </div>
            {lastUpdate && (
              <p className="text-sm text-white/40 mt-1">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg flex items-start gap-3 backdrop-blur-sm">
              <div>
                <p className="text-sm font-medium text-[#ef4444]">Error</p>
                <p className="text-sm text-[#ef4444]/80">{error}</p>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="glass-card p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Search cryptocurrencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                >
                  <option value="market_cap" className="bg-black">Market Cap</option>
                  <option value="price" className="bg-black">Price</option>
                  <option value="volume" className="bg-black">Volume</option>
                  <option value="change_24h" className="bg-black">24h Change</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cryptocurrency Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-sm font-medium text-white/70 w-12">
                      <Star className="w-4 h-4" />
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-white/70">#</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-white/70">Name</th>
                    <th
                      className="text-right py-4 px-4 text-sm font-medium text-white/70 cursor-pointer hover:text-white"
                      onClick={() => handleSort('price')}
                    >
                      Price
                    </th>
                    <th
                      className="text-right py-4 px-4 text-sm font-medium text-white/70 cursor-pointer hover:text-white"
                      onClick={() => handleSort('change_24h')}
                    >
                      24h %
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-white/70">7d %</th>
                    <th
                      className="text-right py-4 px-4 text-sm font-medium text-white/70 cursor-pointer hover:text-white"
                      onClick={() => handleSort('market_cap')}
                    >
                      Market Cap
                    </th>
                    <th
                      className="text-right py-4 px-4 text-sm font-medium text-white/70 cursor-pointer hover:text-white"
                      onClick={() => handleSort('volume')}
                    >
                      Volume (24h)
                    </th>
                    {showPredictions && (
                      <th className="text-right py-4 px-4 text-sm font-medium text-white/70">
                        <div className="flex items-center justify-end gap-1">
                          <Target className="w-4 h-4" />
                          Bull Target
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedCryptos.map((crypto) => {
                    const isPositive24h = crypto.price_change_percentage_24h > 0;
                    const isPositive7d = crypto.price_change_percentage_7d > 0;
                    const isInWatchlist = watchlist.has(crypto.id);
                    const prediction = predictions.get(crypto.symbol.toLowerCase());

                    return (
                      <tr
                        key={crypto.id}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Watchlist Star */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => toggleWatchlist(crypto.id)}
                            className="text-white/40 hover:text-[#fbbf24] transition-colors"
                          >
                            {isInWatchlist ? (
                              <Star className="w-4 h-4 fill-[#fbbf24] text-[#fbbf24]" />
                            ) : (
                              <StarOff className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Rank */}
                        <td className="py-4 px-4 text-white/60 text-sm">
                          {crypto.market_cap_rank}
                        </td>

                        {/* Name & Symbol */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={crypto.image}
                              alt={crypto.name}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div>
                              <div className="font-medium text-white">{crypto.name}</div>
                              <div className="text-sm text-white/50">{crypto.symbol.toUpperCase()}</div>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-4 px-4 text-right font-medium text-white">
                          {formatPrice(crypto.current_price)}
                        </td>

                        {/* 24h Change */}
                        <td className="py-4 px-4 text-right">
                          <div className={`flex items-center justify-end gap-1 ${isPositive24h ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                            {isPositive24h ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="font-medium">
                              {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                            </span>
                          </div>
                        </td>

                        {/* 7d Change */}
                        <td className="py-4 px-4 text-right">
                          <span className={`font-medium ${isPositive7d ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                            {crypto.price_change_percentage_7d ? `${crypto.price_change_percentage_7d.toFixed(2)}%` : 'N/A'}
                          </span>
                        </td>

                        {/* Market Cap */}
                        <td className="py-4 px-4 text-right text-white">
                          {formatNumber(crypto.market_cap)}
                        </td>

                        {/* Volume */}
                        <td className="py-4 px-4 text-right text-white/70">
                          {formatNumber(crypto.total_volume)}
                        </td>

                        {/* Bull Target */}
                        {showPredictions && prediction && (
                          <td className="py-4 px-4 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[#10b981]">
                                  {formatPrice(prediction.bull_target)}
                                </span>
                                <span className="text-xs text-[#10b981]/70">
                                  +{(((prediction.bull_target - crypto.current_price) / crypto.current_price) * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-white/40">
                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                  prediction.sentiment === 'bullish' ? 'bg-[#10b981]/20 text-[#10b981]' :
                                  prediction.sentiment === 'bearish' ? 'bg-[#ef4444]/20 text-[#ef4444]' :
                                  'bg-white/10 text-white/60'
                                }`}>
                                  {prediction.sentiment}
                                </span>
                                <span>{prediction.confidence}% confidence</span>
                              </div>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Results Summary */}
            <div className="px-6 py-4 border-t border-white/10 text-sm text-white/60">
              Showing {sortedCryptos.length} of {cryptos.length} cryptocurrencies
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
