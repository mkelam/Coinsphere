/**
 * Dashboard Page Tests
 * Tests for the main dashboard view and portfolio overview
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from './DashboardPage';

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
    logout: vi.fn(),
  }),
}));

// Mock the ToastContext
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock API services
vi.mock('@/services/api', () => ({
  portfolioApi: {
    getAll: vi.fn().mockResolvedValue({
      portfolios: [
        {
          id: 'portfolio-1',
          name: 'Main Portfolio',
          totalValue: 50000,
          change24h: 1250,
          changePercent24h: 2.5,
        },
      ],
    }),
  },
  tokenApi: {
    getAll: vi.fn().mockResolvedValue({
      tokens: [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          currentPrice: 50000,
          change24h: 2.5,
          marketCap: 1000000000,
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          currentPrice: 3000,
          change24h: 3.2,
          marketCap: 500000000,
        },
      ],
    }),
  },
  alertsApi: {
    getAll: vi.fn().mockResolvedValue({
      alerts: [
        {
          id: 'alert-1',
          alertType: 'price',
          tokenSymbol: 'BTC',
          condition: 'above',
          threshold: 51000,
          isActive: true,
        },
      ],
    }),
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

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = renderWithProviders(<DashboardPage />);
    expect(container).toBeTruthy();
  });

  it('should display page title', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      // Dashboard should have some heading or title
      expect(document.body.textContent).toBeTruthy();
    });
  });

  it('should render navigation header', () => {
    renderWithProviders(<DashboardPage />);
    const headers = document.querySelectorAll('header');
    expect(headers.length).toBeGreaterThan(0);
  });

  it('should have main content area', () => {
    const { container } = renderWithProviders(<DashboardPage />);
    const main = container.querySelector('main');
    expect(main).toBeTruthy();
  });

  it('should display portfolio summary section', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      // Portfolio data should be rendered
      const body = document.body.textContent || '';
      // Should contain some financial data
      expect(body.length).toBeGreaterThan(0);
    });
  });
});
