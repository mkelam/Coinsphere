/**
 * Binance Exchange Connector
 * Implements trading operations for Binance using CCXT
 */

import ccxt from 'ccxt';
import {
  ExchangeConfig,
  OrderRequest,
  Order,
  Balance,
  AccountInfo,
  Ticker,
  OHLCV,
  OrderBook,
  MarketInfo,
  ExchangeStatus,
  Trade,
} from './types';

export class BinanceConnector {
  private exchange: ccxt.binance;
  private config: ExchangeConfig;
  private connected: boolean = false;
  private authenticated: boolean = false;

  constructor(config: ExchangeConfig) {
    this.config = config;

    // Initialize CCXT Binance instance
    this.exchange = new ccxt.binance({
      apiKey: config.credentials.apiKey,
      secret: config.credentials.secret,
      enableRateLimit: config.enableRateLimit ?? true,
      rateLimit: config.rateLimit ?? 1000,
      timeout: config.timeout ?? 30000,
      options: {
        defaultType: 'spot', // 'spot', 'future', 'margin'
        adjustForTimeDifference: true, // Sync time with exchange
      },
    });

    // Use testnet if specified
    if (config.testnet) {
      this.exchange.set_sandbox_mode(true);
    }
  }

  /**
   * Test connection and authentication
   */
  async connect(): Promise<boolean> {
    try {
      // Load markets
      await this.exchange.loadMarkets();
      this.connected = true;

      // Test authentication by fetching balance
      if (this.config.credentials.apiKey && this.config.credentials.secret) {
        await this.exchange.fetchBalance();
        this.authenticated = true;
      }

      console.log(`✅ Connected to Binance ${this.config.testnet ? '(Testnet)' : ''}`);
      return true;
    } catch (error: any) {
      console.error('❌ Binance connection failed:', error.message);
      this.connected = false;
      this.authenticated = false;
      throw error;
    }
  }

  /**
   * Get exchange status
   */
  async getStatus(): Promise<ExchangeStatus> {
    const now = Date.now();

    try {
      // Ping exchange
      await this.exchange.fetchTime();

      return {
        exchange: 'binance',
        connected: this.connected,
        authenticated: this.authenticated,
        rateLimit: {
          remaining: this.exchange.rateLimit,
          limit: 1200, // Binance default
          reset: now + 60000, // Resets every minute
        },
        lastPing: now,
      };
    } catch (error: any) {
      return {
        exchange: 'binance',
        connected: false,
        authenticated: false,
        rateLimit: {
          remaining: 0,
          limit: 1200,
          reset: now + 60000,
        },
        lastPing: now,
        error: {
          exchange: 'binance',
          code: error.code,
          message: error.message,
          timestamp: now,
        },
      };
    }
  }

  /**
   * Fetch current ticker for a symbol
   */
  async fetchTicker(symbol: string): Promise<Ticker> {
    const ticker = await this.exchange.fetchTicker(symbol);

    return {
      symbol,
      bid: ticker.bid || 0,
      ask: ticker.ask || 0,
      last: ticker.last || 0,
      high: ticker.high || 0,
      low: ticker.low || 0,
      volume: ticker.baseVolume || 0,
      timestamp: ticker.timestamp || Date.now(),
      datetime: ticker.datetime || new Date().toISOString(),
    };
  }

  /**
   * Fetch OHLCV candles
   */
  async fetchOHLCV(
    symbol: string,
    timeframe: string = '4h',
    since?: number,
    limit?: number
  ): Promise<OHLCV[]> {
    const candles = await this.exchange.fetchOHLCV(symbol, timeframe, since, limit);

    return candles.map(candle => ({
      timestamp: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    }));
  }

  /**
   * Fetch order book
   */
  async fetchOrderBook(symbol: string, limit: number = 20): Promise<OrderBook> {
    const orderbook = await this.exchange.fetchOrderBook(symbol, limit);

    return {
      symbol,
      bids: orderbook.bids.map(([price, amount]) => ({ price, amount })),
      asks: orderbook.asks.map(([price, amount]) => ({ price, amount })),
      timestamp: orderbook.timestamp || Date.now(),
      datetime: orderbook.datetime || new Date().toISOString(),
    };
  }

  /**
   * Fetch account balance
   */
  async fetchBalance(): Promise<Balance[]> {
    const balance = await this.exchange.fetchBalance();

    const balances: Balance[] = [];

    for (const [asset, value] of Object.entries(balance.total)) {
      if (typeof value === 'number' && value > 0) {
        balances.push({
          asset,
          free: balance.free[asset] || 0,
          locked: balance.used[asset] || 0,
          total: value,
        });
      }
    }

    return balances;
  }

  /**
   * Fetch complete account info with USD value
   */
  async fetchAccountInfo(): Promise<AccountInfo> {
    const balances = await this.fetchBalance();

    // Calculate total USD value
    let totalUSDValue = 0;

    for (const balance of balances) {
      try {
        // Get USD price for each asset
        const symbol = `${balance.asset}/USDT`;
        const ticker = await this.fetchTicker(symbol);
        totalUSDValue += balance.total * ticker.last;
      } catch (error) {
        // If pair doesn't exist, skip
        if (balance.asset === 'USDT' || balance.asset === 'BUSD') {
          totalUSDValue += balance.total;
        }
      }
    }

    return {
      balances,
      totalUSDValue,
      exchange: 'binance',
      timestamp: Date.now(),
    };
  }

  /**
   * Create a market order
   */
  async createMarketOrder(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number
  ): Promise<Order> {
    const order = await this.exchange.createMarketOrder(symbol, side, amount);
    return this.normalizeOrder(order);
  }

