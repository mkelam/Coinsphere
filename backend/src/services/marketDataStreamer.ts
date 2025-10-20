/**
 * Market Data Streamer
 * Real-time market data streaming service for live trading
 * Uses WebSocket connections to exchanges for live price feeds
 */

import EventEmitter from 'events';
import { exchangeManager } from './exchange/ExchangeManager';
import { ExchangeName, Ticker, OHLCV, OrderBook } from './exchange/types';

export interface MarketDataUpdate {
  symbol: string;
  exchange: ExchangeName;
  type: 'ticker' | 'ohlcv' | 'orderbook';
  data: Ticker | OHLCV | OrderBook;
  timestamp: number;
}

export interface StreamSubscription {
  id: string;
  symbol: string;
  exchange: ExchangeName;
  dataType: 'ticker' | 'ohlcv' | 'orderbook';
  interval?: number; // polling interval in ms
}

/**
 * Market Data Streamer
 * Manages real-time market data subscriptions and polling
 */
export class MarketDataStreamer extends EventEmitter {
  private subscriptions: Map<string, StreamSubscription> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor() {
    super();
    this.setMaxListeners(100); // Allow many listeners for different strategies
  }

  /**
   * Start the market data streamer
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️  Market data streamer already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Market data streamer started');
    this.emit('started');
  }

  /**
   * Stop the market data streamer
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️  Market data streamer not running');
      return;
    }

    // Clear all intervals
    for (const [id, interval] of this.intervals.entries()) {
      clearInterval(interval);
      this.intervals.delete(id);
    }

    // Clear subscriptions
    this.subscriptions.clear();

    this.isRunning = false;
    console.log('🛑 Market data streamer stopped');
    this.emit('stopped');
  }

  /**
   * Subscribe to ticker updates for a symbol
   */
  subscribeTicker(
    symbol: string,
    exchange: ExchangeName = 'binance',
    intervalMs: number = 1000
  ): string {
    const id = this.generateSubscriptionId('ticker', symbol, exchange);

    if (this.subscriptions.has(id)) {
      console.log(`⚠️  Already subscribed to ticker: ${symbol} on ${exchange}`);
      return id;
    }

    const subscription: StreamSubscription = {
      id,
      symbol,
      exchange,
      dataType: 'ticker',
      interval: intervalMs,
    };

    this.subscriptions.set(id, subscription);

    // Start polling for ticker updates
    const interval = setInterval(async () => {
      try {
        const ticker = await exchangeManager.fetchTicker(symbol, exchange);

        const update: MarketDataUpdate = {
          symbol,
          exchange,
          type: 'ticker',
          data: ticker,
          timestamp: Date.now(),
        };

        this.emit('ticker', update);
        this.emit(`ticker:${symbol}`, update);
        this.emit(`ticker:${symbol}:${exchange}`, update);
      } catch (error: any) {
        console.error(`Failed to fetch ticker for ${symbol}:`, error.message);
        this.emit('error', { subscriptionId: id, error });
      }
    }, intervalMs);

    this.intervals.set(id, interval);

    console.log(`✅ Subscribed to ticker: ${symbol} on ${exchange} (${intervalMs}ms)`);
    return id;
  }

  /**
   * Subscribe to OHLCV updates for a symbol
   */
  subscribeOHLCV(
    symbol: string,
    timeframe: string = '1m',
    exchange: ExchangeName = 'binance',
    intervalMs: number = 60000
  ): string {
    const id = this.generateSubscriptionId('ohlcv', symbol, exchange, timeframe);

    if (this.subscriptions.has(id)) {
      console.log(`⚠️  Already subscribed to OHLCV: ${symbol} ${timeframe} on ${exchange}`);
      return id;
    }

    const subscription: StreamSubscription = {
      id,
      symbol,
      exchange,
      dataType: 'ohlcv',
      interval: intervalMs,
    };

    this.subscriptions.set(id, subscription);

    // Start polling for OHLCV updates
    const interval = setInterval(async () => {
      try {
        const ohlcv = await exchangeManager.fetchOHLCV(
          symbol,
          timeframe,
          undefined,
          1,
          exchange
        );

        if (ohlcv.length > 0) {
          const latestCandle = ohlcv[0];

          const update: MarketDataUpdate = {
            symbol,
            exchange,
            type: 'ohlcv',
            data: latestCandle,
            timestamp: Date.now(),
          };

          this.emit('ohlcv', update);
          this.emit(`ohlcv:${symbol}`, update);
          this.emit(`ohlcv:${symbol}:${exchange}`, update);
        }
      } catch (error: any) {
        console.error(`Failed to fetch OHLCV for ${symbol}:`, error.message);
        this.emit('error', { subscriptionId: id, error });
      }
    }, intervalMs);

    this.intervals.set(id, interval);

    console.log(`✅ Subscribed to OHLCV: ${symbol} ${timeframe} on ${exchange} (${intervalMs}ms)`);
    return id;
  }

