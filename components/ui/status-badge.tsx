"use client"

import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  DollarSign, 
  Loader2,
  AlertCircle,
  Shield
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  type: "booking" | "payment"
  className?: string
  showIcon?: boolean
  size?: "sm" | "md" | "lg"
}

export function StatusBadge({ 
  status, 
  type, 
  className, 
  showIcon = true, 
  size = "md" 
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    if (type === "booking") {
      return getBookingStatusConfig(status)
    } else {
      return getPaymentStatusConfig(status)
    }
  }

  const getBookingStatusConfig = (status: string) => {
    const configs = {
      PENDING: { 
        color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
        icon: Clock,
        label: "Waiting for Provider"
      },
      CONFIRMED: { 
        color: "bg-blue-100 text-blue-800 border-blue-200", 
        icon: CheckCircle,
        label: "Confirmed"
      },
      PENDING_EXECUTION: { 
        color: "bg-green-100 text-green-800 border-green-200", 
        icon: CheckCircle,
        label: "Payment Received"
      },
      PAYMENT_PROCESSING: { 
        color: "bg-orange-100 text-orange-800 border-orange-200", 
        icon: Loader2,
        label: "Processing Payment"
      },
      IN_PROGRESS: { 
        color: "bg-purple-100 text-purple-800 border-purple-200", 
        icon: Loader2,
        label: "In Progress"
      },
      AWAITING_CONFIRMATION: { 
        color: "bg-orange-100 text-orange-800 border-orange-200", 
        icon: AlertCircle,
        label: "Awaiting Confirmation"
      },
      COMPLETED: { 
        color: "bg-green-100 text-green-800 border-green-200", 
        icon: CheckCircle,
        label: "Completed"
      },
      CANCELLED: { 
        color: "bg-red-100 text-red-800 border-red-200", 
        icon: XCircle,
        label: "Cancelled"
      },
      DISPUTED: { 
        color: "bg-red-100 text-red-800 border-red-200", 
        icon: AlertTriangle,
        label: "Disputed"
      }
    }
    return configs[status as keyof typeof configs] || {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: AlertCircle,
      label: status.replace("_", " ")
    }
  }

  const getPaymentStatusConfig = (status: string) => {
    const configs = {
      PENDING: { 
        color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
        icon: Clock,
        label: "Pending"
      },
      ESCROW: { 
        color: "bg-blue-100 text-blue-800 border-blue-200", 
        icon: Shield,
        label: "In Escrow"
      },
      HELD_IN_ESCROW: { 
        color: "bg-blue-100 text-blue-800 border-blue-200", 
        icon: Shield,
        label: "Held in Escrow"
      },
      PROCESSING_RELEASE: { 
        color: "bg-orange-100 text-orange-800 border-orange-200", 
        icon: Loader2,
        label: "Processing Release"
      },
      RELEASED: { 
        color: "bg-green-100 text-green-800 border-green-200", 
        icon: CheckCircle,
        label: "Released"
      },
      COMPLETED: { 
        color: "bg-green-100 text-green-800 border-green-200", 
        icon: CheckCircle,
        label: "Completed"
      },
      REFUNDED: { 
        color: "bg-gray-100 text-gray-800 border-gray-200", 
        icon: XCircle,
        label: "Refunded"
      },
      FAILED: { 
        color: "bg-red-100 text-red-800 border-red-200", 
        icon: AlertTriangle,
        label: "Failed"
      }
    }
    return configs[status as keyof typeof configs] || {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: AlertCircle,
      label: status.replace("_", " ")
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  }

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  }

  return (
    <Badge 
      className={cn(
        config.color,
        "border font-medium",
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(iconSizes[size], "mr-1")} />
      )}
      {config.label}
    </Badge>
  )
}
