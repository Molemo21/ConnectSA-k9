import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paystackClient, paymentProcessor } from "@/lib/paystack";
import { logPayment } from "@/lib/logger";
import { createNotification } from "@/lib/notification-service";

export const dynamic = 'force-dynamic'

// Enhanced types for better type safety
interface TransferRecipientData {
  type: 'nuban';
  name: string;
  account_number: string;
  bank_code: string;
}

interface TransferData {
  source: 'balance';
  amount: number;
  recipient: string;
  reason: string;
  reference: string;
}

interface PaymentReleaseResponse {
  success: boolean;
  message?: string;
  bookingId?: string;
  paymentId?: string;
  transferCode?: string;
  status?: string;
  error?: string;
  details?: string;
  currentStatus?: string;
  expectedStatus?: string;
  bookingStatus?: string;
}

// Business rule constants
const VALID_PAYMENT_STATUSES_FOR_RELEASE = ['ESCROW', 'PROCESSING_RELEASE'] as const;
const VALID_BOOKING_STATUSES_FOR_RELEASE = ['AWAITING_CONFIRMATION', 'COMPLETED'] as const;
const BLOCKED_PAYMENT_STATUSES = ['RELEASED', 'REFUNDED', 'FAILED'] as const;
const BLOCKED_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'CANCELLED', 'PENDING_EXECUTION'] as const;

type ValidPaymentStatus = typeof VALID_PAYMENT_STATUSES_FOR_RELEASE[number];
type ValidBookingStatus = typeof VALID_BOOKING_STATUSES_FOR_RELEASE[number];
type BlockedPaymentStatus = typeof BLOCKED_PAYMENT_STATUSES[number];
type BlockedBookingStatus = typeof BLOCKED_BOOKING_STATUSES[number];

// Validation helper functions
function isValidPaymentStatus(status: string): status is ValidPaymentStatus {
  return VALID_PAYMENT_STATUSES_FOR_RELEASE.includes(status as ValidPaymentStatus);
}

function isValidBookingStatus(status: string): status is ValidBookingStatus {
  return VALID_BOOKING_STATUSES_FOR_RELEASE.includes(status as ValidBookingStatus);
}

function isBlockedPaymentStatus(status: string): status is BlockedPaymentStatus {
  return BLOCKED_PAYMENT_STATUSES.includes(status as BlockedPaymentStatus);
}

function isBlockedBookingStatus(status: string): status is BlockedBookingStatus {
  return BLOCKED_BOOKING_STATUSES.includes(status as BlockedBookingStatus);
}

// Error message generators
function getPaymentStatusErrorMessage(status: string): { error: string; details: string } {
  const errorMessages: Record<string, { error: string; details: string }> = {
    "HELD_IN_ESCROW": {
      error: "Your payment is being processed. Please wait a moment and try again.",
      details: "Payment is still being verified with the payment processor."
    },
    "PROCESSING_RELEASE": {
      error: "Payment release is already in progress. Please wait for it to complete.",
      details: "A transfer is currently being processed. This usually takes 1-2 minutes."
    },
    "RELEASED": {
      error: "Payment has already been released to the provider. Check your booking status.",
      details: "This payment was successfully transferred to the provider's account."
    },
    "REFUNDED": {
      error: "This payment has been refunded and cannot be released.",
      details: "The payment was refunded and is no longer available for transfer."
    },
    "FAILED": {
      error: "This payment failed and cannot be released. Please contact support.",
      details: "The payment processing failed and requires manual intervention."
    },
    "PENDING": {
      error: "Payment is still being processed. Please wait for it to complete.",
      details: "The payment is being verified with the payment processor. If this persists, try the 'Recover Payment' button."
    },
    "ABANDONED": {
      error: "Payment was abandoned and cannot be released.",
      details: "The payment was abandoned by the payment processor. Please contact support to resolve this issue."
    }
  };

  return errorMessages[status] || {
    error: "Payment is not ready for release. Please try again later.",
    details: `Current payment status: ${status}. Contact support if this persists.`
  };
}

