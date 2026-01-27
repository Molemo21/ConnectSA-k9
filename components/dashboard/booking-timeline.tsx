"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Calendar, Clock, CheckCircle, AlertCircle, 
  ArrowRight, Loader2, AlertTriangle, X, TrendingUp,
  ChevronRight, Eye
} from "lucide-react"
import { useState } from "react"
import { RandIconSimple } from "@/components/ui/rand-icon"
import { formatBookingPrice } from '@/lib/price-utils'

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
    }
  } | null
  scheduledDate: Date | string
  totalAmount: number
  status: string
  // Catalogue pricing fields (for accurate price display)
  bookedPrice?: number | null
  bookedCurrency?: string | null
  catalogueItemId?: string | null
  payment?: {
    status: string
    amount: number
  } | null
  createdAt: Date | string
}

interface BookingTimelineProps {
  bookings: Booking[]
  className?: string
  maxItems?: number
  showViewAll?: boolean
  onBookingClick?: (booking: Booking) => void
}

const getStatusInfo = (status: string, hasPayment?: boolean, paymentMethod?: string) => {
  switch (status) {
    case "PENDING":
      return {
        label: "Waiting for Provider",
        color: "bg-yellow-900/50 text-yellow-400 border-yellow-800/50",
        icon: Clock,
        step: 1,
        description: "Finding the best provider"
      }
    case "CONFIRMED":
      // For cash: step 2 (confirmed), payment not yet due
      // For online: step 2 (confirmed), need payment before starting
      return {
        label: paymentMethod === 'CASH' ? "Confirmed" : hasPayment ? "Confirmed & Paid" : "Confirmed",
        color: "bg-blue-900/50 text-blue-400 border-blue-800/50",
        icon: CheckCircle,
        step: 2,
        description: "Provider confirmed"
      }
    case "PENDING_EXECUTION":
      return {
        label: "Payment Received",
        color: "bg-green-900/50 text-green-400 border-green-800/50",
        icon: RandIconSimple,
        step: 3,
        description: "Payment in escrow"
      }
    case "IN_PROGRESS":
      // For cash: step 3 (in progress includes payment arrangement)
      // For online: step 4 (payment already secured in escrow)
      return {
        label: "In Progress",
        color: "bg-purple-900/50 text-purple-400 border-purple-800/50",
        icon: Loader2,
        step: paymentMethod === 'CASH' ? 3 : 4,
        description: "Work in progress"
      }
    case "AWAITING_CONFIRMATION":
      return {
        label: paymentMethod === 'CASH' ? "Pay Cash" : "Awaiting Confirmation",
        color: "bg-orange-900/50 text-orange-400 border-orange-800/50",
        icon: AlertCircle,
        step: paymentMethod === 'CASH' ? 4 : 5,
        description: paymentMethod === 'CASH' ? "Payment due to provider" : "Confirm completion"
      }
    case "COMPLETED":
      return {
        label: "Completed",
        color: "bg-green-900/50 text-green-400 border-green-800/50",
        icon: CheckCircle,
        step: paymentMethod === 'CASH' ? 5 : 6,
        description: "Service completed"
      }
    case "CANCELLED":
      return {
        label: "Cancelled",
        color: "bg-red-900/50 text-red-400 border-red-800/50",
        icon: X,
        step: 0,
        description: "Booking cancelled"
      }
    case "DISPUTED":
      return {
        label: "Disputed",
        color: "bg-red-900/50 text-red-400 border-red-800/50",
        icon: AlertTriangle,
        step: 0,
        description: "Under dispute"
      }
    default:
      return {
        label: status.replace("_", " "),
        color: "bg-gray-800 text-gray-400 border-gray-700",
        icon: AlertCircle,
        step: 0,
        description: "Unknown status"
      }
  }
}

const getTimelineSteps = (status: string, hasPayment?: boolean, paymentMethod?: string, payment?: { status?: string } | null) => {
  // For cash: 5 steps (skip Payment step, clearer labels)
  // For online: 6 steps (include Payment/escrow step)
  const allSteps = paymentMethod === 'CASH' 
    ? [
        { id: 1, label: "Booked", icon: Calendar },
        { id: 2, label: "Confirmed", icon: CheckCircle },
        { id: 3, label: "In Progress", icon: Loader2 },
        { id: 4, label: "Pay Cash", icon: AlertCircle },
        { id: 5, label: "Completed", icon: CheckCircle }
      ]
    : [
        { id: 1, label: "Booked", icon: Calendar },
        { id: 2, label: "Confirmed", icon: CheckCircle },
        { id: 3, label: "Payment", icon: RandIconSimple },
        { id: 4, label: "In Progress", icon: Loader2 },
        { id: 5, label: "Awaiting", icon: AlertCircle },
        { id: 6, label: "Completed", icon: CheckCircle }
      ]

  const statusInfo = getStatusInfo(status, hasPayment, paymentMethod)
  let currentStep = statusInfo.step
  
  // Check if payment is in PROCESSING_RELEASE status
  // This indicates that provider completed the job and client confirmed completion
  // Therefore, steps 4 (In Progress) and 5 (Awaiting) should be completed for online payments
  // For cash payments, step 3 (In Progress) should be completed
  const isProcessingRelease = payment?.status === "PROCESSING_RELEASE"
  
  if (isProcessingRelease) {
    // If payment is PROCESSING_RELEASE, ensure appropriate steps are marked as completed
    if (paymentMethod === 'CASH') {
      // For cash: step 3 (In Progress) should be completed
      currentStep = Math.max(currentStep, 3)
    } else {
      // For online: steps 4 (In Progress) and 5 (Awaiting) should be completed
      currentStep = Math.max(currentStep, 5)
    }
  }
  
  return allSteps.map(step => ({
    ...step,
    completed: step.id <= currentStep,
    current: step.id === currentStep
  }))
}

