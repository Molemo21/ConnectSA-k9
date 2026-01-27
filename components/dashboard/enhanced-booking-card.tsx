"use client"

import { useState, useEffect } from "react"
import { useSafeTime } from "@/hooks/use-safe-time"
import { useBookingWebSocket } from "@/hooks/use-booking-websocket"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, X, Edit, MessageCircle, Phone, CheckCircle, Loader2, AlertTriangle, FileText, RefreshCw } from "lucide-react"
import { ReviewSection } from "@/components/review-section"
import { BookingActionsModal } from "./booking-actions-modal"
import { showToast, handleApiError } from "@/lib/toast"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { processPayment, handlePaymentResult } from "@/lib/payment-utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { PaymentStatusDisplay } from "@/components/ui/payment-status-display"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RandIconSimple } from "@/components/ui/rand-icon"
import { formatBookingPrice } from '@/lib/price-utils'

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
    id: string
    businessName: string
    user: {
      name: string
      phone?: string
    }
  } | null
  scheduledDate: Date
  duration: number
  totalAmount: number
  status: string
  address: string
  description?: string | null
  // Catalogue pricing fields (for accurate price display)
  bookedPrice?: number | null
  bookedCurrency?: string | null
  catalogueItemId?: string | null
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
  paymentMethod?: "ONLINE" | "CASH" // Add payment method
}

interface ModalBooking {
  id: string
  service: {
    name: string
    category: string
  }
  provider?: {
    businessName: string
    user: {
      name: string
      phone: string
    }
  }
  scheduledDate: string
  duration: number
  totalAmount: number
  status: string
  address: string
  description?: string
  payment?: {
    status: string
    amount: number
  }
}

interface EnhancedBookingCardProps {
  booking: Booking
  onStatusChange?: (bookingId: string, newStatus: string) => void
  onRefresh?: (bookingId: string) => Promise<void>
}

