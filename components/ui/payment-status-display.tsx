"use client"

import { memo, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Loader2,
  DollarSign,
  Banknote
} from "lucide-react"
import { StatusBadge } from "./status-badge"

interface PaymentStatusDisplayProps {
  payment: {
    id: string
    amount: number
    status: string
    createdAt?: string
    updatedAt?: string
  } | null
  isProcessing?: boolean
  onCheckStatus?: () => void
  className?: string
  allowContinue?: boolean
  bookingStatus?: string
  paymentMethod?: "ONLINE" | "CASH"
}

function PaymentStatusDisplayComponent({ 
  payment, 
  isProcessing = false, 
  onCheckStatus,
  className,
  allowContinue = false,
  bookingStatus,
  paymentMethod = "ONLINE",
}: PaymentStatusDisplayProps) {
  if (!payment) return null

  // CASH PAYMENT STATUS DISPLAY
  if (paymentMethod === 'CASH') {
    if (payment.status === 'CASH_PENDING') {
      return (
        <Alert key="cash-pending" className="border-yellow-500/50 bg-yellow-500/10">
          <Banknote className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-300">
            <span className="font-medium mb-1 block">Awaiting Cash Payment</span>
            <p className="text-xs">
              Please pay the provider in cash when the service is completed. The provider will confirm receipt.
            </p>
          </AlertDescription>
        </Alert>
      )
    }

    if (payment.status === 'CASH_RECEIVED') {
      return (
        <Alert key="cash-received" className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-300">
            <span className="font-medium mb-1 block">Cash Payment Received</span>
            <p className="text-xs">
              The provider has confirmed receipt of your cash payment.
            </p>
          </AlertDescription>
        </Alert>
      )
    }

    if (payment.status === 'CASH_VERIFIED') {
      return (
        <div className="flex items-center space-x-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-600 font-medium">Cash Payment Verified</span>
        </div>
      )
    }
  }

  const isPaymentProcessing = payment.status === 'PENDING' && isProcessing
  
  // Memoize these calculations to prevent re-renders
  const isPaymentStuck = useMemo(() => {
    if (!payment.createdAt) return false
    const now = new Date()
    const created = new Date(payment.createdAt)
    const minutesDiff = (now.getTime() - created.getTime()) / (1000 * 60)
    return minutesDiff > 8
  }, [payment.createdAt])

  const isPaymentDelayed = useMemo(() => {
    if (!payment.createdAt) return false
    const now = new Date()
    const created = new Date(payment.createdAt)
    const minutesDiff = (now.getTime() - created.getTime()) / (1000 * 60)
    return minutesDiff > 5 && minutesDiff <= 8
  }, [payment.createdAt])

  // Processing state
  if (isPaymentProcessing) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
        <span className="text-orange-300 font-medium">Processing Payment...</span>
      </div>
    )
  }

  // Stuck payment
  if (payment.status === 'PENDING' && isPaymentStuck) {
    return (
      <Alert key="stuck-payment" className="border-amber-500/50 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertDescription className="text-amber-300">
          <div className="flex items-start justify-between mb-2">
            <span className="font-medium">Payment Status Update Needed</span>
            {onCheckStatus && (
              <Button
                size="sm"
                variant="outline"
                onClick={onCheckStatus}
                className="text-xs h-6 px-2 border-amber-500/50 text-amber-300 hover:bg-amber-500/20"
              >
                Check Status
              </Button>
            )}
          </div>
          <p className="text-xs mb-2">
            Your payment may have been completed but our system needs to sync. This usually resolves automatically.
          </p>
          <div className="text-xs space-y-1">
            <p>• <strong>Try this first:</strong> Click "Check Status" above</p>
            <p>• <strong>If that doesn't work:</strong> Refresh the page</p>
            <p>• <strong>Still stuck?</strong> Your payment is likely fine - wait 10-15 minutes</p>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Delayed payment
  if (payment.status === 'PENDING' && isPaymentDelayed) {
    return (
      <Alert key="delayed-payment" className="border-blue-500/50 bg-blue-500/10">
        <Clock className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-300">
          <span className="font-medium mb-2 block">Payment Taking Longer Than Expected</span>
          <p className="text-xs mb-2">
            Your payment is still processing. This is normal and may take a few more minutes.
          </p>
          <div className="text-xs space-y-1">
            <p>• <strong>What's happening:</strong> We're waiting for payment confirmation</p>
            <p>• <strong>This is normal:</strong> Payments can take 2-8 minutes to process</p>
            <p>• <strong>No action needed:</strong> Just wait a bit longer</p>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Normal/active pending (non-stuck, non-delayed): show status + actions and optional Continue Payment
  if (payment.status === 'PENDING') {
    const url = (payment as any).authorizationUrl
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-600 font-medium">Awaiting Payment Confirmation</span>
        </div>
        <div className="flex items-center gap-2">
          {onCheckStatus && (
            <button onClick={onCheckStatus} className="text-xs underline">Check Status</button>
          )}
          {url && allowContinue && (
            <a href={url} target="_self" className="text-xs text-blue-600 underline">Continue Payment</a>
          )}
          {url && !allowContinue && (
            <span className="text-xs text-gray-500">Payment link disabled</span>
          )}
        </div>
      </div>
    )
  }

  // Failed payment
  if (payment.status === 'FAILED') {
    return (
      <Alert key="payment-failed" className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <span className="font-medium mb-2 block">Payment Failed</span>
          <p className="text-xs mb-2">
            Your payment couldn't be processed. This is usually temporary.
          </p>
          <div className="text-xs space-y-1">
            <p>• <strong>Try again:</strong> Click "Pay Now" below</p>
            <p>• <strong>Check:</strong> Your payment method and internet connection</p>
            <p>• <strong>Contact us:</strong> Only if the issue persists after multiple attempts</p>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Processing Release - Payment is being released to provider
  if (payment.status === 'PROCESSING_RELEASE') {
    // Check if payment is stuck (more than 5 minutes since status was set to PROCESSING_RELEASE)
    const isStuck = useMemo(() => {
      // Prefer updatedAt (when status was set to PROCESSING_RELEASE), fallback to createdAt
      const timestamp = payment.updatedAt || payment.createdAt
      if (!timestamp) return false
      const now = new Date()
      const statusTime = new Date(timestamp)
      const minutesDiff = (now.getTime() - statusTime.getTime()) / (1000 * 60)
      return minutesDiff > 5
    }, [payment.updatedAt, payment.createdAt])

    if (isStuck) {
      return (
        <Alert key="processing-stuck" className="border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          <AlertDescription className="text-orange-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className="font-medium mb-1 block">Payment Release Taking Longer Than Expected</span>
                <p className="text-xs">
                  The payment release may be stuck. You can check the status or retry the release.
                </p>
              </div>
              {onCheckStatus && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCheckStatus}
                  className="ml-4 text-xs h-6 px-2 border-orange-500/50 text-orange-300 hover:bg-orange-500/20"
                >
                  Check Status
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="flex items-center space-x-2 text-sm">
        <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
        <span className="text-orange-600 font-medium">Processing Payment Release</span>
      </div>
    )
  }

  // Escrow payment
  if (['ESCROW', 'HELD_IN_ESCROW'].includes(payment.status)) {
    // If booking is completed, show different message
    if (bookingStatus === 'COMPLETED') {
      return (
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="w-4 h-4 text-orange-500" />
          <span className="text-orange-600 font-medium">Payment in Escrow - Ready for Release</span>
        </div>
      )
    }
    
    // If booking is awaiting confirmation, show waiting for client confirmation
    if (bookingStatus === 'AWAITING_CONFIRMATION') {
      return (
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="w-4 h-4 text-orange-500" />
          <span className="text-orange-600 font-medium">Payment in Escrow - Awaiting Client Confirmation</span>
        </div>
      )
    }
    
    // If booking is in progress, show provider can start work
    if (bookingStatus === 'IN_PROGRESS') {
      return (
        <div className="flex items-center space-x-2 text-sm">
          <DollarSign className="w-4 h-4 text-blue-500" />
          <span className="text-blue-600 font-medium">Payment in Escrow - Work in Progress</span>
        </div>
      )
    }
    
    // Default escrow message for other statuses
    return (
      <div className="flex items-center space-x-2 text-sm">
        <DollarSign className="w-4 h-4 text-blue-500" />
        <span className="text-blue-600 font-medium">Payment in Escrow - Provider Can Start Work</span>
      </div>
    )
  }

  // Completed payment - but check booking status first for AWAITING_CONFIRMATION
  // If booking is awaiting confirmation, payment might be in escrow but status shows as completed
  // In manual payout flow, payment stays in ESCROW until admin marks payout as paid
  if (['RELEASED', 'COMPLETED'].includes(payment.status)) {
    // If booking is awaiting confirmation, this shouldn't happen in manual flow
    // But show appropriate message if it does
    if (bookingStatus === 'AWAITING_CONFIRMATION') {
      return (
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="w-4 h-4 text-orange-500" />
          <span className="text-orange-600 font-medium">Payment in Escrow - Awaiting Client Confirmation</span>
        </div>
      )
    }
    
    // Normal completed payment (admin has marked payout as paid)
    return (
      <div className="flex items-center space-x-2 text-sm">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span className="text-green-600 font-medium">Payment Completed</span>
      </div>
    )
  }

  // Default status badge
  return (
    <StatusBadge 
      status={payment.status} 
      type="payment" 
      size="sm"
      className={className}
    />
  )
}

// Memoize to prevent infinite re-renders when props haven't actually changed
export const PaymentStatusDisplay = memo(PaymentStatusDisplayComponent, (prevProps, nextProps) => {
  // Only re-render if these critical props actually changed
  const prevPayment = prevProps.payment
  const nextPayment = nextProps.payment
  
  // Handle null payments
  if (!prevPayment && !nextPayment) return true // Both null, no change
  if (!prevPayment || !nextPayment) return false // One null, one not, changed
  
  // Compare payment properties
  const paymentChanged = (
    prevPayment.id !== nextPayment.id ||
    prevPayment.status !== nextPayment.status
  )
  
  const otherPropsChanged = (
    prevProps.bookingStatus !== nextProps.bookingStatus ||
    prevProps.paymentMethod !== nextProps.paymentMethod ||
    prevProps.isProcessing !== nextProps.isProcessing
  )
  
  // Return true if nothing changed (should NOT re-render)
  return !paymentChanged && !otherPropsChanged
})
