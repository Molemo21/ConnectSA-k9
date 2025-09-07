"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, Clock, DollarSign, MapPin, Activity, ChevronRight, 
  CheckCircle, AlertCircle, Loader2, X, Phone, MessageCircle,
  ArrowRight, Eye
} from "lucide-react"
import { useState } from "react"

interface Booking {
  id: string
  service: {
    name: string
    category: string
  }
  provider?: {
    businessName: string
    user: {
      name: string
      phone?: string
    }
  } | null
  scheduledDate: Date | string
  totalAmount: number
  status: string
  address: string
  description?: string | null
  payment?: {
    status: string
    amount: number
  } | null
  createdAt: Date | string
}

interface MobileCurrentBookingProps {
  booking: Booking
  onStatusChange?: (bookingId: string, newStatus: string) => void
  onRefresh?: (bookingId: string) => Promise<void>
}

const getStatusInfo = (status: string, hasPayment?: boolean) => {
  switch (status) {
    case "PENDING":
      return {
        label: "Finding Provider",
        color: "bg-yellow-900/50 text-yellow-400 border-yellow-800/50",
        icon: Clock,
        description: "We're finding the best provider"
      }
    case "CONFIRMED":
      return {
        label: hasPayment ? "Confirmed & Paid" : "Confirmed",
        color: "bg-blue-900/50 text-blue-400 border-blue-800/50",
        icon: CheckCircle,
        description: "Provider confirmed"
      }
    case "PENDING_EXECUTION":
      return {
        label: "Payment Received",
        color: "bg-green-900/50 text-green-400 border-green-800/50",
        icon: DollarSign,
        description: "Payment in escrow"
      }
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        color: "bg-purple-900/50 text-purple-400 border-purple-800/50",
        icon: Loader2,
        description: "Work in progress"
      }
    case "AWAITING_CONFIRMATION":
      return {
        label: "Awaiting Confirmation",
        color: "bg-orange-900/50 text-orange-400 border-orange-800/50",
        icon: AlertCircle,
        description: "Confirm completion"
      }
    default:
      return {
        label: status.replace("_", " "),
        color: "bg-gray-800 text-gray-400 border-gray-700",
        icon: AlertCircle,
        description: "Status update"
      }
  }
}

export function MobileCurrentBooking({ booking, onStatusChange, onRefresh }: MobileCurrentBookingProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  const statusInfo = getStatusInfo(booking.status, booking.payment)
  const StatusIcon = statusInfo.icon
  
  const canPay = booking.status === "CONFIRMED" && !booking.payment
  const hasPayment = booking.payment && ['ESCROW', 'HELD_IN_ESCROW', 'RELEASED', 'COMPLETED'].includes(booking.payment.status)
  const isPaymentProcessing = booking.payment && ['PENDING'].includes(booking.payment.status)

  const handlePay = async () => {
    // Payment logic here - same as EnhancedBookingCard
    console.log('Payment initiated for booking:', booking.id)
  }

  return (
    <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-800/50 rounded-xl shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-100">Active Booking</CardTitle>
              <p className="text-xs text-gray-400">Ongoing service</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 p-1"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Service Info */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-100 truncate">{booking.service.name}</h3>
            <p className="text-xs text-gray-400">{booking.service.category}</p>
          </div>
          <Badge className={`text-xs ${statusInfo.color} ml-2`}>
            <StatusIcon className={`w-3 h-3 mr-1 ${statusInfo.icon === Loader2 ? 'animate-spin' : ''}`} />
            {statusInfo.label}
          </Badge>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2 text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <DollarSign className="w-3 h-3" />
            <span>R{booking.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Status Description */}
        <div className="bg-gray-800/50 rounded-lg p-2">
          <p className="text-xs text-gray-300">{statusInfo.description}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {canPay && (
            <Button 
              size="sm" 
              onClick={handlePay}
              className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
            >
              <DollarSign className="w-3 h-3 mr-1" />
              Pay Now
            </Button>
          )}
          
          {booking.provider?.user.phone && (
            <Button
              size="sm"
              variant="outline"
              className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700 text-xs"
              onClick={() => window.open(`tel:${booking.provider.user.phone}`, '_blank')}
            >
              <Phone className="w-3 h-3" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700 text-xs"
            asChild
          >
            <a href="/bookings">
              <Eye className="w-3 h-3 mr-1" />
              View
            </a>
          </Button>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
            <div className="text-xs">
              <span className="text-gray-400">Address:</span>
              <p className="text-gray-200 mt-1">{booking.address}</p>
            </div>
            
            {booking.provider && (
              <div className="text-xs">
                <span className="text-gray-400">Provider:</span>
                <p className="text-gray-200 mt-1">{booking.provider.businessName}</p>
                <p className="text-gray-400">{booking.provider.user.name}</p>
              </div>
            )}
            
            {booking.payment && (
              <div className="text-xs">
                <span className="text-gray-400">Payment:</span>
                <p className="text-gray-200 mt-1">
                  {booking.payment.status} - R{booking.payment.amount.toFixed(2)}
                </p>
              </div>
            )}
            
            <div className="flex space-x-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700 text-xs"
                asChild
              >
                <a href={`/bookings?booking=${booking.id}`}>
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Full Details
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for very small screens
export function CompactCurrentBooking({ booking }: { booking: Booking }) {
  const statusInfo = getStatusInfo(booking.status, booking.payment)
  const StatusIcon = statusInfo.icon
  
  return (
    <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-800/50 rounded-lg shadow-lg">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-purple-800 rounded-md flex items-center justify-center">
              <Activity className="w-3 h-3 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-100 truncate">{booking.service.name}</h3>
              <p className="text-xs text-gray-400">{new Date(booking.scheduledDate).toLocaleDateString()}</p>
            </div>
          </div>
          <Badge className={`text-xs ${statusInfo.color}`}>
            <StatusIcon className={`w-2 h-2 mr-1 ${statusInfo.icon === Loader2 ? 'animate-spin' : ''}`} />
            {statusInfo.label}
          </Badge>
        </div>
        
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700 text-xs h-7"
            asChild
          >
            <a href="/bookings">
              <Eye className="w-3 h-3 mr-1" />
              View
            </a>
          </Button>
          
          {booking.status === "CONFIRMED" && !booking.payment && (
            <Button 
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-7"
            >
              <DollarSign className="w-3 h-3 mr-1" />
              Pay
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}