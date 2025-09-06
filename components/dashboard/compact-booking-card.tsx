"use client"

import { useState } from "react"
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
import { StatusBadge } from "@/components/ui/status-badge"
import { PaymentStatusDisplay } from "@/components/ui/payment-status-display"

interface Booking {
  id: string
  service: {
    name: string
    category: string
  }
  provider?: {
    businessName: string
    user: {
      phone?: string
    }
  }
  scheduledDate: string
  address: string
  totalAmount: number
  status: string
  createdAt: string
  payment?: {
    id: string
    amount: number
    status: string
    createdAt?: string
  }
  review?: {
    id: string
    rating: number
    comment: string
  }
}

interface CompactBookingCardProps {
  booking: Booking
  onUpdate: () => void
}

export function CompactBookingCard({ booking, onUpdate }: CompactBookingCardProps) {
  const [showActionsModal, setShowActionsModal] = useState(false)
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [isPaymentInProgress, setIsPaymentInProgress] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  const isRecent = () => {
    const now = new Date()
    const created = new Date(booking.createdAt)
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
  }

  const timelineSteps = getTimelineSteps(booking.status, booking.payment)
  
  // Enhanced payment status checking with better logic
  const hasPayment = booking.payment && ['ESCROW', 'HELD_IN_ESCROW', 'RELEASED', 'COMPLETED'].includes(booking.payment.status)
  const isPaymentProcessing = booking.payment && ['PENDING'].includes(booking.payment.status)
  const isPaymentFailed = booking.payment && ['FAILED'].includes(booking.payment.status)
  const isPaymentInEscrow = booking.payment && ['ESCROW', 'HELD_IN_ESCROW'].includes(booking.payment.status)

  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status)
  const canPay = (booking.status === "CONFIRMED") && !booking.payment
  const canMessage = booking.provider && ["CONFIRMED", "IN_PROGRESS"].includes(booking.status)
  const canConfirmCompletion = booking.status === "AWAITING_CONFIRMATION"
  const canDispute = ["COMPLETED", "CANCELLED"].includes(booking.status) && !booking.review

  const handlePay = async () => {
    if (!booking.payment) {
      setIsPaymentInProgress(true)
      try {
        const result = await processPayment(booking.id, booking.totalAmount)
        await handlePaymentResult(result, booking.id, onUpdate)
      } catch (error) {
        console.error("Payment error:", error)
        showToast.error("Payment failed. Please try again.")
      } finally {
        setIsPaymentInProgress(false)
      }
    }
  }

  const handleConfirmCompletion = async () => {
    try {
      const response = await fetch(`/api/book-service/${booking.id}/confirm-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        showToast.success("Completion confirmed! Payment will be released to the provider.")
        onUpdate()
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
    setShowActionsModal(true)
  }

  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/book-service/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        showToast.success("Booking cancelled successfully")
        onUpdate()
        setShowCancelConfirmation(false)
      } else {
        const errorData = await response.json()
        showToast.error(errorData.error || "Failed to cancel booking")
      }
    } catch (error) {
      console.error("Cancel error:", error)
      showToast.error("Network error. Please try again.")
    }
  }

  const handleCheckStatus = async () => {
    setIsProcessingPayment(true)
    try {
      const response = await fetch(`/api/book-service/${booking.id}/payment-status`, {
        method: 'GET',
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.status && data.status !== booking.payment?.status) {
          showToast.success("Payment status updated!")
          onUpdate()
        } else {
          showToast.info("Payment status is up to date")
        }
      }
    } catch (error) {
      console.error("Check status error:", error)
      showToast.error("Failed to check payment status")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  return (
    <>
      <Card className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500" data-booking-id={booking.id}>
        <CardContent className="p-3 sm:p-4 md:p-6 lg:p-8">
          {/* Header - Enhanced for Large Screens */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl truncate">{booking.service.name}</h3>
                  {isRecent() && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-1 py-0 sm:px-2 sm:py-1 md:px-3 md:py-1">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 truncate">{booking.service.category}</p>
              </div>
            </div>
            <StatusBadge 
              status={booking.status} 
              type="booking" 
              size="sm"
            />
          </div>

          {/* Timeline - Enhanced for Large Screens */}
          <div className="mb-3 sm:mb-4 md:mb-6">
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 mb-2 md:mb-3">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-500" />
              <span className="text-xs sm:text-sm md:text-base font-medium text-gray-700">Progress</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 overflow-x-auto">
              {timelineSteps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs md:text-sm font-medium ${
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step.completed ? '✓' : index + 1}
                  </div>
                  <span className={`text-xs sm:text-sm md:text-base ml-1 sm:ml-2 md:ml-3 whitespace-nowrap ${
                    step.completed ? 'text-green-600 font-medium' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                  {index < timelineSteps.length - 1 && (
                    <div className={`w-4 sm:w-6 md:w-8 h-0.5 mx-1 sm:mx-2 md:mx-3 ${
                      timelineSteps[index + 1].completed ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status Display */}
          <PaymentStatusDisplay
            payment={booking.payment}
            isProcessing={isProcessingPayment}
            onCheckStatus={handleCheckStatus}
          />
          
          {/* Details - Enhanced Grid for Large Screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4 md:mb-6">
            <div className="space-y-1 sm:space-y-2 md:space-y-3">
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 text-xs sm:text-sm md:text-base">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" />
                <span className="text-gray-700 truncate">
                  {new Date(booking.scheduledDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 text-xs sm:text-sm md:text-base">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" />
                <span className="text-gray-700">
                  {new Date(booking.scheduledDate).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2 md:space-y-3">
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 text-xs sm:text-sm md:text-base">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" />
                <span className="text-gray-700 truncate">{booking.address}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm md:text-base">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-900">R{booking.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            {/* Additional info column for large screens */}
            <div className="hidden lg:block space-y-1 md:space-y-3">
              {booking.provider && (
                <div className="flex items-center space-x-1 md:space-x-3 text-xs sm:text-sm md:text-base">
                  <span className="text-gray-600">Provider:</span>
                  <span className="text-gray-700 truncate">{booking.provider.businessName}</span>
                </div>
              )}
              <div className="flex items-center space-x-1 md:space-x-3 text-xs sm:text-sm md:text-base">
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-700">
                  {new Date(booking.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Enhanced for Large Screens */}
          <div className="pt-3 sm:pt-4 md:pt-6 border-t border-gray-100">
            {/* Primary Actions Row */}
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowActionsModal(true)}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                </Button>
                {canMessage && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4"
                    onClick={() => {
                      showToast.info('Messaging feature coming soon! You can contact your provider directly.')
                    }}
                  >
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </Button>
                )}
                {booking.provider?.user.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4"
                    onClick={() => {
                      window.open(`tel:${booking.provider.user.phone}`, '_blank')
                    }}
                  >
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </Button>
                )}
              </div>
              
              {/* Payment Status Badges */}
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                {hasPayment && (
                  <StatusBadge 
                    status="COMPLETED" 
                    type="payment" 
                    size="sm"
                    showIcon={false}
                    className="text-green-600 border-green-200 text-xs px-1 py-0 sm:px-2 sm:py-1 md:px-3 md:py-1"
                  />
                )}
                {isPaymentInEscrow && (
                  <StatusBadge 
                    status="ESCROW" 
                    type="payment" 
                    size="sm"
                    showIcon={false}
                    className="text-blue-600 border-blue-200 text-xs px-1 py-0 sm:px-2 sm:py-1 md:px-3 md:py-1"
                  />
                )}
              </div>
            </div>
            
            {/* Secondary Actions Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                {canCancel && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowCancelConfirmation(true)}
                    className="text-red-600 border-red-200 hover:bg-red-50 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </Button>
                )}
                {canDispute && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDispute}
                    className="text-red-600 border-red-200 hover:bg-red-50 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4"
                  >
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-gray-500 hover:text-gray-700 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4"
                >
                  <span className="text-xs sm:text-sm md:text-base">
                    {showDetails ? 'Hide' : 'Details'}
                  </span>
                </Button>
              </div>
              
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                {canPay && (
                  <Button 
                    size="sm" 
                    onClick={handlePay} 
                    className="bg-green-600 hover:bg-green-700 h-8 sm:h-9 md:h-10 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base"
                    disabled={isPaymentInProgress}
                  >
                    {isPaymentInProgress ? (
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 animate-spin" />
                    ) : (
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1" />
                    )}
                    {isPaymentInProgress ? "Processing..." : "Pay"}
                  </Button>
                )}
                
                {canConfirmCompletion && (
                  <Button 
                    size="sm" 
                    onClick={handleConfirmCompletion} 
                    className="bg-orange-600 hover:bg-orange-700 h-8 sm:h-9 md:h-10 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base"
                  >
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1" />
                    Confirm
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Expandable Details - Enhanced for Large Screens */}
          {showDetails && (
            <div className="mt-3 sm:mt-4 md:mt-6 pt-3 sm:pt-4 md:pt-6 border-t border-gray-100">
              <div className="space-y-2 sm:space-y-3 md:space-y-4 text-xs sm:text-sm md:text-base text-gray-600">
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span>Created: {new Date(booking.createdAt).toLocaleDateString()} at{' '}
                    {new Date(booking.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                {booking.provider && (
                  <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                    <span className="font-medium">Provider:</span>
                    <span className="truncate">{booking.provider.businessName}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <BookingActionsModal
        isOpen={showActionsModal}
        onClose={() => setShowActionsModal(false)}
        booking={booking}
        onUpdate={onUpdate}
      />

      <ConfirmationDialog
        isOpen={showCancelConfirmation}
        onClose={() => setShowCancelConfirmation(false)}
        onConfirm={handleCancel}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
      />

      {booking.review && (
        <ReviewSection
          review={booking.review}
          onUpdate={onUpdate}
        />
      )}
    </>
  )
}

// Helper function for timeline steps
function getTimelineSteps(status: string, payment: any) {
  const steps = [
    { id: 'booked', label: 'Booked', completed: true },
    { id: 'confirmed', label: 'Confirmed', completed: ['CONFIRMED', 'PENDING_EXECUTION', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED'].includes(status) },
    { id: 'paid', label: 'Paid', completed: payment && ['ESCROW', 'HELD_IN_ESCROW', 'RELEASED', 'COMPLETED'].includes(payment.status) },
    { id: 'in_progress', label: 'In Progress', completed: ['IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED'].includes(status) },
    { id: 'completed', label: 'Completed', completed: status === 'COMPLETED' }
  ]
  
  return steps
}
