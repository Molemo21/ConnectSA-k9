"use client"

import { Activity, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface RealtimeStatusIndicatorProps {
  isConnected: boolean
  isRefreshing?: boolean
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function RealtimeStatusIndicator({ 
  isConnected, 
  isRefreshing = false, 
  className,
  showText = true,
  size = "md"
}: RealtimeStatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3", 
    lg: "w-4 h-4"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  const iconSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  }

  if (isRefreshing) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Activity className={cn("animate-pulse text-blue-500", iconSizeClasses[size])} />
        {showText && (
          <span className={cn("text-blue-500", textSizeClasses[size])}>
            Syncing...
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {isConnected ? (
        <>
          <Wifi className={cn("text-green-500", iconSizeClasses[size])} />
          {showText && (
            <span className={cn("text-green-500", textSizeClasses[size])}>
              Live Updates
            </span>
          )}
        </>
      ) : (
        <>
          <WifiOff className={cn("text-red-500", iconSizeClasses[size])} />
          {showText && (
            <span className={cn("text-red-500", textSizeClasses[size])}>
              Offline
            </span>
          )}
        </>
      )}
    </div>
  )
}

// Pulse indicator for real-time updates
export function RealtimePulseIndicator({ 
  isActive, 
  className 
}: { 
  isActive: boolean
  className?: string 
}) {
  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full bg-green-500",
        isActive && "animate-pulse"
      )} />
      {isActive && (
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
      )}
    </div>
  )
}