const getTimelineSteps = (status: string, payment?: { status: string } | null, paymentMethod?: "ONLINE" | "CASH") => {
  // CASH PAYMENT TIMELINE (Simplified - 5 steps, clearer labels)
  if (paymentMethod === 'CASH') {
    const steps = [
      { id: "booked", label: "Booked", completed: true },
      { id: "confirmed", label: "Confirmed", completed: ["CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"].includes(status) },
      { id: "in_progress", label: "In Progress", completed: ["IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"].includes(status) },
      { id: "pay_cash", label: "Pay Cash", completed: ["AWAITING_CONFIRMATION", "COMPLETED"].includes(status) },
      { id: "completed", label: "Completed", completed: status === "COMPLETED" }
    ]
    
    // Handle special cases
    if (status === "CANCELLED") {
      return steps.map(step => ({ ...step, completed: step.id === "booked" }))
    }
    
    if (status === "DISPUTED") {
      return steps.map(step => ({ ...step, completed: ["booked", "confirmed"].includes(step.id) }))
    }
    
    return steps
  }

  // ONLINE/CARD PAYMENT TIMELINE (existing logic)
  console.log('🔍 Enhanced Timeline Debug:', {
    bookingStatus: status,
    payment: payment ? {
      status: payment.status
    } : null,
    hasPayment: !!payment,
    paymentStatusValid: payment && ["ESCROW", "HELD_IN_ESCROW", "RELEASED", "COMPLETED"].includes(payment.status)
  })

  // Enhanced payment detection logic
  // If booking status is PENDING_EXECUTION or later, payment was likely completed
  // even if payment object is missing or has wrong status
  const isPaymentCompleted = () => {
    // Direct payment status check
    if (payment && ["ESCROW", "HELD_IN_ESCROW", "RELEASED", "COMPLETED"].includes(payment.status)) {
      return true
    }
    
    // Fallback: If booking status indicates payment was processed
    if (["PENDING_EXECUTION", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"].includes(status)) {
      return true
    }
    
    return false
  }

  const steps = [
    { id: "booked", label: "Booked", completed: true },
    { id: "confirmed", label: "Provider Confirmed", completed: ["CONFIRMED", "PENDING_EXECUTION", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"].includes(status) },
    { id: "payment", label: "Paid", completed: isPaymentCompleted() },
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
  const formattedDate = useSafeTime(booking.scheduledDate, 'date')
  const formattedTime = useSafeTime(booking.scheduledDate, 'time')
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showActionsModal, setShowActionsModal] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [previousStatus, setPreviousStatus] = useState(booking.status)
  const [currentBooking, setCurrentBooking] = useState(booking)
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false)
  const [isRecoveringPayment, setIsRecoveringPayment] = useState(false)

  // Use WebSocket hook for real-time updates
  const { isConnected, lastUpdate } = useBookingWebSocket({
    bookingId: booking.id,
    enabled: true,
    onStatusChange: (bookingId, newStatus, updatedBooking) => {
      // Update local booking state when status changes
      setCurrentBooking((prev) => ({
        ...prev,
        ...updatedBooking,
        status: newStatus,
      }))
      
      // Call parent handler if provided
      if (onStatusChange) {
        onStatusChange(bookingId, newStatus)
      }
      
      // Refresh booking data
      if (onRefresh) {
        onRefresh(bookingId).catch(console.error)
      }
    },
    onBookingUpdate: (updatedBooking) => {
      // Update local booking state with full booking data
      setCurrentBooking((prev) => ({
        ...prev,
        ...updatedBooking,
      }))
      
      // Refresh booking data
      if (onRefresh) {
        onRefresh(booking.id).catch(console.error)
      }
    },
  })

  // Use currentBooking instead of booking prop for display
  const displayBooking = currentBooking

  // Detect status changes and trigger flip animation
  useEffect(() => {
    if (previousStatus !== displayBooking.status) {
      setIsFlipping(true)
      setPreviousStatus(displayBooking.status)
      
      // Reset flip animation after completion
      setTimeout(() => {
        setIsFlipping(false)
      }, 800) // Slightly longer than the CSS animation duration
    }
  }, [displayBooking.status, previousStatus])

  // Sync currentBooking with booking prop when it changes externally
  useEffect(() => {
    setCurrentBooking(booking)
  }, [booking.id, booking.status, booking.payment?.status])

  // Check if booking is recent (created within last 24 hours)
  const isRecent = () => {
    if (!booking.createdAt) return false
    const now = new Date()
    const created = new Date(booking.createdAt)
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
  }

  const timelineSteps = getTimelineSteps(displayBooking.status, displayBooking.payment, displayBooking.paymentMethod)
  
  // Enhanced payment status checking with better logic (includes cash payment statuses)
  const hasPayment = displayBooking.payment && ['ESCROW', 'HELD_IN_ESCROW', 'RELEASED', 'COMPLETED', 'CASH_RECEIVED', 'CASH_VERIFIED'].includes(displayBooking.payment.status)
  const isPaymentProcessing = displayBooking.payment && ['PENDING'].includes(displayBooking.payment.status)
  const isPaymentInEscrow = displayBooking.payment && ['ESCROW', 'HELD_IN_ESCROW'].includes(displayBooking.payment.status)

  // Check if payment is stuck in processing state (more than 8 minutes)
  const isPaymentStuck = () => {
    if (!displayBooking.payment || !isPaymentProcessing) return false
    if (!displayBooking.payment.createdAt) return false
    
    const now = new Date()
    const created = new Date(displayBooking.payment.createdAt)
    const minutesDiff = (now.getTime() - created.getTime()) / (1000 * 60)
    
    // More user-friendly: only show warning after 8 minutes (instead of 5)
    // This gives more time for normal webhook processing
    return minutesDiff > 8
  }

  // Check if payment is stuck in PROCESSING_RELEASE (more than 5 minutes)
  const isPaymentStuckInProcessingRelease = () => {
    if (!displayBooking.payment || displayBooking.payment.status !== 'PROCESSING_RELEASE') return false
    if (!displayBooking.payment.updatedAt) return false
    
    const now = new Date()
    const updated = new Date(displayBooking.payment.updatedAt)
    const minutesDiff = (now.getTime() - updated.getTime()) / (1000 * 60)
    
    // Show retry button after 5 minutes
    return minutesDiff > 5
  }

  // Use the provided refresh function instead of making direct API calls
  const handleCheckStatus = async () => {
    if (onRefresh) {
      try {
        await onRefresh(booking.id)
        showToast.success("Payment status checked successfully!")
      } catch {
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
    
    try {
      const result = await processPayment(booking.id)
      
      if (result.success && result.shouldRedirect) {
        // Payment gateway is ready, user will be redirected
        // IMPORTANT: Call handlePaymentResult to execute the redirect logic
        const redirectSuccess = handlePaymentResult(result, onStatusChange, booking.id)
        
        if (redirectSuccess) {
          // Redirect was initiated successfully
          showToast.success("Payment Gateway Ready - Redirecting to Paystack payment gateway...")
          
          // Set a timeout to reset processing state if no webhook update
          setTimeout(() => {
            if (isPaymentProcessing) {
              setIsProcessingPayment(false)
              showToast.info("Payment processing timeout. Please check your payment status.")
            }
          }, 300000) // 5 minutes timeout
        } else {
          // Redirect failed, show manual option
          showToast.warning("Redirect failed. Please manually navigate to the payment gateway.")
          setIsProcessingPayment(false)
        }
        
      } else if (result.success) {
        // Payment processed without redirect (e.g., already paid)
        handlePaymentResult(result, onStatusChange, booking.id)
        setIsProcessingPayment(false)
        
        // Only refresh if payment was actually completed
        if (result.bookingStatus === "PENDING_EXECUTION") {
          window.location.reload()
        }
      } else {
        // Payment failed – attempt recovery by checking current payment status for an authorization URL
        try {
          const statusRes = await fetch(`/api/book-service/${booking.id}/payment-status`)
          if (statusRes.ok) {
            const statusData = await statusRes.json()
            const payment = statusData?.payment
            if (payment?.status === 'PENDING' && payment?.authorizationUrl) {
              // Continue existing Paystack session
              window.location.href = payment.authorizationUrl
              return
            }
          }
        } catch {}
        showToast.error(result.message || "Payment failed. Please try again.")
        setIsProcessingPayment(false)
      }
    } catch (error) {
      console.error("Payment error:", error)
      // Attempt recovery via existing payment session
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
      showToast.error("Network error. Please try again.")
      setIsProcessingPayment(false)
    }
  }


  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status)
  // If booking is confirmed and no completed/escrowed payment, allow pay/continue
  // For cash payments, don't show pay button - payment is handled directly with provider
  const canPay = (booking.paymentMethod === "ONLINE") && (booking.status === "CONFIRMED") && (!booking.payment || booking.payment.status === 'PENDING' || booking.payment.status === 'FAILED')
  const canMessage = booking.provider && ["CONFIRMED", "IN_PROGRESS"].includes(booking.status)
  // Enhanced canConfirmCompletion logic
  const canConfirmCompletion = () => {
    if (displayBooking.status === 'AWAITING_CONFIRMATION') {
      if (displayBooking.paymentMethod === 'ONLINE') {
        return displayBooking.payment && 
               ['ESCROW', 'HELD_IN_ESCROW'].includes(displayBooking.payment.status);
      }
      
      // For CASH: Only show button when payment is CASH_PENDING (client needs to pay)
      // After payment, it becomes CASH_PAID - button should be hidden at that point
      if (displayBooking.paymentMethod === 'CASH') {
        return displayBooking.payment && displayBooking.payment.status === 'CASH_PENDING';
      }
    }
    
    return false;
  }

  const shouldShowConfirmButton = canConfirmCompletion()
  
  // Hide button if payment is already released (for online) or received (for cash)
  const isPaymentReleased = displayBooking.payment && 
    (["RELEASED", "COMPLETED"].includes(displayBooking.payment.status) || 
     (displayBooking.paymentMethod === "CASH" && ["CASH_RECEIVED", "CASH_VERIFIED", "CASH_PAID"].includes(displayBooking.payment.status)))
  const canDispute = ["IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"].includes(displayBooking.status)
  
  // Prevent payment if already processing or stuck
  const isPaymentInProgress = isProcessingPayment || isPaymentStuck()

  const handleConfirmCompletion = async () => {
    if (isConfirmingCompletion) return; // Prevent duplicate clicks
    
    setIsConfirmingCompletion(true);
    try {
      console.log(`🚀 Attempting to confirm completion for booking ${booking.id}`);
      
      const response = await fetch(`/api/book-service/${booking.id}/release-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include' // Ensure cookies are sent
      })
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Success response:`, data);
        showToast.success(data.message || "Payment submitted! Provider will confirm receipt.")
        onStatusChange?.(booking.id, "AWAITING_CONFIRMATION")
        
        // Refresh the booking data instead of reloading the entire page
        if (onRefresh) {
          await onRefresh(booking.id);
        } else {
          // Fallback to reload if onRefresh is not available
          setTimeout(() => window.location.reload(), 1000);
        }
      } else {
        const errorData = await response.json()
        console.error(`❌ Error response:`, errorData);
        showToast.error(errorData.error || "Failed to submit payment")
        
        // If it's an authentication error, redirect to login
        if (response.status === 401) {
          console.log('🔐 Authentication error, redirecting to login');
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error("❌ Confirm completion error:", error)
      showToast.error("Network error. Please try again.")
    } finally {
      setIsConfirmingCompletion(false);
    }
  }

  const handleDispute = async () => {
    // This will open the dispute modal in the actions modal
    setShowActionsModal(true)
  }

  const handleRecoverPayment = async () => {
    if (isRecoveringPayment) return
    
    setIsRecoveringPayment(true)
    try {
      console.log(`🔄 Attempting to recover payment for booking ${booking.id}`)
      
      const response = await fetch('/api/payment/recover-processing-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId: booking.id })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Payment recovered successfully:`, data)
        showToast.success('Payment reset! You can now try releasing the payment again.')
        
        // Refresh the booking data
        if (onRefresh) {
          await onRefresh(booking.id)
        } else {
          setTimeout(() => window.location.reload(), 1000)
        }
      } else {
        const errorData = await response.json()
        console.error(`❌ Recovery error:`, errorData)
        showToast.error(errorData.error || 'Failed to recover payment. Please try again.')
      }
    } catch (error) {
      console.error('❌ Recovery error:', error)
      showToast.error('Network error. Please try again.')
    } finally {
      setIsRecoveringPayment(false)
      setShowRecoveryDialog(false)
    }
  }

  // Normalize booking for BookingActionsModal expected shape
  const modalBooking: ModalBooking = {
    id: displayBooking.id,
    service: {
      name: displayBooking.service.name,
      category: displayBooking.service.category?.name || 'No Category'
    },
    provider: displayBooking.provider
      ? {
          businessName: displayBooking.provider.businessName,
          user: {
            name: displayBooking.provider.user?.name || 'N/A',
            phone: displayBooking.provider.user.phone ?? "",
          },
        }
      : undefined,
    scheduledDate: new Date(displayBooking.scheduledDate).toISOString(),
    duration: displayBooking.duration,
    totalAmount: displayBooking.totalAmount,
    status: displayBooking.status,
    address: displayBooking.address,
    description: displayBooking.description ?? "",
    payment: displayBooking.payment
      ? { status: displayBooking.payment.status, amount: displayBooking.payment.amount }
      : undefined,
  }

  return (
    <>
      <div className="relative perspective-1000 group">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
        
        <Card 
          className={`relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 border-l-4 border-l-blue-400 transform-style-preserve-3d group-hover:shadow-blue-400/20 hover:shadow-2xl overflow-hidden ${
            isFlipping ? 'animate-flip-page' : ''
          }`} 
          data-booking-id={booking.id}
        >
          {/* Subtle Floating Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-4 right-6 w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-6 left-4 w-1 h-1 bg-blue-300/40 rounded-full animate-bounce delay-700"></div>
            <div className="absolute top-1/2 right-4 w-2 h-2 bg-blue-500/20 rounded-full animate-pulse delay-1000"></div>
          </div>
          
          <CardContent className="p-6 relative z-10">
          {/* Enhanced Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Premium Service Icon */}
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 group-hover:shadow-blue-400/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <Calendar className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
                {/* Glowing Ring */}
                <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/30 group-hover:border-blue-300/50 transition-colors duration-500"></div>
                {/* Pulse Effect */}
                <div className="absolute inset-0 rounded-2xl bg-blue-400/20 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl opacity-20 group-hover:opacity-40 blur-sm transition-opacity duration-500"></div>
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-transparent bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text truncate tracking-tight">{displayBooking.service.name}</h3>
                  {isRecent() && (
                    <div className="relative">
                      <Badge className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/40 text-sm px-3 py-1 rounded-full font-semibold shadow-lg shadow-emerald-500/20 animate-pulse">
                        New
                      </Badge>
                      <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md animate-pulse"></div>
                    </div>
                  )}
                </div>
                <p className="text-base text-gray-300 truncate font-medium flex items-center space-x-2">
                  <span>{displayBooking.service.category?.name || 'No Category'}</span>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <StatusBadge 
                status={displayBooking.status} 
                type="booking" 
                size="md"
                className="shadow-lg hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Enhanced Timeline with Flipping Cards */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-400/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-base font-semibold text-transparent bg-gradient-to-r from-gray-200 to-white bg-clip-text">Booking Timeline</span>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-400/30 to-transparent"></div>
            </div>
            <div className="flex items-center space-x-4 overflow-x-auto pb-3">
              {timelineSteps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  {/* Simple Timeline Step */}
                  <div className="relative w-16 h-16">
                    <div className={`w-full h-full rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-300 ${
                      step.completed 
                        ? 'bg-gradient-to-br from-green-400 to-green-500 border-green-400 shadow-lg shadow-green-400/30' 
                        : 'bg-white/10 backdrop-blur-sm border-gray-300/20'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                        step.completed 
                          ? 'bg-white text-green-600' 
                          : 'bg-gray-600 text-white'
                      }`}>
                        {step.completed ? '✓' : index + 1}
                      </div>
                      <span className={`text-xs text-center leading-tight px-1 font-medium ${
                        step.completed ? 'text-white' : 'text-gray-300'
                      }`}>
                        {step.label.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Connector Line */}
                  {index < timelineSteps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 transition-colors duration-500 ${
                      timelineSteps[index + 1].completed ? 'bg-blue-400' : 'bg-gray-300/30'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status Display */}
          <PaymentStatusDisplay
            payment={booking.payment ?? null}
            isProcessing={isProcessingPayment}
            onCheckStatus={handleCheckStatus}
            allowContinue={booking.status === 'CONFIRMED'}
            bookingStatus={booking.status}
            paymentMethod={booking.paymentMethod}
          />
          
          {/* Premium Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="space-y-2">
              {/* Date Card */}
              <div className="relative group/detail overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover/detail:translate-x-full transition-transform duration-1000 ease-out"></div>
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-400/10 via-blue-500/5 to-blue-400/10 backdrop-blur-sm rounded-xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 group-hover/detail:shadow-lg group-hover/detail:shadow-blue-400/20">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400/20 to-blue-500/20 rounded-lg flex items-center justify-center group-hover/detail:scale-110 transition-transform duration-300">
                    <Calendar className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-white font-medium text-sm">
                    {formattedDate}
                  </span>
                </div>
              </div>
              
              {/* Time Card */}
              <div className="relative group/detail overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover/detail:translate-x-full transition-transform duration-1000 ease-out"></div>
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-400/10 via-blue-500/5 to-blue-400/10 backdrop-blur-sm rounded-xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 group-hover/detail:shadow-lg group-hover/detail:shadow-blue-400/20">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400/20 to-blue-500/20 rounded-lg flex items-center justify-center group-hover/detail:scale-110 transition-transform duration-300">
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-white font-medium text-sm">
                    {formattedTime}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {/* Location Card */}
              <div className="relative group/detail overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover/detail:translate-x-full transition-transform duration-1000 ease-out"></div>
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-400/10 via-blue-500/5 to-blue-400/10 backdrop-blur-sm rounded-xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 group-hover/detail:shadow-lg group-hover/detail:shadow-blue-400/20">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400/20 to-blue-500/20 rounded-lg flex items-center justify-center group-hover/detail:scale-110 transition-transform duration-300">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-white font-medium text-sm truncate">{displayBooking.address}</span>
                </div>
              </div>
              
              {/* Amount Card */}
              <div className="relative group/detail overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -skew-x-12 -translate-x-full group-hover/detail:translate-x-full transition-transform duration-1000 ease-out"></div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-emerald-500/10 backdrop-blur-sm rounded-xl border border-emerald-400/30 hover:border-emerald-400/50 transition-all duration-500 group-hover/detail:shadow-lg group-hover/detail:shadow-emerald-400/20">
                  <span className="text-emerald-300 font-medium text-sm">Total Amount</span>
                  <span className="font-bold text-lg text-transparent bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-300 bg-clip-text">{formatBookingPrice(booking)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-blue-400/20">
            <div className="flex items-center space-x-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowActionsModal(true)}
                className="relative overflow-hidden bg-blue-400/10 border-blue-400/40 text-blue-300 hover:text-white hover:bg-blue-400/20 hover:border-blue-400/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-400/25 px-4 py-2 rounded-xl font-semibold group/btn"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"></div>
                <Edit className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300 relative z-10" />
                <span className="relative z-10">Actions</span>
              </Button>
              {canMessage && (
                <Button
                  size="sm"
                  variant="outline"
                  className="relative overflow-hidden bg-blue-400/10 border-blue-400/40 text-blue-300 hover:text-white hover:bg-blue-400/20 hover:border-blue-400/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-400/25 px-4 py-2 rounded-xl font-semibold group/btn"
                  onClick={() => {
                    showToast.info('Messaging feature coming soon! You can contact your provider directly.')
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"></div>
                  <MessageCircle className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300 relative z-10" />
                  <span className="relative z-10">Message</span>
                </Button>
              )}
              {booking.provider?.user.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="relative overflow-hidden bg-emerald-500/10 border-emerald-400/40 text-emerald-300 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-400/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-400/25 px-4 py-2 rounded-xl font-semibold group/btn"
                  onClick={() => {
                    window.open(`tel:${booking.provider?.user.phone}`, '_blank')
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"></div>
                  <Phone className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300 relative z-10" />
                  <span className="relative z-10">Call</span>
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {canPay && (
                <Button
                  size="sm"
                  onClick={handlePay}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 pay-button flex items-center justify-center"
                  disabled={isPaymentInProgress}
                >
                  {isPaymentInProgress ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RandIconSimple className="w-4 h-4 mr-1" />
                  )}
                  {isPaymentInProgress ? "Processing..." : `Pay ${formatBookingPrice(booking)}`}
                </Button>
              )}
              
              {shouldShowConfirmButton && !isPaymentReleased && (
                <Button 
                  size="sm" 
                  onClick={handleConfirmCompletion} 
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  disabled={isConfirmingCompletion}
                >
                  {isConfirmingCompletion ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      {booking.paymentMethod === 'CASH' ? 'Submitting...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {booking.paymentMethod === 'CASH' ? 'Pay Cash' : 'Confirm Completion'}
                    </>
                  )}
                </Button>
              )}
              
              {isPaymentReleased && (
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Payment Released
                </div>
              )}

              {/* Payment Stuck in PROCESSING_RELEASE - Show Retry Button */}
              {isPaymentStuckInProcessingRelease() && !isPaymentReleased && (
                <Alert className="border-orange-500/50 bg-orange-500/10 mt-2">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                  <AlertDescription className="text-orange-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="font-medium block mb-1">Payment release taking longer than expected</span>
                        <p className="text-sm">The release may be stuck. You can retry it.</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowRecoveryDialog(true)}
                        variant="outline"
                        className="ml-4 border-orange-500 text-orange-500 hover:bg-orange-500/20"
                        disabled={isRecoveringPayment}
                      >
                        {isRecoveringPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Recovering...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Retry Release
                          </>
                        )}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {canDispute && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleDispute}
                  className="text-red-400 border-red-500/50 hover:bg-red-500/20"
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Dispute
                </Button>
              )}
              
              {hasPayment && (
                <StatusBadge 
                  status="COMPLETED" 
                  type="payment" 
                  size="sm"
                  className="text-green-600 border-green-200"
                />
              )}
              
              {isPaymentInEscrow && (
                <StatusBadge 
                  status="ESCROW" 
                  type="payment" 
                  size="sm"
                  className="text-blue-600 border-blue-200"
                />
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

          {/* Service Details - Always Visible */}
          {booking.description && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-start space-x-2">
                <FileText className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-white/80">Service Details:</span>
                  <p className="text-sm text-white/70 mt-1 whitespace-pre-wrap">{booking.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Expandable Details */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
              {booking.provider && (
                <div>
                  <span className="text-sm font-medium text-white/60">Provider Details:</span>
                  <div className="mt-1 text-sm text-white/60">
                    <p>Name: {booking.provider?.user.name}</p>
                    <p>Business: {booking.provider?.businessName || 'N/A'}</p>
                    {booking.provider?.user.phone && (
                      <p>Phone: {booking.provider?.user.phone}</p>
                    )}
                  </div>
                </div>
              )}
              
              {booking.payment && (
                <div>
                  <span className="text-sm font-medium text-white/60">Payment Details:</span>
                  <div className="mt-1 text-sm text-white/60">
                    <p>Amount: R{(booking.payment.amount || 0).toFixed(2)}</p>
                    <p>Status: {booking.payment.status}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Review Section for completed bookings */}
          {(booking.status === "COMPLETED" || booking.status === "AWAITING_CONFIRMATION") && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <ReviewSection
                bookingId={booking.id}
                existingReview={booking.review ? { ...booking.review, createdAt: new Date(booking.createdAt) } : null}
              />
            </div>
          )}
        </CardContent>
        </Card>
      </div>
      
      {/* Booking Actions Modal */}
      <BookingActionsModal
        booking={modalBooking}
        isOpen={showActionsModal}
        onClose={() => setShowActionsModal(false)}
        onUpdate={(bookingId, updates) => {
          onStatusChange?.(bookingId, updates.status || booking.status)
          setShowActionsModal(false)
        }}
      />
      
      {/* New Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showRecoveryDialog}
        onClose={() => setShowRecoveryDialog(false)}
        onConfirm={handleRecoverPayment}
        title="Retry Payment Release"
        description="This will reset the payment release process. You'll be able to try releasing the payment again. Continue?"
        confirmText="Yes, Retry"
        cancelText="Cancel"
        variant="warning"
        loadingText="Recovering..."
      />

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