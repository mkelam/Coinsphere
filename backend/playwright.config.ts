import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Tests full API flows including:
 * - Authentication (register, login, logout)
 * - Token management
 * - Portfolio operations
 * - Price data fetching
 */

export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: false, // Run sequentially to avoid database conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for API tests
    baseURL: process.env.API_BASE_URL || 'http://localhost:3001/api/v1',

    // Collect trace on failure
    trace: 'on-first-retry',

    // API request defaults
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },

  // Configure projects for different test types
  projects: [
    {
      name: 'API Tests',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // Run local dev server before starting tests (optional)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3001/api/v1/health',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
