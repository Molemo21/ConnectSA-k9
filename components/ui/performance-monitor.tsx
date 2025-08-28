"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Zap, Database, AlertTriangle } from 'lucide-react'

interface PerformanceMetrics {
  totalTime: number
  dbQueryTime: number
  cacheHit: boolean
  endpoint: string
  timestamp: Date
}

interface PerformanceMonitorProps {
  className?: string
}

export function PerformanceMonitor({ className }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const handlePerformanceData = (event: MessageEvent) => {
      if (event.data?.type === 'PERFORMANCE_METRICS') {
        setMetrics(prev => [event.data.metrics, ...prev.slice(0, 9)]) // Keep last 10
      }
    }

    window.addEventListener('message', handlePerformanceData)
    return () => window.removeEventListener('message', handlePerformanceData)
  }, [isVisible])

  if (!isVisible) return null

  const averageResponseTime = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.totalTime, 0) / metrics.length 
    : 0

  const averageDbTime = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.dbQueryTime, 0) / metrics.length 
    : 0

  const cacheHitRate = metrics.length > 0 
    ? (metrics.filter(m => m.cacheHit).length / metrics.length) * 100 
    : 0

  const getPerformanceColor = (time: number) => {
    if (time < 500) return 'text-green-600'
    if (time < 1000) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (time: number) => {
    if (time < 500) return { label: 'Fast', color: 'bg-green-100 text-green-800' }
    if (time < 1000) return { label: 'Good', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Slow', color: 'bg-red-100 text-red-800' }
  }

  return (
    <Card className={`${className} bg-gray-50 border-gray-200`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center space-x-2">
          <Zap className="w-4 h-4 text-blue-600" />
          <span>Performance Monitor</span>
          <Badge variant="outline" className="text-xs">
            Dev Only
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          Real-time API performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className={`font-semibold ${getPerformanceColor(averageResponseTime)}`}>
              {averageResponseTime.toFixed(0)}ms
            </div>
            <div className="text-gray-500">Avg Response</div>
          </div>
          <div className="text-center">
            <div className={`font-semibold ${getPerformanceColor(averageDbTime)}`}>
              {averageDbTime.toFixed(0)}ms
            </div>
            <div className="text-gray-500">Avg DB</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">
              {cacheHitRate.toFixed(0)}%
            </div>
            <div className="text-gray-500">Cache Hit</div>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">Recent Requests</div>
          {metrics.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-2">
              No requests yet
            </div>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {metrics.map((metric, index) => {
                const performanceBadge = getPerformanceBadge(metric.totalTime)
                return (
                  <div key={index} className="flex items-center justify-between text-xs bg-white p-2 rounded border">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="font-mono text-xs">
                        {metric.totalTime}ms
                      </span>
                      <Badge className={`text-xs ${performanceBadge.color}`}>
                        {performanceBadge.label}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Database className="w-3 h-3" />
                      <span>{metric.dbQueryTime}ms</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Performance Tips */}
        <div className="text-xs text-gray-600 space-y-1">
          <div className="font-medium">Performance Tips:</div>
          <div>• Response time &lt;500ms = Fast</div>
          <div>• Response time &lt;1000ms = Good</div>
          <div>• Response time &gt;1000ms = Needs optimization</div>
        </div>
      </CardContent>
    </Card>
  )
}
