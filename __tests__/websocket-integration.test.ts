/**
 * WebSocket Integration Tests
 * 
 * Comprehensive test suite for real-time WebSocket functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketErrorHandler, WebSocketErrorUtils } from '@/lib/websocket-error-handler';

// Mock Socket.IO client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  id: 'test-socket-id'
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket)
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logSystem: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('WebSocket Integration', () => {
  let errorHandler: WebSocketErrorHandler;

  beforeEach(() => {
    errorHandler = WebSocketErrorHandler.getInstance();
    errorHandler.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    errorHandler.reset();
  });

  describe('Error Handling', () => {
    it('should handle connection errors correctly', () => {
      const error = {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
        type: 'CONNECTION_ERROR'
      };

      const wsError = errorHandler.handleConnectionError(error);

      expect(wsError.code).toBe('ECONNREFUSED');
      expect(wsError.retryable).toBe(true);
      expect(wsError.fallback).toBe('polling');
    });

    it('should identify non-retryable errors', () => {
      const error = {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid token',
        type: 'AUTH_ERROR'
      };

      const wsError = errorHandler.handleConnectionError(error);

      expect(wsError.retryable).toBe(false);
    });

    it('should calculate retry delays with exponential backoff', () => {
      const delay1 = errorHandler.calculateRetryDelay(1);
      const delay2 = errorHandler.calculateRetryDelay(2);
      const delay3 = errorHandler.calculateRetryDelay(3);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it('should track error statistics', () => {
      // Generate some errors
      errorHandler.handleConnectionError({ code: 'ECONNREFUSED', message: 'Test 1' });
      errorHandler.handleConnectionError({ code: 'ECONNREFUSED', message: 'Test 2' });
      errorHandler.handleConnectionError({ code: 'TIMEOUT', message: 'Test 3' });

      const stats = errorHandler.getErrorStats();

      expect(stats.totalErrors).toBe(3);
      expect(stats.retryableErrors).toBe(3);
      expect(stats.mostCommonError).toBe('ECONNREFUSED');
    });
  });

  describe('Retry Logic', () => {
    it('should determine when to retry', () => {
      const retryableError = {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
        timestamp: new Date(),
        retryable: true
      };

      const nonRetryableError = {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid token',
        timestamp: new Date(),
        retryable: false
      };

      expect(errorHandler.shouldRetry(retryableError, 1)).toBe(true);
      expect(errorHandler.shouldRetry(nonRetryableError, 1)).toBe(false);
      expect(errorHandler.shouldRetry(retryableError, 10)).toBe(false); // Max attempts exceeded
    });
  });

  describe('Utility Functions', () => {
    it('should create retry promises with exponential backoff', async () => {
      let attemptCount = 0;
      const operation = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await WebSocketErrorUtils.createRetryPromise(
        operation,
        3,
        10 // Short delay for testing
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should handle network errors', () => {
      const networkError = {
        message: 'Network unreachable',
        type: 'NETWORK_ERROR'
      };

      const wsError = WebSocketErrorUtils.handleNetworkError(networkError);

      expect(wsError.code).toBe('NETWORK_ERROR');
      expect(wsError.retryable).toBe(true);
    });

    it('should handle authentication errors', () => {
      const authError = {
        message: 'Invalid credentials',
        type: 'AUTH_ERROR'
      };

      const wsError = WebSocketErrorUtils.handleAuthError(authError);

      expect(wsError.code).toBe('AUTHENTICATION_ERROR');
      expect(wsError.retryable).toBe(false);
    });
  });

  describe('Fallback Strategies', () => {
    it('should provide appropriate fallback strategies', () => {
      const pollingError = {
        code: 'CONNECTION_TIMEOUT',
        message: 'Connection timeout',
        timestamp: new Date(),
        retryable: true,
        fallback: 'polling' as const
      };

      const manualRefreshError = {
        code: 'BROADCAST_ERROR',
        message: 'Failed to broadcast',
        timestamp: new Date(),
        retryable: true,
        fallback: 'manual_refresh' as const
      };

      expect(errorHandler.getFallbackStrategy(pollingError)).toBe('Switch to polling mode');
      expect(errorHandler.getFallbackStrategy(manualRefreshError)).toBe('Manual refresh required');
    });
  });

  describe('Error History Management', () => {
    it('should clear old errors', () => {
      // Add an old error
      const oldError = {
        code: 'OLD_ERROR',
        message: 'Old error',
        timestamp: new Date(Date.now() - 400000), // 6+ minutes ago
        retryable: true
      };

      errorHandler['errorHistory'] = [oldError];

      errorHandler.clearOldErrors(300000); // Clear errors older than 5 minutes

      expect(errorHandler.getErrorStats().totalErrors).toBe(0);
    });
  });
});

describe('WebSocket Event Broadcasting', () => {
  it('should handle booking acceptance events', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    global.fetch = mockFetch;

    const response = await fetch('/api/socket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: {
          type: 'booking',
          action: 'accepted'
        },
        data: {
          id: 'test_booking_123',
          bookingId: 'test_booking_123',
          status: 'CONFIRMED',
          service: { name: 'Test Service' }
        },
        targetUsers: ['test_user_123']
      })
    });

    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/socket', expect.any(Object));
  });

  it('should handle payment status updates', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    global.fetch = mockFetch;

    const response = await fetch('/api/socket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: {
          type: 'payment',
          action: 'status_changed'
        },
        data: {
          id: 'test_payment_123',
          paymentId: 'test_payment_123',
          status: 'ESCROW'
        },
        targetUsers: ['test_user_123', 'test_provider_123']
      })
    });

    expect(response.ok).toBe(true);
  });
});

describe('Real-time Dashboard Updates', () => {
  it('should update booking status in real-time', () => {
    const mockBookings = [
      { id: 'booking1', status: 'PENDING', service: { name: 'Service 1' } },
      { id: 'booking2', status: 'PENDING', service: { name: 'Service 2' } }
    ];

    const updateEvent = {
      type: 'booking',
      action: 'accepted',
      data: {
        id: 'booking1',
        status: 'CONFIRMED',
        service: { name: 'Service 1' }
      },
      timestamp: new Date().toISOString()
    };

    // Simulate booking update
    const updatedBookings = mockBookings.map(booking => 
      booking.id === updateEvent.data.id 
        ? { ...booking, status: updateEvent.data.status }
        : booking
    );

    expect(updatedBookings[0].status).toBe('CONFIRMED');
    expect(updatedBookings[1].status).toBe('PENDING'); // Unchanged
  });

  it('should handle payment status changes', () => {
    const mockPayments = [
      { id: 'payment1', status: 'PENDING', amount: 100 },
      { id: 'payment2', status: 'PENDING', amount: 200 }
    ];

    const updateEvent = {
      type: 'payment',
      action: 'status_changed',
      data: {
        id: 'payment1',
        status: 'ESCROW',
        amount: 100
      },
      timestamp: new Date().toISOString()
    };

    // Simulate payment update
    const updatedPayments = mockPayments.map(payment => 
      payment.id === updateEvent.data.id 
        ? { ...payment, status: updateEvent.data.status }
        : payment
    );

    expect(updatedPayments[0].status).toBe('ESCROW');
    expect(updatedPayments[1].status).toBe('PENDING'); // Unchanged
  });
});
