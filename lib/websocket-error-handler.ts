/**
 * WebSocket Error Handling & Fallback System
 * 
 * Provides comprehensive error handling, retry logic, and fallback mechanisms
 * for WebSocket connections and real-time updates.
 */

import { logger } from '@/lib/logger';

export interface WebSocketError {
  code: string;
  message: string;
  timestamp: Date;
  retryable: boolean;
  fallback?: 'polling' | 'manual_refresh';
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class WebSocketErrorHandler {
  private static instance: WebSocketErrorHandler;
  private errorHistory: WebSocketError[] = [];
  private retryConfig: RetryConfig = {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  };

  public static getInstance(): WebSocketErrorHandler {
    if (!WebSocketErrorHandler.instance) {
      WebSocketErrorHandler.instance = new WebSocketErrorHandler();
    }
    return WebSocketErrorHandler.instance;
  }

  /**
   * Handle WebSocket connection errors
   */
  public handleConnectionError(error: any): WebSocketError {
    const wsError: WebSocketError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      timestamp: new Date(),
      retryable: this.isRetryableError(error),
      fallback: 'polling'
    };

    this.errorHistory.push(wsError);
    this.logError(wsError, error);

    return wsError;
  }

  /**
   * Handle event broadcasting errors
   */
  public handleBroadcastError(error: any, event: any): WebSocketError {
    const wsError: WebSocketError = {
      code: 'BROADCAST_ERROR',
      message: `Failed to broadcast ${event?.type || 'unknown'} event: ${error.message}`,
      timestamp: new Date(),
      retryable: true,
      fallback: 'manual_refresh'
    };

    this.errorHistory.push(wsError);
    this.logError(wsError, error);

    return wsError;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  public calculateRetryDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
      this.retryConfig.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Check if error should trigger a retry
   */
  public shouldRetry(error: WebSocketError, attempt: number): boolean {
    return (
      error.retryable &&
      attempt <= this.retryConfig.maxAttempts &&
      this.getRecentErrorCount() < 10 // Prevent too many rapid errors
    );
  }

  /**
   * Get fallback strategy for an error
   */
  public getFallbackStrategy(error: WebSocketError): string {
    if (error.fallback === 'polling') {
      return 'Switch to polling mode';
    }
    
    if (error.fallback === 'manual_refresh') {
      return 'Manual refresh required';
    }

    return 'Connection retry';
  }

  /**
   * Get error statistics for monitoring
   */
  public getErrorStats(): {
    totalErrors: number;
    recentErrors: number;
    retryableErrors: number;
    mostCommonError: string;
  } {
    const recent = this.errorHistory.filter(
      e => Date.now() - e.timestamp.getTime() < 60000 // Last minute
    );

    const errorCounts = this.errorHistory.reduce((acc, error) => {
      acc[error.code] = (acc[error.code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonError = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'UNKNOWN';

    return {
      totalErrors: this.errorHistory.length,
      recentErrors: recent.length,
      retryableErrors: this.errorHistory.filter(e => e.retryable).length,
      mostCommonError
    };
  }

  /**
   * Clear old error history
   */
  public clearOldErrors(maxAge: number = 300000): void { // 5 minutes
    this.errorHistory = this.errorHistory.filter(
      e => Date.now() - e.timestamp.getTime() < maxAge
    );
  }

  /**
   * Reset error handler state
   */
  public reset(): void {
    this.errorHistory = [];
  }

  private getErrorCode(error: any): string {
    if (error.code) return error.code;
    if (error.type) return error.type;
    if (error.name) return error.name;
    return 'UNKNOWN_ERROR';
  }

  private getErrorMessage(error: any): string {
    if (error.message) return error.message;
    if (error.description) return error.description;
    return 'An unknown error occurred';
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNRESET',
      'EPIPE',
      'CONNECTION_ERROR',
      'TIMEOUT_ERROR'
    ];

    const nonRetryableCodes = [
      'AUTHENTICATION_ERROR',
      'AUTHORIZATION_ERROR',
      'INVALID_TOKEN',
      'RATE_LIMITED'
    ];

    const code = this.getErrorCode(error);
    
    if (nonRetryableCodes.includes(code)) {
      return false;
    }

    if (retryableCodes.includes(code)) {
      return true;
    }

    // Default to retryable for unknown errors
    return true;
  }

  private getRecentErrorCount(): number {
    return this.errorHistory.filter(
      e => Date.now() - e.timestamp.getTime() < 60000 // Last minute
    ).length;
  }

  private logError(wsError: WebSocketError, originalError: any): void {
    logger.error('websocket_error', 'WebSocket error handled', originalError, {
      error_code: wsError.code,
      retryable: wsError.retryable,
      fallback: wsError.fallback,
      error_count: this.errorHistory.length
    });
  }
}

/**
 * Utility functions for common error scenarios
 */
export const WebSocketErrorUtils = {
  /**
   * Handle connection timeout
   */
  handleTimeout: (timeout: number = 10000): Promise<WebSocketError> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const handler = WebSocketErrorHandler.getInstance();
        const error = handler.handleConnectionError({
          code: 'CONNECTION_TIMEOUT',
          message: `Connection timeout after ${timeout}ms`,
          type: 'TIMEOUT_ERROR'
        });
        resolve(error);
      }, timeout);
    });
  },

  /**
   * Handle network connectivity issues
   */
  handleNetworkError: (error: any): WebSocketError => {
    const handler = WebSocketErrorHandler.getInstance();
    return handler.handleConnectionError({
      ...error,
      code: 'NETWORK_ERROR',
      type: 'CONNECTION_ERROR'
    });
  },

  /**
   * Handle authentication failures
   */
  handleAuthError: (error: any): WebSocketError => {
    const handler = WebSocketErrorHandler.getInstance();
    return handler.handleConnectionError({
      ...error,
      code: 'AUTHENTICATION_ERROR',
      type: 'AUTH_ERROR',
      retryable: false
    });
  },

  /**
   * Create a retry promise with exponential backoff
   */
  createRetryPromise: async <T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
};

export default WebSocketErrorHandler;
