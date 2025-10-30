"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  Play, 
  Phone, 
  MessageCircle, 
  Eye,
  Star,
  User,
  FileText
} from "lucide-react"

interface Booking {
  id: string
  service: {
    name: string
    category: string
  }
  client: {
    id: string
    name: string
    email: string
    phone?: string
  }
  scheduledDate: string
  totalAmount: number
  status: string
  address: string
  description?: string
  payment?: {
    id: string
    amount: number
    status: string
  }
  review?: {
    id: string
    rating: number
    comment?: string
  }
}

interface ProviderBookingCardProps {
  booking: Booking
  onAccept?: () => void
  onDecline?: () => void
  onStart?: () => void
  onComplete?: () => void
  onViewDetails?: () => void
  onMessage?: () => void
  onCall?: () => void
  showStartButton?: boolean
  showCompleteButton?: boolean
  showReview?: boolean
}

const getStatusInfo = (status: string, hasPayment?: boolean) => {
  switch (status) {
    case "PENDING":
      return {
        label: "Pending",
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: Clock,
        description: "Waiting for your response"
      }
    case "CONFIRMED":
      if (hasPayment) {
        return {
          label: "Confirmed & Payment Received",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
          description: "Ready to start"
        }
      }
      return {
        label: "Confirmed",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: CheckCircle,
        description: "Waiting for payment"
      }
    case "PENDING_EXECUTION":
      return {
        label: "Payment Received",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: Play,
        description: "Payment completed - you can start the job now!"
      }
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Play,
        description: "Currently working"
      }
    case "COMPLETED":
      return {
        label: "Completed",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        description: "Job finished"
      }
    default:
      return {
        label: status.replace("_", " "),
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Clock,
        description: "Unknown status"
      }
  }
}

export function ProviderBookingCard({
  booking,
  onAccept,
  onDecline,
  onStart,
  onComplete,
  onViewDetails,
  onMessage,
  onCall,
  showStartButton = false,
  showCompleteButton = false,
  showReview = false
}: ProviderBookingCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const hasPaymentInEscrowOrBeyond = !!booking.payment && ['ESCROW', 'HELD_IN_ESCROW', 'RELEASED', 'COMPLETED'].includes(booking.payment.status)
  const statusInfo = getStatusInfo(booking.status, hasPaymentInEscrowOrBeyond)
  const StatusIcon = statusInfo.icon

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg">{booking.service?.name || 'Unknown Service'}</h3>
              <p className="text-xs sm:text-sm text-gray-600">{booking.service?.category || 'No Category'}</p>
            </div>
          </div>
          <Badge className={`${statusInfo.color} border text-xs`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>

        {/* Client Info */}
        <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm sm:text-base">{booking.client?.name || 'Unknown Client'}</p>
                <p className="text-xs sm:text-sm text-gray-600">{booking.client?.email || 'No Email'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {booking.client.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCall}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 text-xs"
                >
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Call
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={onMessage}
                className="text-green-600 border-green-200 hover:bg-green-50 h-8 text-xs"
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Message
              </Button>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'No Date'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                {new Date(booking.scheduledDate).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            <div className="flex items-start space-x-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <span className="text-gray-700">{booking.address}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-gray-900">R{booking.totalAmount?.toFixed(2) || '0.00'}</span>
            </div>
            {hasPaymentInEscrowOrBeyond && (
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">Payment Received</span>
              </div>
            )}
            {showReview && booking.review && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700">{booking.review?.rating || 0}/5 stars</span>
                </div>
                {booking.review.comment && (
                  <p className="text-xs text-gray-600 line-clamp-2">“{booking.review.comment}”</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onViewDetails}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Eye className="w-4 h-4 mr-1" />
              Details
            </Button>
            {booking.description && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                className="text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                <FileText className="w-4 h-4 mr-1" />
                Notes
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {onAccept && onDecline && (
              <>
                <Button size="sm" onClick={onAccept} className="bg-green-600 hover:bg-green-700">
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={onDecline}>
                  Decline
                </Button>
              </>
            )}
            
            {showStartButton && onStart && (
              <Button size="sm" onClick={onStart} className="bg-purple-600 hover:bg-purple-700">
                <Play className="w-4 h-4 mr-1" />
                Start Job
              </Button>
            )}
            
            {showCompleteButton && onComplete && (
              <Button size="sm" onClick={onComplete} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-1" />
                Complete Job
              </Button>
            )}
          </div>
        </div>

        {/* Expandable Details */}
        {showDetails && booking.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h5 className="font-semibold text-gray-900 mb-2">Client Notes</h5>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              {booking.description}
            </p>
          </div>
        )}

        {/* Review Section */}
        {showReview && booking.review && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h5 className="font-semibold text-gray-900 mb-2">Client Review</h5>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                {[...Array(booking.review.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {booking.review?.rating || 0}/5 stars
                </span>
              </div>
              {booking.review.comment && (
                <p className="text-sm text-gray-700">{booking.review?.comment || 'No comment'}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 