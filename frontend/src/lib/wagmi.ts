import { http, createConfig } from 'wagmi'
import { mainnet, polygon, optimism, arbitrum, base, bsc } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// Define supported chains for multi-chain DeFi
const chains = [mainnet, polygon, optimism, arbitrum, base, bsc] as const

// WalletConnect project ID (get from https://cloud.walletconnect.com)
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

// Configure wallet connectors
const connectors = [
  // MetaMask and other injected wallets
  injected({
    target: 'metaMask',
    shimDisconnect: true,
  }),

  // WalletConnect v2
  walletConnect({
    projectId,
    metadata: {
      name: 'Coinsphere',
      description: 'AI-powered crypto portfolio tracker',
      url: 'https://coinsphere.app',
      icons: ['https://coinsphere.app/icon.png'],
    },
    showQrModal: true,
  }),

  // Coinbase Wallet
  coinbaseWallet({
    appName: 'Coinsphere',
    appLogoUrl: 'https://coinsphere.app/icon.png',
  }),
]

// Create wagmi config
export const config = createConfig({
  chains,
  connectors,
  transports: {
    // Use public RPC endpoints for each chain
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
  },
})

// Export chain IDs for easy reference
export const CHAIN_IDS = {
  ETHEREUM: mainnet.id,
  POLYGON: polygon.id,
  OPTIMISM: optimism.id,
  ARBITRUM: arbitrum.id,
  BASE: base.id,
  BSC: bsc.id,
} as const

// Export chain names mapping
export const CHAIN_NAMES: Record<number, string> = {
  [mainnet.id]: 'Ethereum',
  [polygon.id]: 'Polygon',
  [optimism.id]: 'Optimism',
  [arbitrum.id]: 'Arbitrum',
  [base.id]: 'Base',
  [bsc.id]: 'BSC',
}

// Export blockchain string mapping (matches backend enum)
export const BLOCKCHAIN_MAPPING: Record<number, string> = {
  [mainnet.id]: 'ETHEREUM',
  [polygon.id]: 'POLYGON',
  [optimism.id]: 'OPTIMISM',
  [arbitrum.id]: 'ARBITRUM',
  [base.id]: 'BASE',
  [bsc.id]: 'BSC',
}
