import { showToast, handleApiError } from "./toast"

export interface PaymentResult {
  success: boolean
  message: string
  bookingStatus?: string
  error?: string
}

export async function processPayment(bookingId: string): Promise<PaymentResult> {
  try {
    const response = await fetch(`/api/book-service/${bookingId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        message: data.message || "Payment processed successfully!",
        bookingStatus: "CONFIRMED" // Keep as CONFIRMED, not PAID
      }
    } else {
      const errorData = await response.json()
      
      if (errorData.error === "Payment already exists for this booking") {
        return {
          success: true,
          message: "Payment has already been processed for this booking",
          bookingStatus: "CONFIRMED" // Keep as CONFIRMED, not PAID
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
    showToast.success(result.message)
    // Don't change the booking status - it should remain CONFIRMED
    // The payment flag will be updated via the API response
  } else {
    if (result.error === "Payment already exists for this booking") {
      showToast.warning(result.message)
      // Don't change the booking status - it should remain CONFIRMED
    } else {
      showToast.error(result.message)
    }
  }
  
  return result.success
} 