/**
 * Exchange Manager
 * Manages multiple exchange connections and provides unified interface
 */

import { BinanceConnector } from './BinanceConnector';
import {
  ExchangeName,
  ExchangeConfig,
  ExchangeCredentials,
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

interface ExchangeConnection {
  connector: BinanceConnector; // Will extend to support other exchanges
  config: ExchangeConfig;
  status: ExchangeStatus;
}

export class ExchangeManager {
  private exchanges: Map<ExchangeName, ExchangeConnection> = new Map();
  private defaultExchange: ExchangeName = 'binance';

  /**
   * Add an exchange connection
   */
  async addExchange(config: ExchangeConfig): Promise<void> {
    try {
      let connector: BinanceConnector;

      // Create connector based on exchange name
      switch (config.name) {
        case 'binance':
          connector = new BinanceConnector(config);
          break;
        // Future exchanges
        // case 'coinbase':
        //   connector = new CoinbaseConnector(config);
        //   break;
        // case 'kraken':
        //   connector = new KrakenConnector(config);
        //   break;
        default:
          throw new Error(`Unsupported exchange: ${config.name}`);
      }

      // Connect to exchange
      await connector.connect();

      // Get initial status
      const status = await connector.getStatus();

      // Store connection
      this.exchanges.set(config.name, {
        connector,
        config,
        status,
      });

      console.log(`✅ Exchange ${config.name} added successfully`);
    } catch (error: any) {
      console.error(`❌ Failed to add exchange ${config.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Remove an exchange connection
   */
  async removeExchange(name: ExchangeName): Promise<void> {
    const connection = this.exchanges.get(name);

    if (!connection) {
      throw new Error(`Exchange ${name} not found`);
    }

    await connection.connector.disconnect();
    this.exchanges.delete(name);

    console.log(`✅ Exchange ${name} removed`);
  }

  /**
   * Get connector for a specific exchange
   */
  getExchange(name?: ExchangeName): BinanceConnector {
    const exchangeName = name || this.defaultExchange;
    const connection = this.exchanges.get(exchangeName);

    if (!connection) {
      throw new Error(`Exchange ${exchangeName} not connected. Please add it first.`);
    }

    return connection.connector;
  }

  /**
   * Set default exchange
   */
  setDefaultExchange(name: ExchangeName): void {
    if (!this.exchanges.has(name)) {
      throw new Error(`Exchange ${name} not connected`);
    }

    this.defaultExchange = name;
    console.log(`✅ Default exchange set to ${name}`);
  }

  /**
   * Get status of all exchanges
   */
  async getAllStatuses(): Promise<ExchangeStatus[]> {
    const statuses: ExchangeStatus[] = [];

    for (const [name, connection] of this.exchanges) {
      const status = await connection.connector.getStatus();
      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Get account info from all exchanges
   */
  async getAllAccounts(): Promise<AccountInfo[]> {
    const accounts: AccountInfo[] = [];

    for (const [name, connection] of this.exchanges) {
      try {
        const accountInfo = await connection.connector.fetchAccountInfo();
        accounts.push(accountInfo);
      } catch (error: any) {
        console.error(`Failed to fetch account from ${name}:`, error.message);
      }
    }

    return accounts;
  }

  /**
   * Get total portfolio value across all exchanges
   */
  async getTotalPortfolioValue(): Promise<number> {
    const accounts = await this.getAllAccounts();
    return accounts.reduce((total, account) => total + account.totalUSDValue, 0);
  }

  /**
   * Create order on specified exchange
   */
  async createOrder(request: OrderRequest, exchange?: ExchangeName): Promise<Order> {
    const connector = this.getExchange(exchange);
    return await connector.createOrder(request);
  }

  /**
   * Cancel order on specified exchange
   */
  async cancelOrder(orderId: string, symbol: string, exchange?: ExchangeName): Promise<Order> {
    const connector = this.getExchange(exchange);
    return await connector.cancelOrder(orderId, symbol);
  }

  /**
   * Fetch ticker from specified exchange
   */
  async fetchTicker(symbol: string, exchange?: ExchangeName): Promise<Ticker> {
    const connector = this.getExchange(exchange);
    return await connector.fetchTicker(symbol);
  }

  /**
   * Fetch OHLCV from specified exchange
   */
  async fetchOHLCV(
    symbol: string,
    timeframe: string = '4h',
    since?: number,
    limit?: number,
    exchange?: ExchangeName
  ): Promise<OHLCV[]> {
    const connector = this.getExchange(exchange);
    return await connector.fetchOHLCV(symbol, timeframe, since, limit);
  }

  /**
   * Fetch order book from specified exchange
   */
  async fetchOrderBook(symbol: string, limit: number = 20, exchange?: ExchangeName): Promise<OrderBook> {
    const connector = this.getExchange(exchange);
    return await connector.fetchOrderBook(symbol, limit);
  }

  /**
   * Fetch balance from specified exchange
   */
  async fetchBalance(exchange?: ExchangeName): Promise<Balance[]> {
    const connector = this.getExchange(exchange);
    return await connector.fetchBalance();
  }

  /**
   * Fetch open orders from specified exchange
   */
  async fetchOpenOrders(symbol?: string, exchange?: ExchangeName): Promise<Order[]> {
    const connector = this.getExchange(exchange);
    return await connector.fetchOpenOrders(symbol);
  }

  /**
   * Fetch closed orders from specified exchange
   */
  async fetchClosedOrders(
    symbol?: string,
    since?: number,
    limit?: number,
    exchange?: ExchangeName
  ): Promise<Order[]> {
    const connector = this.getExchange(exchange);
    return await connector.fetchClosedOrders(symbol, since, limit);
  }

  /**
   * Fetch my trades from specified exchange
   */
  async fetchMyTrades(
    symbol?: string,
    since?: number,
    limit?: number,
    exchange?: ExchangeName
  ): Promise<Trade[]> {
    const connector = this.getExchange(exchange);
    return await connector.fetchMyTrades(symbol, since, limit);
  }

  /**
   * Fetch market info from specified exchange
   */
  async fetchMarket(symbol: string, exchange?: ExchangeName): Promise<MarketInfo> {
    const connector = this.getExchange(exchange);
    return await connector.fetchMarket(symbol);
  }

  /**
   * Fetch all markets from specified exchange
   */
  async fetchMarkets(exchange?: ExchangeName): Promise<MarketInfo[]> {
    const connector = this.getExchange(exchange);
    return await connector.fetchMarkets();
  }

  /**
   * Check if exchange is connected
   */
  isConnected(name?: ExchangeName): boolean {
    const exchangeName = name || this.defaultExchange;
    return this.exchanges.has(exchangeName);
  }

  /**
   * Get list of connected exchanges
   */
  getConnectedExchanges(): ExchangeName[] {
    return Array.from(this.exchanges.keys());
  }

  /**
   * Disconnect all exchanges
   */
  async disconnectAll(): Promise<void> {
    for (const [name, connection] of this.exchanges) {
      await connection.connector.disconnect();
    }

    this.exchanges.clear();
    console.log('✅ All exchanges disconnected');
  }
}

// Singleton instance
export const exchangeManager = new ExchangeManager();
