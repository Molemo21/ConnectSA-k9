/**
 * Shared Booking Timeline Utilities
 * 
 * Centralized timeline logic to ensure all booking cards display
 * consistent progress indicators across the application.
 * 
 * This prevents sync issues between different booking card components.
 */

export interface TimelineStep {
  id: string
  label: string
  completed: boolean
}

export interface PaymentInfo {
  status: string
}

/**
 * Get timeline steps for a booking based on status, payment, and payment method
 * 
 * @param status - Booking status (PENDING, CONFIRMED, IN_PROGRESS, etc.)
 * @param payment - Payment object with status property
 * @param paymentMethod - Payment method (ONLINE or CASH)
 * @returns Array of timeline steps with completion status
 */
export function getTimelineSteps(
  status: string,
  payment?: PaymentInfo | null,
  paymentMethod?: "ONLINE" | "CASH"
): TimelineStep[] {
  // CASH PAYMENT TIMELINE (Simplified - 5 steps, clearer labels)
  if (paymentMethod === 'CASH') {
    const steps: TimelineStep[] = [
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

  // ONLINE/CARD PAYMENT TIMELINE
  // Enhanced payment detection logic
  // If booking status is PENDING_EXECUTION or later, payment was likely completed
  // even if payment object is missing or has wrong status
  const isPaymentCompleted = (): boolean => {
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

  // Check if payment is in PROCESSING_RELEASE status
  // This indicates that:
  // 1. Provider completed the job
  // 2. Client confirmed completion (clicked "Confirm Completion")
  // 3. Payment release is in progress
  // Therefore, "In Progress" and "Awaiting Confirmation" steps should be ticked
  const isProcessingRelease = payment?.status === "PROCESSING_RELEASE"
  
  // Determine if job completion steps should be marked as completed
  // If payment is PROCESSING_RELEASE, it means the job was completed and client confirmed
  // This should be true regardless of booking status when payment is PROCESSING_RELEASE
  const hasCompletedJob = isProcessingRelease || ["IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"].includes(status)
  const hasConfirmedCompletion = isProcessingRelease || ["AWAITING_CONFIRMATION", "COMPLETED"].includes(status)

  const steps: TimelineStep[] = [
    { id: "booked", label: "Booked", completed: true },
    { id: "confirmed", label: "Provider Confirmed", completed: ["CONFIRMED", "PENDING_EXECUTION", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED"].includes(status) },
    { id: "payment", label: "Paid", completed: isPaymentCompleted() },
    { id: "in_progress", label: "In Progress", completed: hasCompletedJob },
    { id: "awaiting_confirmation", label: "Awaiting Confirmation", completed: hasConfirmedCompletion },
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
