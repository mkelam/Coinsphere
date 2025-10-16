/**
 * Trending Cryptos Widget - LunarCrush Integration
 * Shows top trending cryptocurrencies by Galaxy Score
 * License: Individual tier ($24/month) - ~5K calls/day
 */

import { useState, useEffect } from 'react';
import { TrendingUp, Flame, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

interface TrendingCoin {
  symbol: string;
  name: string;
  galaxy_score: number;
  social_volume: number;
  sentiment: number;
  tweets_24h: number;
  trending_rank: number;
}

interface TrendingWidgetProps {
  limit?: number;
  refreshInterval?: number; // in milliseconds (default: 15 min)
}

export function TrendingWidget({ limit = 10, refreshInterval = 900000 }: TrendingWidgetProps) {
  const [trending, setTrending] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTrending = async () => {
    try {
      console.log('[TrendingWidget] Fetching trending coins from LunarCrush...');

      const response = await fetch(`http://localhost:3001/api/v1/social/trending/coins?limit=${limit}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch trending coins: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[TrendingWidget] Received ${data.trending?.length || 0} trending coins`);

      setTrending(data.trending || []);
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      console.error('[TrendingWidget] Error:', err);
      setError(err.message || 'Failed to load trending data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();

    // Auto-refresh every 15 minutes (or custom interval)
    const interval = setInterval(fetchTrending, refreshInterval);

    return () => clearInterval(interval);
  }, [limit, refreshInterval]);

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-[#f59e0b]" />
          <h3 className="text-lg font-semibold text-white">Trending Now</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#3b82f6]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-[#f59e0b]" />
          <h3 className="text-lg font-semibold text-white">Trending Now</h3>
        </div>
        <div className="flex items-start gap-3 p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#ef4444]">Unable to load trending data</p>
            <p className="text-xs text-[#ef4444]/70 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#f59e0b]" />
          <h3 className="text-lg font-semibold text-white">Trending Now</h3>
          <span className="text-xs bg-[#f59e0b]/20 text-[#f59e0b] px-2 py-0.5 rounded border border-[#f59e0b]/30">
            LunarCrush
          </span>
        </div>
        {lastUpdate && (
          <span className="text-xs text-white/40">
            {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Trending List */}
      <div className="space-y-3">
        {trending.map((coin) => {
          const galaxyScoreColor =
            coin.galaxy_score >= 75 ? 'text-[#10b981]' :
            coin.galaxy_score >= 60 ? 'text-[#3b82f6]' :
            coin.galaxy_score >= 40 ? 'text-white/70' :
            coin.galaxy_score >= 25 ? 'text-[#f59e0b]' :
            'text-[#ef4444]';

          const galaxyBarColor =
            coin.galaxy_score >= 75 ? 'bg-[#10b981]' :
            coin.galaxy_score >= 60 ? 'bg-[#3b82f6]' :
            coin.galaxy_score >= 40 ? 'bg-white/40' :
            coin.galaxy_score >= 25 ? 'bg-[#f59e0b]' :
            'bg-[#ef4444]';

          return (
            <div
              key={coin.symbol}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
            >
              {/* Rank & Name */}
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] text-xs font-bold">
                  {coin.trending_rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">{coin.symbol.toUpperCase()}</div>
                  <div className="text-xs text-white/50 truncate">{coin.name}</div>
                </div>
              </div>

              {/* Galaxy Score */}
              <div className="flex flex-col items-end gap-1 min-w-[80px]">
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${galaxyScoreColor}`}>
                    {Math.round(coin.galaxy_score)}
                  </span>
                  <TrendingUp className="w-4 h-4 text-[#10b981]" />
                </div>
                <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full ${galaxyBarColor}`}
                    style={{ width: `${coin.galaxy_score}%` }}
                  />
                </div>
                <span className="text-xs text-white/40">Galaxy Score</span>
              </div>

              {/* Social Volume */}
              <div className="hidden sm:flex flex-col items-end ml-4 min-w-[60px]">
                <span className="text-sm font-medium text-white/70">
                  {coin.social_volume >= 1000000
                    ? `${(coin.social_volume / 1000000).toFixed(1)}M`
                    : coin.social_volume >= 1000
                    ? `${(coin.social_volume / 1000).toFixed(1)}K`
                    : coin.social_volume}
                </span>
                <span className="text-xs text-white/40">mentions</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <a
          href="https://lunarcrush.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-xs text-white/50 hover:text-white/70 transition-colors"
        >
          <span>Powered by LunarCrush</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
