import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { paystackClient } from "@/lib/paystack";

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized",
        details: "You must be logged in to recover payment status."
      }, { status: 401 });
    }

    // 2. Parse request body
    const { paymentId } = await request.json();
    
    if (!paymentId) {
      return NextResponse.json({
        success: false,
        error: "Payment ID is required",
        details: "Please provide a valid payment ID."
      }, { status: 400 });
    }

    console.log(`🔄 Starting payment recovery for payment: ${paymentId}`);

    // 3. Fetch payment with booking and provider info
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            client: true,
            provider: {
              include: { user: true }
            },
            service: true
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({
        success: false,
        error: "Payment not found",
        details: "No payment found with the provided ID."
      }, { status: 404 });
    }

    // 4. Authorization check
    if (payment.booking.clientId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: "Forbidden",
        details: "You can only recover payments for your own bookings."
      }, { status: 403 });
    }

    // 5. Check if payment is actually stuck
    if (payment.status !== 'PENDING') {
      return NextResponse.json({
        success: false,
        error: "Payment is not stuck",
        details: `Payment status is already ${payment.status}. No recovery needed.`,
        currentStatus: payment.status
      }, { status: 400 });
    }

    console.log(`🔍 Payment ${paymentId} is stuck in PENDING status. Verifying with Paystack...`);

    // 6. Verify payment with Paystack
    try {
      const paystackVerification = await paystackClient.verifyPayment(payment.paystackRef);
      console.log(`🔍 Paystack verification result:`, paystackVerification);
      
      if (paystackVerification.status && paystackVerification.data.status === 'success') {
        console.log(`✅ Paystack verification successful. Payment was completed.`);
        
        // Update payment status to ESCROW
        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: { 
            status: 'ESCROW',
            paidAt: new Date(),
            transactionId: paystackVerification.data.id?.toString() || null,
            updatedAt: new Date()
          }
        });

        // Update booking status to PENDING_EXECUTION if it's still CONFIRMED
        let updatedBooking = null;
        if (payment.booking.status === "CONFIRMED") {
          updatedBooking = await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'PENDING_EXECUTION' }
          });
          console.log(`✅ Booking status updated to PENDING_EXECUTION`);
        }

        // Create notification for provider
        try {
          await prisma.notification.create({
            data: {
              userId: payment.booking.provider.user.id,
              type: 'PAYMENT_RECEIVED',
              title: 'Payment Received',
              message: `Payment received for ${payment.booking.service?.name || 'your service'} - Booking #${payment.booking.id}. You can now start the job!`,
              isRead: false,
            }
          });
        } catch (notificationError) {
          console.warn('Could not create payment notification:', notificationError);
        }

        console.log(`🎉 Payment status recovery completed successfully!`);
        
        return NextResponse.json({
          success: true,
          message: "Payment status recovered successfully",
          payment: {
            id: updatedPayment.id,
            status: updatedPayment.status,
            paidAt: updatedPayment.paidAt,
            transactionId: updatedPayment.transactionId
          },
          booking: updatedBooking ? {
            id: updatedBooking.id,
            status: updatedBooking.status
          } : null,
          paystackVerification: {
            status: paystackVerification.data.status,
            amount: paystackVerification.data.amount,
            currency: paystackVerification.data.currency
          }
        });

      } else if (paystackVerification.data.status === 'abandoned') {
        console.log(`❌ Payment was abandoned by user`);
        return NextResponse.json({
          success: false,
          error: "Payment was abandoned",
          details: "The payment was abandoned by the user and cannot be recovered.",
          paystackStatus: paystackVerification.data.status,
          currentStatus: payment.status
        }, { status: 400 });

      } else {
        console.log(`❌ Payment verification shows payment was not successful:`, paystackVerification.data.status);
        return NextResponse.json({
          success: false,
          error: "Payment verification failed",
          details: `Paystack verification shows payment status: ${paystackVerification.data.status}`,
          paystackStatus: paystackVerification.data.status,
          currentStatus: payment.status
        }, { status: 400 });
      }
      
    } catch (verificationError) {
      console.error(`❌ Payment verification failed:`, verificationError);
      
      const errorMessage = verificationError instanceof Error ? verificationError.message : 'Unknown error';
      
      return NextResponse.json({
        success: false,
        error: "Payment verification failed",
        details: `Unable to verify payment with Paystack: ${errorMessage}`,
        currentStatus: payment.status
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Payment recovery error:', error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: "An unexpected error occurred during payment recovery."
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}