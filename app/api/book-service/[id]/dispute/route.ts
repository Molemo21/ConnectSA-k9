import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = 'force-dynamic'


const disputeSchema = z.object({
  reason: z.enum(['service_not_provided', 'poor_quality', 'wrong_time', 'damage', 'other']),
  description: z.string().min(10, "Description must be at least 10 characters"),
  evidence: z.array(z.string().url()).optional(), // Array of evidence URLs (photos, documents)
});

export async function POST(request: NextRequest) {
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

    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/dispute/);
    const bookingId = match ? match[1] : null;
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const body = await request.json();
    const validated = disputeSchema.parse(body);

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get booking with payment and dispute info
      const booking = await tx.booking.findUnique({ 
        where: { id: bookingId },
        include: { 
          payment: true,
          dispute: true,
          client: true,
          provider: true
        }
      });
      
      if (!booking) {
        throw new Error("Booking not found");
      }

      // Check if user is authorized to dispute (client or provider)
      if (booking.clientId !== user.id && booking.providerId !== user.provider?.id) {
        throw new Error("Forbidden");
      }

      // Check if dispute already exists
      if (booking.dispute) {
        throw new Error("Dispute already exists for this booking");
      }

      // Check if booking can be disputed
      if (!['PENDING_EXECUTION', 'IN_PROGRESS', 'AWAITING_CONFIRMATION'].includes(booking.status)) {
        throw new Error("Booking cannot be disputed in its current status");
      }

      // Check if payment exists and is in escrow
      if (!booking.payment || booking.payment.status !== "ESCROW") {
        throw new Error("Payment must be in escrow to dispute");
      }

      // Create dispute record
      const dispute = await tx.dispute.create({
        data: {
          bookingId: bookingId,
          reportedBy: user.id,
          reason: validated.reason,
          description: validated.description,
          status: "PENDING",
        },
      });

      // Update booking status to DISPUTED
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: "DISPUTED" },
        include: { dispute: true }
      });

      return { dispute, booking: updatedBooking };
    });

    // TODO: Send notification to admin about new dispute
    // TODO: Send notification to the other party (client/provider)
    // TODO: Send email notifications

    console.log(`Dispute created for booking ${bookingId} by user ${user.id}`);

    return NextResponse.json({ 
      success: true,
      dispute: result.dispute,
      booking: result.booking,
      message: "Dispute created successfully. Our team will review and resolve this issue.",
    });

  } catch (error) {
    console.error("Dispute creation error:", error);
    
    if (error instanceof Error) {
      if (error.message === "Booking not found") {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "Dispute already exists for this booking") {
        return NextResponse.json({ error: "Dispute already exists for this booking" }, { status: 400 });
      }
      if (error.message === "Booking cannot be disputed in its current status") {
        return NextResponse.json({ error: "Booking cannot be disputed in its current status" }, { status: 400 });
      }
      if (error.message === "Payment must be in escrow to dispute") {
        return NextResponse.json({ error: "Payment must be in escrow to dispute" }, { status: 400 });
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