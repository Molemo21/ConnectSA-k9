"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Clock, MapPin, DollarSign, X, Edit, MessageCircle, Phone, CheckCircle, Loader2, AlertCircle, AlertTriangle } from "lucide-react"
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
    createdAt?: string // Add creation date for payment
  } | null
  review?: {
    id: string
    rating: number
    comment?: string | null
  } | null
  createdAt: Date // Add creation date
}

interface EnhancedBookingCardProps {
  booking: Booking
  onStatusChange?: (bookingId: string, newStatus: string) => void
  onRefresh?: (bookingId: string) => Promise<void>
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
    case "PENDING_EXECUTION":
      return {
        label: "Payment Received",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        description: "Payment completed - funds held in escrow, waiting for execution"
      }
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Loader2,
        description: "Provider is working on your service"
      }
    case "AWAITING_CONFIRMATION":
      return {
        label: "Awaiting Confirmation",
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: AlertCircle,
        description: "Provider has completed the job. Please confirm completion to release payment."
      }
    case "COMPLETED":
      return {
        label: "Completed",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        description: "Service has been completed and payment released"
      }
    case "CANCELLED":
      return {
        label: "Cancelled",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: X,
        description: "Booking has been cancelled"
      }
    case "DISPUTED":
      return {
        label: "Disputed",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: AlertTriangle,
        description: "A dispute has been raised for this booking"
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
    { id: "confirmed", label: "Provider Confirmed", completed: ["CONFIRMED", "PENDING_EXECUTION", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"].includes(status) },
    { id: "payment", label: "Payment Processing", completed: hasPayment && ["PENDING_EXECUTION", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"].includes(status) },
    { id: "in_progress", label: "In Progress", completed: ["IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"].includes(status) },
    { id: "awaiting_confirmation", label: "Awaiting Confirmation", completed: ["AWAITING_CONFIRMATION", "COMPLETED"].includes(status) },
    { id: "completed", label: "Completed", completed: status === "COMPLETED" }
  ]
  
  // Handle special cases
  if (status === "CANCELLED") {
    return steps.map(step => ({ ...step, completed: step.id === "booked" }))
  }
  
  if (status === "DISPUTED") {
    return steps.map(step => ({ ...step, completed: ["booked", "confirmed", "payment"].includes(step.id) }))
  }
  
  return steps
}

export function EnhancedBookingCard({ booking, onStatusChange, onRefresh }: EnhancedBookingCardProps) {
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showActionsModal, setShowActionsModal] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  // Check if booking is recent (created within last 24 hours)
  const isRecent = () => {
    if (!booking.createdAt) return false
    const now = new Date()
    const created = new Date(booking.createdAt)
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
  }

  const statusInfo = getStatusInfo(booking.status, booking.payment)
  const StatusIcon = statusInfo.icon
  const timelineSteps = getTimelineSteps(booking.status, booking.payment)
  
  // Enhanced payment status checking with better logic
  const hasPayment = booking.payment && ['ESCROW', 'HELD_IN_ESCROW', 'RELEASED', 'COMPLETED'].includes(booking.payment.status)
  const isPaymentProcessing = booking.payment && ['PENDING'].includes(booking.payment.status)
  const isPaymentFailed = booking.payment && ['FAILED'].includes(booking.payment.status)
  const isPaymentInEscrow = booking.payment && ['ESCROW', 'HELD_IN_ESCROW'].includes(booking.payment.status)

  // Check if payment is stuck in processing state (more than 8 minutes)
  const isPaymentStuck = () => {
    if (!booking.payment || !isPaymentProcessing) return false
    if (!booking.payment.createdAt) return false
    
    const now = new Date()
    const created = new Date(booking.payment.createdAt)
    const minutesDiff = (now.getTime() - created.getTime()) / (1000 * 60)
    
    // More user-friendly: only show warning after 8 minutes (instead of 5)
    // This gives more time for normal webhook processing
    return minutesDiff > 8
  }

  // Check if payment is taking longer than expected (but not necessarily stuck)
  const isPaymentDelayed = () => {
    if (!booking.payment || !isPaymentProcessing) return false
    if (!booking.payment.createdAt) return false
    
    const now = new Date()
    const created = new Date(booking.payment.createdAt)
    const minutesDiff = (now.getTime() - created.getTime()) / (1000 * 60)
    
    // Show gentle warning after 5 minutes
    return minutesDiff > 5 && minutesDiff <= 8
  }

  // Use the provided refresh function instead of making direct API calls
  const handleCheckStatus = async () => {
    if (onRefresh) {
      try {
        await onRefresh(booking.id)
        showToast.success("Payment status checked successfully!")
      } catch (error) {
        showToast.error("Unable to check payment status. Please try again.")
      }
    }
  }

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
    // Prevent multiple payment attempts
    if (isProcessingPayment) {
      showToast.warning("Payment is already being processed. Please wait.")
      return
    }

    setIsProcessingPayment(true)
    setPaymentStatus('PENDING')
    
    try {
      const result = await processPayment(booking.id)
      
      if (result.success && result.shouldRedirect) {
        // Payment gateway is ready, user will be redirected
        showToast.success("Payment gateway opened in new tab. Please complete your payment there.")
        
        // Set a timeout to reset processing state if no webhook update
        setTimeout(() => {
          if (isPaymentProcessing) {
            setIsProcessingPayment(false)
            setPaymentStatus(null)
            showToast.info("Payment processing timeout. Please check your payment status.")
          }
        }, 300000) // 5 minutes timeout
        
      } else if (result.success) {
        // Payment processed without redirect (e.g., already paid)
        handlePaymentResult(result, onStatusChange, booking.id)
        setPaymentStatus('COMPLETED')
        setIsProcessingPayment(false)
        
        // Only refresh if payment was actually completed
        if (result.bookingStatus === "PENDING_EXECUTION") {
          window.location.reload()
        }
      } else {
        // Payment failed
        showToast.error(result.message || "Payment failed. Please try again.")
        setPaymentStatus('FAILED')
        setIsProcessingPayment(false)
      }
    } catch (error) {
      console.error("Payment error:", error)
      showToast.error("Network error. Please try again.")
      setPaymentStatus('FAILED')
      setIsProcessingPayment(false)
    }
  }

  // Enhanced payment status display
  const renderPaymentStatus = () => {
    if (isPaymentProcessing && isProcessingPayment) {
      return (
        <div className="flex items-center space-x-2 text-sm">
          <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
          <span className="text-orange-600 font-medium">Processing Payment...</span>
        </div>
      )
    }
    
    if (isPaymentProcessing && isPaymentStuck()) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-amber-800">Payment Status Update Needed</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCheckStatus}
                  className="text-xs h-6 px-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Check Status
                </Button>
              </div>
              <p className="text-xs text-amber-700 mb-2">
                Your payment may have been completed but our system needs to sync. This usually resolves automatically.
              </p>
              <div className="text-xs text-amber-600 space-y-1">
                <p>• <strong>Try this first:</strong> Click "Check Status" above</p>
                <p>• <strong>If that doesn't work:</strong> Refresh the page</p>
                <p>• <strong>Still stuck?</strong> Your payment is likely fine - wait 10-15 minutes</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    if (isPaymentProcessing && isPaymentDelayed()) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-blue-800 mb-2 block">Payment Taking Longer Than Expected</span>
              <p className="text-xs text-blue-700 mb-2">
                Your payment is still processing. This is normal and may take a few more minutes.
              </p>
              <div className="text-xs text-blue-600 space-y-1">
                <p>• <strong>What's happening:</strong> We're waiting for payment confirmation</p>
                <p>• <strong>This is normal:</strong> Payments can take 2-8 minutes to process</p>
                <p>• <strong>No action needed:</strong> Just wait a bit longer</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    if (isPaymentProcessing) {
      return (
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-600 font-medium">Awaiting Payment Confirmation</span>
        </div>
      )
    }
    
    if (isPaymentFailed) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-red-800 mb-2 block">Payment Failed</span>
              <p className="text-xs text-red-700 mb-2">
                Your payment couldn't be processed. This is usually temporary.
              </p>
              <div className="text-xs text-red-600 space-y-1">
                <p>• <strong>Try again:</strong> Click "Pay Now" below</p>
                <p>• <strong>Check:</strong> Your payment method and internet connection</p>
                <p>• <strong>Contact us:</strong> Only if the issue persists after multiple attempts</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    if (hasPayment) {
      return (
        <div className="flex items-center space-x-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-600 font-medium">Payment Completed</span>
        </div>
      )
    }
    
    if (isPaymentInEscrow) {
      return (
        <div className="flex items-center space-x-2 text-sm">
          <DollarSign className="w-4 h-4 text-blue-500" />
          <span className="text-blue-600 font-medium">Payment in Escrow - Provider Can Start Work</span>
        </div>
      )
    }
    
    return null
  }

  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status)
  const canPay = (booking.status === "CONFIRMED") && !booking.payment
  const canMessage = booking.provider && ["CONFIRMED", "IN_PROGRESS"].includes(booking.status)
  const canConfirmCompletion = booking.status === "AWAITING_CONFIRMATION"
  const canDispute = ["IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"].includes(booking.status)
  
  // Prevent payment if already processing or stuck
  const isPaymentInProgress = isProcessingPayment || isPaymentStuck()

  const handleConfirmCompletion = async () => {
    try {
      const response = await fetch(`/api/book-service/${booking.id}/release-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      
      if (response.ok) {
        const data = await response.json()
        showToast.success(data.message || "Job completion confirmed! Payment will be released to provider.")
        onStatusChange?.(booking.id, "COMPLETED")
        // Refresh the page to update the status
        window.location.reload()
      } else {
        const errorData = await response.json()
        showToast.error(errorData.error || "Failed to confirm completion")
      }
    } catch (error) {
      console.error("Confirm completion error:", error)
      showToast.error("Network error. Please try again.")
    }
  }

  const handleDispute = async () => {
    // This will open the dispute modal in the actions modal
    setShowActionsModal(true)
  }

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
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900 text-lg">{booking.service.name}</h3>
                  {isRecent() && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                      New
                    </Badge>
                  )}
                </div>
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

          {/* Payment Status Display */}
          {renderPaymentStatus()}
          
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
              {booking.createdAt && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    Created: {new Date(booking.createdAt).toLocaleDateString()} at{' '}
                    {new Date(booking.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              )}
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
                  disabled={isPaymentInProgress}
                >
                  {isPaymentInProgress ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <DollarSign className="w-4 h-4 mr-1" />
                  )}
                  {isPaymentInProgress ? "Processing..." : "Pay Now"}
                </Button>
              )}
              
              {canConfirmCompletion && (
                <Button 
                  size="sm" 
                  onClick={handleConfirmCompletion} 
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Confirm Completion
                </Button>
              )}
              
              {canDispute && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleDispute}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Dispute
                </Button>
              )}
              
              {hasPayment && (
                <Badge variant="secondary" className="text-green-600 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Payment Received
                </Badge>
              )}
              
              {isPaymentInEscrow && (
                <Badge variant="secondary" className="text-blue-600 border-blue-200">
                  <DollarSign className="w-3 h-3 mr-1" />
                  Payment in Escrow
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
          {(booking.status === "COMPLETED" || booking.status === "AWAITING_CONFIRMATION") && (
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