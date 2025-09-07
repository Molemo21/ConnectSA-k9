import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";
import { paystackClient } from "@/lib/paystack";
import { z } from "zod";

const verifyPaymentSchema = z.object({
  reference: z.string().min(1, "Payment reference is required"),
});

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const { reference } = await request.json();
    
    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 });
    }

    console.log(`🔍 Verifying payment with reference: ${reference}`);

    // Find payment in database
    const payment = await db.payment.findUnique({
      where: { paystackRef: reference },
      include: { booking: true }
    });

    if (!payment) {
      console.log(`❌ Payment not found for reference: ${reference}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    console.log(`✅ Payment found:`, {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      paystackRef: payment.paystackRef
    });

    // Verify payment with Paystack
    let paystackVerification = null;
    let verificationError = null;

    try {
      console.log(`📡 Verifying payment with Paystack for reference: ${reference}`);
      paystackVerification = await paystackClient.verifyPayment(reference);
      console.log(`✅ Paystack verification successful:`, paystackVerification);
    } catch (error) {
      console.error(`❌ Paystack verification failed:`, error);
      verificationError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Determine if payment status should be updated based on verification
    let statusUpdate = null;
    let shouldUpdate = false;
    let recoveryMessage = null;

    if (paystackVerification && paystackVerification.status) {
      const paystackStatus = paystackVerification.data.status;
      const currentStatus = payment.status;

      console.log(`📊 Status comparison: Database=${currentStatus}, Paystack=${paystackStatus}`);

      // Check for stuck payments that need recovery
      if (paystackStatus === 'success' && currentStatus === 'PENDING') {
        statusUpdate = 'ESCROW';
        shouldUpdate = true;
        recoveryMessage = 'Payment was successful but stuck in PENDING status. Automatically recovered.';
        console.log(`🔄 Payment recovery needed: PENDING → ESCROW`);
      } else if (paystackStatus === 'success' && currentStatus === 'ESCROW') {
        recoveryMessage = 'Payment is already in correct ESCROW status.';
        console.log(`✅ Payment status is correct: ESCROW`);
      } else if (paystackStatus === 'failed' && currentStatus !== 'FAILED') {
        statusUpdate = 'FAILED';
        shouldUpdate = true;
        recoveryMessage = 'Payment failed. Status updated automatically.';
        console.log(`🔄 Payment failed: ${currentStatus} → FAILED`);
      } else if (paystackStatus === 'abandoned' && currentStatus === 'PENDING') {
        statusUpdate = 'FAILED';
        shouldUpdate = true;
        recoveryMessage = 'Payment was abandoned. Status updated automatically.';
        console.log(`🔄 Payment abandoned: PENDING → FAILED`);
      } else {
        recoveryMessage = 'Payment status is up to date.';
        console.log(`ℹ️ No status update needed: ${currentStatus} matches Paystack status`);
      }
    } else {
      recoveryMessage = 'Unable to verify payment with Paystack.';
      console.log(`⚠️ Paystack verification unavailable:`, verificationError);
    }

    // Update payment status if needed
    let updatedPayment = payment;
    let updatedBooking = null;

    if (shouldUpdate && statusUpdate) {
      console.log(`🔄 Updating payment status from ${payment.status} to ${statusUpdate}`);
      
      try {
        // Update payment status
        updatedPayment = await db.payment.update({
          where: { id: payment.id },
          data: { 
            status: statusUpdate,
            updatedAt: new Date(),
            ...(statusUpdate === 'ESCROW' && { paidAt: new Date() })
          }
        });

        console.log(`✅ Payment status updated successfully to ${statusUpdate}`);

        // If payment moved to ESCROW, update booking status
        if (statusUpdate === 'ESCROW' && payment.booking.status === 'CONFIRMED') {
          updatedBooking = await db.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'PENDING_EXECUTION' }
          });
          
          console.log(`✅ Booking status updated to PENDING_EXECUTION`);
          
          // Create notification for provider
          await db.notification.create({
            data: {
              userId: payment.booking.providerId,
              type: 'PAYMENT_RECEIVED',
              title: 'Payment Received',
              content: `Payment received for ${payment.booking.service?.name || 'your service'} - Booking #${payment.booking.id}. You can now start the job!`,
              isRead: false,
            }
          });
          
          console.log(`🔔 Provider notification created`);
        }

        recoveryMessage = `Payment status automatically recovered from ${payment.status} to ${statusUpdate}.`;
        
      } catch (updateError) {
        console.error(`❌ Failed to update payment status:`, updateError);
        recoveryMessage = `Payment verification successful but status update failed.`;
      }
    }

    // Return comprehensive response
    const response = {
      success: true,
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        amount: updatedPayment.amount,
        paystackRef: updatedPayment.paystackRef,
        paidAt: updatedPayment.paidAt,
        updatedAt: updatedPayment.updatedAt
      },
      booking: updatedBooking ? {
        id: updatedBooking.id,
        status: updatedBooking.status
      } : {
        id: payment.booking.id,
        status: payment.booking.status
      },
      paystackVerification: paystackVerification ? {
        status: paystackVerification.data.status,
        amount: paystackVerification.data.amount,
        currency: paystackVerification.data.currency,
        gateway_response: paystackVerification.data.gateway_response
      } : null,
      recovery: {
        needed: shouldUpdate,
        message: recoveryMessage,
        previousStatus: payment.status,
        newStatus: updatedPayment.status
      },
      message: recoveryMessage || 'Payment verification completed'
    };

    console.log(`📤 Sending verification response:`, response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return NextResponse.json({ 
      error: 'Payment verification failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint for retrieving payment status without verification
export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const reference = searchParams.get('reference');
    const bookingId = searchParams.get('bookingId');

    if (!reference && !bookingId) {
      return NextResponse.json({ 
        error: "Either reference or bookingId is required" 
      }, { status: 400 });
    }

    let payment;
    
    if (reference) {
      payment = await db.payment.findUnique({
        where: { paystackRef: reference },
        include: { 
          booking: { 
            include: { 
              client: true, 
              provider: true,
              service: true 
            } 
          } 
        }
      });
    } else if (bookingId) {
      payment = await db.payment.findUnique({
        where: { bookingId },
        include: { 
          booking: { 
            include: { 
              client: true, 
              provider: true,
              service: true 
            } 
          } 
        }
      });
    }

    if (!payment) {
      return NextResponse.json({ 
        error: "Payment not found",
        reference,
        bookingId
      }, { status: 404 });
    }

    // Check permissions
    if (user.role === 'CLIENT' && payment.booking.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === 'PROVIDER' && payment.booking.providerId !== user.provider?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        escrowAmount: payment.escrowAmount,
        platformFee: payment.platformFee,
        currency: payment.currency,
        paystackRef: payment.paystackRef,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
      booking: {
        id: payment.booking.id,
        status: payment.booking.status,
        scheduledDate: payment.booking.scheduledDate,
        totalAmount: payment.booking.totalAmount,
        serviceName: payment.booking.service?.name,
        clientName: payment.booking.client.name,
        providerName: payment.booking.provider.businessName || payment.booking.provider.user.name,
      },
      message: "Payment status retrieved successfully"
    });

  } catch (error) {
    console.error("❌ Payment status retrieval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
