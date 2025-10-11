import { createContext, useContext, ReactNode } from 'react'
import { WagmiProvider, useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { config } from '@/lib/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a query client for wagmi
const queryClient = new QueryClient()

interface WalletContextType {
  address: string | undefined
  isConnected: boolean
  isConnecting: boolean
  chainId: number | undefined
  connect: () => void
  disconnect: () => void
  switchChain: (chainId: number) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

// Inner provider that uses wagmi hooks
function WalletProviderInner({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount()
  const { connect: wagmiConnect, connectors, isPending } = useConnect()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const { switchChain: wagmiSwitchChain } = useSwitchChain()

  const connect = () => {
    // Connect with the first available connector (MetaMask, WalletConnect, etc.)
    const connector = connectors[0]
    if (connector) {
      wagmiConnect({ connector })
    }
  }

  const disconnect = () => {
    wagmiDisconnect()
  }

  const switchChain = (chainId: number) => {
    wagmiSwitchChain({ chainId })
  }

  const value: WalletContextType = {
    address,
    isConnected,
    isConnecting: isPending,
    chainId,
    connect,
    disconnect,
    switchChain,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

// Main provider that wraps with WagmiProvider and QueryClientProvider
export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProviderInner>{children}</WalletProviderInner>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
