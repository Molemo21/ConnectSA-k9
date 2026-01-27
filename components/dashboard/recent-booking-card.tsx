"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DraftAwareBookingButton } from "@/components/ui/draft-aware-booking-button"
import { StatusBadge } from "@/components/ui/status-badge"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  MessageCircle, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ChevronRight,
  Plus,
  Eye,
  RefreshCw,
  X,
  RotateCcw,
  FileText,
} from "lucide-react"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { RandIconSimple } from "@/components/ui/rand-icon"
import { formatSADate, formatSATime } from '@/lib/date-utils'
import { formatBookingPrice } from '@/lib/price-utils'

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
  scheduledDate: string | Date
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
    createdAt?: string
  } | null
  createdAt: string | Date
}

interface RecentBookingCardProps {
  booking: Booking | null
  onViewAll?: () => void
  onRefresh?: (bookingId: string) => Promise<void>
  isLoading?: boolean
}

export function RecentBookingCard({ 
  booking, 
  onViewAll, 
  onRefresh, 
  isLoading = false 
}: RecentBookingCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false)

  // Handle refresh
  const handleRefresh = async () => {
    if (!booking || !onRefresh || isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await onRefresh(booking.id)
      showToast.success("Booking status updated!")
    } catch (error) {
      showToast.error("Failed to refresh booking status")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle payment
  const handlePay = async () => {
    if (!booking || isProcessingPayment) return
    
    setIsProcessingPayment(true)
    try {
      console.log('💳 Initiating payment for booking:', booking.id)
      
      // Call the payment API
      const response = await fetch(`/api/book-service/${booking.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log('❌ Payment API Error:', errorData)
        
        // Handle specific error cases
        if (errorData.bookingStatus === "PENDING") {
          throw new Error("This booking is still pending provider acceptance. Please wait for the provider to accept your booking before making payment.")
        } else if (errorData.totalAmount === 0) {
          throw new Error("The booking amount has not been set yet. Please contact the provider to confirm the service cost.")
        } else {
          throw new Error(errorData.error || 'Payment failed')
        }
      }

      const paymentData = await response.json()
      console.log('✅ Payment initiated successfully:', paymentData)
      console.log('🔍 Authorization URL found:', paymentData.authorizationUrl || paymentData.authorization_url)
      
      // Redirect to Paystack payment page
      if (paymentData.authorizationUrl || paymentData.authorization_url) {
        const redirectUrl = paymentData.authorizationUrl || paymentData.authorization_url
        console.log('🚀 Redirecting to Paystack:', redirectUrl)
        window.location.href = redirectUrl
      } else {
        console.log('❌ No authorization URL found in response:', paymentData)
        showToast.success("Payment initiated! Check your email for payment details.")
      }
      
    } catch (error) {
      console.error('❌ Payment failed:', error)
      showToast.error(error instanceof Error ? error.message : "Payment failed. Please try again.")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Check if booking is recent (created within last 24 hours)
  const isRecent = () => {
    if (!booking?.createdAt) return false
    const now = new Date()
    const created = new Date(booking.createdAt)
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
  }

  // Get timeline steps for booking progress
  const getTimelineSteps = (status: string, payment: any) => {
    // CASH PAYMENT TIMELINE (Simplified - 5 steps, clearer labels)
    if (booking.paymentMethod === 'CASH') {
      const steps = [
        { id: 'booked', label: 'Booked', completed: true },
        { id: 'confirmed', label: 'Confirmed', completed: ['CONFIRMED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED'].includes(status) },
        { id: 'in_progress', label: 'In Progress', completed: ['IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED'].includes(status) },
        { id: 'pay_cash', label: 'Pay Cash', completed: ['AWAITING_CONFIRMATION', 'COMPLETED'].includes(status) },
        { id: 'completed', label: 'Completed', completed: status === 'COMPLETED' }
      ]
      
      return steps
    }

    // Debug logging for payment status
    console.log('🔍 Timeline Debug:', {
      bookingId: booking.id,
      bookingStatus: status,
      payment: payment ? {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        paidAt: payment.paidAt
      } : null,
      hasPayment: !!payment,
      paymentStatusValid: payment && ['ESCROW', 'HELD_IN_ESCROW', 'RELEASED', 'COMPLETED', 'PROCESSING_RELEASE'].includes(payment.status),
      isProcessingRelease: payment?.status === "PROCESSING_RELEASE"
    })

    // Enhanced payment detection logic
    // If booking status is PENDING_EXECUTION or later, payment was likely completed
    // even if payment object is missing or has wrong status
    const isPaymentCompleted = () => {
      // Direct payment status check
      if (payment && ['ESCROW', 'HELD_IN_ESCROW', 'RELEASED', 'COMPLETED'].includes(payment.status)) {
        return true
      }
      
      // Fallback: If booking status indicates payment was processed
      if (['PENDING_EXECUTION', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED'].includes(status)) {
        return true
      }
      
      return false
    }

    // Check if payment is in PROCESSING_RELEASE status
    // This indicates that provider completed the job and client confirmed completion
    // Therefore, "In Progress" step should be ticked
    const isProcessingRelease = payment?.status === "PROCESSING_RELEASE"
    const hasCompletedJob = isProcessingRelease || ['IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED'].includes(status)

    const steps = [
      { id: 'booked', label: 'Booked', completed: true },
      { id: 'confirmed', label: 'Confirmed', completed: ['CONFIRMED', 'PENDING_EXECUTION', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED'].includes(status) },
      { id: 'paid', label: 'Paid', completed: isPaymentCompleted() },
      { id: 'in_progress', label: 'In Progress', completed: hasCompletedJob },
      { id: 'completed', label: 'Completed', completed: status === 'COMPLETED' }
    ]
    
    return steps
  }

  // If no booking, show empty state
  if (!booking) {
    return (
      <div className="relative group">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-500/5 to-blue-400/10 rounded-3xl animate-pulse opacity-50 group-hover:opacity-75 transition-opacity duration-1000"></div>
        
        <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group-hover:shadow-blue-400/20">
          {/* Floating Particles Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400/40 rounded-full animate-pulse delay-700"></div>
            <div className="absolute top-8 right-8 w-1 h-1 bg-blue-300/30 rounded-full animate-bounce delay-1000"></div>
            <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-blue-500/20 rounded-full animate-pulse delay-500"></div>
            <div className="absolute bottom-8 right-4 w-1 h-1 bg-blue-400/50 rounded-full animate-bounce delay-300"></div>
          </div>
          
          <CardHeader className="pb-4 relative z-10">
            <CardTitle className="flex items-center space-x-3 text-xl sm:text-2xl text-white">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-400/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl opacity-20 group-hover:opacity-40 blur-sm transition-opacity duration-500"></div>
              </div>
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent font-bold tracking-tight">Recent Booking</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <div className="text-center py-16 sm:py-20">
              {/* Main Empty State Icon with Advanced Effects */}
              <div className="relative mx-auto mb-8 sm:mb-12">
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-blue-400/20 via-blue-500/30 to-blue-600/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-blue-400/30 group-hover:scale-105 transition-all duration-700 group-hover:rotate-3 shadow-2xl shadow-blue-400/20">
                  <Calendar className="w-16 h-16 sm:w-20 sm:h-20 text-blue-400 group-hover:text-blue-300 transition-colors duration-500" />
                </div>
                {/* Orbital Rings */}
                <div className="absolute inset-0 rounded-full border border-blue-400/10 animate-spin" style={{animationDuration: '20s'}}></div>
                <div className="absolute inset-2 rounded-full border border-blue-300/10 animate-spin" style={{animationDuration: '15s', animationDirection: 'reverse'}}></div>
                {/* Floating Dots */}
                <div className="absolute -top-2 left-1/2 w-3 h-3 bg-blue-400/60 rounded-full animate-bounce delay-200"></div>
                <div className="absolute -bottom-2 left-1/4 w-2 h-2 bg-blue-300/40 rounded-full animate-pulse delay-700"></div>
                <div className="absolute top-1/2 -right-2 w-2.5 h-2.5 bg-blue-500/50 rounded-full animate-bounce delay-1000"></div>
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-bold text-transparent bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text mb-4 sm:mb-6 tracking-tight">No Recent Bookings</h3>
              <p className="text-gray-300 mb-8 sm:mb-12 max-w-md mx-auto text-base sm:text-lg leading-relaxed font-medium">
                Ready to experience our amazing services? Your journey starts with just one click!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center max-w-lg mx-auto">
                <DraftAwareBookingButton 
                  className="relative overflow-hidden bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 hover:from-blue-400 hover:via-blue-500 hover:to-blue-400 transition-all duration-500 ease-out hover:scale-105 text-base sm:text-lg px-8 py-4 rounded-2xl font-semibold shadow-2xl shadow-blue-500/30 hover:shadow-blue-400/50 group/btn"
                  onNavigate={(url) => window.location.href = url}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out"></div>
                  <span className="relative z-10">Book Your First Service</span>
                </DraftAwareBookingButton>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get timeline steps for this booking
  const timelineSteps = getTimelineSteps(booking.status, booking.payment);

  // Determine if pay button should be shown
  const canPay = () => {
    // Show pay button if:
    // 1. Booking is CONFIRMED (provider accepted)
    // 2. No payment exists yet OR payment is PENDING/FAILED
    // 3. Not already processing payment
    // 4. Booking has a valid amount (> 0)
    return booking.status === 'CONFIRMED' && 
           (!booking.payment || ['PENDING', 'FAILED'].includes(booking.payment.status)) &&
           !isProcessingPayment &&
           booking.totalAmount && booking.totalAmount > 0
  }

  // Determine if confirm completion button should be shown
  const canConfirmCompletion = () => {
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
    return (booking.status === "COMPLETED" && booking.payment && ["ESCROW", "HELD_IN_ESCROW"].includes(booking.payment.status))
  }
  
  // Hide button if payment is already released
  const isPaymentReleased = () => {
    return booking.payment && ["RELEASED", "COMPLETED"].includes(booking.payment.status)
  }

  // Handle confirm completion
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
        onRefresh?.() // Refresh the booking data
        window.location.reload()
      } else {
        const errorData = await response.json()
        console.error(`❌ Error response:`, errorData);
        showToast.error(errorData.error || "Failed to confirm completion")
        
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

  return (
    <div className="relative group">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
      
      <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group-hover:shadow-blue-400/20 hover:shadow-2xl">
        {/* Subtle Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 right-6 w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-6 left-4 w-1 h-1 bg-blue-300/40 rounded-full animate-bounce delay-700"></div>
          <div className="absolute top-1/2 right-4 w-2 h-2 bg-blue-500/20 rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <CardHeader className="pb-6 relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3 text-xl sm:text-2xl text-white">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-400/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl opacity-20 group-hover:opacity-40 blur-sm transition-opacity duration-500"></div>
              </div>
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent font-bold tracking-tight">Recent Booking</span>
              {isRecent() && (
                <div className="relative">
                  <span className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/40 text-sm px-3 py-1 rounded-full font-semibold shadow-lg shadow-emerald-500/20 animate-pulse">
                    New
                  </span>
                  <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md animate-pulse"></div>
                </div>
              )}
            </CardTitle>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="h-8 w-8 p-0"
              aria-label="Refresh booking status"
            >
              <RefreshCw className={cn(
                "w-4 h-4 text-gray-500",
                (isRefreshing || isLoading) && "animate-spin"
              )} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 sm:space-y-6 relative z-10">
          {/* Premium Service Card */}
          <div className="relative group/card overflow-hidden">
            {/* Shimmer Effect Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1500 ease-out"></div>
            
            <div className="flex items-center space-x-4 sm:space-x-6 p-4 sm:p-6 bg-gradient-to-r from-blue-400/10 via-blue-500/5 to-blue-400/10 backdrop-blur-md rounded-2xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 ease-out hover:shadow-xl hover:shadow-blue-400/20 group-hover/card:scale-[1.02]">
              {/* Enhanced Service Icon */}
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 group-hover/card:shadow-blue-400/50 transition-all duration-500 group-hover/card:scale-110 group-hover/card:rotate-3">
                  <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-white group-hover/card:scale-110 transition-transform duration-300" />
                </div>
                {/* Glowing Ring */}
                <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/30 group-hover/card:border-blue-300/50 transition-colors duration-500"></div>
                {/* Pulse Effect */}
                <div className="absolute inset-0 rounded-2xl bg-blue-400/20 animate-pulse opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg sm:text-xl font-bold text-transparent bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text truncate leading-tight tracking-tight">
                    {booking.service?.name || 'Service'}
                  </h4>
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-300 font-medium flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
              
              {/* Status Indicator */}
              <div className="flex-shrink-0">
                <StatusBadge status={booking.status} type="booking" size="sm" />
              </div>
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
          
          {/* Additional booking details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-white/20">
                  {formatSADate(booking.scheduledDate)}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-white/20">
                  {formatSATime(booking.scheduledDate)}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-white/20 truncate">{booking.address}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/20">Amount:</span>
                <span className="font-semibold text-white">{formatBookingPrice(booking)}</span>
              </div>
            </div>
          </div>

          {/* Provider info if available */}
          {booking.provider && (
            <div className="pt-3 border-t border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white/20" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {booking.provider.user?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-white/20 truncate">
                    {booking.provider.businessName || 'Business name not set'}
                  </p>
                </div>
                {booking.provider.user.phone && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                    onClick={() => window.open(`tel:${booking.provider?.user.phone}`, '_blank')}
                    aria-label={`Call ${booking.provider.user?.name || 'provider'}`}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Service Details - Always Visible */}
          {booking.description && (
            <div className="pt-3 border-t border-white/20">
              <div className="flex items-start space-x-2">
                <FileText className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-white/80">Service Details:</span>
                  <p className="text-sm text-white/70 mt-1 whitespace-pre-wrap">{booking.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-blue-400/20">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAll}
                className="relative overflow-hidden bg-blue-400/10 border-blue-400/40 text-blue-300 hover:text-white hover:bg-blue-400/20 hover:border-blue-400/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-400/25 px-6 py-3 rounded-xl font-semibold group/btn"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"></div>
                <Eye className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
                <span className="relative z-10">View Details</span>
              </Button>
              
              {/* Show refresh button for bookings with pending payments */}
              {booking.payment && ['PENDING', 'ESCROW'].includes(booking.payment.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      console.log('🔄 Manual refresh requested for booking:', booking.id)
                      const response = await fetch(`/api/book-service/${booking.id}/refresh`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ bookingId: booking.id })
                      })
                      
                      if (response.ok) {
                        const data = await response.json()
                        console.log('✅ Booking refreshed:', data)
                        showToast.success('Booking status updated!')
                        onRefresh?.()
                      } else {
                        showToast.error('Failed to refresh booking status')
                      }
                    } catch (error) {
                      console.error('Refresh error:', error)
                      showToast.error('Failed to refresh booking status')
                    }
                  }}
                  className="relative overflow-hidden bg-blue-400/10 border-blue-400/40 text-blue-300 hover:text-white hover:bg-blue-400/20 hover:border-blue-400/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-400/25 px-4 py-2 rounded-xl font-semibold group/btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"></div>
                  <RefreshCw className="w-3 h-3 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
                  <span className="relative z-10">Refresh</span>
                </Button>
              )}
              
              {canPay() && (
                <Button
                  size="sm"
                  onClick={handlePay}
                  disabled={isProcessingPayment}
                  className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 px-6 py-3 rounded-xl font-semibold group/btn flex items-center justify-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"></div>
                  {isProcessingPayment ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin group-hover/btn:scale-110 transition-transform duration-300" />
                  ) : (
                    <RandIconSimple className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
                  )}
                  <span className="relative z-10">
                    {isProcessingPayment ? "Processing..." : `Pay ${formatBookingPrice(booking)}`}
                  </span>
                </Button>
              )}
              
              {/* Show helpful message when payment button is not available */}
              {booking.status === 'CONFIRMED' && (!booking.totalAmount || booking.totalAmount <= 0) && (
                <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    <span>Payment amount not set. Contact provider to confirm cost.</span>
                  </div>
                </div>
              )}
              
              {canConfirmCompletion() && !isPaymentReleased() && (
                <Button
                  size="sm"
                  onClick={handleConfirmCompletion}
                  disabled={isConfirmingCompletion}
                  className="relative overflow-hidden bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 px-6 py-3 rounded-xl font-semibold group/btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"></div>
                  {isConfirmingCompletion ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="relative z-10">{booking.paymentMethod === 'CASH' ? 'Submitting...' : 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
                      <span className="relative z-10">{booking.paymentMethod === 'CASH' ? 'Pay Cash' : 'Confirm Completion'}</span>
                    </>
                  )}
                </Button>
              )}
              
              {isPaymentReleased() && (
                <div className="flex items-center text-green-600 text-sm font-medium px-6 py-3">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Payment Released
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="text-gray-300 hover:text-white hover:bg-blue-400/10 transition-all duration-300 hover:scale-105 px-6 py-3 rounded-xl font-semibold group/btn"
            >
              <span className="relative z-10">View All Bookings</span>
              <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
  )
}


