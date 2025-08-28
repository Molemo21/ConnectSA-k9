'use client';

import React, { useState, useEffect } from 'react';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('🔴 Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-900 mb-4">Something went wrong</h1>
            <p className="text-red-700 mb-6">
              The page encountered an error during loading. This might be a hydration issue.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Reload Page
              </button>
              <button 
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Try Again
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-red-600">Error Details</summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function TestServicesSimpleContent() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Debug logging function
  const addDebugInfo = (message: string) => {
    console.log(`🔍 [TestServices] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addDebugInfo('Component mounted, starting services fetch');
    
    async function fetchServices() {
      try {
        addDebugInfo('Making fetch request to /api/services');
        const res = await fetch('/api/services');
        addDebugInfo(`Response status: ${res.status}, ok: ${res.ok}`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        addDebugInfo('Parsing JSON response');
        const data = await res.json();
        addDebugInfo(`Parsed ${data.length} services from response`);
        
        setServices(data);
        setLoading(false);
        addDebugInfo('Services state set successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        addDebugInfo(`Error fetching services: ${errorMessage}`);
        console.error('❌ Error fetching services:', err);
        setError(errorMessage);
        setLoading(false);
      }
    }

    addDebugInfo('Calling fetchServices function');
    fetchServices();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl">Loading services...</p>
          <p className="text-sm text-gray-500 mt-2">
            If this takes too long, there might be a JavaScript error. Check the browser console.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-xl mb-4">Error loading services</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.href = '/api/services'} 
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 w-full"
            >
              Test API Directly
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Services Test Page (Simple)</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Services Data</h2>
          <div className="text-sm text-gray-600 mb-2">
            Total services: {services.length}
          </div>
          <div className="text-sm text-green-600 mb-2">
            ✓ Services loaded successfully!
          </div>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(services, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Services List</h2>
          <div className="grid gap-4">
            {services.map((service) => (
              <div key={service.id} className="border rounded p-4">
                <div className="font-semibold">{service.name}</div>
                <div className="text-sm text-gray-600">{service.category}</div>
                <div className="text-xs text-gray-500">{service.description}</div>
                <div className="text-xs text-gray-400 mt-1">ID: {service.id}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-black text-white p-4 rounded-lg mt-6">
            <h3 className="font-bold mb-2">Debug Info</h3>
            <div className="space-y-1 text-sm">
              <div>Services Count: {services.length}</div>
              <div>Loading: {loading.toString()}</div>
              <div>Error: {error || 'none'}</div>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer">Logs</summary>
              <div className="mt-1 space-y-1">
                {debugInfo.slice(-10).map((log, i) => (
                  <div key={i} className="text-green-300 text-xs">{log}</div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TestServicesSimplePage() {
  return (
    <ErrorBoundary>
      <TestServicesSimpleContent />
    </ErrorBoundary>
  );
}
