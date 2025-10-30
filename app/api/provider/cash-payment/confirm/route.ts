import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";
import { z } from "zod";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

const cashPaymentConfirmationSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
});

/**
 * POST /api/provider/cash-payment/confirm
 * Allow providers to confirm they received cash payment from clients
 */
export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    console.log("💰 Cash payment confirmation API called");

    const user = await getCurrentUser();
    if (!user || user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = cashPaymentConfirmationSchema.parse(body);

    console.log("✅ Request validated:", {
      bookingId: validated.bookingId,
      amount: validated.amount,
      providerId: user.provider?.id
    });

    // Verify the booking exists and belongs to this provider
    const booking = await db.booking.findFirst({
      where: {
        id: validated.bookingId,
        providerId: user.provider?.id,
        paymentMethod: 'CASH'
      },
      include: {
        payment: true,
        client: {
          select: { id: true, name: true, email: true }
        },
        service: {
          select: { name: true }
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ 
        error: "Booking not found or you don't have permission to confirm this payment" 
      }, { status: 404 });
    }

    // Verify the payment exists
    if (!booking.payment) {
      return NextResponse.json({ 
        error: "No payment record found for this booking" 
      }, { status: 404 });
    }

    // Allow CASH_PENDING, CASH_PAID, or CASH_RECEIVED (idempotent)
    // CASH_PENDING: Legacy flow where provider confirms before client pays
    // CASH_PAID: New flow - client claimed they paid, provider now confirms receipt
    if (!['CASH_PENDING', 'CASH_PAID', 'CASH_RECEIVED'].includes(booking.payment.status)) {
      return NextResponse.json({ 
        error: `Payment is already ${booking.payment.status.toLowerCase()}`,
        currentStatus: booking.payment.status
      }, { status: 400 });
    }

    // If already CASH_RECEIVED, ensure booking status is also COMPLETED (idempotent + repair)
    if (booking.payment.status === 'CASH_RECEIVED') {
      // Safety check: If payment is CASH_RECEIVED but booking is not COMPLETED, fix it
      if (booking.status !== 'COMPLETED') {
        console.warn(`⚠️ Data inconsistency detected: Payment is CASH_RECEIVED but booking status is ${booking.status}. Auto-repairing...`);
        
        try {
          await db.booking.update({
            where: { id: booking.id },
            data: { status: 'COMPLETED' }
          });
          console.log(`✅ Auto-repaired booking ${booking.id}: Updated status from ${booking.status} to COMPLETED`);
        } catch (repairError) {
          console.error(`❌ Failed to auto-repair booking ${booking.id}:`, repairError);
          // Continue anyway - at least return success for the payment
        }
      }
      
      return NextResponse.json({
        success: true,
        message: "Cash payment already confirmed",
        payment: {
          id: booking.payment.id,
          status: booking.payment.status,
          paidAt: booking.payment.paidAt
        },
        booking: {
          id: booking.id,
          status: 'COMPLETED' // Always return COMPLETED after repair
        }
      });
    }

    // Verify the amount matches (with small tolerance for rounding)
    const expectedAmount = booking.totalAmount;
    const amountDifference = Math.abs(validated.amount - expectedAmount);
    
    if (amountDifference > 0.01) { // Allow 1 cent difference for rounding
      return NextResponse.json({ 
        error: `Amount mismatch. Expected R${expectedAmount.toFixed(2)}, received R${validated.amount.toFixed(2)}`,
        expectedAmount,
        receivedAmount: validated.amount
      }, { status: 400 });
    }

    // Update payment status to CASH_RECEIVED and booking status to COMPLETED in a transaction
    const result = await db.$transaction(async (tx) => {
      // Update payment status first
      const updatedPayment = await tx.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: 'CASH_RECEIVED',
          paidAt: new Date(),
        }
      });

      // Always mark booking as COMPLETED when provider confirms cash receipt
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'COMPLETED'
        }
      });

      // Post-transaction verification: Ensure data consistency
      if (updatedPayment.status !== 'CASH_RECEIVED' || updatedBooking.status !== 'COMPLETED') {
        console.error("❌ Transaction completed but data inconsistency detected:", {
          paymentStatus: updatedPayment.status,
          bookingStatus: updatedBooking.status
        });
        throw new Error("Data consistency check failed after transaction");
      }

      return { updatedPayment, updatedBooking };
    }, {
      timeout: 10000, // 10 second timeout
      maxWait: 5000,  // 5 second max wait for a transaction slot
    });

    // Post-transaction verification (double-check outside transaction)
    const verification = await db.booking.findUnique({
      where: { id: booking.id },
      include: { payment: true }
    });

    if (!verification || verification.payment?.status !== 'CASH_RECEIVED' || verification.status !== 'COMPLETED') {
      console.error("❌ Post-transaction verification failed:", {
        bookingId: booking.id,
        paymentStatus: verification?.payment?.status,
        bookingStatus: verification?.status
      });
      
      // Attempt repair
      try {
        if (verification?.payment?.status === 'CASH_RECEIVED' && verification.status !== 'COMPLETED') {
          await db.booking.update({
            where: { id: booking.id },
            data: { status: 'COMPLETED' }
          });
          console.log("✅ Post-transaction repair successful");
        }
      } catch (repairError) {
        console.error("❌ Post-transaction repair failed:", repairError);
      }
    }

    console.log("✅ Cash payment confirmed and booking completed:", {
      paymentId: result.updatedPayment.id,
      bookingId: booking.id,
      newBookingStatus: result.updatedBooking.status,
      paymentStatus: result.updatedPayment.status
    });

    // Create notification for client
    try {
      await db.notification.create({
        data: {
          userId: booking.clientId,
          type: 'PAYMENT_CONFIRMED',
          title: 'Payment Confirmed',
          message: `Your cash payment of R${validated.amount.toFixed(2)} has been confirmed by ${user.name} for ${booking.service?.name || 'your service'}. Booking #${booking.id.substring(0, 8)}.`
        }
      });
      console.log("✅ Client notification created");
    } catch (notificationError) {
      console.error("❌ Failed to create client notification:", notificationError);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json({
      success: true,
      message: "Cash payment confirmed successfully",
      payment: {
        id: result.updatedPayment.id,
        bookingId: booking.id,
        amount: result.updatedPayment.amount,
        status: result.updatedPayment.status,
        paidAt: result.updatedPayment.paidAt
      },
      booking: {
        id: booking.id,
        status: result.updatedBooking.status,
        clientName: booking.client.name,
        serviceName: booking.service?.name,
        totalAmount: booking.totalAmount
      }
    });

  } catch (error) {
    console.error("❌ Cash payment confirmation error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid request data",
        details: error.errors[0]?.message || 'Validation failed'
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
