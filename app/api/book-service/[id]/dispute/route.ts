import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const disputeSchema = z.object({
  reason: z.enum([
    "service_not_provided",
    "poor_quality", 
    "wrong_time",
    "damage",
    "other"
  ]),
  details: z.string().min(10, "Please provide detailed description (minimum 10 characters)"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
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

    const booking = await prisma.booking.findUnique({ 
      where: { id: bookingId },
      include: { client: true, provider: true }
    });
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if user is the client for this booking
    if (booking.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if booking can be disputed
    if (!["IN_PROGRESS", "COMPLETED"].includes(booking.status)) {
      return NextResponse.json({ 
        error: "Booking cannot be disputed in its current status" 
      }, { status: 400 });
    }

    // Check if dispute already exists
    const existingDispute = await prisma.dispute.findFirst({
      where: { bookingId: bookingId }
    });

    if (existingDispute) {
      return NextResponse.json({ 
        error: "Dispute already exists for this booking" 
      }, { status: 400 });
    }

    // Create dispute record
    const dispute = await prisma.dispute.create({
      data: {
        bookingId: bookingId,
        reportedBy: user.id,
        reason: validated.reason,
        description: validated.details,
        status: "PENDING",
      },
    });

    // Update booking status to indicate dispute
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: "DISPUTED",
      },
    });

    // TODO: Send notification to admin
    // TODO: Send notification to provider
    // TODO: Send dispute email to client

    return NextResponse.json({ 
      dispute,
      booking: updatedBooking,
      message: "Dispute reported successfully. Our team will review and contact you within 24 hours."
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: error.errors[0]?.message || "Invalid input" 
      }, { status: 400 });
    }
    console.error("Dispute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 