"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Shield, Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, Zap, RefreshCw, Loader2 } from "lucide-react"
import { showToast } from "@/lib/toast"

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  databaseConnection: boolean
  apiResponseTime: number
  errorRate: number
  activeUsers: number
  systemLoad: number
  lastBackup?: string
  databaseSize?: string
}

export default function AdminSystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const fetchSystemHealth = async () => {
    try {
      setRefreshing(true)
      
      // Skip API calls during build time
      if (typeof window === 'undefined') {
        console.log('Skipping API call during build time')
        return
      }

      const response = await fetch('/api/admin/system-health')
      
      if (response.ok) {
        const healthData = await response.json()
        setHealth(healthData)
      } else {
        console.error('Failed to fetch system health')
        showToast.error('Error fetching system health')
      }
    } catch (error) {
      console.error('Error fetching system health:', error)
      showToast.error('Error fetching system health')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSystemHealth()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>System Health Monitoring</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading system health...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!health) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>System Health Monitoring</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to fetch system health data. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const HealthIcon = health.status === 'healthy' ? CheckCircle : 
                     health.status === 'warning' ? Clock : AlertTriangle
  const healthColor = health.status === 'healthy' ? 'green' : 
                      health.status === 'warning' ? 'orange' : 'red'

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>System Health Monitoring</span>
            </CardTitle>
            <CardDescription>
              Real-time monitoring of platform health and performance metrics
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSystemHealth}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall System Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full bg-${healthColor}-500`}></div>
              <span className="font-medium text-gray-900">System Status</span>
            </div>
            <div className="flex items-center space-x-2">
              <HealthIcon className={`w-5 h-5 text-${healthColor}-600`} />
              <Badge 
                variant={health.status === 'healthy' ? 'default' : 'secondary'}
                className={`bg-${healthColor}-100 text-${healthColor}-800`}
              >
                {health.status === 'healthy' ? 'Healthy' : 
                 health.status === 'warning' ? 'Warning' : 'Critical'}
              </Badge>
            </div>
          </div>

          {/* Health Indicators Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* System Performance */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>System Performance</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Response Time</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${health.apiResponseTime > 1000 ? 'bg-red-500' : health.apiResponseTime > 500 ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                    <span className="text-sm font-medium">{health.apiResponseTime}ms</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database Connection</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${health.databaseConnection ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium">{health.databaseConnection ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Error Rate</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${health.errorRate > 5 ? 'bg-red-500' : health.errorRate > 2 ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                    <span className="text-sm font-medium">{health.errorRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Activity */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>User Activity</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Users (24h)</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${health.activeUsers > 100 ? 'bg-green-500' : health.activeUsers > 50 ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium">{health.activeUsers}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">System Load</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${health.systemLoad > 80 ? 'bg-red-500' : health.systemLoad > 60 ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                    <span className="text-sm font-medium">{health.systemLoad}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall Health</span>
                  <Badge 
                    variant={health.status === 'healthy' ? 'default' : 'secondary'}
                    className={`bg-${healthColor}-100 text-${healthColor}-800`}
                  >
                    {health.status === 'healthy' ? 'Optimal' : 
                     health.status === 'warning' ? 'Degraded' : 'Critical'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="space-y-4">
            {health.status === 'critical' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Critical System Issues Detected</strong> - Immediate attention required. 
                  Check system logs and consider maintenance mode.
                </AlertDescription>
              </Alert>
            )}

            {health.status === 'warning' && (
              <Alert className="border-orange-200 bg-orange-50">
                <Clock className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>System Performance Degraded</strong> - Monitor closely and consider optimization. 
                  Response times or error rates are elevated.
                </AlertDescription>
              </Alert>
            )}

            {health.status === 'healthy' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All systems are operating normally. No immediate attention required.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{health.activeUsers}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{health.apiResponseTime}ms</div>
              <div className="text-sm text-gray-600">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{health.errorRate}%</div>
              <div className="text-sm text-gray-600">Error Rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
