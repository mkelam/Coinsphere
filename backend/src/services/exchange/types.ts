/**
 * Exchange Service Type Definitions
 * Core types for multi-exchange trading integration
 */

export type ExchangeName = 'binance' | 'coinbase' | 'kraken';
export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
export type OrderStatus = 'open' | 'closed' | 'canceled' | 'expired' | 'rejected';
export type PositionSide = 'long' | 'short';

export interface ExchangeCredentials {
  apiKey: string;
  secret: string;
  password?: string; // For exchanges like Coinbase that require it
  uid?: string; // For exchanges like Kraken
}

export interface ExchangeConfig {
  name: ExchangeName;
  credentials: ExchangeCredentials;
  testnet?: boolean;
  rateLimit?: number;
  enableRateLimit?: boolean;
  timeout?: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
  datetime: string;
}

export interface Ticker {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
  datetime: string;
}

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface AccountInfo {
  balances: Balance[];
  totalUSDValue: number;
  exchange: ExchangeName;
  timestamp: number;
}

export interface OrderRequest {
  symbol: string;
  type: OrderType;
  side: OrderSide;
  amount: number;
  price?: number;
  stopPrice?: number;
  params?: Record<string, any>;
}

export interface Order {
  id: string;
  clientOrderId?: string;
  timestamp: number;
  datetime: string;
  lastTradeTimestamp?: number;
  symbol: string;
  type: OrderType;
  side: OrderSide;
  price?: number;
  average?: number;
  amount: number;
  filled: number;
  remaining: number;
  status: OrderStatus;
  fee?: {
    cost: number;
    currency: string;
  };
  trades?: Trade[];
  info: any; // Raw exchange response
}

export interface Trade {
  id: string;
  timestamp: number;
  datetime: string;
  symbol: string;
  order?: string;
  type: OrderType;
  side: OrderSide;
  price: number;
  amount: number;
  cost: number;
  fee?: {
    cost: number;
    currency: string;
  };
}

export interface Position {
  id: string;
  symbol: string;
  side: PositionSide;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  liquidationPrice?: number;
  leverage?: number;
  timestamp: number;
}

export interface ExchangeError {
  exchange: ExchangeName;
  code?: string;
  message: string;
  timestamp: number;
}

export interface MarketInfo {
  id: string;
  symbol: string;
  base: string;
  quote: string;
  active: boolean;
  precision: {
    amount: number;
    price: number;
  };
  limits: {
    amount: {
      min: number;
      max: number;
    };
    price: {
      min: number;
      max: number;
    };
    cost: {
      min: number;
      max: number;
    };
  };
  info: any; // Raw exchange market info
}

export interface ExchangeStatus {
  exchange: ExchangeName;
  connected: boolean;
  authenticated: boolean;
  rateLimit: {
    remaining: number;
    limit: number;
    reset: number;
  };
  lastPing: number;
  error?: ExchangeError;
}
