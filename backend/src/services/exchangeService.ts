import ccxt from 'ccxt';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';

const prisma = new PrismaClient();

/**
 * Supported exchanges for MVP - Sprint 3: Expanded to 20+ exchanges
 */
export const SUPPORTED_EXCHANGES = [
  'binance',
  'binanceus',
  'coinbase',
  'coinbasepro',
  'kraken',
  'kucoin',
  'huobi',
  'okx',
  'bybit',
  'bitfinex',
  'bitstamp',
  'gemini',
  'gateio',
  'bitget',
  'mexc',
  'bitmart',
  'lbank',
  'phemex',
  'poloniex',
  'htx',
  'crypto.com',
] as const;
export type SupportedExchange = typeof SUPPORTED_EXCHANGES[number];

/**
 * Exchange credentials
 */
export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string; // For Coinbase Pro, KuCoin
}

/**
 * Balance for a single asset
 */
export interface AssetBalance {
  symbol: string;
  free: number;
  used: number;
  total: number;
}

/**
 * Exchange connection result
 */
export interface ConnectionResult {
  success: boolean;
  message: string;
  connectionId?: string;
}

/**
 * Exchange Service
 * Handles all exchange API interactions via CCXT
 */
export class ExchangeService {

  /**
   * Test exchange credentials without saving
   */
  static async testConnection(
    exchange: SupportedExchange,
    credentials: ExchangeCredentials
  ): Promise<{ success: boolean; message: string }> {
    try {
      const exchangeInstance = this.createExchangeInstance(exchange, credentials);

      // Test by fetching balance
      await exchangeInstance.fetchBalance();

      return {
        success: true,
        message: 'Connection successful'
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection failed'
      };
    }
  }

  /**
   * Connect user's exchange account
   */
  static async connectExchange(
    userId: string,
    exchange: SupportedExchange,
    credentials: ExchangeCredentials,
    label?: string
  ): Promise<ConnectionResult> {
    try {
      // Test connection first
      const testResult = await this.testConnection(exchange, credentials);
      if (!testResult.success) {
        return {
          success: false,
          message: testResult.message
        };
      }

      // Encrypt credentials
      const apiKeyEncrypted = encrypt(credentials.apiKey);
      const apiSecretEncrypted = encrypt(credentials.apiSecret);
      const passphraseEncrypted = credentials.passphrase
        ? encrypt(credentials.passphrase)
        : null;

      // Save to database
      const connection = await prisma.exchangeConnection.create({
        data: {
          userId,
          exchange,
          label: label || `${exchange.charAt(0).toUpperCase() + exchange.slice(1)} Account`,
          apiKeyEncrypted,
          apiSecretEncrypted,
          passphraseEncrypted,
          status: 'active',
          lastSyncAt: new Date()
        }
      });

      // Perform initial sync
      await this.syncExchangeHoldings(connection.id);

      return {
        success: true,
        message: 'Exchange connected successfully',
        connectionId: connection.id
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to connect exchange'
      };
    }
  }

