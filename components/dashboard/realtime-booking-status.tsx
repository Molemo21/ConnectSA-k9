"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RealtimeStatusIndicator } from "@/components/ui/realtime-status-indicator"
import { useSafeTime } from "@/hooks/use-safe-time"
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Activity,
  Wifi,
  WifiOff
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Booking {
  id: string
  status: string
  service?: {
    name: string
  }
  payment?: {
    status: string
  }
  [key: string]: any
}

interface RealtimeBookingStatusProps {
  booking: Booking
  isConnected: boolean
  isRefreshing: boolean
  onRefresh: () => void
  className?: string
}

const statusConfig = {
  PENDING: {
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "Waiting for Provider",
    description: "Your booking is waiting for a provider to accept",
    pulse: true
  },
  CONFIRMED: {
    icon: CheckCircle,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Confirmed",
    description: "Provider has accepted your booking",
    pulse: false
  },
  PENDING_EXECUTION: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Payment Received",
    description: "Payment processed, provider can start work",
    pulse: false
  },
  IN_PROGRESS: {
    icon: Loader2,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    label: "In Progress",
    description: "Provider is working on your service",
    pulse: true
  },
  COMPLETED: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Completed",
    description: "Service completed successfully",
    pulse: false
  },
  CANCELLED: {
    icon: AlertCircle,
    color: "bg-red-100 text-red-800 border-red-200",
    label: "Cancelled",
    description: "Booking was cancelled",
    pulse: false
  }
}

export function RealtimeBookingStatus({ 
  booking, 
  isConnected, 
  isRefreshing, 
  onRefresh,
  className 
}: RealtimeBookingStatusProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [statusHistory, setStatusHistory] = useState<string[]>([booking.status])
  const formattedTime = useSafeTime(lastUpdate, 'time')

  // Track status changes
  useEffect(() => {
    if (statusHistory[statusHistory.length - 1] !== booking.status) {
      setStatusHistory(prev => [...prev, booking.status])
      setLastUpdate(new Date())
    }
  }, [booking.status, statusHistory])

  const config = statusConfig[booking.status as keyof typeof statusConfig] || {
    icon: AlertCircle,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    label: booking.status.replace("_", " "),
    description: "Status update",
    pulse: false
  }

  const StatusIcon = config.icon

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Real-time indicator */}
      <div className="absolute top-2 right-2">
        <RealtimeStatusIndicator 
          isConnected={isConnected}
          isRefreshing={isRefreshing}
          size="sm"
          showText={false}
        />
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {booking.service?.name || 'Service'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center space-x-3">
          <Badge className={cn(
            "flex items-center space-x-2 px-3 py-1",
            config.color,
            config.pulse && "animate-pulse"
          )}>
            <StatusIcon className="w-4 h-4" />
            <span>{config.label}</span>
          </Badge>
          
          {/* Pulse indicator for active statuses */}
          {config.pulse && (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>Live</span>
            </div>
          )}
        </div>

        {/* Status Description */}
        <p className="text-sm text-gray-600">
          {config.description}
        </p>

        {/* Connection Status */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="w-3 h-3 text-green-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-500" />
            )}
            <span>
              {isConnected ? 'Real-time updates active' : 'Updates paused'}
            </span>
          </div>
          
          <span>
            Last updated: {formattedTime}
          </span>
        </div>

        {/* Status History (if multiple changes) */}
        {statusHistory.length > 1 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Status History:</p>
            <div className="flex space-x-2">
              {statusHistory.map((status, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs"
                >
                  {statusConfig[status as keyof typeof statusConfig]?.label || status}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
