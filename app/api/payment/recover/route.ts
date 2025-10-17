import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";
import { z } from "zod";

export const dynamic = 'force-dynamic'

const recoverPaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
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
  const logger = createLogger('PaymentRecovery');
  
  try {
    // Authentication
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { bookingId } = recoverPaymentSchema.parse(body);
    
    logger.info('Payment recovery started', { bookingId, userId: user.id });

    // Find booking with payment data
    const booking = await db.booking.findUnique({
      where: { 
        id: bookingId,
        clientId: user.id // Ensure user owns this booking
      },
      include: {
        payment: true,
        service: { select: { name: true } },
        provider: { 
          include: { 
            user: { select: { name: true, email: true } } 
          } 
        }
      }
    });

    if (!booking) {
      logger.warn('Booking not found or not owned by user', { bookingId, userId: user.id });
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    logger.info('Booking found', {
      bookingId: booking.id,
      bookingStatus: booking.status,
      hasPayment: !!booking.payment,
      paymentStatus: booking.payment?.status
    });

    // Check if payment recovery is needed
    if (!booking.payment) {
      logger.warn('No payment record found for booking', { bookingId });
      return NextResponse.json({ 
        error: "No payment record found for this booking",
        needsPayment: true
      }, { status: 400 });
    }

    // If booking status indicates payment was processed but payment status is still PENDING
    if (['PENDING_EXECUTION', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED'].includes(booking.status) 
        && booking.payment.status === 'PENDING') {
      
      logger.info('Payment recovery needed - updating payment status', {
        bookingId,
        bookingStatus: booking.status,
        currentPaymentStatus: booking.payment.status
      });

      // Update payment status to ESCROW to match booking status
      const updatedPayment = await db.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: 'ESCROW',
          paidAt: new Date(),
          updatedAt: new Date()
        }
      });

      logger.info('Payment status recovered successfully', {
        paymentId: updatedPayment.id,
        newStatus: updatedPayment.status,
        bookingId
      });

      return NextResponse.json({
        success: true,
        message: "Payment status recovered successfully",
        payment: {
          id: updatedPayment.id,
          status: updatedPayment.status,
          amount: updatedPayment.amount,
          paidAt: updatedPayment.paidAt
        },
        booking: {
          id: booking.id,
          status: booking.status
        }
      });
    }

    // Payment status is already correct
    logger.info('Payment status is already correct', {
      bookingId,
      bookingStatus: booking.status,
      paymentStatus: booking.payment.status
    });

    return NextResponse.json({
      success: true,
      message: "Payment status is already correct",
      payment: {
        id: booking.payment.id,
        status: booking.payment.status,
        amount: booking.payment.amount,
        paidAt: booking.payment.paidAt
      },
      booking: {
        id: booking.id,
        status: booking.status
      }
    });

  } catch (error) {
    logger.error('Payment recovery failed', error);
    
    return NextResponse.json({ 
      error: "Payment recovery failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
