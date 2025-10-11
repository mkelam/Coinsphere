/**
 * DeFi Service - API client for DeFi protocol integration
 */

import api from './api';

export interface DefiProtocol {
  id: string;
  name: string;
  slug: string;
  category: string;
  blockchain: string;
  logoUrl?: string;
  website?: string;
  tvl?: string;
  subgraphUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DefiPosition {
  id: string;
  userId: string;
  protocolId: string;
  walletAddress: string;
  positionType: string;
  tokenSymbol: string;
  amount: string;
  valueUsd: string;
  apy?: string;
  rewardsEarned?: string;
  rewardsToken?: string;
  metadata?: any;
  status: string;
  lastSyncAt: string;
  createdAt: string;
  updatedAt: string;
  protocol?: DefiProtocol;
}

export interface DefiPositionsResponse {
  success: boolean;
  data: {
    positions: DefiPosition[];
    totalValue: string;
    count: number;
  };
}

export interface DefiProtocolsResponse {
  success: boolean;
  data: DefiProtocol[];
  count: number;
}

export interface DefiSyncResponse {
  success: boolean;
  message: string;
  data: {
    results: Array<{
      wallet: string;
      blockchain: string;
      status: string;
      error?: string;
    }>;
    summary: {
      total: number;
      success: number;
      errors: number;
    };
  };
}

export interface DefiStatsResponse {
  success: boolean;
  data: {
    totalValue: string;
    totalPositions: number;
    protocolCount: number;
    positionsByType: Record<string, number>;
    averageApy: string;
    lastSync: string | null;
  };
}

export const defiService = {
  /**
   * Get list of supported DeFi protocols
   */
  async getProtocols(): Promise<DefiProtocol[]> {
    const response = await api.get<DefiProtocolsResponse>('/defi/protocols');
    return response.data.data;
  },

  /**
   * Get user's DeFi positions across all protocols
   */
  async getPositions(): Promise<DefiPositionsResponse['data']> {
    const response = await api.get<DefiPositionsResponse>('/defi/positions');
    return response.data.data;
  },

  /**
   * Manually trigger sync of DeFi positions for connected wallets
   */
  async syncPositions(): Promise<DefiSyncResponse['data']> {
    const response = await api.post<DefiSyncResponse>('/defi/sync');
    return response.data.data;
  },

  /**
   * Get user's positions for a specific protocol
   */
  async getProtocolPositions(protocolId: string): Promise<{
    protocol: DefiProtocol;
    positions: DefiPosition[];
    totalValue: string;
    count: number;
  }> {
    const response = await api.get(`/defi/protocols/${protocolId}/positions`);
    return response.data.data;
  },

  /**
   * Get user's DeFi portfolio statistics
   */
  async getStats(): Promise<DefiStatsResponse['data']> {
    const response = await api.get<DefiStatsResponse>('/defi/stats');
    return response.data.data;
  },
};
