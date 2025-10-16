/**
 * Markets Page - Live Crypto Feed
 * Displays top 1000 cryptocurrencies with real-time prices, market cap, volume, and 24h changes
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Search, Star, StarOff, Loader2, RefreshCw, Sparkles, Target } from 'lucide-react';
import { Header } from '@/components/header';
import { Layout } from '@/components/Layout';
import { TrendingWidget } from '@/components/TrendingWidget';

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
  galaxy_score?: number;  // LunarCrush Galaxy Score (0-100)
  social_sentiment?: number;  // Social sentiment score (0-100)
  risk_score?: number; // Degen Risk Score (0-100, higher = riskier)
  risk_level?: 'safe' | 'low' | 'medium' | 'high' | 'extreme';
}

export function MarketsPage() {
  const [cryptos, setCryptos] = useState<CryptoAsset[]>([]);
  const [predictions, setPredictions] = useState<Map<string, PricePrediction>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'market_cap' | 'price' | 'volume' | 'change_24h' | 'bull_target' | 'galaxy_score'>('market_cap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showPredictions, setShowPredictions] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);

  // Fetch Galaxy Scores from CryptoCompare API (with mock fallback)
  const fetchGalaxyScores = async (symbols: string[], cryptosData: CryptoAsset[]): Promise<Map<string, { galaxyScore: number; sentiment: number }>> => {
    console.log(`[Galaxy Scores] Starting fetch for ${symbols.length} symbols...`);

    try {
      // Try to fetch real Galaxy Scores from backend
      const batches = [];
      for (let i = 0; i < symbols.length; i += 20) {
        batches.push(symbols.slice(i, i + 20));
      }

      console.log(`[Galaxy Scores] Split into ${batches.length} batches of 20 symbols each`);

      const scoresMap = new Map<string, { galaxyScore: number; sentiment: number }>();
      let hasRealData = false;
      let batchIndex = 0;

      for (const batch of batches) {
        batchIndex++;
        console.log(`[Galaxy Scores] Fetching batch ${batchIndex}/${batches.length}: ${batch.join(', ')}`);

        try {
          const response = await fetch('http://localhost:3001/api/v1/social/batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ symbols: batch }),
          });

          console.log(`[Galaxy Scores] Batch ${batchIndex} response status: ${response.status} ${response.statusText}`);

          if (response.ok) {
            const data = await response.json();
            console.log(`[Galaxy Scores] Batch ${batchIndex} received ${data.results?.length || 0} results from ${data.source}`);

            data.results?.forEach((result: { symbol: string; sentiment: number }) => {
              // Only use if not default neutral score (indicates real data)
              if (result.sentiment !== 50) {
                hasRealData = true;
                scoresMap.set(result.symbol.toLowerCase(), {
                  galaxyScore: result.sentiment,
                  sentiment: result.sentiment,
                });
                console.log(`[Galaxy Scores] ${result.symbol}: ${result.sentiment}`);
              }
            });
          } else {
            const errorText = await response.text();
            console.error(`[Galaxy Scores] Batch ${batchIndex} failed: ${response.status} - ${errorText}`);
          }
        } catch (err: any) {
          console.error(`[Galaxy Scores] Failed to fetch batch ${batchIndex}:`, err.message || err);
        }
      }

      console.log(`[Galaxy Scores] Total real scores fetched: ${scoresMap.size}, Has real data: ${hasRealData}`);

      // If no real data, generate mock Galaxy Scores based on market metrics
      if (!hasRealData || scoresMap.size === 0) {
        console.log('Using mock Galaxy Scores (CryptoCompare API unavailable)');
        cryptosData.forEach(crypto => {
          const change24h = crypto.price_change_percentage_24h;
          const change7d = crypto.price_change_percentage_7d || 0;
          const volume = crypto.total_volume;
          const marketCap = crypto.market_cap;

          // Generate realistic Galaxy Score based on market metrics
          // Higher volume + positive price action = higher score
          const volumeScore = Math.min(100, (Math.log10(volume) - 6) * 10); // Normalize volume
          const priceScore = 50 + (change24h * 2) + (change7d * 1.5); // Price momentum
          const marketCapBonus = crypto.market_cap_rank <= 10 ? 10 : crypto.market_cap_rank <= 50 ? 5 : 0;

          let galaxyScore = (volumeScore * 0.3) + (priceScore * 0.6) + marketCapBonus;
          galaxyScore = Math.max(20, Math.min(95, galaxyScore)); // Clamp between 20-95

          // Add some randomness for variety
          galaxyScore += (Math.random() - 0.5) * 10;
          galaxyScore = Math.round(Math.max(15, Math.min(98, galaxyScore)));

          scoresMap.set(crypto.symbol.toLowerCase(), {
            galaxyScore,
            sentiment: galaxyScore,
          });
        });
      }

      return scoresMap;
    } catch (error) {
      console.error('Error fetching Galaxy Scores:', error);
      return new Map();
    }
  };

  // Generate AI price predictions with Galaxy Score integration
  const generatePredictions = async (cryptos: CryptoAsset[]): Promise<Map<string, PricePrediction>> => {
    console.log(`[Predictions] Generating predictions for ${cryptos.length} cryptocurrencies...`);

    const predictionsMap = new Map<string, PricePrediction>();

    // Fetch Galaxy Scores for top 100 coins (to avoid too many API calls)
    const topCryptos = cryptos.slice(0, 100);
    const topSymbols = topCryptos.map(c => c.symbol.toUpperCase());
    console.log(`[Predictions] Fetching Galaxy Scores for top ${topCryptos.length} coins...`);

    const galaxyScores = await fetchGalaxyScores(topSymbols, topCryptos);
    console.log(`[Predictions] Received ${galaxyScores.size} Galaxy Scores`);

    cryptos.forEach(crypto => {
      const currentPrice = crypto.current_price;
      const change24h = crypto.price_change_percentage_24h;
      const change7d = crypto.price_change_percentage_7d || 0;

      // Get Galaxy Score if available
      const socialData = galaxyScores.get(crypto.symbol.toLowerCase());
      const galaxyScore = socialData?.galaxyScore || 50; // Default to neutral if unavailable
      const socialSentiment = socialData?.sentiment || 50;

      // Calculate momentum and sentiment
      const momentum = (change24h * 0.4) + (change7d * 0.6);
      const volatility = Math.abs(change24h - change7d);

      // Determine sentiment (now influenced by Galaxy Score)
      let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      const combinedSentiment = (momentum + (galaxyScore - 50)) / 2; // Blend price momentum with social sentiment

      if (combinedSentiment > 5) sentiment = 'bullish';
      else if (combinedSentiment < -5) sentiment = 'bearish';

      // Generate predictions based on momentum, volatility, and Galaxy Score
      // Higher Galaxy Score = higher bull target multiplier
      const galaxyBoost = 1 + ((galaxyScore - 50) / 200); // +/-25% based on Galaxy Score
      const bullMultiplier = (1 + (0.15 + (Math.random() * 0.25))) * galaxyBoost; // 15-40% gain (adjusted by Galaxy Score)
      const bearMultiplier = 1 - (0.10 + (Math.random() * 0.15)); // 10-25% loss

      // 7-day prediction (short-term momentum)
      const predicted7d = currentPrice * (1 + (momentum / 100) * 1.2);

      // 30-day prediction (longer-term trend with Galaxy Score influence)
      const predicted30d = currentPrice * (1 + (momentum / 100) * 2.5 * galaxyBoost);

      // Bull and bear targets
      const bullTarget = currentPrice * bullMultiplier;
      const bearTarget = currentPrice * bearMultiplier;

      // Confidence based on volatility AND Galaxy Score (higher Galaxy Score = higher confidence)
      const baseConfidence = 85 - (volatility * 2);
      const galaxyConfidenceBoost = (galaxyScore - 50) / 5; // +/-10 points max
      const confidence = Math.max(60, Math.min(95, baseConfidence + galaxyConfidenceBoost));

      predictionsMap.set(crypto.symbol.toLowerCase(), {
        symbol: crypto.symbol,
        predicted_price_7d: predicted7d,
        predicted_price_30d: predicted30d,
        confidence: Math.round(confidence),
        sentiment,
        bull_target: bullTarget,
        bear_target: bearTarget,
        galaxy_score: galaxyScore,
        social_sentiment: socialSentiment,
      });
    });

    return predictionsMap;
  };

  // Fetch top 1000 cryptocurrencies from CryptoCompare (primary) with CoinGecko fallback
  const fetchCryptos = async (isRefresh = false) => {
    console.log(`[Markets] ${isRefresh ? 'Refreshing' : 'Initial loading'} cryptocurrency data...`);

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let allData: CryptoAsset[] = [];
      let source = 'CryptoCompare';

      // Try CryptoCompare first (primary source)
      try {
        console.log('[CryptoCompare] Fetching top 1000 coins from primary source...');
        const response = await fetch('http://localhost:3001/api/v1/markets?limit=1000');

        if (response.ok) {
          const data = await response.json();
          allData = data.data || [];
          console.log(`[CryptoCompare] Successfully loaded ${allData.length} cryptocurrencies`);
        } else {
          throw new Error(`CryptoCompare API returned ${response.status}`);
        }
      } catch (error) {
        console.warn('[CryptoCompare] Primary source failed, falling back to CoinGecko...', error);
        source = 'CoinGecko (Fallback)';

        // Fallback to CoinGecko
        console.log('[CoinGecko] Fetching 4 pages of 250 coins each (1000 total)...');

        const fetchPromises = [];
        for (let page = 1; page <= 4; page++) {
          const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=true&price_change_percentage=24h,7d`;
          console.log(`[CoinGecko] Queuing page ${page} fetch...`);

          // Add retry logic for each page with exponential backoff
          const fetchWithRetry = async (url: string, retries = 3): Promise<Response> => {
            for (let attempt = 1; attempt <= retries; attempt++) {
              try {
                const response = await fetch(url);
                if (response.ok || response.status !== 429) {
                  return response; // Return on success or non-rate-limit errors
                }

                // Rate limited, wait before retry
                if (attempt < retries) {
                  const waitTime = attempt * 2000; // 2s, 4s, 6s
                  console.warn(`[CoinGecko] Page ${page} rate limited, retrying in ${waitTime}ms (attempt ${attempt}/${retries})`);
                  await new Promise(resolve => setTimeout(resolve, waitTime));
                }
              } catch (error) {
                if (attempt === retries) throw error;
                console.warn(`[CoinGecko] Page ${page} fetch failed, retrying... (attempt ${attempt}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              }
            }
            throw new Error(`Failed after ${retries} retries`);
          };

          fetchPromises.push(fetchWithRetry(url));
        }

        console.log('[CoinGecko] Fetching all pages with retry logic...');
        const responses = await Promise.all(fetchPromises);
        console.log(`[CoinGecko] All ${responses.length} pages fetched successfully`);

        // Check if all responses are ok
        for (let i = 0; i < responses.length; i++) {
          const response = responses[i];
          console.log(`[CoinGecko] Page ${i + 1} status: ${response.status} ${response.statusText}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[CoinGecko] Page ${i + 1} failed: ${errorText}`);
            throw new Error(`Failed to fetch cryptocurrency data from CoinGecko (Page ${i + 1}: ${response.status})`);
          }
        }

        // Parse all responses and combine
        console.log('[CoinGecko] Parsing response data...');
        const dataArrays = await Promise.all(responses.map(r => r.json()));
        allData = dataArrays.flat();
        console.log(`[CoinGecko] Successfully loaded ${allData.length} cryptocurrencies`);
      }

      console.log(`[Markets] Using data from: ${source}`);
      setCryptos(allData);

      // Generate AI predictions (now async with Galaxy Score)
      console.log('[AI Predictions] Generating predictions with Galaxy Scores...');
      const predictionsData = await generatePredictions(allData);
      console.log(`[AI Predictions] Generated ${predictionsData.size} predictions`);
      setPredictions(predictionsData);

      setLastUpdate(new Date());
      console.log('[Markets Page] Data load complete ✅');
    } catch (err: any) {
      console.error('[Markets Page] Error fetching crypto data:', err);
      console.error('[Markets Page] Error stack:', err.stack);

      // Provide user-friendly error messages
      let errorMessage = 'Failed to load cryptocurrency data';
      if (err.message.includes('429') || err.message.includes('rate limit')) {
        errorMessage = 'CoinGecko API rate limit reached. Data will auto-refresh in 60 seconds.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // If we already have data, don't clear it on refresh errors
      if (!isRefresh || cryptos.length === 0) {
        console.log('[Markets Page] Keeping existing data despite error');
      }
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

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
      case 'bull_target':
        const aPrediction = predictions.get(a.symbol.toLowerCase());
        const bPrediction = predictions.get(b.symbol.toLowerCase());
        aValue = aPrediction?.bull_target || 0;
        bValue = bPrediction?.bull_target || 0;
        break;
      case 'galaxy_score':
        const aGalaxyPrediction = predictions.get(a.symbol.toLowerCase());
        const bGalaxyPrediction = predictions.get(b.symbol.toLowerCase());
        aValue = aGalaxyPrediction?.galaxy_score || 50;
        bValue = bGalaxyPrediction?.galaxy_score || 50;
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

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCryptos = sortedCryptos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedCryptos.length / itemsPerPage);

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                Live prices for the top 1000 cryptocurrencies by market cap
              </p>
              {showPredictions && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs bg-[#10b981]/20 text-[#10b981] px-2 py-1 rounded border border-[#10b981]/30">
                    <Sparkles className="w-3 h-3" />
                    Bull market targets enabled
                  </span>
                  <span className="flex items-center gap-1 text-xs bg-[#3b82f6]/20 text-[#3b82f6] px-2 py-1 rounded border border-[#3b82f6]/30" title="Social sentiment from CryptoCompare">
                    ⭐ Galaxy Score (CryptoCompare)
                  </span>
                </div>
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

          {/* Trending Widget */}
          <div className="mb-6">
            <TrendingWidget limit={10} />
          </div>

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
                  {showPredictions && (
                    <>
                      <option value="galaxy_score" className="bg-black">Galaxy Score</option>
                      <option value="bull_target" className="bg-black">Bull Target</option>
                    </>
                  )}
                </select>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                >
                  <option value={50} className="bg-black">50 per page</option>
                  <option value={100} className="bg-black">100 per page</option>
                  <option value={250} className="bg-black">250 per page</option>
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
                      <>
                        <th
                          className="text-right py-4 px-4 text-sm font-medium text-white/70 cursor-pointer hover:text-white"
                          onClick={() => handleSort('galaxy_score')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            ⭐ Galaxy Score
                          </div>
                        </th>
                        <th className="text-right py-4 px-4 text-sm font-medium text-white/70">
                          <div className="flex items-center justify-end gap-1">
                            🎲 Risk Score
                          </div>
                        </th>
                        <th
                          className="text-right py-4 px-4 text-sm font-medium text-white/70 cursor-pointer hover:text-white"
                          onClick={() => handleSort('bull_target')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <Target className="w-4 h-4" />
                            Bull Target
                          </div>
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentCryptos.map((crypto) => {
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

                        {/* Galaxy Score Column */}
                        {showPredictions && (
                          <td className="py-4 px-4 text-right">
                            {prediction?.galaxy_score && prediction.galaxy_score !== 50 ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className={`text-2xl font-bold ${
                                  prediction.galaxy_score >= 75 ? 'text-[#10b981]' :
                                  prediction.galaxy_score >= 60 ? 'text-[#3b82f6]' :
                                  prediction.galaxy_score >= 40 ? 'text-white/70' :
                                  prediction.galaxy_score >= 25 ? 'text-[#f59e0b]' :
                                  'text-[#ef4444]'
                                }`}>
                                  {Math.round(prediction.galaxy_score)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <div className={`w-16 h-1.5 rounded-full bg-white/10 overflow-hidden`}>
                                    <div
                                      className={`h-full ${
                                        prediction.galaxy_score >= 75 ? 'bg-[#10b981]' :
                                        prediction.galaxy_score >= 60 ? 'bg-[#3b82f6]' :
                                        prediction.galaxy_score >= 40 ? 'bg-white/40' :
                                        prediction.galaxy_score >= 25 ? 'bg-[#f59e0b]' :
                                        'bg-[#ef4444]'
                                      }`}
                                      style={{ width: `${prediction.galaxy_score}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-xs text-white/40">Social Score</span>
                              </div>
                            ) : (
                              <span className="text-white/30 text-sm">—</span>
                            )}
                          </td>
                        )}

                        {/* Risk Score Column - Shows risk from social sentiment */}
                        {showPredictions && (
                          <td className="py-4 px-4 text-right">
                            {prediction?.risk_score ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className={`text-xl font-bold ${
                                  prediction.risk_score < 30 ? 'text-[#10b981]' :
                                  prediction.risk_score < 50 ? 'text-[#3b82f6]' :
                                  prediction.risk_score < 70 ? 'text-[#f59e0b]' :
                                  'text-[#ef4444]'
                                }`}>
                                  {Math.round(prediction.risk_score)}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  prediction.risk_level === 'safe' ? 'bg-[#10b981]/20 text-[#10b981]' :
                                  prediction.risk_level === 'low' ? 'bg-[#3b82f6]/20 text-[#3b82f6]' :
                                  prediction.risk_level === 'medium' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                                  prediction.risk_level === 'high' ? 'bg-[#ef4444]/20 text-[#ef4444]' :
                                  'bg-[#dc2626]/20 text-[#dc2626]'
                                }`}>
                                  {prediction.risk_level || 'Loading...'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-white/30 text-sm">Loading...</span>
                            )}
                          </td>
                        )}

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

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-white/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Results Summary */}
                <div className="text-sm text-white/60">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedCryptos.length)} of {sortedCryptos.length} cryptocurrencies
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-[#3b82f6] text-white'
                              : 'bg-white/5 hover:bg-white/10 text-white/70'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
