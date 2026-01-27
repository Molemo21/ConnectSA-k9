import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { paystackClient } from "@/lib/paystack";

/**
 * Verify transfer status with Paystack and update payment/booking accordingly
 * 
 * This endpoint:
 * 1. Finds payment stuck in PROCESSING_RELEASE
 * 2. Gets transfer_code from payment.transactionId
 * 3. Verifies transfer status with Paystack
 * 4. Updates payment and booking status based on Paystack response:
 *    - success: Payment -> RELEASED, Booking -> COMPLETED
 *    - failed: Payment -> ESCROW, Booking -> AWAITING_CONFIRMATION
 *    - pending: Returns current status (no change)
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
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Find the payment with PROCESSING_RELEASE status
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        client: true,
        provider: {
          include: {
            user: true
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    if (!booking.payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found for this booking" },
        { status: 404 }
      );
    }

    // Verify user has permission (client, provider, or admin)
    const isClient = booking.clientId === session.user.id;
    const isProvider = booking.provider.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isClient && !isProvider && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Check if payment is in PROCESSING_RELEASE status
    if (booking.payment.status !== 'PROCESSING_RELEASE') {
      return NextResponse.json(
        { 
          success: false, 
          error: "Payment is not in PROCESSING_RELEASE status",
          currentStatus: booking.payment.status
        },
        { status: 400 }
      );
    }

    // Get transfer_code from payment.transactionId
    const transferCode = booking.payment.transactionId;
    
    if (!transferCode) {
      console.error(`❌ No transfer code found for payment ${booking.payment.id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: "Transfer code not found. Payment may not have been initiated properly."
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Verifying transfer ${transferCode} for payment ${booking.payment.id}`);

    // Verify transfer with Paystack
    let transferStatus;
    try {
      const transferResponse = await paystackClient.verifyTransfer(transferCode);
      transferStatus = transferResponse.data.status;
      console.log(`✅ Transfer verification successful: ${transferStatus}`);
    } catch (error) {
      console.error(`❌ Failed to verify transfer with Paystack:`, error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to verify transfer with Paystack",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      );
    }

    // Update payment and booking status based on transfer status
    const result = await prisma.$transaction(async (tx) => {
      if (transferStatus === 'success') {
        // Transfer was successful - update to RELEASED
        const updatedPayment = await tx.payment.update({
          where: { id: booking.payment!.id },
          data: {
            status: 'RELEASED',
            updatedAt: new Date()
          }
        });

        const updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: 'COMPLETED',
            updatedAt: new Date()
          }
        });

        console.log(`✅ Transfer successful: Updated payment ${booking.payment!.id} to RELEASED and booking ${bookingId} to COMPLETED`);

        return {
          payment: updatedPayment,
          booking: updatedBooking,
          action: 'released'
        };
      } else if (transferStatus === 'failed' || transferStatus === 'reversed') {
        // Transfer failed - rollback to ESCROW
        const updatedPayment = await tx.payment.update({
          where: { id: booking.payment!.id },
          data: {
            status: 'ESCROW',
            updatedAt: new Date()
          }
        });

        const updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: 'AWAITING_CONFIRMATION',
            updatedAt: new Date()
          }
        });

        console.log(`⚠️ Transfer failed: Rolled back payment ${booking.payment!.id} to ESCROW and booking ${bookingId} to AWAITING_CONFIRMATION`);

        return {
          payment: updatedPayment,
          booking: updatedBooking,
          action: 'rolled_back'
        };
      } else {
        // Transfer is still pending - no changes needed
        console.log(`⏳ Transfer still pending: ${transferStatus}`);
        return {
          payment: booking.payment,
          booking: booking,
          action: 'pending'
        };
      }
    });

    // Return appropriate response
    if (result.action === 'released') {
      return NextResponse.json({
        success: true,
        action: 'released',
        message: "Transfer verified successfully! Payment has been released.",
        payment: {
          id: result.payment.id,
          status: result.payment.status
        },
        booking: {
          id: result.booking.id,
          status: result.booking.status
        },
        transferStatus
      });
    } else if (result.action === 'rolled_back') {
      return NextResponse.json({
        success: true,
        action: 'rolled_back',
        message: "Transfer verification found the transfer failed. Payment has been reset to ESCROW. You can try releasing again.",
        payment: {
          id: result.payment.id,
          status: result.payment.status
        },
        booking: {
          id: result.booking.id,
          status: result.booking.status
        },
        transferStatus
      });
    } else {
      return NextResponse.json({
        success: true,
        action: 'pending',
        message: "Transfer is still pending. Please wait for it to complete.",
        payment: {
          id: result.payment.id,
          status: result.payment.status
        },
        booking: {
          id: result.booking.id,
          status: result.booking.status
        },
        transferStatus
      });
    }

  } catch (error) {
    console.error("❌ Transfer verification error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify transfer",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
