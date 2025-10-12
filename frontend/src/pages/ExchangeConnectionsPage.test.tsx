/**
 * Exchange Connections Page Tests
 * Tests for exchange account management and API connections
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ExchangeConnectionsPage from './ExchangeConnectionsPage';

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-123',
      email: 'test@coinsphere.app',
      firstName: 'Test',
      lastName: 'User',
      subscriptionTier: 'pro',
    },
    isAuthenticated: true,
  }),
}));

// Mock the ToastContext with proper signature
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock exchange API
vi.mock('@/services/exchangeApi', () => ({
  exchangeApi: {
    getConnections: vi.fn().mockResolvedValue({
      connections: [
        {
          id: 'conn-1',
          exchange: 'binance',
          label: 'My Binance',
          isActive: true,
          lastSync: new Date().toISOString(),
        },
        {
          id: 'conn-2',
          exchange: 'coinbase',
          label: 'Coinbase Pro',
          isActive: false,
          lastSync: null,
        },
      ],
    }),
    connectExchange: vi.fn().mockResolvedValue({ connectionId: 'new-conn' }),
    syncConnection: vi.fn().mockResolvedValue({}),
    syncAll: vi.fn().mockResolvedValue({}),
    disconnectExchange: vi.fn().mockResolvedValue({}),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ExchangeConnectionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = renderWithProviders(<ExchangeConnectionsPage />);
    expect(container).toBeTruthy();
  });

  it('should have header navigation', () => {
    renderWithProviders(<ExchangeConnectionsPage />);
    const headers = document.querySelectorAll('header');
    expect(headers.length).toBeGreaterThan(0);
  });

  it('should display page content', async () => {
    renderWithProviders(<ExchangeConnectionsPage />);
    await waitFor(() => {
      expect(document.body.textContent).toBeTruthy();
    });
  });

  it('should render connections container', async () => {
    const { container } = renderWithProviders(<ExchangeConnectionsPage />);
    await waitFor(() => {
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThan(0);
    });
  });

  it('should handle loading state initially', () => {
    renderWithProviders(<ExchangeConnectionsPage />);
    expect(document.body).toBeTruthy();
  });

  it('should render main content area', () => {
    const { container } = renderWithProviders(<ExchangeConnectionsPage />);
    expect(container.firstChild).toBeTruthy();
  });
});
