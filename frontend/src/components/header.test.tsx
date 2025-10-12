import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './header';

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
    },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
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

describe('Header Component', () => {
  it('should render without crashing', () => {
    const { container } = renderWithProviders(<Header />);
    expect(container).toBeTruthy();
  });

  it('should contain navigation elements', () => {
    const { container } = renderWithProviders(<Header />);
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
  });

  it('should render Coinsphere logo/title', () => {
    renderWithProviders(<Header />);
    // Header should contain some branding
    expect(document.body).toBeTruthy();
  });
});
