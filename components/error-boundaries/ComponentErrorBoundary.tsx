'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  componentName?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`🔴 COMPONENT ERROR BOUNDARY [${this.props.componentName || 'Unknown'}]:`, error)
    console.error('Error Name:', error.name)
    console.error('Error Message:', error.message)
    console.error('Error Stack:', error.stack)
    console.error('Component Stack:', errorInfo.componentStack)
    console.error('Full Error Info:', errorInfo)
    
    // Check for specific React errors
    if (error.message.includes('185')) {
      console.error('🚨 REACT ERROR #185 DETECTED: Infinite render loop')
      console.error('This usually means a component is continuously updating state')
      console.error('Check for: useEffect without proper dependencies, circular state updates')
    }
    
    // Log to server if callback provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    this.setState({
      error,
      errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="border border-red-300 bg-red-50 p-4 rounded-lg m-2">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-semibold text-red-800">
              Component Error: {this.props.componentName || 'Unknown Component'}
            </h3>
          </div>
          <p className="text-sm text-red-700 mb-2">
            {this.state.error?.message || 'An error occurred'}
          </p>
          <details className="text-xs text-red-600 mb-2">
            <summary className="cursor-pointer">Error Details</summary>
            <div className="mt-1">
              <div><strong>Error Name:</strong> {this.state.error?.name}</div>
              <div><strong>Error Message:</strong> {this.state.error?.message}</div>
              <div><strong>Component:</strong> {this.props.componentName || 'Unknown'}</div>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2">
                <strong>Stack Trace:</strong>
                <pre className="mt-1 text-xs overflow-auto bg-red-100 p-2 rounded">
                  {this.state.error?.stack}
                </pre>
                <strong>Component Stack:</strong>
                <pre className="mt-1 text-xs overflow-auto bg-red-100 p-2 rounded">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </details>
          <Button
            size="sm"
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry Component
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component wrapper
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => (
    <ComponentErrorBoundary componentName={componentName}>
      <Component {...props} />
    </ComponentErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}
