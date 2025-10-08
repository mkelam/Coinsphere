import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/api/v1/ws'

interface PriceUpdate {
  type: 'price_update'
  data: {
    symbol: string
    price: number
    change24h: number
    volume24h: number
    marketCap: number
    timestamp: string
  }
}

interface WebSocketMessage {
  type: string
  [key: string]: any
}

export function useWebSocket() {
  const { isAuthenticated } = useAuth()
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [latestPrices, setLatestPrices] = useState<Map<string, PriceUpdate['data']>>(new Map())
  const reconnectTimeout = useRef<NodeJS.Timeout>()
  const subscribers = useRef<Set<string>>(new Set())

  const connect = useCallback(() => {
    if (!isAuthenticated) return

    try {
      ws.current = new WebSocket(WS_URL)

      ws.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)

        // Re-subscribe to previously subscribed symbols
        if (subscribers.current.size > 0) {
          ws.current?.send(
            JSON.stringify({
              type: 'subscribe',
              symbols: Array.from(subscribers.current),
            })
          )
        }
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)

          switch (message.type) {
            case 'price_update':
              const priceData = message.data as PriceUpdate['data']
              setLatestPrices((prev) => {
                const newMap = new Map(prev)
                newMap.set(priceData.symbol, priceData)
                return newMap
              })
              break

            case 'connected':
              console.log('WebSocket:', message.message)
              break

            case 'subscribed':
              console.log('Subscribed to:', message.symbols)
              break

            case 'pong':
              // Handle ping/pong for keep-alive
              break

            default:
              console.log('Unknown WebSocket message:', message)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.current.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)

        // Attempt to reconnect after 5 seconds
        reconnectTimeout.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...')
          connect()
        }, 5000)
      }
    } catch (error) {
      console.error('Error connecting to WebSocket:', error)
    }
  }, [isAuthenticated])

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
    }

    if (ws.current) {
      ws.current.close()
      ws.current = null
    }

    setIsConnected(false)
  }, [])

  const subscribe = useCallback(
    (symbols: string[]) => {
      symbols.forEach((symbol) => subscribers.current.add(symbol))

      if (isConnected && ws.current) {
        ws.current.send(
          JSON.stringify({
            type: 'subscribe',
            symbols,
          })
        )
      }
    },
    [isConnected]
  )

  const unsubscribe = useCallback(
    (symbols: string[]) => {
      symbols.forEach((symbol) => subscribers.current.delete(symbol))

      if (isConnected && ws.current) {
        ws.current.send(
          JSON.stringify({
            type: 'unsubscribe',
            symbols,
          })
        )
      }
    },
    [isConnected]
  )

  // Connect when authenticated, disconnect when not
  useEffect(() => {
    if (isAuthenticated) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, connect, disconnect])

  // Ping/pong keep-alive
  useEffect(() => {
    if (!isConnected) return

    const pingInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(pingInterval)
  }, [isConnected])

  return {
    isConnected,
    latestPrices,
    subscribe,
    unsubscribe,
  }
}
