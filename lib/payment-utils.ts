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
        // Fetch current payment status to determine next action (continue vs already completed)
        try {
          const statusRes = await fetch(`/api/book-service/${bookingId}/payment-status`, { method: 'GET' })
          if (statusRes.ok) {
            const statusData = await statusRes.json()
            const payment = statusData?.payment
            if (payment?.status === 'PENDING' && payment?.authorizationUrl) {
              return {
                success: true,
                message: "Payment is in progress. Redirecting to continue...",
                bookingStatus: "CONFIRMED",
                authorizationUrl: payment.authorizationUrl,
                shouldRedirect: true
              }
            }

            if (payment?.status === 'ESCROW' || payment?.status === 'HELD_IN_ESCROW' || payment?.status === 'RELEASED' || payment?.status === 'COMPLETED') {
              return {
                success: true,
                message: "Payment already completed.",
                bookingStatus: "PENDING_EXECUTION"
              }
            }
          }
        } catch (e) {
          // Fall through to default handling
        }
        return {
          success: false,
          message: "Payment already exists and could not be continued. Please use 'Check Status' or try again shortly.",
          error: "PAYMENT_ALREADY_EXISTS"
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
      showToast.success("Payment Gateway Ready - Redirecting to Paystack payment gateway...")
      
      // Update the current page to show payment is being processed
      if (onStatusChange && bookingId) {
        onStatusChange(bookingId, "CONFIRMED") // Keep as CONFIRMED until payment completes
      }
      
      // IMPROVED REDIRECT MECHANISM
      console.log('🔄 Redirecting to payment gateway NOW...')
      
      // Method 1: Direct redirect (most reliable)
      setTimeout(() => {
        try {
          console.log('🔄 Attempting direct redirect...')
          
          // Use the most reliable redirect method
          console.log('🔄 Using window.location.href for redirect...')
          if (result.authorizationUrl) {
            window.location.href = result.authorizationUrl
          }
          
        } catch (redirectError) {
          console.log('⚠️ Direct redirect failed, trying fallback...')
          
          // Method 2: Try window.location.replace
          try {
            console.log('🔄 Trying window.location.replace...')
            if (result.authorizationUrl) {
              window.location.replace(result.authorizationUrl)
            }
          } catch (replaceError) {
            console.log('⚠️ Replace redirect failed, trying new tab...')
            
            // Method 3: Open in new tab with focus
            try {
              console.log('🔄 Opening payment gateway in new tab...')
              if (result.authorizationUrl) {
                const newWindow = window.open(result.authorizationUrl, '_blank', 'noopener,noreferrer')
                if (newWindow) {
                  console.log('✅ Payment gateway opened in new tab')
                  newWindow.focus()
                  
                  // Show clear instruction to user
                  showToast.success("Payment gateway opened in new tab. Please complete your payment there.")
                } else {
                  throw new Error('Popup blocked')
                }
              }
            } catch (newTabError) {
              console.log('⚠️ New tab failed, showing manual option...')
              
              // Method 4: Show manual link with copy functionality
              showToast.error("Redirect failed. Please manually navigate to the payment gateway.")
            }
          }
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