  /**
   * Subscribe to order book updates for a symbol
   */
  subscribeOrderBook(
    symbol: string,
    exchange: ExchangeName = 'binance',
    limit: number = 20,
    intervalMs: number = 1000
  ): string {
    const id = this.generateSubscriptionId('orderbook', symbol, exchange);

    if (this.subscriptions.has(id)) {
      console.log(`⚠️  Already subscribed to order book: ${symbol} on ${exchange}`);
      return id;
    }

    const subscription: StreamSubscription = {
      id,
      symbol,
      exchange,
      dataType: 'orderbook',
      interval: intervalMs,
    };

    this.subscriptions.set(id, subscription);

    // Start polling for order book updates
    const interval = setInterval(async () => {
      try {
        const orderbook = await exchangeManager.fetchOrderBook(symbol, limit, exchange);

        const update: MarketDataUpdate = {
          symbol,
          exchange,
          type: 'orderbook',
          data: orderbook,
          timestamp: Date.now(),
        };

        this.emit('orderbook', update);
        this.emit(`orderbook:${symbol}`, update);
        this.emit(`orderbook:${symbol}:${exchange}`, update);
      } catch (error: any) {
        console.error(`Failed to fetch order book for ${symbol}:`, error.message);
        this.emit('error', { subscriptionId: id, error });
      }
    }, intervalMs);

    this.intervals.set(id, interval);

    console.log(`✅ Subscribed to order book: ${symbol} on ${exchange} (${intervalMs}ms)`);
    return id;
  }

  /**
   * Unsubscribe from a data stream
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription) {
      console.log(`⚠️  Subscription not found: ${subscriptionId}`);
      return false;
    }

    // Clear the interval
    const interval = this.intervals.get(subscriptionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(subscriptionId);
    }

    // Remove subscription
    this.subscriptions.delete(subscriptionId);

    console.log(`✅ Unsubscribed: ${subscription.symbol} ${subscription.dataType} on ${subscription.exchange}`);
    return true;
  }

  /**
   * Unsubscribe from all streams for a symbol
   */
  unsubscribeSymbol(symbol: string, exchange?: ExchangeName): number {
    let count = 0;

    for (const [id, subscription] of this.subscriptions.entries()) {
      if (subscription.symbol === symbol) {
        if (!exchange || subscription.exchange === exchange) {
          this.unsubscribe(id);
          count++;
        }
      }
    }

    console.log(`✅ Unsubscribed ${count} streams for ${symbol}`);
    return count;
  }

  /**
   * Get all active subscriptions
   */
  getSubscriptions(): StreamSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get subscription by ID
   */
  getSubscription(id: string): StreamSubscription | undefined {
    return this.subscriptions.get(id);
  }

  /**
   * Check if streamer is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get number of active subscriptions
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(
    type: string,
    symbol: string,
    exchange: string,
    timeframe?: string
  ): string {
    const parts = [type, symbol, exchange];
    if (timeframe) parts.push(timeframe);
    return parts.join(':');
  }
}

// Singleton instance
export const marketDataStreamer = new MarketDataStreamer();

// Event types for type safety
export interface MarketDataStreamerEvents {
  started: () => void;
  stopped: () => void;
  ticker: (update: MarketDataUpdate) => void;
  ohlcv: (update: MarketDataUpdate) => void;
  orderbook: (update: MarketDataUpdate) => void;
  error: (error: { subscriptionId: string; error: Error }) => void;
}

// Type-safe event emitter
export interface TypedMarketDataStreamer {
  on<K extends keyof MarketDataStreamerEvents>(
    event: K,
    listener: MarketDataStreamerEvents[K]
  ): this;
  emit<K extends keyof MarketDataStreamerEvents>(
    event: K,
    ...args: Parameters<MarketDataStreamerEvents[K]>
  ): boolean;
}
