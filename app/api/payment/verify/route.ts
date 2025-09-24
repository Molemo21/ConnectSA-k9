import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs'
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paystackClient } from "@/lib/paystack";
import { z } from "zod";

export const dynamic = 'force-dynamic'


const verifyPaymentSchema = z.object({
  reference: z.string().min(1, "Payment reference is required"),
});

// Structured logging utility
const createLogger = (context: string) => ({
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  error: (message: string, error?: any, data?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      context,
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  warn: (message: string, data?: any) => {
    console.warn(JSON.stringify({
      level: 'warn',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  }
});

export async function POST(request: NextRequest) {
  const logger = createLogger('PaymentVerify');
  
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const { reference } = verifyPaymentSchema.parse(body);
    
    logger.info('Payment verification started', { reference });

    // Find payment in database with required relations
    const payment = await prisma.payment.findUnique({
      where: { paystackRef: reference },
      include: {
        booking: {
          include: {
            client: true,
            provider: { include: { user: true } },
            service: true,
          }
        }
      }
    });

    if (!payment) {
      logger.warn('Payment not found for reference', { reference });
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    logger.info('Payment found in database', {
      reference,
      paymentId: payment.id,
      currentStatus: payment.status,
      bookingId: payment.bookingId
    });

    // Verify payment with Paystack
    logger.info('Verifying payment with Paystack', { reference });
    const paystackResponse = await paystackClient.verifyPayment(reference);

    logger.info('Paystack verification response', {
      reference,
      status: paystackResponse.data.status,
      amount: paystackResponse.data.amount,
      currency: paystackResponse.data.currency
    });

    // Handle different payment statuses
    if (paystackResponse.data.status === 'success') {
      logger.info('Payment successful, updating database', { reference });
      
      // Update payment and booking status in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update payment status
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'ESCROW',
            paidAt: new Date(),
            transactionId: paystackResponse.data.id.toString(),
            providerResponse: paystackResponse,
            errorMessage: null, // Clear any previous error
          },
        });

        // Update booking status to PAID
        const updatedBooking = await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: 'PAID',
          },
        });

        return { updatedPayment, updatedBooking };
      });

      logger.info('Payment and booking updated successfully', {
        reference,
        paymentId: payment.id,
        bookingId: payment.bookingId,
        newPaymentStatus: result.updatedPayment.status,
        newBookingStatus: result.updatedBooking.status
      });

      // Create notification for provider (skip if schema doesn't support content field)
      try {
        await prisma.notification.create({
          data: {
            userId: payment.booking.provider.user.id,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Received',
            content: `Payment received for ${payment.booking.service?.name || 'your service'} - Booking #${payment.booking.id}. You can now start the job!`,
            isRead: false,
          }
        });
        logger.info('Provider notification created', {
          reference,
          providerId: payment.booking.provider.user.id
        });
      } catch (notificationError) {
        logger.warn('Could not create notification (schema issue)', {
          reference,
          error: notificationError instanceof Error ? notificationError.message : 'Unknown error'
        });
        // Continue without notification - payment status is more important
      }

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        payment: {
          id: result.updatedPayment.id,
          status: result.updatedPayment.status,
          amount: result.updatedPayment.amount,
          paidAt: result.updatedPayment.paidAt,
        },
        booking: {
          id: result.updatedBooking.id,
          status: result.updatedBooking.status,
        },
        paystackResponse: {
          status: paystackResponse.data.status,
          amount: paystackResponse.data.amount,
          currency: paystackResponse.data.currency,
        }
      });

    } else {
      logger.warn('Payment verification failed', {
        reference,
        status: paystackResponse.data.status,
        message: paystackResponse.message
      });

      // Update payment status to failed
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          errorMessage: paystackResponse.message || 'Payment verification failed',
          providerResponse: paystackResponse,
        },
      });

      logger.info('Payment marked as failed', {
        reference,
        paymentId: payment.id,
        errorMessage: paystackResponse.message
      });

      return NextResponse.json({
        success: false,
        message: "Payment verification failed",
        payment: {
          id: updatedPayment.id,
          status: updatedPayment.status,
          errorMessage: updatedPayment.errorMessage,
        },
        paystackResponse: {
          status: paystackResponse.data.status,
          message: paystackResponse.message,
        }
      }, { status: 400 });
    }

  } catch (error) {
    logger.error('Payment verification error', error);
    
    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: error.errors 
      }, { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message.includes("Payment not found")) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }
      if (error.message.includes("Paystack")) {
        return NextResponse.json({ 
          error: "Payment verification service temporarily unavailable. Please try again later." 
        }, { status: 503 });
      }
    }

    return NextResponse.json({ 
      error: "Internal server error",
      message: "Payment verification failed. Please try again."
    }, { status: 500 });
  }
}

// GET endpoint for payment status check (public access for callbacks)
export async function GET(request: NextRequest) {
  const logger = createLogger('PaymentStatusCheck');
  
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    
    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 });
    }

    logger.info('Checking payment status', { reference });

    // Find payment in database
    const payment = await prisma.payment.findUnique({
      where: { paystackRef: reference },
      include: {
        booking: {
          include: {
            client: true,
            provider: { include: { user: true } },
            service: true,
          }
        }
      }
    });

    if (!payment) {
      logger.warn('Payment not found for status check', { reference });
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    logger.info('Payment status retrieved', {
      reference,
      status: payment.status,
      bookingStatus: payment.booking.status
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        reference: payment.paystackRef,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      },
      booking: {
        id: payment.booking.id,
        status: payment.booking.status,
        serviceName: payment.booking.service?.name,
      },
      client: {
        id: payment.booking.client.id,
        name: payment.booking.client.name,
        email: payment.booking.client.email,
      },
      provider: {
        id: payment.booking.provider.id,
        businessName: payment.booking.provider.businessName,
        user: {
          id: payment.booking.provider.user.id,
          name: payment.booking.provider.user.name,
          email: payment.booking.provider.user.email,
        }
      }
    });

  } catch (error) {
    logger.error('Payment status check error', error);
    
    return NextResponse.json({ 
      error: "Internal server error",
      message: "Failed to retrieve payment status."
    }, { status: 500 });
  }
}