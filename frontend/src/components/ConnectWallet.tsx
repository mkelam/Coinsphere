import { useWallet } from '@/contexts/WalletContext'
import { CHAIN_IDS } from '@/lib/wagmi'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/glass-card'
import { Wallet, ChevronRight, Check, ExternalLink } from 'lucide-react'

interface ConnectWalletProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConnectWallet({ open, onOpenChange }: ConnectWalletProps) {
  const { address, isConnected, isConnecting, chainId, connect, disconnect, switchChain } = useWallet()

  const handleConnect = () => {
    connect()
  }

  const handleDisconnect = () => {
    disconnect()
    onOpenChange(false)
  }

  const handleSwitchChain = (newChainId: number) => {
    switchChain(newChainId)
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // List of supported chains
  const supportedChains = [
    { id: CHAIN_IDS.ETHEREUM, name: 'Ethereum', icon: '⟠' },
    { id: CHAIN_IDS.POLYGON, name: 'Polygon', icon: '⬡' },
    { id: CHAIN_IDS.OPTIMISM, name: 'Optimism', icon: '🔴' },
    { id: CHAIN_IDS.ARBITRUM, name: 'Arbitrum', icon: '🔵' },
    { id: CHAIN_IDS.BASE, name: 'Base', icon: '🔷' },
    { id: CHAIN_IDS.BSC, name: 'BSC', icon: '🟡' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900/95 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isConnected
              ? 'Manage your wallet connection and switch networks'
              : 'Connect your Web3 wallet to access DeFi features'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!isConnected ? (
            // Connect Wallet View
            <div className="space-y-4">
              <GlassCard className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="rounded-full bg-blue-500/20 p-3">
                    <Wallet className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Why Connect?</h3>
                    <p className="text-sm text-gray-400">
                      Connect your wallet to track DeFi positions, monitor yields, and manage your on-chain assets
                      across 6 networks.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg"
                >
                  {isConnecting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Connect Wallet
                      <ChevronRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              </GlassCard>

              <div className="text-xs text-gray-500 text-center">
                By connecting, you agree to our{' '}
                <a href="/terms" className="text-blue-400 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-400 hover:underline">
                  Privacy Policy
                </a>
              </div>
            </div>
          ) : (
            // Connected Wallet View
            <div className="space-y-4">
              {/* Wallet Info */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">Address</span>
                  <a
                    href={`https://etherscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                  >
                    View on Explorer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-white font-mono text-lg">{address && formatAddress(address)}</code>
                  <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                    Connected
                  </div>
                </div>
              </GlassCard>

              {/* Network Selector */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Select Network</h3>
                <div className="grid grid-cols-2 gap-3">
                  {supportedChains.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => handleSwitchChain(chain.id)}
                      disabled={chainId === chain.id}
                      className={`
                        p-4 rounded-lg border transition-all
                        ${
                          chainId === chain.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{chain.icon}</span>
                          <span className="text-white font-medium">{chain.name}</span>
                        </div>
                        {chainId === chain.id && <Check className="h-5 w-5 text-blue-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Disconnect Button */}
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400"
              >
                Disconnect Wallet
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