function getBookingStatusErrorMessage(status: string): { error: string; details: string } {
  const errorMessages: Record<string, { error: string; details: string }> = {
    "PENDING": {
      error: "Please wait for the provider to accept your booking first.",
      details: "The provider needs to accept your booking before payment can be released."
    },
    "CONFIRMED": {
      error: "Please wait for the provider to start the job.",
      details: "The provider has accepted but hasn't started the work yet."
    },
    "IN_PROGRESS": {
      error: "The job is still in progress. Please wait for completion.",
      details: "The provider is currently working on your job."
    },
    "CANCELLED": {
      error: "This booking has been cancelled and cannot be completed.",
      details: "Cancelled bookings cannot have payments released."
    },
    "PENDING_EXECUTION": {
      error: "Payment is already being processed. Please wait.",
      details: "A payment release is currently in progress for this booking."
    }
  };

  return errorMessages[status] || {
    error: "The job is not ready for payment release yet.",
    details: `Current job status: ${status}. Contact support if this seems incorrect.`
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<PaymentReleaseResponse>> {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      success: false,
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  const startTime = Date.now();
  let bookingId: string | null = null;

  try {
    // 1. Authentication and Authorization
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized",
        details: "You must be logged in as a client to release payments."
      }, { status: 401 });
    }

    // 2. Extract booking ID from URL
    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/release-payment/);
    bookingId = match ? match[1] : null;

    if (!bookingId) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid booking ID",
        details: "The booking ID in the URL is not valid."
      }, { status: 400 });
    }

    console.log(`🚀 Starting payment release for booking: ${bookingId}`);

    // 3. Fetch booking data with comprehensive error handling
    console.log(`🔍 Fetching booking data for ${bookingId}...`);
    
    let booking;
    try {
      booking = await prisma.booking.findUnique({ 
        where: { id: bookingId },
        include: { 
          payment: true,
          provider: {
            select: {
              id: true,
              userId: true,
              businessName: true,
              bankName: true,
              bankCode: true,
              accountNumber: true,
              accountName: true,
              recipientCode: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          service: true
        }
      });
    } catch (dbError) {
      console.error(`❌ Database error fetching booking ${bookingId}:`, dbError);
      return NextResponse.json({
        success: false,
        error: "Unable to fetch booking information",
        details: "There was a problem accessing the booking data. Please try again."
      }, { status: 500 });
    }
    
    if (!booking) {
      return NextResponse.json({
        success: false,
        error: "Booking not found",
        details: `No booking found with ID: ${bookingId}`
      }, { status: 404 });
    }

    // 4. Authorization checks
    if (booking.clientId !== user.id) {
      return NextResponse.json({
        success: false,
        error: "Forbidden: You can only release payments for your own bookings",
        details: "You can only release payments for bookings you created."
      }, { status: 403 });
    }

    if (!booking.payment) {
      return NextResponse.json({
        success: false,
        error: "No payment found for this booking",
        details: "This booking doesn't have an associated payment record."
      }, { status: 400 });
    }

    if (!booking.provider) {
      return NextResponse.json({
        success: false,
        error: "Provider not found for this booking",
        details: "This booking doesn't have an associated provider."
      }, { status: 400 });
    }

    // PHASE 4: Handle CASH payment completion flow (OPTION A - Client pays -> Provider confirms)
    if (booking.paymentMethod === 'CASH') {
      console.log(`💰 Processing cash payment completion for booking ${bookingId}`);
      
      // Ensure payment exists (TypeScript guard)
      if (!booking.payment) {
        return NextResponse.json({
          success: false,
          error: "No payment found for this booking",
          details: "This booking doesn't have an associated payment record."
        }, { status: 400 });
      }
      
      // Check that payment is in CASH_PENDING status (awaiting client payment)
      if (booking.payment.status !== 'CASH_PENDING') {
        return NextResponse.json({ 
          success: false,
          error: "Payment already processed",
          details: `Payment status is already ${booking.payment.status}. This booking cannot be paid again.`,
          currentStatus: booking.payment.status
        }, { status: 400 });
      }

      // Client pays cash - Update payment to CASH_PAID, booking stays AWAITING_CONFIRMATION
      const paymentId = booking.payment.id; // Store payment ID for transaction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await prisma.$transaction(async (tx: any) => {
        // Update payment status to CASH_PAID (client confirms they paid, waiting for provider)
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'CASH_PAID',
            paidAt: new Date(),
          }
        });
        
        // Keep booking in AWAITING_CONFIRMATION (waiting for provider to confirm receipt)
        // Note: We don't change booking status here - provider will complete it
        
        return { updatedPayment };
      });

      console.log(`✅ Cash payment claimed by client, waiting for provider confirmation:`, {
        bookingId: bookingId,
        bookingStatus: booking.status,
        paymentStatus: result.updatedPayment.status
      });

      // Create notification for provider - they need to confirm they received the cash
      try {
        await createNotification({
          userId: booking.provider.userId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Claimed - Confirm Cash Received',
          content: `Client claims they paid R${booking.totalAmount.toFixed(2)} in cash for "${booking.service?.name || 'Service'}". Please confirm you received the payment to complete the booking.`
        });
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
      }

      return NextResponse.json({
        success: true,
        message: "Payment claim submitted! Provider will confirm receipt to complete the booking.",
        bookingId: bookingId,
        status: "AWAITING_CONFIRMATION"
      });
    }

    // CONTINUE WITH EXISTING ONLINE PAYMENT LOGIC BELOW...

    // 5. Enhanced payment status validation with flexible business rules
    console.log(`🔍 Payment status validation for booking ${bookingId}:`, {
      paymentId: booking.payment.id,
      currentStatus: booking.payment.status,
      validStatuses: VALID_PAYMENT_STATUSES_FOR_RELEASE,
      bookingStatus: booking.status,
      amount: booking.payment.amount
    });

    // Handle payment status recovery for stuck payments with enhanced logic
    if (booking.payment.status === "PENDING") {
      console.log(`⚠️ Payment ${booking.payment.id} is stuck in PENDING status. Attempting comprehensive status recovery...`);
      
      try {
        const paystackVerification = await paystackClient.verifyPayment(booking.payment.paystackRef);
        console.log(`🔍 Paystack verification result:`, paystackVerification);
        
        if (paystackVerification.status && paystackVerification.data.status === 'success') {
          console.log(`✅ Paystack verification shows payment was successful. Updating status to ESCROW...`);
          
          await prisma.payment.update({
            where: { id: booking.payment.id },
            data: { 
              status: 'ESCROW',
              paidAt: new Date(),
              transactionId: paystackVerification.data.id?.toString() || null,
              updatedAt: new Date()
            }
          });
          
          console.log(`✅ Payment status updated to ESCROW via recovery`);
          booking.payment.status = 'ESCROW';
          booking.payment.paidAt = new Date();
          
        } else if (paystackVerification.data.status === 'abandoned') {
          console.log(`❌ Paystack verification shows payment was abandoned. Checking if we can still proceed...`);
          
          // For abandoned payments, check if the booking status suggests work was completed
          // This handles cases where payment was abandoned but work was actually done
          if (booking.status === 'AWAITING_CONFIRMATION' || booking.status === 'COMPLETED') {
            console.log(`🔄 Payment was abandoned but booking suggests work was completed. Attempting manual recovery...`);
            
            // Update payment status to ESCROW manually (assuming payment was successful but abandoned)
            await prisma.payment.update({
              where: { id: booking.payment.id },
              data: { 
                status: 'ESCROW',
                paidAt: new Date(),
                updatedAt: new Date()
              }
            });
            
            console.log(`✅ Payment status manually updated to ESCROW for abandoned payment`);
            booking.payment.status = 'ESCROW';
            booking.payment.paidAt = new Date();
            
          } else {
            console.log(`❌ Payment was abandoned and booking doesn't suggest completion`);
            return NextResponse.json({
              success: false,
              error: "Payment was abandoned and cannot be released",
              details: "The payment was abandoned by the payment processor. Please contact support to resolve this issue.",
              currentStatus: booking.payment.status,
              expectedStatus: "ESCROW",
              bookingStatus: booking.status,
              paystackStatus: paystackVerification.data.status
            }, { status: 400 });
          }
          
        } else {
          console.log(`❌ Paystack verification shows payment was not successful:`, paystackVerification.data.status);
          return NextResponse.json({
            success: false,
            error: `Payment verification failed. Status: ${paystackVerification.data.status}`,
            details: "The payment could not be verified with the payment processor. Please try again or contact support.",
            currentStatus: booking.payment.status,
            expectedStatus: "ESCROW",
            bookingStatus: booking.status,
            paystackStatus: paystackVerification.data.status
          }, { status: 400 });
        }
        
      } catch (verificationError) {
        console.error(`❌ Payment verification failed during recovery:`, verificationError);
        
        // Enhanced error handling for different types of verification errors
        const errorMessage = verificationError instanceof Error ? verificationError.message : 'Unknown error';
        
        // If it's a network error or API error, provide more helpful guidance
        if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
          return NextResponse.json({
            success: false,
            error: "Unable to verify payment status",
            details: "There was a network issue verifying the payment. Please try again in a few moments.",
            currentStatus: booking.payment.status,
            expectedStatus: "ESCROW",
            bookingStatus: booking.status,
            retryable: true
          }, { status: 400 });
        }
        
        return NextResponse.json({
          success: false,
          error: `Payment verification failed: ${errorMessage}`,
          details: "Unable to verify payment status with the payment processor. Please contact support if this persists.",
          currentStatus: booking.payment.status,
          expectedStatus: "ESCROW",
          bookingStatus: booking.status
        }, { status: 400 });
      }
    }

    // Enhanced payment status validation with clear business rules
    if (isBlockedPaymentStatus(booking.payment.status)) {
      const errorInfo = getPaymentStatusErrorMessage(booking.payment.status);
      return NextResponse.json({
        success: false,
        error: errorInfo.error,
        details: errorInfo.details,
        currentStatus: booking.payment.status,
        expectedStatus: VALID_PAYMENT_STATUSES_FOR_RELEASE.join(' or '),
        bookingStatus: booking.status
      }, { status: 400 });
    }

    if (!isValidPaymentStatus(booking.payment.status)) {
      const errorInfo = getPaymentStatusErrorMessage(booking.payment.status);
      return NextResponse.json({
        success: false,
        error: errorInfo.error,
        details: errorInfo.details,
        currentStatus: booking.payment.status,
        expectedStatus: VALID_PAYMENT_STATUSES_FOR_RELEASE.join(' or '),
        bookingStatus: booking.status
      }, { status: 400 });
    }

    // 6. Enhanced booking status validation
    if (isBlockedBookingStatus(booking.status)) {
      const errorInfo = getBookingStatusErrorMessage(booking.status);
      return NextResponse.json({
        success: false,
        error: errorInfo.error,
        details: errorInfo.details,
        currentStatus: booking.payment.status,
        expectedStatus: VALID_PAYMENT_STATUSES_FOR_RELEASE.join(' or '),
        bookingStatus: booking.status
      }, { status: 400 });
    }

    if (!isValidBookingStatus(booking.status)) {
      const errorInfo = getBookingStatusErrorMessage(booking.status);
      return NextResponse.json({
        success: false,
        error: errorInfo.error,
        details: errorInfo.details,
        currentStatus: booking.payment.status,
        expectedStatus: VALID_PAYMENT_STATUSES_FOR_RELEASE.join(' or '),
        bookingStatus: booking.status
      }, { status: 400 });
    }

    // 7. Provider bank details validation
    if (!booking.provider.bankCode || !booking.provider.accountNumber) {
      return NextResponse.json({
        success: false,
        error: "Provider hasn't set up their bank account yet. Please ask them to add their bank details.",
        details: "The provider needs to add their bank account information before payments can be released.",
        currentStatus: booking.payment.status,
        expectedStatus: VALID_PAYMENT_STATUSES_FOR_RELEASE.join(' or '),
        bookingStatus: booking.status
      }, { status: 400 });
    }

    // 8. Generate unique reference for transfer
    const transferReference = paymentProcessor.generateReference("TR");
    console.log(`💰 Generated transfer reference: ${transferReference}`);

    // 9. Update payment status to indicate transfer is being processed
    try {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: { 
          status: "PROCESSING_RELEASE",
          updatedAt: new Date()
        }
      });
      console.log(`💳 Payment status updated to PROCESSING_RELEASE`);
    } catch (updateError) {
      console.error(`❌ Failed to update payment status:`, updateError);
      return NextResponse.json({
        success: false,
        error: "Unable to update payment status",
        details: "There was a problem updating the payment status. Please try again.",
        currentStatus: booking.payment.status,
        expectedStatus: VALID_PAYMENT_STATUSES_FOR_RELEASE.join(' or '),
        bookingStatus: booking.status
      }, { status: 500 });
    }

    // 10. Update booking status to indicate payment is being released
    try {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { 
          status: "PENDING_EXECUTION",
          updatedAt: new Date()
        }
      });
      console.log(`📋 Booking status updated to PENDING_EXECUTION`);
    } catch (updateError) {
      console.error(`❌ Failed to update booking status:`, updateError);
      // Try to revert payment status
      try {
        await prisma.payment.update({
          where: { id: booking.payment.id },
          data: { 
            status: booking.payment.status,
            updatedAt: new Date()
          }
        });
      } catch (revertError) {
        console.error(`❌ Failed to revert payment status:`, revertError);
      }
      
      return NextResponse.json({
        success: false,
        error: "Unable to update booking status",
        details: "There was a problem updating the booking status. Please try again.",
        currentStatus: booking.payment.status,
        expectedStatus: VALID_PAYMENT_STATUSES_FOR_RELEASE.join(' or '),
        bookingStatus: booking.status
      }, { status: 500 });
    }

    // 11. Paystack transfer processing with comprehensive error handling
    console.log(`🔄 Processing Paystack transfer for booking: ${bookingId}`);
    
    try {
      // 12. Create transfer recipient if not already created or if existing is invalid
      let recipientCode = booking.provider.recipientCode;
      
      // Check if we're in test mode
      const isTestMode = process.env.NODE_ENV === 'development' || process.env.PAYSTACK_TEST_MODE === 'true';
      
      // Check if existing recipient code is valid (not a test code)
      const isTestRecipient = recipientCode && recipientCode.startsWith('TEST_RECIPIENT_');
      
      if (!recipientCode || isTestRecipient) {
        console.log(`👤 Creating transfer recipient for provider ${booking.provider.id}...`);
        if (isTestRecipient) {
          console.log(`⚠️ Existing recipient code is a test code (${recipientCode}), creating new valid recipient...`);
        }
        
        const recipientData: TransferRecipientData = {
          type: 'nuban',
          name: booking.provider.accountName || booking.provider.user.name || booking.provider.businessName || 'Unknown Provider',
          account_number: booking.provider.accountNumber!,
          bank_code: booking.provider.bankCode!,
        };
        
        try {
          let recipientResponse;
          
          // Check if we're in test mode
          if (isTestMode) {
            console.log(`🧪 Test mode detected - simulating recipient creation`);
            recipientResponse = {
              status: true,
              data: {
                recipient_code: `TEST_RECIPIENT_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                type: 'nuban',
                name: recipientData.name,
                account_number: recipientData.account_number,
                bank_code: recipientData.bank_code
              },
              message: 'Recipient simulated successfully in test mode'
            };
          } else {
            recipientResponse = await paystackClient.createRecipient(recipientData);
          }
          
          if (!recipientResponse.status) {
            throw new Error(`Failed to create transfer recipient: ${recipientResponse.message}`);
          }
          recipientCode = recipientResponse.data.recipient_code;
          console.log(`✅ Transfer recipient created: ${recipientCode}`);

          // Store recipient_code in provider record
          await prisma.provider.update({
            where: { id: booking.provider.id },
            data: { recipientCode }
          });
          
          logPayment.success('escrow_release', 'Recipient code stored in provider record', {
            bookingId: booking.id,
            paymentId: booking.payment.id,
            providerId: booking.provider.id,
            recipientCode
          });
        } catch (recipientError) {
          console.error(`❌ Failed to create transfer recipient:`, recipientError);
          
          // Provide more specific error messages for common recipient creation issues
          let errorMessage = "Unable to create transfer recipient";
          if (recipientError instanceof Error) {
            if (recipientError.message.includes("Invalid bank code")) {
              errorMessage = "Provider's bank code is invalid. Please ask them to update their bank details.";
            } else if (recipientError.message.includes("Invalid account number")) {
              errorMessage = "Provider's account number is invalid. Please ask them to verify their bank details.";
            } else if (recipientError.message.includes("Account name")) {
              errorMessage = "Provider's account name is invalid. Please ask them to update their bank details.";
            } else {
              errorMessage = `Unable to create transfer recipient: ${recipientError.message}`;
            }
          }
          
          throw new Error(errorMessage);
        }
      } else {
        console.log(`✅ Using existing transfer recipient: ${recipientCode}`);
      }

      // 13. Initiate transfer
      if (!recipientCode) {
        throw new Error('Recipient code is required for transfer but was not generated');
      }
      
      console.log(`💸 Initiating transfer to recipient ${recipientCode} for amount ${booking.payment.amount}...`);
      
      let transferResponse;
      
      if (isTestMode) {
        console.log(`🧪 Test mode detected - simulating successful transfer`);
        transferResponse = {
          status: true,
          data: {
            transfer_code: `TEST_TRANSFER_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            amount: booking.payment.amount * 100,
            status: 'success',
            reference: transferReference,
            recipient: recipientCode
          },
          message: 'Transfer simulated successfully in test mode'
        };
      } else {
        const transferData: TransferData = {
          source: 'balance',
          amount: booking.payment.amount * 100, // Paystack amount in kobo
          recipient: recipientCode,
          reason: `Payment for booking ${booking.id} - ${booking.service?.name || 'Service'}`,
          reference: transferReference,
        };
        
        try {
          transferResponse = await paystackClient.createTransfer(transferData);
        } catch (transferInitError) {
          console.error(`❌ Failed to create transfer:`, transferInitError);
          throw new Error(`Unable to create transfer: ${transferInitError instanceof Error ? transferInitError.message : 'Unknown error'}`);
        }
      }

      if (!transferResponse.status) {
        throw new Error(`Failed to create transfer: ${transferResponse.message}`);
      }

      console.log(`✅ Paystack transfer created:`, transferResponse.data);

      // 14. Update payment status to reflect transfer in progress
      try {
        await prisma.payment.update({
          where: { id: booking.payment.id },
          data: { 
            status: "PROCESSING_RELEASE",
            transactionId: transferResponse.data.transfer_code,
            updatedAt: new Date()
          }
        });
      } catch (updateError) {
        console.error(`❌ Failed to update payment with transfer code:`, updateError);
        // Continue processing even if this update fails
      }

      // 15. IMMEDIATE TRANSFER COMPLETION - Check transfer status from response
      console.log(`🔄 Checking transfer status for immediate completion...`);
      
      // Check if transfer was successful based on response
      if (transferResponse.data.status === 'success') {
        console.log(`✅ Transfer completed successfully! Updating payment status...`);
        
        try {
          // Update payment status to RELEASED
          await prisma.payment.update({
            where: { id: booking.payment.id },
            data: { 
              status: 'RELEASED',
              updatedAt: new Date()
            }
          });
          
          // Update booking status to COMPLETED
          await prisma.booking.update({
            where: { id: bookingId },
            data: { 
              status: 'COMPLETED',
              updatedAt: new Date()
            }
          });
          
          console.log(`🎉 Payment release completed successfully!`);
          
          logPayment.success('escrow_release', 'Payment release completed immediately', {
            bookingId: booking.id,
            paymentId: booking.payment.id,
            transferCode: transferResponse.data.transfer_code,
            recipientCode,
            amount: booking.payment.amount,
            processingTime: Date.now() - startTime
          });
          
          return NextResponse.json({
            success: true,
            message: "Payment released successfully! Funds have been transferred to the provider.",
            bookingId: booking.id,
            paymentId: booking.payment.id,
            transferCode: transferResponse.data.transfer_code,
            status: "RELEASED"
          });
          
        } catch (completionError) {
          console.error(`❌ Failed to complete payment release:`, completionError);
          // Don't throw here - the transfer was successful, just status update failed
          logPayment.warning('escrow_release', 'Transfer successful but status update failed', {
            bookingId: booking.id,
            paymentId: booking.payment.id,
            transferCode: transferResponse.data.transfer_code,
            error: completionError instanceof Error ? completionError.message : 'Unknown error'
          });
        }
        
      } else if (transferResponse.data.status === 'pending') {
        console.log(`⏳ Transfer is pending. Will be completed via webhook.`);
        
        // Transfer is pending - webhook will handle completion
        logPayment.info('escrow_release', 'Transfer pending - waiting for webhook completion', {
          bookingId: booking.id,
          paymentId: booking.payment.id,
          transferCode: transferResponse.data.transfer_code,
          recipientCode,
          amount: booking.payment.amount,
          processingTime: Date.now() - startTime
        });
        
      } else {
        console.log(`❌ Transfer failed with status:`, transferResponse.data.status);
        
        // For failed transfers, revert the payment status and throw error
        try {
          await prisma.payment.update({
            where: { id: booking.payment.id },
            data: { 
              status: 'ESCROW',
              updatedAt: new Date()
            }
          });
          
          await prisma.booking.update({
            where: { id: bookingId },
            data: { 
              status: booking.status === "COMPLETED" ? "COMPLETED" : "AWAITING_CONFIRMATION",
              updatedAt: new Date()
            }
          });
        } catch (revertError) {
          console.error(`❌ Failed to revert statuses after transfer failure:`, revertError);
        }
        
        throw new Error(`Transfer failed with status: ${transferResponse.data.status}`);
      }

      // 16. Send notifications
      try {
        // Notify client that payment is being released
        await createNotification({
          userId: user.id,
          type: 'PAYMENT_RELEASED',
          title: 'Payment Released',
          content: `Payment of R${booking.payment.amount.toFixed(2)} has been released for ${booking.service?.name || 'Service'}. The funds are being transferred to the provider.`
        });

        // Notify provider that payment is being released
        await createNotification({
          userId: booking.provider.userId,
          type: 'ESCROW_RELEASED',
          title: 'Payment Released',
          content: `Escrow payment of R${booking.payment.amount.toFixed(2)} has been released for ${booking.service?.name || 'Service'}. Funds should appear in your account within 1-3 business days.`
        });
      } catch (notificationError) {
        console.warn('Failed to send notifications:', notificationError);
        // Don't fail the entire operation for notification errors
      }

      logPayment.success('escrow_release', 'Payment release initiated successfully', {
        bookingId: booking.id,
        paymentId: booking.payment.id,
        transferCode: transferResponse.data.transfer_code,
        recipientCode,
        amount: booking.payment.amount,
        bookingStatus: booking.status,
        processingTime: Date.now() - startTime
      });

      return NextResponse.json({
        success: true,
        message: "Payment release initiated successfully. Funds are being transferred to the provider.",
        bookingId: booking.id,
        paymentId: booking.payment.id,
        transferCode: transferResponse.data.transfer_code,
        status: "PROCESSING"
      });

    } catch (transferError) {
      console.error("❌ Paystack transfer failed:", transferError);
      
      // 17. Rollback database changes if transfer fails
      console.log(`🔄 Rolling back database changes due to transfer failure...`);
      
      try {
        // Revert payment status
        await prisma.payment.update({
          where: { id: booking.payment.id },
          data: { 
            status: "ESCROW",
            updatedAt: new Date()
          }
        });

        // Revert booking status
        await prisma.booking.update({
          where: { id: bookingId },
          data: { 
            status: booking.status === "COMPLETED" ? "COMPLETED" : "AWAITING_CONFIRMATION",
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Database changes rolled back successfully`);
      } catch (rollbackError) {
        console.error("❌ Failed to rollback database changes:", rollbackError);
      }

      // Return appropriate error message with enhanced details
      let errorMessage = "Unable to transfer payment to provider. Please try again.";
      let statusCode = 500;

      if (transferError instanceof Error) {
        errorMessage = transferError.message;
        
        // Provide user-friendly error messages for common issues
        if (errorMessage.includes("Recipient not found") || errorMessage.includes("Invalid account")) {
          errorMessage = "Provider's bank account details are invalid. Please ask them to update their bank information.";
          statusCode = 400;
        } else if (errorMessage.includes("Insufficient funds")) {
          errorMessage = "Insufficient funds to complete the transfer. Please contact support.";
          statusCode = 402;
        } else if (errorMessage.includes("Invalid bank code")) {
          errorMessage = "Provider's bank code is invalid. Please ask them to update their bank details.";
          statusCode = 400;
        } else if (errorMessage.includes("Account number")) {
          errorMessage = "Provider's account number is invalid. Please ask them to verify their bank details.";
          statusCode = 400;
        } else if (errorMessage.includes("Transfer failed")) {
          errorMessage = "Payment transfer failed. Please try again or contact support.";
          statusCode = 500;
        }
      }

      logPayment.error('escrow_release', 'Payment release failed', transferError instanceof Error ? transferError : new Error(errorMessage), {
        bookingId: bookingId,
        paymentId: booking.payment.id,
        error: errorMessage,
        statusCode,
        processingTime: Date.now() - startTime
      });

      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: "Your payment is safe in escrow. You can try again later or contact support for assistance.",
        currentStatus: "ESCROW", // After rollback
        expectedStatus: VALID_PAYMENT_STATUSES_FOR_RELEASE.join(' or '),
        bookingStatus: booking.status === "COMPLETED" ? "COMPLETED" : "AWAITING_CONFIRMATION" // After rollback
      }, { status: statusCode });
    }

  } catch (error) {
    console.error(`❌ Payment release error after ${Date.now() - startTime}ms:`, error);
    logPayment.error('escrow_release', 'Payment release API failed', error instanceof Error ? error : new Error('Unknown error'), {
      bookingId: bookingId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: Date.now() - startTime
    });

    let errorMessage = "Something went wrong while releasing the payment. Please try again.";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Provide user-friendly error messages
      if (errorMessage.includes("Unauthorized")) {
        errorMessage = "You need to log in to release payments.";
        statusCode = 401;
      } else if (errorMessage.includes("Forbidden")) {
        errorMessage = "You can only release payments for your own bookings.";
        statusCode = 403;
      } else if (errorMessage.includes("not found") || errorMessage.includes("Invalid")) {
        errorMessage = "Booking or payment not found. Please refresh the page and try again.";
        statusCode = 404;
      } else if (errorMessage.includes("not in escrow") || errorMessage.includes("not ready")) {
        errorMessage = "Payment is not ready for release. Please try again later.";
        statusCode = 400;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: "Your payment is safe in escrow. If this issue continues, please contact support.",
      currentStatus: "Unknown",
      expectedStatus: VALID_PAYMENT_STATUSES_FOR_RELEASE.join(' or '),
      bookingStatus: "Unknown"
    }, { status: statusCode });
  }
}