import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk splitting strategy
          if (id.includes('node_modules')) {
            // WalletConnect & Web3 libraries (largest dependencies)
            if (id.includes('@reown/appkit') ||
                id.includes('@walletconnect') ||
                id.includes('@wagmi')) {
              return 'vendor-wallet';
            }

            // React ecosystem (React, React DOM, React Router)
            if (id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('react-router')) {
              return 'vendor-react';
            }

            // TanStack Query (React Query)
            if (id.includes('@tanstack')) {
              return 'vendor-query';
            }

            // UI libraries (Recharts, Radix UI, etc.)
            if (id.includes('recharts') ||
                id.includes('@radix-ui') ||
                id.includes('lucide-react')) {
              return 'vendor-ui';
            }

            // Crypto/blockchain libraries
            if (id.includes('viem') ||
                id.includes('ethers') ||
                id.includes('@noble')) {
              return 'vendor-crypto';
            }

            // Everything else from node_modules
            return 'vendor-other';
          }

          // App code chunking by feature
          if (id.includes('/pages/')) {
            // Group related pages
            if (id.includes('Dashboard') || id.includes('Portfolio')) {
              return 'pages-portfolio';
            }
            if (id.includes('Defi') || id.includes('Exchange')) {
              return 'pages-integration';
            }
            if (id.includes('Billing') || id.includes('Checkout') || id.includes('Pricing')) {
              return 'pages-billing';
            }
          }

          // Components stay in the main chunk unless they're large
          if (id.includes('/components/') && id.includes('ConnectWallet')) {
            return 'component-wallet';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase limit slightly (was 500 KB)
  },
});
