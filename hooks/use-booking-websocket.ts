/**
 * useBookingWebSocket Hook
 * 
 * Listens to WebSocket events for real-time booking status updates.
 * Automatically updates booking data when status changes are broadcast.
 * 
 * Features:
 * - Real-time booking status updates via WebSocket
 * - Automatic reconnection on disconnect
 * - Fallback to polling if WebSocket unavailable
 * - Debounced updates to prevent excessive re-renders
 */

"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Dynamic import for socket.io-client to avoid SSR issues
let io: any = null;
let Socket: any = null;

if (typeof window !== 'undefined') {
  try {
    const socketIO = require('socket.io-client');
    io = socketIO.io || socketIO.default;
    Socket = socketIO.Socket;
  } catch (err) {
    console.warn('socket.io-client not available:', err);
  }
}

interface Booking {
  id: string;
  status: string;
  [key: string]: any;
}

interface UseBookingWebSocketOptions {
  bookingId?: string;
  bookingIds?: string[]; // For multiple bookings
  userId?: string;
  enabled?: boolean;
  onStatusChange?: (bookingId: string, newStatus: string, booking: any) => void;
  onBookingUpdate?: (booking: any) => void;
}

interface UseBookingWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  lastUpdate: Date | null;
  error: string | null;
  reconnect: () => void;
  disconnect: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '/api/socket';
const RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

export function useBookingWebSocket(
  options: UseBookingWebSocketOptions = {}
): UseBookingWebSocketReturn {
  const {
    bookingId,
    bookingIds = [],
    userId,
    enabled = true,
    onStatusChange,
    onBookingUpdate,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Status change messages for toast notifications
  const statusMessages: Record<string, string> = {
    PENDING: '⏳ Booking is waiting for provider response',
    CONFIRMED: '🎉 Booking confirmed by provider!',
    PENDING_EXECUTION: '💳 Payment received, provider can start work',
    IN_PROGRESS: '🔧 Provider is working on your service',
    AWAITING_CONFIRMATION: '✅ Service completed! Please confirm completion',
    COMPLETED: '🎊 Booking completed successfully!',
    CANCELLED: '❌ Booking was cancelled',
    DISPUTED: '⚠️ Booking is under dispute',
  };

  // Handle booking update events
  const handleBookingUpdate = useCallback(
    (data: { type: string; action: string; data: any; timestamp: string }) => {
      if (!enabled) return;

      const booking = data.data;
      const bookingIdToCheck = booking?.id || booking?.bookingId;

      // Check if this update is for one of our bookings
      if (
        bookingIdToCheck &&
        (bookingIdToCheck === bookingId ||
          bookingIds.includes(bookingIdToCheck) ||
          !bookingId)
      ) {
        // Debounce rapid updates
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
          setLastUpdate(new Date());

          // Call custom handler if provided
          if (onBookingUpdate) {
            onBookingUpdate(booking);
          }

          // Handle status changes
          if (data.action === 'status_changed' && booking.status) {
            const message = statusMessages[booking.status as keyof typeof statusMessages];
            if (message) {
              toast({
                title: 'Booking Status Update',
                description: message,
                duration: 5000,
              });
            }

            // Call custom status change handler
            if (onStatusChange) {
              onStatusChange(bookingIdToCheck, booking.status, booking);
            }
          }
        }, 300); // 300ms debounce
      }
    },
    [enabled, bookingId, bookingIds, onStatusChange, onBookingUpdate, toast]
  );

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || socketRef.current?.connected) {
      return;
    }

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Dynamically import socket.io-client to avoid SSR issues
      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: RECONNECT_DELAY,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        autoConnect: true,
      });

      socket.on('connect', () => {
        console.log('🔌 WebSocket connected for booking updates');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;

        // Authenticate if userId is provided
        if (userId) {
          socket.emit('authenticate', {
            userId,
            role: 'CLIENT', // This should be determined from user context
          });
        }

        // Join user-specific room
        if (userId) {
          socket.emit('join_room', `user_${userId}`);
        }

        // Join booking-specific rooms
        if (bookingId) {
          socket.emit('join_room', `booking_${bookingId}`);
        }
        bookingIds.forEach((id) => {
          socket.emit('join_room', `booking_${id}`);
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        setIsConnected(false);
        setIsConnecting(false);

        // Attempt reconnection if not manually disconnected
        if (reason !== 'io client disconnect' && enabled) {
          reconnectAttemptsRef.current++;
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, RECONNECT_DELAY);
          } else {
            setError('Failed to reconnect. Please refresh the page.');
          }
        }
      });

      socket.on('connect_error', (err) => {
        console.error('🔌 WebSocket connection error:', err);
        setError(err.message);
        setIsConnecting(false);
      });

      // Listen for booking updates
      socket.on('booking_update', handleBookingUpdate);

      socketRef.current = socket;
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnecting(false);
    }
  }, [enabled, userId, bookingId, bookingIds, handleBookingUpdate]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  // Reconnect manually
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect]);

  // Setup effect
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    lastUpdate,
    error,
    reconnect,
    disconnect,
  };
}

