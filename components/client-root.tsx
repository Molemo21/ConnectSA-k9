'use client';

import React, { Component, ReactNode, useEffect } from 'react';
import { CurrencyProvider } from '@/contexts/currency-context';
import { LanguageProvider } from '@/contexts/LanguageContext';

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
    console.error('🔴 CLIENT ERROR BOUNDARY CAUGHT ERROR:');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Full Error Info:', errorInfo);
    
    // Log current URL and user agent for context
    console.error('Current URL:', window.location.href);
    console.error('User Agent:', navigator.userAgent);
    
    // Log to server
    logToServer('error', 'React Error Boundary caught error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      url: window.location.href,
      userAgent: navigator.userAgent,
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
              <div className="mt-2 text-sm">
                <div className="mb-2">
                  <strong>Error Name:</strong> {this.state.error?.name}
                </div>
                <div className="mb-2">
                  <strong>Error Message:</strong> {this.state.error?.message}
                </div>
                <div className="mb-2">
                  <strong>URL:</strong> {window.location.href}
                </div>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2">
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1 text-xs overflow-auto bg-red-200 p-2 rounded">
                    {this.state.error?.stack}
                  </pre>
                  <strong>Component Stack:</strong>
                  <pre className="mt-1 text-xs overflow-auto bg-red-200 p-2 rounded">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
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
      <LanguageProvider>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
      </LanguageProvider>
    </ClientErrorBoundary>
  );
}
