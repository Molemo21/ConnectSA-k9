"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar, Clock, MapPin, X, Edit, MessageCircle, Phone, CheckCircle, Loader2, AlertCircle, AlertTriangle, RefreshCw, HelpCircle, Info } from "lucide-react"
import { ReviewSection } from "@/components/review-section"
import { BookingActionsModal } from "./booking-actions-modal"
import { showToast, handleApiError } from "@/lib/toast"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { processPayment, handlePaymentResult } from "@/lib/payment-utils"
import { RandIconSimple } from "@/components/ui/rand-icon"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatSADate, formatSATime } from '@/lib/date-utils'
import { PaymentStatusDisplay } from "@/components/ui/payment-status-display"
import { formatBookingPrice } from '@/lib/price-utils'
import { getTimelineSteps } from '@/lib/booking-timeline-utils'

interface Booking {
  id: string
  service: {
    name: string
    category: {
      id: string
      name: string
      description?: string
      icon?: string
    }
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
  paymentMethod?: "ONLINE" | "CASH"
  // Catalogue pricing fields (for accurate price display)
  bookedPrice?: number | null
  bookedCurrency?: string | null
  catalogueItemId?: string | null
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
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  const isRecent = () => {
    const now = new Date()
    const created = new Date(booking.createdAt)
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
  }

  const timelineSteps = getTimelineSteps(booking.status, booking.payment, booking.paymentMethod)
  
  // Enhanced payment status checking with better logic
  const hasPayment = booking.payment && ['ESCROW', 'HELD_IN_ESCROW', 'RELEASED', 'COMPLETED'].includes(booking.payment.status)
  const isPaymentProcessing = booking.payment && ['PENDING'].includes(booking.payment.status)
  const isPaymentFailed = booking.payment && ['FAILED'].includes(booking.payment.status)
  const isPaymentInEscrow = booking.payment && ['ESCROW', 'HELD_IN_ESCROW'].includes(booking.payment.status)

  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status)
  const canPay = (booking.status === "CONFIRMED") && (!booking.payment || booking.payment.status === 'PENDING' || booking.payment.status === 'FAILED')
  const canMessage = booking.provider && ["CONFIRMED", "IN_PROGRESS"].includes(booking.status)
  // Enhanced completion logic with better status detection
  const canConfirmCompletion = () => {
    // Don't show if payment is already released
    if (booking.payment && ["RELEASED", "COMPLETED"].includes(booking.payment.status)) {
      return false
    }
    
    if (booking.status === "AWAITING_CONFIRMATION") {
      // For cash: Only show when payment is CASH_PENDING (not CASH_PAID - button should be hidden after payment)
      if (booking.paymentMethod === 'CASH') {
        return booking.payment && booking.payment.status === 'CASH_PENDING';
      }
      // For online: Show when payment is in escrow
      if (booking.paymentMethod === 'ONLINE') {
        return booking.payment && ['ESCROW', 'HELD_IN_ESCROW'].includes(booking.payment.status);
      }
      return true
    }
    
    // Allow if booking is completed and payment is in escrow
    if (booking.status === "COMPLETED" && booking.payment && ["ESCROW", "HELD_IN_ESCROW"].includes(booking.payment.status)) {
      return true
    }
    
    // Special case: If booking suggests completion but payment is stuck in PENDING
    // This handles cases where payment verification failed but work was done
    if ((booking.status === "AWAITING_CONFIRMATION" || booking.status === "COMPLETED") && 
        booking.payment && booking.payment.status === "PENDING") {
      return true
    }
    
    return false
  }
  
  // Check if payment is already released (for display purposes)
  const isPaymentReleased = booking.payment && ["RELEASED", "COMPLETED"].includes(booking.payment.status)
  
  // Check if payment is stuck and needs recovery
  const needsPaymentRecovery = booking.payment && booking.payment.status === 'PENDING' && booking.status !== 'PENDING'
  const canDispute = ["COMPLETED", "CANCELLED"].includes(booking.status) && !booking.review

