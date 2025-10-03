/**
 * React Error Logger
 * Provides structured logging for React errors and component issues
 */

interface ReactErrorContext {
  componentName?: string;
  errorBoundary?: string;
  userId?: string;
  userRole?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  errorType: 'render' | 'lifecycle' | 'event' | 'async' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ReactErrorData {
  message: string;
  stack?: string;
  componentStack?: string;
  context: ReactErrorContext;
  metadata?: Record<string, any>;
}

class ReactErrorLogger {
  private static instance: ReactErrorLogger;
  private errorQueue: ReactErrorData[] = [];
  private maxQueueSize = 100;

  static getInstance(): ReactErrorLogger {
    if (!ReactErrorLogger.instance) {
      ReactErrorLogger.instance = new ReactErrorLogger();
    }
    return ReactErrorLogger.instance;
  }

  /**
   * Log a React error with structured data
   */
  logError(
    error: Error,
    errorInfo: any,
    context: Partial<ReactErrorContext> = {}
  ): void {
    const errorData: ReactErrorData = {
      message: this.sanitizeErrorMessage(error.message),
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        errorType: this.determineErrorType(error, errorInfo),
        severity: this.determineSeverity(error, context),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      },
      metadata: this.extractMetadata(error, errorInfo)
    };

    // Add to queue
    this.addToQueue(errorData);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 React Error Logged');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Context:', errorData.context);
      console.error('Metadata:', errorData.metadata);
      console.groupEnd();
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(errorData);
    }
  }

  /**
   * Log a render error specifically
   */
  logRenderError(
    error: Error,
    componentName: string,
    props?: Record<string, any>
  ): void {
    this.logError(error, {}, {
      componentName,
      errorType: 'render',
      severity: 'high'
    });
  }

  /**
   * Log an async error
   */
  logAsyncError(
    error: Error,
    context: string,
    metadata?: Record<string, any>
  ): void {
    this.logError(error, {}, {
      componentName: context,
      errorType: 'async',
      severity: 'medium',
      metadata
    });
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit = 10): ReactErrorData[] {
    return this.errorQueue.slice(-limit);
  }

  /**
   * Clear error queue
   */
  clearErrors(): void {
    this.errorQueue = [];
  }

  private addToQueue(errorData: ReactErrorData): void {
    this.errorQueue.push(errorData);
    
    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages
    return message
      .replace(/password[=:]\s*[^\s,]+/gi, 'password=***')
      .replace(/token[=:]\s*[^\s,]+/gi, 'token=***')
      .replace(/key[=:]\s*[^\s,]+/gi, 'key=***')
      .replace(/secret[=:]\s*[^\s,]+/gi, 'secret=***');
  }

  private determineErrorType(error: Error, errorInfo: any): ReactErrorContext['errorType'] {
    if (error.message.includes('render') || error.message.includes('JSX')) {
      return 'render';
    }
    if (error.message.includes('componentDidMount') || error.message.includes('useEffect')) {
      return 'lifecycle';
    }
    if (error.message.includes('event') || error.message.includes('handler')) {
      return 'event';
    }
    if (error.message.includes('async') || error.message.includes('Promise')) {
      return 'async';
    }
    return 'unknown';
  }

  private determineSeverity(error: Error, context: Partial<ReactErrorContext>): ReactErrorContext['severity'] {
    // Critical errors that break the entire app
    if (error.message.includes('Cannot read property') || 
        error.message.includes('Cannot access') ||
        error.message.includes('undefined is not a function')) {
      return 'critical';
    }

    // High severity errors that break components
    if (error.message.includes('render') || 
        error.message.includes('JSX') ||
        context.componentName?.includes('Dashboard')) {
      return 'high';
    }

    // Medium severity for async/network errors
    if (error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('timeout')) {
      return 'medium';
    }

    return 'low';
  }

  private extractMetadata(error: Error, errorInfo: any): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Extract useful information from error
    if (error.name) metadata.errorName = error.name;
    if (error.cause) metadata.errorCause = error.cause;

    // Extract component information
    if (errorInfo?.componentStack) {
      const componentStack = errorInfo.componentStack;
      const components = componentStack
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('at '))
        .slice(0, 5); // Limit to first 5 components
      
      metadata.componentStack = components;
    }

    // Add browser information
    if (typeof window !== 'undefined') {
      metadata.viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      metadata.screen = {
        width: window.screen.width,
        height: window.screen.height
      };
    }

    return metadata;
  }

  private sendToExternalLogger(errorData: ReactErrorData): void {
    // In a real application, you would send this to your logging service
    // For now, we'll just log it to console in a structured format
    console.error('React Error (Production):', JSON.stringify(errorData, null, 2));
    
    // Example: Send to external service
    // fetch('/api/logs/react-errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // }).catch(err => console.error('Failed to send error log:', err));
  }
}

// Export singleton instance
export const reactErrorLogger = ReactErrorLogger.getInstance();

// Export types for use in components
export type { ReactErrorContext, ReactErrorData };

// Helper function for easy use in error boundaries
export function logReactError(
  error: Error,
  errorInfo: any,
  context: Partial<ReactErrorContext> = {}
): void {
  reactErrorLogger.logError(error, errorInfo, context);
}