function BookingTimelineItem({ 
  booking, 
  isLast, 
  onBookingClick 
}: { 
  booking: Booking; 
  isLast: boolean;
  onBookingClick?: (booking: Booking) => void;
}) {
  const statusInfo = getStatusInfo(booking.status, !!booking.payment, booking.paymentMethod)
  const StatusIcon = statusInfo.icon
  const timelineSteps = getTimelineSteps(booking.status, !!booking.payment, booking.paymentMethod, booking.payment)
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-700"></div>
      )}
      
      <div 
        className={`flex items-start space-x-4 pb-6 ${onBookingClick ? 'cursor-pointer hover:bg-gray-800/30 rounded-lg p-2 -m-2 transition-colors' : ''}`}
        onClick={() => onBookingClick?.(booking)}
      >
        {/* Status indicator */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          statusInfo.step > 0 ? 'bg-purple-900/50 border-2 border-purple-800/50' : 'bg-gray-800 border-2 border-gray-700'
        }`}>
          <StatusIcon className={`w-5 h-5 ${
            statusInfo.step > 0 ? 'text-purple-400' : 'text-gray-400'
          } ${statusInfo.icon === Loader2 ? 'animate-spin' : ''}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-gray-100 truncate">
                {booking.service.name}
              </h4>
              <Badge className={`text-xs ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowDetails(!showDetails)
              }}
              className="text-gray-400 hover:text-gray-100 hover:bg-gray-800 p-1"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
            </Button>
          </div>

          <div className="flex items-center space-x-4 text-xs text-gray-400 mb-2">
            <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
            <span>•</span>
            <span>{formatBookingPrice(booking)}</span>
            {booking.provider && (
              <>
                <span>•</span>
                <span className="truncate">
                  {booking.provider.businessName || booking.provider.user?.name || 'Provider'}
                </span>
              </>
            )}
          </div>

          {/* Mini timeline */}
          <div className="flex items-center space-x-1 mb-2">
            {timelineSteps.slice(0, 4).map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${
                  step.completed 
                    ? 'bg-purple-400' 
                    : step.current 
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-gray-600'
                }`}></div>
                {index < 3 && (
                  <div className={`w-3 h-0.5 ${
                    timelineSteps[index + 1]?.completed ? 'bg-purple-400' : 'bg-gray-600'
                  }`}></div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500">{statusInfo.description}</p>

          {/* Expandable details */}
          {showDetails && (
            <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400">Service:</span>
                  <p className="text-gray-200">{booking.service.category?.name || 'No Category'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Scheduled:</span>
                  <p className="text-gray-200">
                    {new Date(booking.scheduledDate).toLocaleString()}
                  </p>
                </div>
                {booking.payment && (
                  <div>
                    <span className="text-gray-400">Payment:</span>
                    <p className="text-gray-200">
                      {booking.payment.status} - R{(booking.payment.amount || 0).toFixed(2)}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Created:</span>
                  <p className="text-gray-200">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function BookingTimeline({ 
  bookings, 
  className = "", 
  maxItems = 5, 
  showViewAll = true,
  onBookingClick
}: BookingTimelineProps) {
  const [showAll, setShowAll] = useState(false)
  
  // Sort bookings by creation date (most recent first)
  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  
  const displayBookings = showAll ? sortedBookings : sortedBookings.slice(0, maxItems)
  const hasMore = sortedBookings.length > maxItems

  if (bookings.length === 0) {
    return (
      <Card className={`bg-gray-900 border-gray-800 rounded-xl shadow-lg ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-100 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
            Booking Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-100 mb-2">No bookings yet</h3>
            <p className="text-xs text-gray-400 mb-4">Your booking timeline will appear here</p>
            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700" asChild>
              <a href="/book-service">Book Your First Service</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-100 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
            Booking Timeline
          </CardTitle>
          {showViewAll && hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
            >
              {showAll ? 'Show Less' : `View All (${sortedBookings.length})`}
              <Eye className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-400">Track your service booking progress</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-0">
          {displayBookings.map((booking, index) => (
            <BookingTimelineItem
              key={booking.id}
              booking={booking}
              isLast={index === displayBookings.length - 1}
              onBookingClick={onBookingClick}
            />
          ))}
        </div>
        
        {showViewAll && hasMore && !showAll && (
          <div className="text-center pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(true)}
              className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700"
            >
              Show {sortedBookings.length - maxItems} More Bookings
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for smaller spaces
export function CompactBookingTimeline({ bookings, className = "" }: { bookings: Booking[]; className?: string }) {
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  if (bookings.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3 mb-3">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-medium text-gray-100">Recent Activity</h4>
        </div>
        <p className="text-xs text-gray-400">No recent bookings</p>
      </div>
    )
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-medium text-gray-100">Recent Activity</h4>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-purple-400 hover:text-purple-300 p-1" asChild>
          <a href="/bookings">View All</a>
        </Button>
      </div>
      
      <div className="space-y-3">
        {recentBookings.map((booking) => {
          const statusInfo = getStatusInfo(booking.status, booking.payment)
          const StatusIcon = statusInfo.icon
          
          return (
            <div key={booking.id} className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                statusInfo.step > 0 ? 'bg-purple-900/50' : 'bg-gray-700'
              }`}>
                <StatusIcon className={`w-3 h-3 ${
                  statusInfo.step > 0 ? 'text-purple-400' : 'text-gray-400'
                } ${statusInfo.icon === Loader2 ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-100 truncate">
                  {booking.service.name}
                </p>
                <p className="text-xs text-gray-400">
                  {statusInfo.description} • {new Date(booking.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge className={`text-xs ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
            </div>
          )
        })}
      </div>
    </div>
  )
}