  const handlePay = async () => {
    // Prevent duplicate clicks
    if (isPaymentInProgress) return
      setIsPaymentInProgress(true)
      try {
      const result = await processPayment(booking.id)

      if (result.success && result.shouldRedirect && result.authorizationUrl) {
        // Immediate redirect
        try {
          window.location.href = result.authorizationUrl
          return
        } catch {
          try {
            window.location.replace(result.authorizationUrl)
            return
          } catch {
            const w = window.open(result.authorizationUrl, '_blank', 'noopener,noreferrer')
            if (!w) {
              showToast.error('Redirect blocked. Please allow popups or use Continue Payment link.')
            }
          }
        }
      }

      if (result.success) {
        handlePaymentResult(result)
        return
      }

      // Failure: try recovery by checking current payment
      try {
        const statusRes = await fetch(`/api/book-service/${booking.id}/payment-status`)
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          const payment = statusData?.payment
          if (payment?.status === 'PENDING' && payment?.authorizationUrl) {
            window.location.href = payment.authorizationUrl
            return
          }
        }
      } catch {}
      showToast.error(result.message || 'Payment failed. Please try again.')
      } catch (error) {
      console.error('Payment error:', error)
      // Attempt recovery
      try {
        const statusRes = await fetch(`/api/book-service/${booking.id}/payment-status`)
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          const payment = statusData?.payment
          if (payment?.status === 'PENDING' && payment?.authorizationUrl) {
            window.location.href = payment.authorizationUrl
            return
          }
        }
      } catch {}
      showToast.error('Network error. Please try again.')
      } finally {
        setIsPaymentInProgress(false)
    }
  }

  const handleConfirmCompletion = async () => {
    if (isConfirmingCompletion) return; // Prevent duplicate clicks
    
    setIsConfirmingCompletion(true);
    try {
      console.log(`🚀 Attempting to confirm completion for booking ${booking.id}`);
      
      const response = await fetch(`/api/book-service/${booking.id}/release-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Ensure cookies are sent
      })
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success response:`, data);
        
        // Show success message with more detail
        const successMessage = data.message || "Payment submitted! Provider will confirm receipt."
        showToast.success(successMessage)
        
        // Update the booking data to reflect the new state
        onUpdate()
        
      } else {
        const errorData = await response.json()
        console.error(`❌ Error response:`, errorData);
        
        // Enhanced error handling with user-friendly messages
        let errorMessage = errorData.error || "Failed to submit payment"
        let errorDetails = errorData.details || ""
        
        // Handle specific error cases with better UX
        if (errorData.paystackStatus === 'abandoned') {
          errorMessage = "Payment was abandoned by the payment processor"
          errorDetails = "The payment was not completed. Please contact support to resolve this issue."
        } else if (errorData.retryable) {
          errorMessage = "Temporary issue verifying payment"
          errorDetails = "Please try again in a few moments. The payment verification is temporarily unavailable."
        } else if (errorData.currentStatus === 'PENDING') {
          errorMessage = "Payment is still being processed"
          errorDetails = "Please wait a moment for the payment to complete, then try again."
        }
        
        showToast.error(errorMessage)
        
        // Show additional details in console for debugging
        if (errorDetails) {
          console.log(`📋 Error details: ${errorDetails}`)
        }
        
        // If it's an authentication error, redirect to login
        if (response.status === 401) {
          console.log('🔐 Authentication error, redirecting to login');
          window.location.href = '/login';
        }
        
        // If it's a retryable error, show a retry option
        if (errorData.retryable) {
          setTimeout(() => {
            if (confirm("Would you like to try again?")) {
              handleConfirmCompletion()
            }
          }, 2000)
        }
      }
    } catch (error) {
      console.error("❌ Confirm completion error:", error)
      showToast.error("Network error. Please check your connection and try again.")
    } finally {
      setIsConfirmingCompletion(false);
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
    console.log(`🔍 Check Status clicked for booking ${booking.id}`, {
      currentStatus: booking.status,
      paymentStatus: booking.payment?.status
    });
    
    setIsProcessingPayment(true)
    try {
      // Use sync-status endpoint to fix inconsistencies and validate bank codes
      console.log(`📡 Calling sync-status endpoint for booking ${booking.id}...`);
      const syncResponse = await fetch(`/api/book-service/${booking.id}/sync-status`, {
        method: 'POST',
      });

      console.log(`📥 Sync response status: ${syncResponse.status}`, {
        ok: syncResponse.ok,
        statusText: syncResponse.statusText
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json().catch(() => ({}));
        console.error(`❌ Sync failed:`, errorData);
        throw new Error(errorData.error || 'Failed to sync status');
      }

      const syncData = await syncResponse.json();
      console.log(`✅ Sync response data:`, {
        synced: syncData.synced,
        bookingStatus: syncData.booking?.status,
        paymentStatus: syncData.payment?.status,
        issueFound: syncData.issueFound,
        issueDetails: syncData.issueDetails,
        message: syncData.message,
        providerBankCode: syncData.provider?.bankCode,
        hasProvider: !!syncData.provider,
        fullResponse: syncData // Log full response for debugging
      });
      
      // Log provider info if available
      if (syncData.provider) {
        console.log(`👤 Provider info from sync:`, {
          id: syncData.provider.id,
          businessName: syncData.provider.businessName,
          hasBankCode: !!syncData.provider.bankCode,
          bankCode: syncData.provider.bankCode
        });
      }
      
      // Check if validation should have run but didn't
      if (syncData.payment?.status === 'PROCESSING_RELEASE' && 
          syncData.booking?.status === 'AWAITING_CONFIRMATION' &&
          syncData.provider?.bankCode &&
          !syncData.issueFound &&
          !syncData.synced) {
        console.warn(`⚠️ [WARNING] Payment is PROCESSING_RELEASE with bankCode but no issue found!`, {
          bankCode: syncData.provider.bankCode,
          paymentStatus: syncData.payment.status,
          bookingStatus: syncData.booking.status,
          message: 'Validation may not have run or bank code was validated as valid'
        });
      }
      
      // Update local state
      if (syncData.synced || syncData.issueFound) {
        showToast.success(syncData.message || "Status synchronized and updated successfully!")
        onUpdate()
      } else {
        showToast.info("Status checked - everything is up to date")
      }
    } catch (error) {
      console.error("❌ Check status error:", error)
      showToast.error("Unable to check payment status. Please try again.")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleRecoverPayment = async () => {
    try {
      console.log(`🔄 Attempting to recover payment for booking ${booking.id}`);
      
      const response = await fetch(`/api/payment/recover-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: booking.payment?.id }),
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Payment recovery successful:`, data);
        
        // Show success message
        showToast.success("Payment status recovered successfully!")
        
        // Update the booking data
        onUpdate()
        
        // Show additional info
        setTimeout(() => {
          showToast.info("Your payment is now ready. You can confirm completion to release funds to the provider.")
        }, 2000)
        
      } else {
        const errorData = await response.json()
        console.error(`❌ Payment recovery failed:`, errorData);
        
        // Enhanced error handling
        let errorMessage = errorData.error || "Failed to recover payment status"
        if (errorData.paystackStatus === 'abandoned') {
          errorMessage = "Payment was abandoned and cannot be recovered"
        } else if (errorData.details) {
          errorMessage = `${errorMessage}. ${errorData.details}`
        }
        
        showToast.error(errorMessage)
      }
    } catch (error) {
      console.error("❌ Payment recovery error:", error)
      showToast.error("Network error during payment recovery. Please try again.")
    }
  }

  return (
    <>
      <div className="relative group w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
        
        <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 border-l-4 border-l-blue-400 group-hover:shadow-blue-400/20 hover:shadow-2xl overflow-hidden group-hover:scale-[1.01]" data-booking-id={booking.id}>
          {/* Subtle Floating Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-4 right-6 w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-6 left-4 w-1 h-1 bg-blue-300/40 rounded-full animate-bounce delay-700"></div>
            <div className="absolute top-1/2 right-4 w-2 h-2 bg-blue-500/20 rounded-full animate-pulse delay-1000"></div>
          </div>
          
          <CardContent className="p-3 sm:p-4 md:p-6 lg:p-8 relative z-10">
          {/* Premium Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6 flex-1 min-w-0">
              {/* Enhanced Service Icon */}
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 group-hover:shadow-blue-400/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
                {/* Glowing Ring */}
                <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/30 group-hover:border-blue-300/50 transition-colors duration-500"></div>
                {/* Pulse Effect */}
                <div className="absolute inset-0 rounded-2xl bg-blue-400/20 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl opacity-20 group-hover:opacity-40 blur-sm transition-opacity duration-500"></div>
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 mb-2">
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-transparent bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text truncate tracking-tight">{booking.service.name}</h3>
                  {isRecent() && (
                    <div className="relative">
                      <Badge className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/40 text-sm px-3 py-1 rounded-full font-semibold shadow-lg shadow-emerald-500/20 animate-pulse">
                        New
                      </Badge>
                      <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md animate-pulse"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm sm:text-base md:text-lg text-gray-300 truncate font-medium flex items-center space-x-2">
                  <span>{booking.service.category?.name || 'No Category'}</span>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <StatusBadge 
                status={booking.status} 
                type="booking" 
                size="md"
                className="shadow-lg hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Timeline - Enhanced for Large Screens */}
          <div className="mb-3 sm:mb-4 md:mb-6">
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 mb-2 md:mb-3">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-500" />
              <span className="text-xs sm:text-sm md:text-base font-medium text-white/20">Progress</span>
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
            allowContinue={booking.status === 'CONFIRMED'}
            bookingStatus={booking.status}
          />
          
          {/* Details - Enhanced Grid for Large Screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4 md:mb-6">
            <div className="space-y-1 sm:space-y-2 md:space-y-3">
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 text-xs sm:text-sm md:text-base">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" />
                <span className="text-white/20 truncate">
                  {formatSADate(booking.scheduledDate)}
                </span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 text-xs sm:text-sm md:text-base">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" />
                <span className="text-white/20">
                  {formatSATime(booking.scheduledDate)}
                </span>
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2 md:space-y-3">
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 text-xs sm:text-sm md:text-base">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" />
                <span className="text-white/20 truncate">{booking.address}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm md:text-base">
                <span className="text-white/20">Amount:</span>
                <span className="font-semibold text-white">{formatBookingPrice(booking)}</span>
              </div>
            </div>
            {/* Additional info column for large screens */}
            <div className="hidden lg:block space-y-1 md:space-y-3">
              {booking.provider && (
                <div className="flex items-center space-x-1 md:space-x-3 text-xs sm:text-sm md:text-base">
                  <span className="text-white/20">Provider:</span>
                  <span className="text-white/20 truncate">
                    {booking.provider.businessName || booking.provider.user?.name || 'N/A'}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-1 md:space-x-3 text-xs sm:text-sm md:text-base">
                <span className="text-white/20">Created:</span>
                <span className="text-white/20">
                  {new Date(booking.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Enhanced for Large Screens */}
            <div className="pt-3 sm:pt-4 md:pt-6 border-t border-white/20">
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
                  className="text-white/20 hover:text-white h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4"
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
                    className="bg-green-600 hover:bg-green-700 h-8 sm:h-9 md:h-10 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base flex items-center justify-center"
                    disabled={isPaymentInProgress}
                  >
                    {isPaymentInProgress ? (
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 animate-spin" />
                    ) : (
                      <RandIconSimple className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1" />
                    )}
                    {isPaymentInProgress ? "Processing..." : `Pay ${formatBookingPrice(booking)}`}
                  </Button>
                )}
                
                {/* Confirm Completion Button with Tooltip */}
                {canConfirmCompletion() && !isPaymentReleased && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm" 
                          onClick={handleConfirmCompletion} 
                          disabled={isConfirmingCompletion}
                          className="bg-orange-600 hover:bg-orange-700 h-8 sm:h-9 md:h-10 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isConfirmingCompletion ? (
                            <>
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 animate-spin" />
                              {booking.paymentMethod === 'CASH' ? 'Submitting...' : 'Processing...'}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1" />
                              {booking.paymentMethod === 'CASH' ? 'Pay Cash' : 'Confirm Completion'}
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">{booking.paymentMethod === 'CASH' ? 'Submit Cash Payment' : 'Confirm Job Completion'}</p>
                          <p className="text-sm">{booking.paymentMethod === 'CASH' ? 'Click to confirm you have paid the provider in cash. The provider will then verify receipt to complete the booking.' : 'Click to release payment to the provider. This confirms the job is done and transfers the funds from escrow.'}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Recovery Button for Stuck Payments with Tooltip */}
                {needsPaymentRecovery && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm" 
                          onClick={handleRecoverPayment} 
                          className="bg-blue-600 hover:bg-blue-700 h-8 sm:h-9 md:h-10 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base"
                        >
                          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1" />
                          Recover Payment
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">Recover Stuck Payment</p>
                          <p className="text-sm">Your payment is stuck in processing. Click to verify with the payment processor and update the status.</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Payment Released Status with Help Info */}
                {isPaymentReleased && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center text-green-600 text-xs sm:text-sm md:text-base font-medium px-3 sm:px-4 md:px-6 cursor-help">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1" />
                          Payment Released
                          <Info className="w-3 h-3 sm:w-4 sm:h-4 ml-1 opacity-60" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">Payment Successfully Released</p>
                          <p className="text-sm">The payment has been transferred to the provider's account. This booking is now complete.</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>

          {/* Payment Help Section - Shows when there are payment issues */}
          {(needsPaymentRecovery || (booking.payment && booking.payment.status === 'PENDING')) && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-2">
                <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Payment Status Help
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    {needsPaymentRecovery 
                      ? "Your payment is stuck in processing. Use the 'Recover Payment' button to fix this issue."
                      : "Your payment is being processed. Please wait for it to complete before confirming job completion."
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message Section - Shows when payment is released */}
          {isPaymentReleased && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-800 dark:text-green-200 mb-1">
                    Payment Successfully Released
                  </p>
                  <p className="text-green-700 dark:text-green-300">
                    The payment has been transferred to the provider's account. This booking is now complete and no further action is needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Expandable Details - Enhanced for Large Screens */}
          {showDetails && (
            <div className="mt-3 sm:mt-4 md:mt-6 pt-3 sm:pt-4 md:pt-6 border-t border-white/20">
              <div className="space-y-2 sm:space-y-3 md:space-y-4 text-xs sm:text-sm md:text-base text-white/20">
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
                    <span className="truncate">
                      {booking.provider.businessName || booking.provider.user?.name || 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

      {/* Modals */}
      <BookingActionsModal
        isOpen={showActionsModal}
        onClose={() => setShowActionsModal(false)}
        booking={{
          ...booking,
          service: {
            name: booking.service.name,
            category: booking.service.category?.name || 'No Category'
          }
        }}
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

      {(booking.status === 'COMPLETED' || booking.status === 'AWAITING_CONFIRMATION') && (
        <ReviewSection
          bookingId={booking.id}
          existingReview={booking.review ? {
            id: booking.review.id,
            rating: booking.review.rating,
            comment: booking.review.comment,
            createdAt: new Date(booking.createdAt)
          } as any : null}
        />
      )}
    </>
  )
}

// Timeline steps are now provided by shared utility function
// See: lib/booking-timeline-utils.ts

