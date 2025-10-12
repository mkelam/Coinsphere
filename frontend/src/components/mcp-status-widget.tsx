import { useEffect, useState } from "react"
import { GlassCard } from "./glass-card"
import { Activity, AlertCircle, CheckCircle, RefreshCw, Radio, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface McpStatus {
  mcp: {
    enabled: boolean
    connected: boolean
    status: string
  }
  rest: {
    available: boolean
    status: string
  }
  activeMode: string
  timestamp: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'

export function McpStatusWidget() {
  const [status, setStatus] = useState<McpStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/social/mcp/status`)
      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`)
      }
      const data = await response.json()
      setStatus(data)
      setError(null)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('MCP status fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchStatus()

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <GlassCard hover={false} className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white/50 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">LunarCrush Status</h3>
              <p className="text-xs text-white/50">Loading...</p>
            </div>
          </div>
        </div>
      </GlassCard>
    )
  }

  if (error) {
    return (
      <GlassCard hover={false} className="mb-6 border-red-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">LunarCrush Status</h3>
              <p className="text-xs text-red-400">Failed to fetch status</p>
            </div>
          </div>
          <button
            onClick={fetchStatus}
            className="text-xs text-white/50 hover:text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </GlassCard>
    )
  }

  if (!status) {
    return null
  }

  const isMcpConnected = status.mcp.enabled && status.mcp.connected
  const isRestAvailable = status.rest.available

  return (
    <GlassCard hover={false} className="mb-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isMcpConnected
                  ? "bg-green-500/20"
                  : isRestAvailable
                  ? "bg-yellow-500/20"
                  : "bg-red-500/20"
              )}
            >
              {isMcpConnected ? (
                <Radio className="w-5 h-5 text-green-500 animate-pulse" />
              ) : isRestAvailable ? (
                <Activity className="w-5 h-5 text-yellow-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Social Sentiment Streaming</h3>
              <p className="text-xs text-white/50">
                {isMcpConnected ? "Real-time (MCP SSE)" : isRestAvailable ? "REST API" : "Offline"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/50">
              {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Status Details */}
        <div className="grid grid-cols-2 gap-4">
          {/* MCP Status */}
          <div className="flex items-start gap-2">
            <div className="mt-0.5">
              {status.mcp.enabled && status.mcp.connected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-white/30" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-white/90">MCP Streaming</div>
              <div className="text-xs text-white/50">
                {status.mcp.enabled
                  ? status.mcp.connected
                    ? "Connected"
                    : "Disconnected"
                  : "Disabled"}
              </div>
              {status.mcp.enabled && status.mcp.connected && (
                <div className="flex items-center gap-1 mt-1">
                  <Zap className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-500">&lt;10ms latency</span>
                </div>
              )}
            </div>
          </div>

          {/* REST Fallback Status */}
          <div className="flex items-start gap-2">
            <div className="mt-0.5">
              {status.rest.available ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-white/90">REST Fallback</div>
              <div className="text-xs text-white/50">
                {status.rest.available ? "Available" : "Unavailable"}
              </div>
              {status.rest.available && !status.mcp.connected && (
                <div className="text-xs text-yellow-500 mt-1">Active (fallback)</div>
              )}
            </div>
          </div>
        </div>

        {/* Active Mode Badge */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Active Mode</span>
            <span
              className={cn(
                "text-xs font-medium px-2 py-1 rounded",
                isMcpConnected
                  ? "bg-green-500/20 text-green-400"
                  : isRestAvailable
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
              )}
            >
              {status.activeMode}
            </span>
          </div>
        </div>

        {/* Performance Info */}
        {isMcpConnected && (
          <div className="pt-3 border-t border-white/10">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-500">&lt;10ms</div>
                <div className="text-xs text-white/50">Latency</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-500">Real-time</div>
                <div className="text-xs text-white/50">Updates</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-500">300x</div>
                <div className="text-xs text-white/50">Faster</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  )
}
