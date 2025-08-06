"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Clock, MapPin, DollarSign, X, Edit, MessageCircle, Phone, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { ReviewSection } from "@/components/review-section"
import { BookingActionsModal } from "./booking-actions-modal"
import { showToast, handleApiError } from "@/lib/toast"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { processPayment, handlePaymentResult } from "@/lib/payment-utils"

interface Booking {
  id: string
  service: {
    name: string
    category: string
  }
  provider?: {
    id: string
    businessName: string
    user: {
      name: string
      phone?: string
    }
  } | null
  scheduledDate: Date
  totalAmount: number
  status: string
  address: string
  description?: string | null
  payment?: {
    id: string
    amount: number
    status: string
  } | null
  review?: {
    id: string
    rating: number
    comment?: string | null
  } | null
}

interface EnhancedBookingCardProps {
  booking: Booking
  onStatusChange?: (bookingId: string, newStatus: string) => void
}

const getStatusInfo = (status: string, hasPayment?: boolean) => {
  switch (status) {
    case "PENDING":
      return {
        label: "Waiting for Provider",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        description: "We're finding the best provider for you"
      }
    case "CONFIRMED":
      if (hasPayment) {
        return {
          label: "Confirmed & Paid",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
          description: "Payment completed - waiting for provider to start"
        }
      }
      return {
        label: "Confirmed",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: CheckCircle,
        description: "Provider has confirmed your booking"
      }
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Loader2,
        description: "Provider is working on your service"
      }
    case "COMPLETED":
      return {
        label: "Completed",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        description: "Service has been completed"
      }
    case "CANCELLED":
      return {
        label: "Cancelled",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: X,
        description: "Booking has been cancelled"
      }
    default:
      return {
        label: status.replace("_", " "),
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: AlertCircle,
        description: "Unknown status"
      }
  }
}

const getTimelineSteps = (status: string, hasPayment?: boolean) => {
  const steps = [
    { id: "booked", label: "Booked", completed: true },
    { id: "confirmed", label: "Confirmed", completed: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(status) },
    { id: "payment", label: "Payment Completed", completed: hasPayment && ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(status) },
    { id: "in_progress", label: "In Progress", completed: ["IN_PROGRESS", "COMPLETED"].includes(status) },
    { id: "completed", label: "Completed", completed: status === "COMPLETED" }
  ]
  
  if (status === "CANCELLED") {
    return steps.map(step => ({ ...step, completed: step.id === "booked" }))
  }
  
  return steps
}

export function EnhancedBookingCard({ booking, onStatusChange }: EnhancedBookingCardProps) {
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showActionsModal, setShowActionsModal] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const statusInfo = getStatusInfo(booking.status, booking.payment)
  const StatusIcon = statusInfo.icon
  const timelineSteps = getTimelineSteps(booking.status, booking.payment)

  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/book-service/${booking.id}/cancel`, { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        showToast.success(data.message || "Booking cancelled successfully");
        onStatusChange?.(booking.id, "CANCELLED");
      } else {
        await handleApiError(response, "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Cancel booking error:", error);
      showToast.error("Network error. Please try again.");
    }
  }

  const handlePay = async () => {
    setIsProcessingPayment(true)
    try {
      const result = await processPayment(booking.id)
      handlePaymentResult(result, onStatusChange, booking.id)
      // Refresh the page or trigger a re-fetch to update the payment state
      if (result.success) {
        window.location.reload() // Simple solution for now
      }
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status)
  const canPay = booking.status === "CONFIRMED" && !booking.payment
  const hasPayment = booking.payment // Remove the status check, only check payment flag
  const canMessage = booking.provider && ["CONFIRMED", "IN_PROGRESS"].includes(booking.status)

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500" data-booking-id={booking.id}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{booking.service.name}</h3>
                <p className="text-sm text-gray-600">{booking.service.category}</p>
              </div>
            </div>
            <Badge className={`${statusInfo.color} border`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>

          {/* Timeline */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Booking Timeline</span>
            </div>
            <div className="flex items-center space-x-2">
              {timelineSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step.completed ? '✓' : index + 1}
                  </div>
                  <span className={`text-xs ml-1 ${
                    step.completed ? 'text-green-600 font-medium' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                  {index < timelineSteps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      timelineSteps[index + 1].completed ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {new Date(booking.scheduledDate).toLocaleDateString()}
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
                <span className="font-semibold text-gray-900">R{booking.totalAmount.toFixed(2)}</span>
              </div>
              {hasPayment && (
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 font-medium">Payment Completed</span>
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
                onClick={() => setShowActionsModal(true)}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <Edit className="w-4 h-4 mr-1" />
                Actions
              </Button>
              {canMessage && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => {
                    showToast.info('Messaging feature coming soon! You can contact your provider directly.')
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Message
                </Button>
              )}
              {booking.provider?.user.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => {
                    window.open(`tel:${booking.provider.user.phone}`, '_blank')
                  }}
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {canPay && (
                <Button 
                  size="sm" 
                  onClick={handlePay} 
                  className="bg-green-600 hover:bg-green-700 pay-button"
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <DollarSign className="w-4 h-4 mr-1" />
                  )}
                  {isProcessingPayment ? "Processing..." : "Pay Now"}
                </Button>
              )}
              
              {hasPayment && (
                <Badge variant="secondary" className="text-green-600 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Paid
                </Badge>
              )}
              
              {canCancel && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowCancelConfirmation(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              )}
              
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowDetails(!showDetails)}
              >
                <Edit className="w-4 h-4 mr-1" />
                {showDetails ? 'Hide' : 'Details'}
              </Button>
            </div>
          </div>

          {/* Expandable Details */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              {booking.description && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Notes:</span>
                  <p className="text-sm text-gray-600 mt-1">{booking.description}</p>
                </div>
              )}
              
              {booking.provider && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Provider Details:</span>
                  <div className="mt-1 text-sm text-gray-600">
                    <p>Name: {booking.provider.user.name}</p>
                    <p>Business: {booking.provider.businessName}</p>
                    {booking.provider.user.phone && (
                      <p>Phone: {booking.provider.user.phone}</p>
                    )}
                  </div>
                </div>
              )}
              
              {booking.payment && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Payment Details:</span>
                  <div className="mt-1 text-sm text-gray-600">
                    <p>Amount: R{booking.payment.amount.toFixed(2)}</p>
                    <p>Status: {booking.payment.status}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Review Section for completed bookings */}
          {booking.status === "COMPLETED" && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <ReviewSection
                bookingId={booking.id}
                existingReview={booking.review}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Booking Actions Modal */}
      <BookingActionsModal
        booking={booking}
        isOpen={showActionsModal}
        onClose={() => setShowActionsModal(false)}
        onUpdate={(bookingId, updates) => {
          onStatusChange?.(bookingId, updates.status || booking.status)
          setShowActionsModal(false)
        }}
      />
      
      {/* New Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCancelConfirmation}
        onClose={() => setShowCancelConfirmation(false)}
        onConfirm={handleCancel}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        variant="destructive"
        loadingText="Cancelling..."
      />
    </>
  )
} 