"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  LogIn,
  Cookie,
  User,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react'

interface AuthDebugInfo {
  isAuthenticated: boolean
  user: any | null
  hasAuthToken: boolean
  cookies: string[]
  error: string | null
  timestamp: string
}

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const checkAuthStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/debug', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      setDebugInfo({
        isAuthenticated: data.isAuthenticated || false,
        user: data.user,
        hasAuthToken: data.hasAuthToken || false,
        cookies: data.cookies || [],
        error: data.error,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setDebugInfo({
        isAuthenticated: false,
        user: null,
        hasAuthToken: false,
        cookies: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const getStatusIcon = (isAuthenticated: boolean) => {
    if (isAuthenticated) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusBadge = (isAuthenticated: boolean) => {
    if (isAuthenticated) {
      return <Badge variant="default" className="bg-green-500">Authenticated</Badge>
    } else {
      return <Badge variant="destructive">Not Authenticated</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentication Debug
            </CardTitle>
            <CardDescription>
              Debug authentication status and cookie information
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={checkAuthStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {debugInfo ? (
          <>
            {/* Status Overview */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(debugInfo.isAuthenticated)}
                <div>
                  <p className="font-medium">Authentication Status</p>
                  <p className="text-sm text-gray-500">
                    Last checked: {new Date(debugInfo.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {getStatusBadge(debugInfo.isAuthenticated)}
            </div>

            {/* User Information */}
            {debugInfo.user ? (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  User Information
                </h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Email:</strong> {debugInfo.user.email}</p>
                  <p><strong>Name:</strong> {debugInfo.user.name}</p>
                  <p><strong>Role:</strong> {debugInfo.user.role}</p>
                  <p><strong>Email Verified:</strong> {debugInfo.user.emailVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No user information available. User is not authenticated.
                </AlertDescription>
              </Alert>
            )}

            {/* Detailed Information */}
            {showDetails && (
              <div className="space-y-4">
                {/* Cookie Information */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Cookie className="h-4 w-4" />
                    Cookie Information
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Has Auth Token:</strong> {debugInfo.hasAuthToken ? 'Yes' : 'No'}</p>
                    <p><strong>Total Cookies:</strong> {debugInfo.cookies.length}</p>
                    {debugInfo.cookies.length > 0 && (
                      <div className="mt-2">
                        <p><strong>Cookie Names:</strong></p>
                        <ul className="list-disc list-inside text-xs text-gray-600">
                          {debugInfo.cookies.map((cookie, index) => (
                            <li key={index}>{cookie.split('=')[0]}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Information */}
                {debugInfo.error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Error:</strong> {debugInfo.error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Raw Debug Data */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Raw Debug Data</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              {!debugInfo.isAuthenticated ? (
                <Button asChild>
                  <a href="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Log In
                  </a>
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a href="/dashboard">Go to Dashboard</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/provider/dashboard">Provider Dashboard</a>
                  </Button>
                </div>
              )}
              <Button variant="outline" onClick={checkAuthStatus} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading authentication status...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
