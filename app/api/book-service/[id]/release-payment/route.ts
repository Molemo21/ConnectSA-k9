import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentProcessor, paystackClient } from "@/lib/paystack";
import { logPayment } from "@/lib/logger";
import { createNotification } from "@/lib/notification-service";
import { broadcastPayoutUpdate, broadcastBookingUpdate, broadcastPaymentUpdate } from "@/lib/socket-server";

export const dynamic = 'force-dynamic'

// Enhanced types for better type safety

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
    if (!booking.provider.bankCode || !booking.provider.accountNumber || !booking.provider.accountName) {
      return NextResponse.json({
        success: false,
        error: "Provider hasn't set up their bank account yet",
        details: "The provider needs to add their bank account information in their dashboard (Settings > Bank Details) " +
          "before payments can be released. Please contact them and ask them to complete their bank details setup. " +
          "Your payment is safe in escrow and will be released once they add their bank details.",
        actionRequired: "PROVIDER_SETUP_BANK_DETAILS",
        providerId: booking.provider.id,
        providerName: booking.provider.businessName || booking.provider.user.name,
        currentStatus: booking.payment.status,
        expectedStatus: VALID_PAYMENT_STATUSES_FOR_RELEASE.join(' or '),
        bookingStatus: booking.status
      }, { status: 400 });
    }

    // 7.5. Ensure escrowAmount is set
    if (!booking.payment.escrowAmount || !booking.payment.platformFee) {
      // Calculate if missing
      const breakdown = paymentProcessor.calculatePaymentBreakdown(booking.payment.amount);
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          escrowAmount: breakdown.escrowAmount,
          platformFee: breakdown.platformFee,
        },
      });
      booking.payment.escrowAmount = breakdown.escrowAmount;
      booking.payment.platformFee = breakdown.platformFee;
    }

    // 8. SIMPLIFIED: Create payout record - admin will manually transfer via Paystack
    console.log(`🔄 Creating payout request for booking: ${bookingId}`);
    
    try {
      // Simple transaction - just create payout record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await prisma.$transaction(async (tx: any) => {
        // Step 1: Re-check payment status atomically (prevent race conditions)
        const currentPayment = await tx.payment.findUnique({
          where: { id: booking.payment.id },
          select: {
            id: true,
            status: true,
          },
        });

        if (!currentPayment || currentPayment.status !== 'ESCROW') {
          throw new Error(`Payment is not in ESCROW status (current: ${currentPayment?.status})`);
        }

        // Step 2: Check if payout already exists (database constraint also prevents this)
        const existingPayout = await tx.payout.findUnique({
          where: { paymentId: booking.payment.id },
          select: {
            id: true,
            paymentId: true,
            status: true,
            amount: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (existingPayout) {
          // Return existing payout info instead of erroring
          // This handles the case where user clicks button multiple times
          console.log(`ℹ️ Payout already exists: ${existingPayout.id} with status ${existingPayout.status}`);
          
          // Still update booking status if it's not COMPLETED yet
          let updatedBooking = booking;
          if (booking.status !== 'COMPLETED') {
            updatedBooking = await tx.booking.update({
              where: { id: booking.id },
              data: { status: 'COMPLETED' },
              select: { id: true, status: true }
            });
            console.log(`✅ Booking status updated to COMPLETED: ${updatedBooking.id}`);
          }
          
          return { payout: existingPayout, booking: updatedBooking, alreadyExists: true };
        }

        // Step 3: Update booking status to COMPLETED
        const updatedBooking = await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'COMPLETED' },
          select: { id: true, status: true }
        });

        // Step 4: Create payout record (database unique constraint prevents duplicates)
        // Money stays in escrow - admin will manually transfer via Paystack
        const payout = await tx.payout.create({
          data: {
            paymentId: booking.payment.id,
            providerId: booking.providerId,
            amount: booking.payment.escrowAmount!,
            paystackRef: `PAYOUT_${booking.payment.id}`,
            status: 'PENDING',
            method: 'MANUAL' as const,
            bankName: booking.provider.bankName || '',
            bankCode: booking.provider.bankCode || '',
            accountNumber: booking.provider.accountNumber || '',
            accountName: booking.provider.accountName || '',
            requestedAt: new Date(),
            retryCount: 0,
          },
        });

        console.log(`✅ Payout record created: ${payout.id} for amount R${payout.amount}`);
        console.log(`✅ Booking status updated to COMPLETED: ${updatedBooking.id}`);
        console.log(`💰 Money remains in escrow - admin will transfer manually via Paystack`);

        return { payout, booking: updatedBooking, alreadyExists: false };
      });

      // Skip notifications if payout already existed (was created previously)
      if (result.alreadyExists) {
        console.log(`ℹ️ Payout already existed, skipping notifications`);
        
        logPayment.success('escrow_release', 'Payout already exists (idempotent request)', {
          bookingId: booking.id,
          paymentId: booking.payment.id,
          payoutId: result.payout.id,
          amount: result.payout.amount,
          status: result.payout.status,
          processingTime: Date.now() - startTime
        });

        return NextResponse.json({
          success: true,
          message: "Payout request already exists. Admin will process it shortly.",
          bookingId: booking.id,
          paymentId: booking.payment.id,
          payoutId: result.payout.id,
          status: result.payout.status,
          alreadyExists: true,
        });
      }

      // Notify all parties: admins, provider, and client
      try {
        // 1. Notify all admins of pending payout
        const adminUsers = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true, name: true, email: true }
        });
        
        for (const admin of adminUsers) {
          await createNotification({
            userId: admin.id,
            type: 'ESCROW_RELEASED', // Better notification type
            title: 'New Payout Request Pending',
            content: `Payout request for R${result.payout.amount.toFixed(2)} to ${booking.provider.businessName || booking.provider.user.name} - Booking ${booking.id.substring(0, 8)}. Please process via Paystack dashboard.`,
            metadata: { payoutId: result.payout.id, bookingId: booking.id }
          });
        }
        console.log(`📧 Notified ${adminUsers.length} admin(s) of pending payout`);

        // 2. Notify provider that payout request was created
        await createNotification({
          userId: booking.provider.user.id,
          type: 'ESCROW_RELEASED',
          title: 'Payout Request Submitted',
          content: `Your payout request for R${result.payout.amount.toFixed(2)} has been submitted. Admin will process it shortly. Booking ${booking.id.substring(0, 8)}.`,
          metadata: { payoutId: result.payout.id, bookingId: booking.id }
        });
        console.log(`📧 Notified provider of payout request`);

        // 3. Notify client that completion was confirmed
        await createNotification({
          userId: booking.clientId,
          type: 'JOB_COMPLETED',
          title: 'Completion Confirmed',
          content: `You've confirmed completion for ${booking.service?.name || 'your service'}. Payment will be released to the provider shortly. Booking ${booking.id.substring(0, 8)}.`,
          metadata: { bookingId: booking.id, payoutId: result.payout.id }
        });
        console.log(`📧 Notified client of completion confirmation`);

      } catch (notificationError) {
        console.warn('⚠️ Failed to send notifications (payout still created):', notificationError);
        // Don't fail the request if notification fails
      }

      // Emit real-time socket events for instant UI updates
      try {
        // Get admin user IDs for broadcasting
        const adminUsers = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true }
        });
        const adminIds = adminUsers.map((admin: { id: string }) => admin.id);
        
        // Broadcast payout creation to provider and admins
        broadcastPayoutUpdate(result.payout.id, 'created', {
          id: result.payout.id,
          status: result.payout.status,
          amount: result.payout.amount,
          bookingId: booking.id
        }, [booking.provider.user.id, ...adminIds]);

        // Broadcast booking status update to client, provider, and admins
        broadcastBookingUpdate(booking.id, 'status_changed', {
          id: booking.id,
          status: result.booking.status,
          previousStatus: booking.status,
          payoutId: result.payout.id,
          updatedAt: new Date().toISOString(),
          // Include full booking data for UI updates
          serviceName: booking.service?.name,
          clientName: booking.client?.name,
          providerName: booking.provider?.businessName || booking.provider?.user?.name,
          totalAmount: booking.totalAmount
        }, [booking.clientId, booking.provider.user.id, ...adminIds]);

        // Broadcast payment status (still ESCROW, but payout created)
        broadcastPaymentUpdate(booking.payment.id, 'payout_requested', {
          id: booking.payment.id,
          status: booking.payment.status,
          payoutId: result.payout.id
        }, [booking.clientId, booking.provider.user.id]);

        console.log(`📡 Emitted real-time socket events for payout, booking, and payment updates`);
      } catch (socketError) {
        console.warn('⚠️ Failed to emit socket events (payout still created):', socketError);
        // Don't fail the request if socket emission fails
      }

      logPayment.success('escrow_release', 'Payout request created successfully', {
        bookingId: booking.id,
        paymentId: booking.payment.id,
        payoutId: result.payout.id,
        amount: result.payout.amount,
        status: result.payout.status,
        processingTime: Date.now() - startTime
      });

      return NextResponse.json({
        success: true,
        message: "Payout request created successfully. Admin will process the payment via Paystack shortly.",
        bookingId: booking.id,
        paymentId: booking.payment.id,
        payoutId: result.payout.id,
        status: result.payout.status,
      });

    } catch (payoutError) {
      console.error("❌ Payout creation failed:", payoutError);
      
      // Rollback payment status if payout creation failed
      try {
        await prisma.payment.update({
          where: { id: booking.payment.id },
          data: { 
            status: "ESCROW",
            updatedAt: new Date()
          }
        });
        console.log(`🔄 Rolled back payment status to ESCROW`);
      } catch (rollbackError) {
        console.error("❌ Failed to rollback payment status:", rollbackError);
      }

      let errorMessage = "Unable to create payout request. Please try again.";
      let statusCode = 500;

      if (payoutError instanceof Error) {
        errorMessage = payoutError.message;
        
        if (errorMessage.includes("already exists")) {
          statusCode = 400;
        }
      }

      logPayment.error('escrow_release', 'Payout creation failed', payoutError instanceof Error ? payoutError : new Error(errorMessage), {
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
        bookingStatus: booking.status
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