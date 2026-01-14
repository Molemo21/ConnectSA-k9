import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs'
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";
import { paystackClient } from "@/lib/paystack";
import { createNotification, NotificationTemplates } from "@/lib/notification-service";
import { sendMultiChannelNotification } from "@/lib/notification-service-enhanced";
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
    const payment = await db.payment.findUnique({
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
    
    let paystackResponse;
    try {
      paystackResponse = await paystackClient.verifyPayment(reference);
    } catch (paystackError) {
      logger.warn('Paystack verification failed, checking if keys are configured', { 
        reference, 
        error: paystackError instanceof Error ? paystackError.message : 'Unknown error' 
      });
      
      // If Paystack keys are not configured, assume payment is successful for development
      if (paystackError instanceof Error && paystackError.message.includes('Missing required environment variable')) {
        logger.info('Paystack keys not configured, assuming payment success for development', { reference });
        paystackResponse = {
          status: true,
          message: 'Payment verified successfully (development mode)',
          data: {
            id: 123456,
            domain: 'test',
            amount: payment.amount * 100, // Convert to kobo
            currency: 'ZAR',
            status: 'success',
            reference: reference,
            created_at: new Date().toISOString(),
            customer: {
              id: 123,
              email: payment.booking.client.email,
              customer_code: 'CUS_test',
            }
          }
        };
      } else {
        throw paystackError;
      }
    }

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
      const result = await db.$transaction(async (tx) => {
        // Update payment status
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'ESCROW',
            paidAt: new Date(),
          },
        });

        // Update booking status to PENDING_EXECUTION
        const updatedBooking = await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: 'PENDING_EXECUTION',
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

      // Use unified service to send notifications and broadcast WebSocket event
      try {
        const { updateBookingStatusWithNotification, getTargetUsersForBookingStatusChange } = await import('@/lib/booking-status-service');
        
        // Get full booking data for the service
        const fullBooking = await db.booking.findUnique({
          where: { id: payment.bookingId },
          include: {
            client: { select: { id: true, name: true, email: true } },
            provider: { 
              include: { 
                user: { select: { id: true, name: true, email: true } }
              }
            },
            service: { select: { name: true } },
            payment: true
          }
        });

        if (fullBooking) {
          await updateBookingStatusWithNotification({
            bookingId: payment.bookingId,
            newStatus: 'PENDING_EXECUTION',
            notificationType: 'PAYMENT_RECEIVED',
            targetUserIds: getTargetUsersForBookingStatusChange(fullBooking, 'PENDING_EXECUTION'),
            skipStatusUpdate: true, // Status already updated in transaction above
            skipNotification: false,
            skipBroadcast: false,
          });
          
          logger.info('Payment notification and broadcast sent', {
            reference,
            bookingId: payment.bookingId
          });
        }
      } catch (notificationError) {
        logger.warn('Could not send payment notification/broadcast', {
          reference,
          error: notificationError instanceof Error ? notificationError.message : 'Unknown error'
        });
        // Don't fail - payment was successful
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
      const updatedPayment = await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
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
    const payment = await db.payment.findUnique({
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