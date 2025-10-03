"use client"

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseWebSocketOptions {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  onMessage?: (data: any) => void
  enabled?: boolean
}

interface UseWebSocketReturn {
  socket: WebSocket | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  sendMessage: (data: any) => void
  reconnect: () => void
  disconnect: () => void
}

export function useWebSocket({
  url,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
  onOpen,
  onClose,
  onError,
  onMessage,
  enabled = true
}: UseWebSocketOptions): UseWebSocketReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const reconnectAttempts = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const isManualDisconnect = useRef(false)

  const connect = useCallback(() => {
    if (!enabled || socketRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const ws = new WebSocket(url)
      socketRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected:', url)
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        reconnectAttempts.current = 0
        onOpen?.()
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        setIsConnected(false)
        setIsConnecting(false)
        setSocket(null)
        socketRef.current = null
        onClose?.()

        // Only attempt to reconnect if it wasn't a manual disconnect
        if (!isManualDisconnect.current && enabled) {
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`)
            
            // Exponential backoff
            const delay = reconnectInterval * Math.pow(2, reconnectAttempts.current - 1)
            reconnectTimeoutRef.current = setTimeout(() => {
              connect()
            }, delay)
          } else {
            setError(`Failed to reconnect after ${maxReconnectAttempts} attempts`)
            console.error('Max reconnection attempts reached')
          }
        }
      }

      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        setError('WebSocket connection error')
        setIsConnecting(false)
        onError?.(event)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage?.(data)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
          // Still call onMessage with raw data if parsing fails
          onMessage?.(event.data)
        }
      }

      setSocket(ws)
    } catch (err) {
      console.error('Failed to create WebSocket:', err)
      setError('Failed to create WebSocket connection')
      setIsConnecting(false)
    }
  }, [url, enabled, reconnectInterval, maxReconnectAttempts, onOpen, onClose, onError, onMessage])

  const disconnect = useCallback(() => {
    isManualDisconnect.current = true
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    setSocket(null)
    setIsConnected(false)
    setIsConnecting(false)
    setError(null)
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    isManualDisconnect.current = false
    reconnectAttempts.current = 0
    connect()
  }, [disconnect, connect])

  const sendMessage = useCallback((data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data)
        socketRef.current.send(message)
      } catch (err) {
        console.error('Failed to send WebSocket message:', err)
        setError('Failed to send message')
      }
    } else {
      console.warn('WebSocket is not connected. Cannot send message.')
      setError('WebSocket is not connected')
    }
  }, [])

  // Initialize connection
  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [])

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    sendMessage,
    reconnect,
    disconnect
  }
}