  /**
   * Create a limit order
   */
  async createLimitOrder(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    price: number
  ): Promise<Order> {
    const order = await this.exchange.createLimitOrder(symbol, side, amount, price);
    return this.normalizeOrder(order);
  }

  /**
   * Create a stop loss order
   */
  async createStopLossOrder(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    stopPrice: number
  ): Promise<Order> {
    const order = await this.exchange.createOrder(
      symbol,
      'stop_loss_limit',
      side,
      amount,
      stopPrice,
      { stopPrice }
    );
    return this.normalizeOrder(order);
  }

  /**
   * Create any type of order
   */
  async createOrder(request: OrderRequest): Promise<Order> {
    let order: any;

    switch (request.type) {
      case 'market':
        order = await this.exchange.createMarketOrder(
          request.symbol,
          request.side,
          request.amount
        );
        break;

      case 'limit':
        if (!request.price) throw new Error('Price required for limit order');
        order = await this.exchange.createLimitOrder(
          request.symbol,
          request.side,
          request.amount,
          request.price
        );
        break;

      case 'stop':
        if (!request.stopPrice) throw new Error('Stop price required for stop order');
        order = await this.exchange.createOrder(
          request.symbol,
          'stop_loss_limit',
          request.side,
          request.amount,
          request.stopPrice,
          { stopPrice: request.stopPrice }
        );
        break;

      default:
        throw new Error(`Unsupported order type: ${request.type}`);
    }

    return this.normalizeOrder(order);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, symbol: string): Promise<Order> {
    const order = await this.exchange.cancelOrder(orderId, symbol);
    return this.normalizeOrder(order);
  }

  /**
   * Fetch an order
   */
  async fetchOrder(orderId: string, symbol: string): Promise<Order> {
    const order = await this.exchange.fetchOrder(orderId, symbol);
    return this.normalizeOrder(order);
  }

  /**
   * Fetch open orders
   */
  async fetchOpenOrders(symbol?: string): Promise<Order[]> {
    const orders = await this.exchange.fetchOpenOrders(symbol);
    return orders.map(order => this.normalizeOrder(order));
  }

  /**
   * Fetch closed orders
   */
  async fetchClosedOrders(symbol?: string, since?: number, limit?: number): Promise<Order[]> {
    const orders = await this.exchange.fetchClosedOrders(symbol, since, limit);
    return orders.map(order => this.normalizeOrder(order));
  }

  /**
   * Fetch recent trades
   */
  async fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]> {
    const trades = await this.exchange.fetchMyTrades(symbol, since, limit);

    return trades.map(trade => ({
      id: trade.id,
      timestamp: trade.timestamp,
      datetime: trade.datetime,
      symbol: trade.symbol,
      order: trade.order,
      type: trade.type as any,
      side: trade.side as any,
      price: trade.price,
      amount: trade.amount,
      cost: trade.cost,
      fee: trade.fee ? {
        cost: trade.fee.cost,
        currency: trade.fee.currency,
      } : undefined,
    }));
  }

  /**
   * Get market info for a symbol
   */
  async fetchMarket(symbol: string): Promise<MarketInfo> {
    const markets = await this.exchange.loadMarkets();
    const market = markets[symbol];

    if (!market) {
      throw new Error(`Market ${symbol} not found`);
    }

    return {
      id: market.id,
      symbol: market.symbol,
      base: market.base,
      quote: market.quote,
      active: market.active,
      precision: {
        amount: market.precision.amount,
        price: market.precision.price,
      },
      limits: {
        amount: {
          min: market.limits.amount.min,
          max: market.limits.amount.max,
        },
        price: {
          min: market.limits.price.min,
          max: market.limits.price.max,
        },
        cost: {
          min: market.limits.cost.min,
          max: market.limits.cost.max,
        },
      },
      info: market.info,
    };
  }

  /**
   * Get all available markets
   */
  async fetchMarkets(): Promise<MarketInfo[]> {
    const markets = await this.exchange.loadMarkets();

    return Object.values(markets).map(market => ({
      id: market.id,
      symbol: market.symbol,
      base: market.base,
      quote: market.quote,
      active: market.active,
      precision: {
        amount: market.precision.amount,
        price: market.precision.price,
      },
      limits: {
        amount: {
          min: market.limits.amount.min,
          max: market.limits.amount.max,
        },
        price: {
          min: market.limits.price.min,
          max: market.limits.price.max,
        },
        cost: {
          min: market.limits.cost.min,
          max: market.limits.cost.max,
        },
      },
      info: market.info,
    }));
  }

  /**
   * Normalize CCXT order to our format
   */
  private normalizeOrder(ccxtOrder: any): Order {
    return {
      id: ccxtOrder.id,
      clientOrderId: ccxtOrder.clientOrderId,
      timestamp: ccxtOrder.timestamp,
      datetime: ccxtOrder.datetime,
      lastTradeTimestamp: ccxtOrder.lastTradeTimestamp,
      symbol: ccxtOrder.symbol,
      type: ccxtOrder.type,
      side: ccxtOrder.side,
      price: ccxtOrder.price,
      average: ccxtOrder.average,
      amount: ccxtOrder.amount,
      filled: ccxtOrder.filled,
      remaining: ccxtOrder.remaining,
      status: ccxtOrder.status,
      fee: ccxtOrder.fee ? {
        cost: ccxtOrder.fee.cost,
        currency: ccxtOrder.fee.currency,
      } : undefined,
      trades: ccxtOrder.trades,
      info: ccxtOrder.info,
    };
  }

  /**
   * Close connection
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.authenticated = false;
    console.log('🔌 Disconnected from Binance');
  }
}
