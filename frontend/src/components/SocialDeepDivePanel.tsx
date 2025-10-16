/**
 * Social Deep-Dive Panel - LunarCrush Integration
 * Shows detailed social metrics for a single cryptocurrency
 * License: Individual tier ($24/month) - ~5K calls/day
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, MessageCircle, ExternalLink, Loader2, AlertCircle, BarChart3, Star } from 'lucide-react';

interface SocialMetrics {
  galaxyScore: number;
  altRank: number;
  socialDominance: number;
  socialVolume: number;
  socialVolume24hChange: number;
  socialContributors: number;
  tweets24h: number;
  tweets24hChange: number;
  redditPosts24h: number;
  redditPosts24hChange: number;
  sentiment: number; // -1 to 1
  sentimentAbsolute: number; // 0 to 100
  urlShares: number;
  categories: string[];
}

interface SocialDeepDivePanelProps {
  symbol: string;
  onClose?: () => void;
}

export function SocialDeepDivePanel({ symbol, onClose }: SocialDeepDivePanelProps) {
  const [metrics, setMetrics] = useState<SocialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`[SocialDeepDive] Fetching metrics for ${symbol}...`);

        const response = await fetch(`http://localhost:3001/api/v1/social/${symbol}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`No social data available for ${symbol}`);
          }
          throw new Error(`Failed to fetch social data: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[SocialDeepDive] Received metrics for ${symbol}:`, data);

        setMetrics(data.metrics);
      } catch (err: any) {
        console.error(`[SocialDeepDive] Error fetching ${symbol}:`, err);
        setError(err.message || 'Failed to load social data');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [symbol]);

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Social Insights: {symbol.toUpperCase()}</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#3b82f6]" />
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Social Insights: {symbol.toUpperCase()}</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-start gap-3 p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#ef4444]">Unable to load social data</p>
            <p className="text-xs text-[#ef4444]/70 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate sentiment interpretation
  const sentimentLabel =
    metrics.sentiment >= 0.5 ? 'Very Bullish' :
    metrics.sentiment >= 0.2 ? 'Bullish' :
    metrics.sentiment >= -0.2 ? 'Neutral' :
    metrics.sentiment >= -0.5 ? 'Bearish' :
    'Very Bearish';

  const sentimentColor =
    metrics.sentiment >= 0.5 ? 'text-[#10b981]' :
    metrics.sentiment >= 0.2 ? 'text-[#3b82f6]' :
    metrics.sentiment >= -0.2 ? 'text-white/70' :
    metrics.sentiment >= -0.5 ? 'text-[#f59e0b]' :
    'text-[#ef4444]';

  const galaxyScoreColor =
    metrics.galaxyScore >= 75 ? 'text-[#10b981]' :
    metrics.galaxyScore >= 60 ? 'text-[#3b82f6]' :
    metrics.galaxyScore >= 40 ? 'text-white/70' :
    metrics.galaxyScore >= 25 ? 'text-[#f59e0b]' :
    'text-[#ef4444]';

  const galaxyBarColor =
    metrics.galaxyScore >= 75 ? 'bg-[#10b981]' :
    metrics.galaxyScore >= 60 ? 'bg-[#3b82f6]' :
    metrics.galaxyScore >= 40 ? 'bg-white/40' :
    metrics.galaxyScore >= 25 ? 'bg-[#f59e0b]' :
    'bg-[#ef4444]';

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-white">Social Insights: {symbol.toUpperCase()}</h3>
          <span className="text-xs bg-[#3b82f6]/20 text-[#3b82f6] px-2 py-0.5 rounded border border-[#3b82f6]/30">
            LunarCrush
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Galaxy Score - Hero Metric */}
      <div className="mb-6 p-6 bg-gradient-to-br from-[#3b82f6]/20 to-[#10b981]/20 border border-white/10 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-[#fbbf24]" />
              <span className="text-sm font-medium text-white/70">Galaxy Score</span>
            </div>
            <div className={`text-5xl font-bold ${galaxyScoreColor}`}>
              {Math.round(metrics.galaxyScore)}
            </div>
            <div className="mt-3 w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full ${galaxyBarColor} transition-all duration-500`}
                style={{ width: `${metrics.galaxyScore}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/50 mb-1">Alt Rank</div>
            <div className="text-3xl font-bold text-white">#{metrics.altRank}</div>
          </div>
        </div>
      </div>

      {/* Grid: Social Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Social Volume */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#3b82f6]" />
              <span className="text-sm text-white/70">Social Volume</span>
            </div>
            <div className={`flex items-center gap-1 text-xs ${
              metrics.socialVolume24hChange >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
            }`}>
              {metrics.socialVolume24hChange >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(metrics.socialVolume24hChange).toFixed(1)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.socialVolume >= 1000000
              ? `${(metrics.socialVolume / 1000000).toFixed(2)}M`
              : metrics.socialVolume >= 1000
              ? `${(metrics.socialVolume / 1000).toFixed(1)}K`
              : metrics.socialVolume}
          </div>
          <div className="text-xs text-white/40 mt-1">Total mentions</div>
        </div>

        {/* Sentiment */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-[#10b981]" />
            <span className="text-sm text-white/70">Sentiment</span>
          </div>
          <div className={`text-2xl font-bold ${sentimentColor}`}>
            {sentimentLabel}
          </div>
          <div className="text-xs text-white/40 mt-1">
            Score: {metrics.sentimentAbsolute}/100
          </div>
        </div>

        {/* Twitter Activity */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#1DA1F2]" />
              <span className="text-sm text-white/70">Twitter (24h)</span>
            </div>
            <div className={`flex items-center gap-1 text-xs ${
              metrics.tweets24hChange >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
            }`}>
              {metrics.tweets24hChange >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(metrics.tweets24hChange).toFixed(1)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.tweets24h >= 1000
              ? `${(metrics.tweets24h / 1000).toFixed(1)}K`
              : metrics.tweets24h}
          </div>
          <div className="text-xs text-white/40 mt-1">Tweets</div>
        </div>

        {/* Reddit Activity */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#FF4500]" />
              <span className="text-sm text-white/70">Reddit (24h)</span>
            </div>
            <div className={`flex items-center gap-1 text-xs ${
              metrics.redditPosts24hChange >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
            }`}>
              {metrics.redditPosts24hChange >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(metrics.redditPosts24hChange).toFixed(1)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.redditPosts24h}
          </div>
          <div className="text-xs text-white/40 mt-1">Posts</div>
        </div>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center">
          <div className="text-xl font-bold text-white">{metrics.socialDominance.toFixed(2)}%</div>
          <div className="text-xs text-white/40 mt-1">Social Dominance</div>
        </div>
        <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center">
          <div className="text-xl font-bold text-white">
            {metrics.socialContributors >= 1000
              ? `${(metrics.socialContributors / 1000).toFixed(1)}K`
              : metrics.socialContributors}
          </div>
          <div className="text-xs text-white/40 mt-1">Contributors</div>
        </div>
        <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center">
          <div className="text-xl font-bold text-white">
            {metrics.urlShares >= 1000
              ? `${(metrics.urlShares / 1000).toFixed(1)}K`
              : metrics.urlShares}
          </div>
          <div className="text-xs text-white/40 mt-1">URL Shares</div>
        </div>
      </div>

      {/* Categories */}
      {metrics.categories && metrics.categories.length > 0 && (
        <div className="mb-6">
          <div className="text-sm text-white/70 mb-2">Categories</div>
          <div className="flex flex-wrap gap-2">
            {metrics.categories.map((category, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-[#3b82f6]/20 text-[#3b82f6] text-xs rounded-full border border-[#3b82f6]/30"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-white/10">
        <a
          href={`https://lunarcrush.com/coins/${symbol.toLowerCase()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors"
        >
          <span>View full analysis on LunarCrush</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
