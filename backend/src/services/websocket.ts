import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';

interface Client {
  ws: WebSocket;
  subscriptions: Set<string>;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, Client> = new Map();
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: '/api/v1/ws',
    });

    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('New WebSocket connection');

      // Initialize client
      this.clients.set(ws, {
        ws,
        subscriptions: new Set(),
      });

      // Send welcome message
      this.send(ws, {
        type: 'connected',
        message: 'Connected to Coinsphere WebSocket',
        timestamp: new Date().toISOString(),
      });

      // Handle messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error);
        }
      });

      // Handle close
      ws.on('close', () => {
        logger.info('WebSocket connection closed');
        this.clients.delete(ws);
      });

      // Handle error
      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    // Start broadcasting price updates
    this.startPriceUpdates();

    logger.info('WebSocket service initialized');
  }

  private handleMessage(ws: WebSocket, message: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (message.type) {
      case 'subscribe':
        if (message.symbols && Array.isArray(message.symbols)) {
          message.symbols.forEach((symbol: string) => {
            client.subscriptions.add(symbol);
          });
          this.send(ws, {
            type: 'subscribed',
            symbols: Array.from(client.subscriptions),
          });
          logger.info(`Client subscribed to: ${message.symbols.join(', ')}`);
        }
        break;

      case 'unsubscribe':
        if (message.symbols && Array.isArray(message.symbols)) {
          message.symbols.forEach((symbol: string) => {
            client.subscriptions.delete(symbol);
          });
          this.send(ws, {
            type: 'unsubscribed',
            symbols: message.symbols,
          });
        }
        break;

      case 'ping':
        this.send(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      default:
        logger.warn(`Unknown message type: ${message.type}`);
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

        // Send updates to all connected clients
        if (this.clients.size > 0) {
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
        }
      } catch (error) {
        logger.error('Error broadcasting price updates:', error);
      }
    }, 5000); // 5 seconds
  }

  stop() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }

    if (this.wss) {
      this.wss.close();
      logger.info('WebSocket service stopped');
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
