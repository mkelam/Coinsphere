import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';

interface Client {
  ws: WebSocket;
  userId: string;
  subscriptions: Set<string>;
}

interface JWTPayload {
  userId: string;
  email: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, Client> = new Map();
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: '/api/v1/ws',
      verifyClient: (info, callback) => {
        // Extract token from query string or headers
        const token = this.extractToken(info.req);

        if (!token) {
          logger.warn('WebSocket connection attempt without token');
          callback(false, 401, 'Unauthorized: No token provided');
          return;
        }

        // Verify JWT token
        try {
          const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
          // Attach user info to request for later use
          (info.req as any).userId = decoded.userId;
          callback(true);
        } catch (error) {
          logger.warn('WebSocket connection attempt with invalid token:', error);
          callback(false, 401, 'Unauthorized: Invalid token');
        }
      },
    });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const userId = (req as any).userId;
      logger.info(`New WebSocket connection for user ${userId}`);

      // Initialize client
      this.clients.set(ws, {
        ws,
        userId,
        subscriptions: new Set(),
      });

      // Send welcome message
      this.send(ws, {
        type: 'connected',
        message: 'Connected to Coinsphere WebSocket',
        userId,
        timestamp: new Date().toISOString(),
      });

      // Handle messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error);
          this.send(ws, {
            type: 'error',
            message: 'Invalid message format',
          });
        }
      });

      // Handle close
      ws.on('close', () => {
        logger.info(`WebSocket connection closed for user ${userId}`);
        this.clients.delete(ws);
      });

      // Handle error
      ws.on('error', (error) => {
        logger.error(`WebSocket error for user ${userId}:`, error);
        this.clients.delete(ws);
      });
    });

    // Start broadcasting price updates
    this.startPriceUpdates();

    logger.info('WebSocket service initialized with authentication');
  }

  private extractToken(req: IncomingMessage): string | null {
    // Try to get token from query string: ws://host/path?token=xxx
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const tokenFromQuery = url.searchParams.get('token');
    if (tokenFromQuery) return tokenFromQuery;

    // Try to get token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get token from Sec-WebSocket-Protocol header
    const protocol = req.headers['sec-websocket-protocol'];
    if (protocol) {
      const protocols = Array.isArray(protocol) ? protocol : [protocol];
      for (const p of protocols) {
        if (p.startsWith('token.')) {
          return p.substring(6);
        }
      }
    }

    return null;
  }

  private handleMessage(ws: WebSocket, message: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (message.type) {
      case 'subscribe':
        if (message.symbols && Array.isArray(message.symbols)) {
          message.symbols.forEach((symbol: string) => {
            client.subscriptions.add(symbol.toUpperCase());
          });
          this.send(ws, {
            type: 'subscribed',
            symbols: Array.from(client.subscriptions),
          });
          const symbolList = message.symbols.join(', ');
          logger.info(`User ${client.userId} subscribed to: ${symbolList}`);
        }
        break;

      case 'unsubscribe':
        if (message.symbols && Array.isArray(message.symbols)) {
          message.symbols.forEach((symbol: string) => {
            client.subscriptions.delete(symbol.toUpperCase());
          });
          this.send(ws, {
            type: 'unsubscribed',
            symbols: message.symbols,
          });
          const symbolList = message.symbols.join(', ');
          logger.info(`User ${client.userId} unsubscribed from: ${symbolList}`);
        }
        break;

      case 'ping':
        this.send(ws, {
          type: 'pong',
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        logger.warn(`Unknown message type from user ${client.userId}: ${message.type}`);
        this.send(ws, {
          type: 'error',
          message: `Unknown message type: ${message.type}`,
        });
    }
  }

  private send(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  private broadcast(data: any) {
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(data));
      }
    });
  }

  private broadcastToSubscribers(symbol: string, data: any) {
    this.clients.forEach((client) => {
      if (
        client.subscriptions.has(symbol) &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(JSON.stringify(data));
      }
    });
  }

  private startPriceUpdates() {
    // Broadcast price updates every 5 seconds
    this.priceUpdateInterval = setInterval(async () => {
      try {
        // Only fetch if there are connected clients
        if (this.clients.size === 0) return;

        const tokens = await prisma.token.findMany({
          select: {
            symbol: true,
            currentPrice: true,
            priceChange24h: true,
            volume24h: true,
            marketCap: true,
          },
          where: {
            currentPrice: {
              not: null,
            },
          },
        });

        // Send updates to subscribed clients only
        tokens.forEach((token) => {
          this.broadcastToSubscribers(token.symbol, {
            type: 'price_update',
            data: {
              symbol: token.symbol,
              price: token.currentPrice,
              change24h: token.priceChange24h,
              volume24h: token.volume24h,
              marketCap: token.marketCap,
              timestamp: new Date().toISOString(),
            },
          });
        });
      } catch (error) {
        logger.error('Error broadcasting price updates:', error);
      }
    }, 5000); // 5 seconds
  }

  stop() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
      logger.info('Stopped price update interval');
    }

    if (this.wss) {
      // Close all client connections
      this.clients.forEach((client) => {
        client.ws.close(1000, 'Server shutting down');
      });
      this.clients.clear();

      this.wss.close();
      logger.info('WebSocket service stopped');
    }
  }

  // Get connection stats
  getStats() {
    const subscriptions = new Map<string, number>();
    this.clients.forEach((client) => {
      client.subscriptions.forEach((symbol) => {
        subscriptions.set(symbol, (subscriptions.get(symbol) || 0) + 1);
      });
    });

    return {
      connectedClients: this.clients.size,
      subscriptions: Object.fromEntries(subscriptions),
    };
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
