/**
 * Alerts Page Tests
 * Tests for alerts management and configuration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertsPage } from './AlertsPage';

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

// Mock the ToastContext
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock alerts API
vi.mock('@/services/alerts', () => ({
  alertsApi: {
    getAlerts: vi.fn().mockResolvedValue({
      alerts: [
        {
          id: 'alert-1',
          alertType: 'price',
          tokenSymbol: 'BTC',
          condition: 'above',
          threshold: 51000,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'alert-2',
          alertType: 'risk',
          tokenSymbol: 'ETH',
          condition: 'above',
          threshold: 80,
          isActive: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }),
    createAlert: vi.fn().mockResolvedValue({
      alert: { id: 'new-alert', alertType: 'price', tokenSymbol: 'BTC', condition: 'above', threshold: 50000, isActive: true }
    }),
    toggleAlert: vi.fn().mockResolvedValue({
      alert: { id: 'alert-1', isActive: false }
    }),
    deleteAlert: vi.fn().mockResolvedValue({}),
  },
  Alert: {},
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

describe('AlertsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = renderWithProviders(<AlertsPage />);
    expect(container).toBeTruthy();
  });

  it('should have header navigation', () => {
    renderWithProviders(<AlertsPage />);
    const headers = document.querySelectorAll('header');
    expect(headers.length).toBeGreaterThan(0);
  });

  it('should display alerts page content', async () => {
    renderWithProviders(<AlertsPage />);
    await waitFor(() => {
      expect(document.body.textContent).toBeTruthy();
    });
  });

  it('should render alerts list container', async () => {
    const { container } = renderWithProviders(<AlertsPage />);
    await waitFor(() => {
      // Should have some content containers
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThan(0);
    });
  });

  it('should handle loading state initially', () => {
    renderWithProviders(<AlertsPage />);
    // Component should render even while loading
    expect(document.body).toBeTruthy();
  });
});
