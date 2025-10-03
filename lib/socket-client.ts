/**
 * Socket.IO Client Hook for React Components
 * 
 * Provides real-time WebSocket functionality with:
 * - Automatic connection management
 * - Event subscription and handling
 * - Polling fallback when WebSocket fails
 * - Centralized logging integration
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { logSystem } from '@/lib/logger';
import { WebSocketErrorHandler, WebSocketErrorUtils } from '@/lib/websocket-error-handler';
import { normalizeBooking } from '@/lib/normalize-booking';

export interface SocketEvent {
  type: 'booking' | 'payment' | 'payout' | 'notification';
  action: string;
  data: any;
  timestamp: string;
}

export interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  lastEvent: SocketEvent | null;
}

export interface UseSocketOptions {
  userId?: string;
  role?: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  enablePolling?: boolean;
  pollingInterval?: number; // in milliseconds
  onBookingUpdate?: (event: SocketEvent) => void;
  onPaymentUpdate?: (event: SocketEvent) => void;
  onPayoutUpdate?: (event: SocketEvent) => void;
  onNotification?: (event: SocketEvent) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    userId,
    role,
    enablePolling = true,
    pollingInterval = 60000, // 60 seconds
    onBookingUpdate,
    onPaymentUpdate,
    onPayoutUpdate,
    onNotification,
    onConnectionChange
  } = options;

  const [socketState, setSocketState] = useState<SocketState>({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempts: 0,
    lastEvent: null
  });

  const socketRef = useRef<Socket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Initialize Socket.IO connection
  const initializeSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setSocketState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : 'http://localhost:3000';

      const socket = io(socketUrl, {
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      socketRef.current = socket;

      // Connection event handlers
      socket.on('connect', () => {
        logSystem.success('socket_client', 'Socket connected', {
          userId,
          role,
          socketId: socket.id
        });

        setSocketState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
          reconnectAttempts: 0
        }));

        onConnectionChange?.(true);

        // Authenticate user if credentials provided
        if (userId && role) {
          socket.emit('authenticate', { 
            token: 'test_token', // In production, use actual JWT token
            userId,
            role
          });
        }

        // Stop polling when WebSocket connects
        if (isPollingRef.current) {
          stopPolling();
        }
      });

      socket.on('disconnect', (reason) => {
        logSystem.success('socket_client', 'Socket disconnected', {
          userId,
          role,
          reason
        });

        setSocketState(prev => ({
          ...prev,
          connected: false,
          connecting: false
        }));

        onConnectionChange?.(false);

        // Start polling if WebSocket disconnects and polling is enabled
        if (enablePolling && !isPollingRef.current) {
          startPolling();
        }
      });

      socket.on('connect_error', (error) => {
        const errorHandler = WebSocketErrorHandler.getInstance();
        const wsError = errorHandler.handleConnectionError(error);
        
        logSystem.error('socket_client', 'Socket connection error', error, {
          userId,
          role,
          error_code: wsError.code,
          retryable: wsError.retryable
        });

        setSocketState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: wsError.message,
          reconnectAttempts: prev.reconnectAttempts + 1
        }));

        onConnectionChange?.(false);

        // Start polling on connection error
        if (enablePolling && !isPollingRef.current) {
          startPolling();
        }
      });

      socket.on('authenticated', (data) => {
        logSystem.success('socket_client', 'Socket authentication successful', {
          userId: data.userId,
          role: data.role,
          socketId: socket.id
        });
      });

      socket.on('authentication_error', (error) => {
        logSystem.error('socket_client', 'Socket authentication failed', new Error(error.error), {
          userId,
          role,
          error_code: 'SOCKET_AUTH_ERROR'
        });

        setSocketState(prev => ({
          ...prev,
          error: error.error
        }));
      });

      // Event handlers for different types of updates
      socket.on('booking_update', (event: SocketEvent) => {
        logSystem.success('socket_client', 'Booking update received', {
          userId,
          role,
          action: event.action,
          metadata: event.data
        });

        // Normalize booking data before passing to callback
        if (event.data && typeof event.data === 'object') {
          try {
            event.data = normalizeBooking(event.data);
          } catch (error) {
            console.warn('Failed to normalize booking data from socket:', error);
          }
        }

        setSocketState(prev => ({ ...prev, lastEvent: event }));
        onBookingUpdate?.(event);
      });

      socket.on('payment_update', (event: SocketEvent) => {
        logSystem.success('socket_client', 'Payment update received', {
          userId,
          role,
          action: event.action,
          metadata: event.data
        });

        setSocketState(prev => ({ ...prev, lastEvent: event }));
        onPaymentUpdate?.(event);
      });

      socket.on('payout_update', (event: SocketEvent) => {
        logSystem.success('socket_client', 'Payout update received', {
          userId,
          role,
          action: event.action,
          metadata: event.data
        });

        setSocketState(prev => ({ ...prev, lastEvent: event }));
        onPayoutUpdate?.(event);
      });

      socket.on('notification', (event: SocketEvent) => {
        logSystem.success('socket_client', 'Notification received', {
          userId,
          role,
          action: event.action,
          metadata: event.data
        });

        setSocketState(prev => ({ ...prev, lastEvent: event }));
        onNotification?.(event);
      });

    } catch (error) {
      logSystem.error('socket_client', 'Socket initialization error', error as Error, {
        userId,
        role,
        error_code: 'SOCKET_INIT_ERROR'
      });

      setSocketState(prev => ({
        ...prev,
        connecting: false,
        error: (error as Error).message
      }));

      // Start polling on initialization error
      if (enablePolling && !isPollingRef.current) {
        startPolling();
      }
    }
  }, [userId, role, enablePolling, onBookingUpdate, onPaymentUpdate, onPayoutUpdate, onNotification, onConnectionChange]);

  // Polling fallback function
  const pollForUpdates = useCallback(async () => {
    if (!userId || !role) return;

    try {
      logSystem.success('socket_client', 'Polling for updates', {
        userId,
        role,
        pollingInterval
      });

      // In a real implementation, you'd fetch updates from your API
      // For now, we'll simulate polling
      const response = await fetch('/api/user/bookings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        logSystem.success('socket_client', 'Polling successful', {
          userId,
          role,
          metadata: { bookingCount: data.bookings?.length || 0 }
        });
      }
    } catch (error) {
      logSystem.error('socket_client', 'Polling error', error as Error, {
        userId,
        role,
        error_code: 'POLLING_ERROR'
      });
    }
  }, [userId, role, pollingInterval]);

  // Start polling
  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;

    isPollingRef.current = true;
    logSystem.success('socket_client', 'Starting polling fallback', {
      userId,
      role,
      pollingInterval
    });

    pollingRef.current = setInterval(pollForUpdates, pollingInterval);
  }, [pollForUpdates, userId, role, pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (!isPollingRef.current) return;

    isPollingRef.current = false;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    logSystem.success('socket_client', 'Stopped polling fallback', {
      userId,
      role
    });
  }, [userId, role]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    stopPolling();
    initializeSocket();
  }, [initializeSocket, stopPolling]);

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      stopPolling();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [initializeSocket, stopPolling]);

  // Auto-reconnect on connection loss
  useEffect(() => {
    if (!socketState.connected && socketState.reconnectAttempts < 5) {
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnect();
      }, 5000);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [socketState.connected, socketState.reconnectAttempts, reconnect]);

  return {
    ...socketState,
    reconnect,
    isPolling: isPollingRef.current
  };
}

// Hook for booking-specific updates
export function useBookingSocket(userId?: string, onUpdate?: (event: SocketEvent) => void) {
  return useSocket({
    userId,
    role: 'CLIENT',
    onBookingUpdate: onUpdate,
    onPaymentUpdate: onUpdate
  });
}

// Hook for provider-specific updates
export function useProviderSocket(userId?: string, onUpdate?: (event: SocketEvent) => void) {
  return useSocket({
    userId,
    role: 'PROVIDER',
    onBookingUpdate: onUpdate,
    onPaymentUpdate: onUpdate,
    onPayoutUpdate: onUpdate
  });
}
