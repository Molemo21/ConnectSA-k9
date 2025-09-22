"use client"

import { useState, useEffect } from "react"
import { useSafeTime } from "@/hooks/use-safe-time"
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
        color: "bg-gray-500/20 text-gray-300 border-gray-500/50",
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
  const formattedDate = useSafeTime(booking.scheduledDate, 'date')
  const formattedTime = useSafeTime(booking.scheduledDate, 'time')
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showActionsModal, setShowActionsModal] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [previousStatus, setPreviousStatus] = useState(booking.status)

  // Detect status changes and trigger flip animation
  useEffect(() => {
    if (previousStatus !== booking.status) {
      setIsFlipping(true)
      setPreviousStatus(booking.status)
      
      // Reset flip animation after completion
      setTimeout(() => {
        setIsFlipping(false)
      }, 800) // Slightly longer than the CSS animation duration
    }
  }, [booking.status, previousStatus])

  // Check if booking is recent (created within last 24 hours)
  const isRecent = () => {
    if (!booking.createdAt) return false
    const now = new Date()
    const created = new Date(booking.createdAt)
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
  }

  const timelineSteps = getTimelineSteps(booking.status, Boolean(booking.payment))
  
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
        // IMPORTANT: Call handlePaymentResult to execute the redirect logic
        const redirectSuccess = handlePaymentResult(result, onStatusChange, booking.id)
        
        if (redirectSuccess) {
          // Redirect was initiated successfully
          showToast.success("Payment Gateway Ready - Redirecting to Paystack payment gateway...")
          
          // Set a timeout to reset processing state if no webhook update
          setTimeout(() => {
            if (isPaymentProcessing) {
              setIsProcessingPayment(false)
              setPaymentStatus(null)
              showToast.info("Payment processing timeout. Please check your payment status.")
            }
          }, 300000) // 5 minutes timeout
        } else {
          // Redirect failed, show manual option
          showToast.warning("Redirect failed. Please manually navigate to the payment gateway.")
          setIsProcessingPayment(false)
          setPaymentStatus(null)
        }
        
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
        setPaymentStatus('FAILED')
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
      setPaymentStatus('FAILED')
      setIsProcessingPayment(false)
    }
  }


  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status)
  // If booking is confirmed and no completed/escrowed payment, allow pay/continue
  const canPay = (booking.status === "CONFIRMED") && (!booking.payment || booking.payment.status === 'PENDING' || booking.payment.status === 'FAILED')
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

  // Normalize booking for BookingActionsModal expected shape
  const modalBooking = {
    id: booking.id,
    service: booking.service,
    provider: booking.provider
      ? {
          businessName: booking.provider.businessName,
          user: {
            name: booking.provider.user.name,
            phone: booking.provider.user.phone ?? "",
          },
        }
      : undefined,
    scheduledDate: new Date(booking.scheduledDate).toISOString(),
    duration: booking.duration,
    totalAmount: booking.totalAmount,
    status: booking.status,
    address: booking.address,
    description: booking.description ?? "",
    payment: booking.payment
      ? { status: booking.payment.status, amount: booking.payment.amount }
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
                  <h3 className="text-xl sm:text-2xl font-bold text-transparent bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text truncate tracking-tight">{booking.service.name}</h3>
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
                  <span>{booking.service.category}</span>
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
                  {/* Flipping Card */}
                  <div className="relative w-16 h-16 perspective-1000">
                    <div 
                      className={`absolute inset-0 w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                        step.completed ? 'rotate-y-180' : ''
                      }`}
                    >
                      {/* Front of card (incomplete state) */}
                      <div className="absolute inset-0 w-full h-full backface-hidden rounded-lg bg-white/10 backdrop-blur-sm border-2 border-gray-300/20 flex flex-col items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-gray-600 text-white flex items-center justify-center text-xs font-bold mb-1">
                          {index + 1}
                        </div>
                        <span className="text-xs text-gray-300 text-center leading-tight px-1">
                          {step.label.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </div>
                      
                      {/* Back of card (completed state) */}
                      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 border-2 border-blue-400 flex flex-col items-center justify-center shadow-lg">
                        <div className="w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center text-xs font-bold mb-1">
                          ✓
                        </div>
                        <span className="text-xs text-white text-center leading-tight px-1 font-medium">
                          {step.label.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </div>
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
            payment={(booking.payment ?? null) as any}
            isProcessing={isProcessingPayment}
            onCheckStatus={handleCheckStatus}
            allowContinue={booking.status === 'CONFIRMED'}
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
                  <span className="text-white font-medium text-sm truncate">{booking.address}</span>
                </div>
              </div>
              
              {/* Amount Card */}
              <div className="relative group/detail overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -skew-x-12 -translate-x-full group-hover/detail:translate-x-full transition-transform duration-1000 ease-out"></div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-emerald-500/10 backdrop-blur-sm rounded-xl border border-emerald-400/30 hover:border-emerald-400/50 transition-all duration-500 group-hover/detail:shadow-lg group-hover/detail:shadow-emerald-400/20">
                  <span className="text-emerald-300 font-medium text-sm">Total Amount</span>
                  <span className="font-bold text-lg text-transparent bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-300 bg-clip-text">R{booking.totalAmount.toFixed(2)}</span>
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
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 pay-button"
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
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
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

          {/* Expandable Details */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
              {booking.description && (
                <div>
                  <span className="text-sm font-medium text-white/60">Notes:</span>
                  <p className="text-sm text-white/60 mt-1">{booking.description}</p>
                </div>
              )}
              
              {booking.provider && (
                <div>
                  <span className="text-sm font-medium text-white/60">Provider Details:</span>
                  <div className="mt-1 text-sm text-white/60">
                    <p>Name: {booking.provider?.user.name}</p>
                    <p>Business: {booking.provider?.businessName}</p>
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
                    <p>Amount: R{booking.payment.amount.toFixed(2)}</p>
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
                existingReview={booking.review ? { ...booking.review, createdAt: new Date(booking.createdAt) } as any : null}
              />
            </div>
          )}
        </CardContent>
        </Card>
      </div>
      
      {/* Booking Actions Modal */}
      <BookingActionsModal
        booking={modalBooking as any}
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