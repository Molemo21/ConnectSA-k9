import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs'
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paystackClient } from "@/lib/paystack";
import { z } from "zod";

export const dynamic = 'force-dynamic'


const releaseEscrowSchema = z.object({
  reason: z.string().min(1, "Release reason is required"),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const user = await getCurrentUser();
    
    // Only admins and the client can release escrow
    if (!user || !["ADMIN", "CLIENT"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/release-escrow/);
    const bookingId = match ? match[1] : null;
    
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const body = await request.json();
    const validated = releaseEscrowSchema.parse(body);

    console.log(`🔓 Escrow release requested for booking ${bookingId} by user ${user.id} (${user.role})`);

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get booking with payment, provider, and client info
      const booking = await tx.booking.findUnique({ 
        where: { id: bookingId },
        include: { 
          payment: true,
          provider: { 
            include: { user: true } 
          },
          client: true,
          jobProof: true
        }
      });
      
      if (!booking) {
        throw new Error("Booking not found");
      }

      // Verify payment exists and is in escrow
      if (!booking.payment) {
        throw new Error("No payment found for this booking");
      }

      if (booking.payment.status !== 'HELD_IN_ESCROW') {
        throw new Error(`Payment is not in escrow (current status: ${booking.payment.status})`);
      }

      // Verify booking status allows escrow release
      if (!['COMPLETED', 'AWAITING_CONFIRMATION'].includes(booking.status)) {
        throw new Error(`Booking status does not allow escrow release (current status: ${booking.status})`);
      }

      // If client is requesting release, verify they are the actual client
      if (user.role === 'CLIENT' && booking.clientId !== user.id) {
        throw new Error("Forbidden: Only the booking client can release escrow");
      }

      // If client is requesting release, verify job completion proof exists
      if (user.role === 'CLIENT' && !booking.jobProof) {
        throw new Error("Job completion proof required before escrow can be released");
      }

      console.log(`✅ Escrow release validation passed for booking ${bookingId}`);

      // Step 1: Update payment status to PROCESSING_RELEASE
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { 
          status: 'PROCESSING_RELEASE',
          updatedAt: new Date()
        }
      });

      console.log(`🔄 Payment ${booking.payment.id} status updated to PROCESSING_RELEASE`);

      // Step 2: Create payout record
      const payout = await tx.payout.create({
        data: {
          paymentId: booking.payment.id,
          providerId: booking.providerId,
          amount: booking.payment.escrowAmount,
          paystackRef: `PAYOUT_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          status: 'PENDING',
        }
      });

      console.log(`💸 Payout record created: ${payout.id} for amount ${payout.amount}`);

      // Step 3: Attempt Paystack transfer to provider
      try {
        // Note: In production, you would need to:
        // 1. Create a recipient for the provider (bank account details)
        // 2. Use the recipient code for the transfer
        // For now, we'll simulate the transfer
        
        console.log(`📡 Initiating Paystack transfer for payout ${payout.id}`);
        
        // TODO: Implement actual Paystack transfer
        // const transferResponse = await paystackClient.createTransfer({
        //   source: 'balance',
        //   amount: payout.amount,
        //   recipient: providerRecipientCode, // You need to create this first
        //   reason: `Payment for ${booking.service?.name || 'service'} - Booking ${bookingId}`,
        //   reference: payout.paystackRef,
        // });

        // For now, simulate successful transfer
        console.log(`✅ Transfer initiated successfully (simulated)`);
        
        // Update payout status to PROCESSING
        await tx.payout.update({
          where: { id: payout.id },
          data: { 
            status: 'PROCESSING',
            transferCode: 'SIMULATED_TRANSFER_CODE'
          }
        });

        // Update payment status to RELEASED
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { 
            status: 'RELEASED',
            updatedAt: new Date()
          }
        });

        // Update booking status to COMPLETED if not already
        if (booking.status !== 'COMPLETED') {
          await tx.booking.update({
            where: { id: bookingId },
            data: { status: 'COMPLETED' }
          });
        }

        console.log(`🎉 Escrow released successfully for booking ${bookingId}`);

        return { 
          success: true,
          payout,
          payment: await tx.payment.findUnique({ where: { id: booking.payment.id } }),
          booking: await tx.booking.findUnique({ where: { id: bookingId } }),
          message: "Escrow released successfully to provider"
        };

      } catch (transferError) {
        console.error('❌ Transfer failed:', transferError);
        
        // Revert payment status back to HELD_IN_ESCROW
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { 
            status: 'HELD_IN_ESCROW',
            updatedAt: new Date()
          }
        });

        // Update payout status to FAILED
        await tx.payout.update({
          where: { id: payout.id },
          data: { 
            status: 'FAILED',
            error: transferError instanceof Error ? transferError.message : 'Transfer failed'
          }
        });

        throw new Error(`Transfer failed: ${transferError instanceof Error ? transferError.message : 'Unknown error'}`);
      }
    });

    // TODO: Send notifications
    // - Notify provider about payment
    // - Notify client about escrow release
    // - Send email confirmations

    return NextResponse.json({
      success: true,
      payout: result.payout,
      payment: result.payment,
      booking: result.booking,
      message: result.message
    });

  } catch (error) {
    console.error("❌ Escrow release error:", error);
    
    if (error instanceof Error) {
      if (error.message === "Booking not found") {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      if (error.message === "No payment found for this booking") {
        return NextResponse.json({ error: "No payment found for this booking" }, { status: 400 });
      }
      if (error.message.includes("Payment is not in escrow")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes("Booking status does not allow escrow release")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "Forbidden: Only the booking client can release escrow") {
        return NextResponse.json({ error: "Forbidden: Only the booking client can release escrow" }, { status: 403 });
      }
      if (error.message === "Job completion proof required before escrow can be released") {
        return NextResponse.json({ error: "Job completion proof required before escrow can be released" }, { status: 400 });
      }
      if (error.message.includes("Transfer failed")) {
        return NextResponse.json({ 
          error: "Escrow release failed due to transfer error. Please try again or contact support.",
          details: error.message
        }, { status: 500 });
      }
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
