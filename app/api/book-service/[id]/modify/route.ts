import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = 'force-dynamic'


const modifyBookingSchema = z.object({
  address: z.string().min(1, "Address is required"),
  description: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/modify/);
    const bookingId = match ? match[1] : null;
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const body = await request.json();
    const validated = modifyBookingSchema.parse(body);

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

    // Check if booking can be modified
    if (!["PENDING"].includes(booking.status)) {
      return NextResponse.json({ 
        error: "Booking cannot be modified in its current status" 
      }, { status: 400 });
    }

    // Update booking details
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        address: validated.address,
        description: validated.description || null,
      },
    });

    // TODO: Notify provider about booking modification
    // TODO: Send modification email to client

    return NextResponse.json({ 
      booking: updatedBooking,
      message: "Booking modified successfully"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: error.errors[0]?.message || "Invalid input" 
      }, { status: 400 });
    }
    console.error("Modify booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 