  /**
   * Disconnect exchange
   */
  static async disconnectExchange(
    userId: string,
    connectionId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify ownership
      const connection = await prisma.exchangeConnection.findFirst({
        where: { id: connectionId, userId }
      });

      if (!connection) {
        return {
          success: false,
          message: 'Connection not found'
        };
      }

      // Delete connection (will cascade delete holdings)
      await prisma.exchangeConnection.delete({
        where: { id: connectionId }
      });

      return {
        success: true,
        message: 'Exchange disconnected'
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to disconnect exchange'
      };
    }
  }

  /**
   * Get all user's exchange connections
   */
  static async getUserConnections(userId: string) {
    return prisma.exchangeConnection.findMany({
      where: { userId },
      select: {
        id: true,
        exchange: true,
        label: true,
        status: true,
        lastSyncAt: true,
        lastError: true,
        autoSync: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Sync holdings from exchange
   */
  static async syncExchangeHoldings(connectionId: string): Promise<void> {
    try {
      const connection = await prisma.exchangeConnection.findUnique({
        where: { id: connectionId },
        include: { user: true }
      });

      if (!connection) {
        throw new Error('Connection not found');
      }

      // Decrypt credentials
      const credentials: ExchangeCredentials = {
        apiKey: decrypt(connection.apiKeyEncrypted),
        apiSecret: decrypt(connection.apiSecretEncrypted),
        passphrase: connection.passphraseEncrypted
          ? decrypt(connection.passphraseEncrypted)
          : undefined
      };

      // Create exchange instance
      const exchangeInstance = this.createExchangeInstance(
        connection.exchange as SupportedExchange,
        credentials
      );

      // Fetch balances
      const balance = await exchangeInstance.fetchBalance();

      // Get or create user's portfolio
      let portfolio = await prisma.portfolio.findFirst({
        where: { userId: connection.userId, isActive: true }
      });

      if (!portfolio) {
        portfolio = await prisma.portfolio.create({
          data: {
            userId: connection.userId,
            name: 'Main Portfolio',
            isActive: true
          }
        });
      }

      // Update holdings
      for (const [symbol, balanceData] of Object.entries(balance.total)) {
        const amount = balanceData as number;

        if (amount > 0) {
          // Find or create token
          let token = await prisma.token.findUnique({
            where: { symbol }
          });

          if (!token) {
            // Create basic token entry (will be enriched later)
            token = await prisma.token.create({
              data: {
                symbol,
                name: symbol,
                blockchain: this.guessBlockchain(symbol)
              }
            });
          }

          // Upsert holding
          await prisma.holding.upsert({
            where: {
              portfolioId_tokenId: {
                portfolioId: portfolio.id,
                tokenId: token.id
              }
            },
            update: {
              amount,
              source: connection.exchange,
              sourceId: connection.id
            },
            create: {
              portfolioId: portfolio.id,
              tokenId: token.id,
              amount,
              source: connection.exchange,
              sourceId: connection.id
            }
          });
        }
      }

      // Update connection status
      await prisma.exchangeConnection.update({
        where: { id: connectionId },
        data: {
          status: 'active',
          lastSyncAt: new Date(),
          lastError: null
        }
      });

    } catch (error: any) {
      // Update connection with error
      await prisma.exchangeConnection.update({
        where: { id: connectionId },
        data: {
          status: 'error',
          lastError: error.message
        }
      });

      throw error;
    }
  }

  /**
   * Create CCXT exchange instance
   */
  private static createExchangeInstance(
    exchange: SupportedExchange,
    credentials: ExchangeCredentials
  ): any {
    const ExchangeClass = (ccxt as any)[exchange];

    if (!ExchangeClass) {
      throw new Error(`Exchange ${exchange} not supported`);
    }

    return new ExchangeClass({
      apiKey: credentials.apiKey,
      secret: credentials.apiSecret,
      password: credentials.passphrase, // For exchanges that need it
      enableRateLimit: true,
      timeout: 30000
    });
  }

  /**
   * Guess blockchain from symbol
   * TODO: Improve with proper blockchain detection
   */
  private static guessBlockchain(symbol: string): string {
    const blockchainMap: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      SOL: 'solana',
      BNB: 'binance-smart-chain',
      MATIC: 'polygon',
      AVAX: 'avalanche',
      DOT: 'polkadot',
      ADA: 'cardano'
    };

    return blockchainMap[symbol.toUpperCase()] || 'ethereum';
  }

  /**
   * Sync all active connections for a user
   */
  static async syncAllUserConnections(userId: string): Promise<void> {
    const connections = await prisma.exchangeConnection.findMany({
      where: {
        userId,
        status: 'active',
        autoSync: true
      }
    });

    for (const connection of connections) {
      try {
        await this.syncExchangeHoldings(connection.id);
      } catch (error) {
        console.error(`Failed to sync connection ${connection.id}:`, error);
      }
    }
  }
}
