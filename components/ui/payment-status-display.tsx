"use client"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Loader2,
  DollarSign
} from "lucide-react"
import { StatusBadge } from "./status-badge"

interface PaymentStatusDisplayProps {
  payment: {
    id: string
    amount: number
    status: string
    createdAt?: string
  } | null
  isProcessing?: boolean
  onCheckStatus?: () => void
  className?: string
}

export function PaymentStatusDisplay({ 
  payment, 
  isProcessing = false, 
  onCheckStatus,
  className 
}: PaymentStatusDisplayProps) {
  if (!payment) return null

  const isPaymentProcessing = payment.status === 'PENDING' && isProcessing
  const isPaymentStuck = () => {
    if (!payment.createdAt) return false
    const now = new Date()
    const created = new Date(payment.createdAt)
    const minutesDiff = (now.getTime() - created.getTime()) / (1000 * 60)
    return minutesDiff > 8
  }

  const isPaymentDelayed = () => {
    if (!payment.createdAt) return false
    const now = new Date()
    const created = new Date(payment.createdAt)
    const minutesDiff = (now.getTime() - created.getTime()) / (1000 * 60)
    return minutesDiff > 5 && minutesDiff <= 8
  }

  // Processing state
  if (isPaymentProcessing) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
        <span className="text-orange-600 font-medium">Processing Payment...</span>
      </div>
    )
  }

  // Stuck payment
  if (payment.status === 'PENDING' && isPaymentStuck()) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="flex items-start justify-between mb-2">
            <span className="font-medium">Payment Status Update Needed</span>
            {onCheckStatus && (
              <Button
                size="sm"
                variant="outline"
                onClick={onCheckStatus}
                className="text-xs h-6 px-2 border-amber-300 text-amber-700 hover:bg-amber-100"
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
  if (payment.status === 'PENDING' && isPaymentDelayed()) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Clock className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
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

  // Normal processing
  if (payment.status === 'PENDING') {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Clock className="w-4 h-4 text-yellow-500" />
        <span className="text-yellow-600 font-medium">Awaiting Payment Confirmation</span>
      </div>
    )
  }

  // Failed payment
  if (payment.status === 'FAILED') {
    return (
      <Alert className="border-red-200 bg-red-50">
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

  // Completed payment
  if (['RELEASED', 'COMPLETED'].includes(payment.status)) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span className="text-green-600 font-medium">Payment Completed</span>
      </div>
    )
  }

  // Escrow payment
  if (['ESCROW', 'HELD_IN_ESCROW'].includes(payment.status)) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <DollarSign className="w-4 h-4 text-blue-500" />
        <span className="text-blue-600 font-medium">Payment in Escrow - Provider Can Start Work</span>
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
