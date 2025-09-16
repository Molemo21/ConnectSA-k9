'use client';

import React, { Component, ReactNode, useEffect } from 'react';
import { CurrencyProvider } from '@/contexts/currency-context';

// Client logger utility
const logToServer = async (level: 'error' | 'info', message: string, data?: any) => {
  try {
    await fetch('/api/client-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    });
  } catch (error) {
    console.error('Failed to send log to server:', error);
  }
};

// Hydration probe to verify client-side execution
function HydrationProbe() {
  useEffect(() => {
    console.log('🟢 CLIENT UP: React hydration successful!');
    logToServer('info', 'Client hydration successful');
  }, []);

  return null;
}

// Error boundary state interface
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ClientErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🔴 CLIENT ERROR BOUNDARY:', error, errorInfo);
    
    // Log to server
    logToServer('error', 'React Error Boundary caught error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-900 mb-4">
              Client Error Detected
            </h1>
            <p className="text-red-700 mb-6">
              A React error was caught by the error boundary.
            </p>
            <details className="text-left bg-red-100 p-4 rounded">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 text-sm overflow-auto">
                {this.state.error?.toString()}
              </pre>
              {process.env.NODE_ENV === 'development' && (
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error?.stack}
                </pre>
              )}
            </details>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ClientRootProps {
  children: ReactNode;
}

export function ClientRoot({ children }: ClientRootProps) {
  return (
    <ClientErrorBoundary>
      <HydrationProbe />
      <CurrencyProvider>
        {children}
      </CurrencyProvider>
    </ClientErrorBoundary>
  );
}
