import { showToast, handleApiError } from "./toast"

export interface PaymentResult {
  success: boolean
  message: string
  bookingStatus?: string
  error?: string
  authorizationUrl?: string
  shouldRedirect?: boolean
}

export async function processPayment(bookingId: string): Promise<PaymentResult> {
  try {
    const response = await fetch(`/api/book-service/${bookingId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callbackUrl: `${window.location.origin}/dashboard?payment=success&booking=${bookingId}`
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      
      // If we get an authorization URL, prepare for redirect to Paystack
      if (data.authorizationUrl) {
        return {
          success: true,
          message: "Payment gateway ready. Redirecting to complete payment...",
          bookingStatus: "CONFIRMED", // Keep as CONFIRMED until payment is actually completed
          authorizationUrl: data.authorizationUrl,
          shouldRedirect: true
        }
      }
      
      return {
        success: true,
        message: data.message || "Payment processed successfully!",
        bookingStatus: "PENDING_EXECUTION"
      }
    } else {
      const errorData = await response.json()
      
      if (errorData.error === "Payment already exists for this booking") {
        return {
          success: true,
          message: "Payment has already been processed for this booking",
          bookingStatus: "PENDING_EXECUTION"
        }
      } else {
        return {
          success: false,
          message: errorData.error || "Failed to process payment",
          error: errorData.error
        }
      }
    }
  } catch (error) {
    console.error("Payment error:", error)
    return {
      success: false,
      message: "Network error. Please try again.",
      error: "NETWORK_ERROR"
    }
  }
}

export function handlePaymentResult(result: PaymentResult, onStatusChange?: (bookingId: string, status: string) => void, bookingId?: string) {
  if (result.success) {
    if (result.shouldRedirect && result.authorizationUrl) {
      // Show success message and redirect to payment gateway
      showToast.success(result.message)
      
      // Update the current page to show payment is being processed
      if (onStatusChange && bookingId) {
        onStatusChange(bookingId, "CONFIRMED") // Keep as CONFIRMED until payment completes
      }
      
      // Redirect to payment gateway in the same tab for better UX
      setTimeout(() => {
        try {
          // Redirect to payment gateway
          window.location.href = result.authorizationUrl
        } catch (error) {
          console.error("Redirect failed, opening in new tab:", error)
          // Fallback to new tab if redirect fails
          window.open(result.authorizationUrl, '_blank', 'noopener,noreferrer')
        }
      }, 1000)
    } else {
      // Regular success case (no redirect needed)
      showToast.success(result.message)
      if (result.bookingStatus && onStatusChange && bookingId) {
        onStatusChange(bookingId, result.bookingStatus)
      }
    }
  } else {
    if (result.error === "Payment already exists for this booking") {
      showToast.warning(result.message)
    } else {
      showToast.error(result.message)
    }
  }
  
  return result.success
} 