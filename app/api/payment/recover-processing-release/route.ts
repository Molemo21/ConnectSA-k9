import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Recovery endpoint for payments stuck in PROCESSING_RELEASE status
 * 
 * This happens when payment release fails during validation (e.g., invalid bank code)
 * but payment status was already set to PROCESSING_RELEASE before the error.
 * 
 * This endpoint:
 * 1. Checks if payment is stuck in PROCESSING_RELEASE for more than 5 minutes
 * 2. Verifies user has permission (client, provider, or admin)
 * 3. Rolls back payment status to ESCROW
 * 4. Ensures booking status is AWAITING_CONFIRMATION
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentId, bookingId } = body;

    if (!paymentId && !bookingId) {
      return NextResponse.json(
        { success: false, error: "Payment ID or Booking ID is required" },
        { status: 400 }
      );
    }

    // Find the payment
    const payment = await prisma.payment.findFirst({
      where: {
        ...(paymentId ? { id: paymentId } : { bookingId }),
        status: 'PROCESSING_RELEASE'
      },
      include: {
        booking: {
          include: {
            client: true,
            provider: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No payment found in PROCESSING_RELEASE status",
          details: "Payment may have already been recovered or doesn't exist."
        },
        { status: 404 }
      );
    }

    // Verify user has permission (client or provider)
    const isClient = payment.booking.clientId === session.user.id;
    const isProvider = payment.booking.provider.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isClient && !isProvider && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Check if payment has been stuck for more than 5 minutes (likely a failed release)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const wasUpdatedRecently = payment.updatedAt > fiveMinutesAgo;

    if (wasUpdatedRecently) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Payment release is still in progress",
          details: "Please wait a few minutes. If the issue persists, contact support."
        },
        { status: 400 }
      );
    }

    // Recover: Rollback payment status to ESCROW
    const result = await prisma.$transaction(async (tx) => {
      // Revert payment status to ESCROW
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'ESCROW',
          updatedAt: new Date()
        }
      });

      // Ensure booking status is AWAITING_CONFIRMATION (should already be, but verify)
      const booking = await tx.booking.findUnique({
        where: { id: payment.bookingId }
      });

      let updatedBooking = null;
      if (booking && booking.status !== 'AWAITING_CONFIRMATION' && booking.status !== 'COMPLETED') {
        updatedBooking = await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: 'AWAITING_CONFIRMATION',
            updatedAt: new Date()
          }
        });
      }

      return { updatedPayment, booking: updatedBooking || booking };
    });

    console.log(`✅ Recovered payment ${payment.id} from PROCESSING_RELEASE to ESCROW`);

    return NextResponse.json({
      success: true,
      message: "Payment status recovered successfully",
      payment: {
        id: result.updatedPayment.id,
        status: result.updatedPayment.status,
        previousStatus: 'PROCESSING_RELEASE'
      },
      booking: {
        id: result.booking?.id,
        status: result.booking?.status
      }
    });

  } catch (error) {
    console.error("❌ Payment recovery error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to recover payment",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
