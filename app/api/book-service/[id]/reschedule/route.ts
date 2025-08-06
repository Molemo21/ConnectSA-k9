import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const rescheduleBookingSchema = z.object({
  scheduledDate: z.string().datetime("Invalid date format"),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/reschedule/);
    const bookingId = match ? match[1] : null;
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const body = await request.json();
    const validated = rescheduleBookingSchema.parse(body);

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

    // Check if booking can be rescheduled
    if (!["CONFIRMED"].includes(booking.status)) {
      return NextResponse.json({ 
        error: "Booking cannot be rescheduled in its current status" 
      }, { status: 400 });
    }

    // Check if new date is in the future
    const newScheduledDate = new Date(validated.scheduledDate);
    const now = new Date();
    if (newScheduledDate <= now) {
      return NextResponse.json({ 
        error: "New scheduled date must be in the future" 
      }, { status: 400 });
    }

    // Check if new date is at least 2 hours from now
    const hoursDifference = (newScheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursDifference < 2) {
      return NextResponse.json({ 
        error: "New scheduled date must be at least 2 hours from now" 
      }, { status: 400 });
    }

    // Update booking scheduled date
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        scheduledDate: newScheduledDate,
      },
    });

    // TODO: Notify provider about rescheduling
    // TODO: Send reschedule email to client
    // TODO: Check provider availability for new time

    return NextResponse.json({ 
      booking: updatedBooking,
      message: "Booking rescheduled successfully"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: error.errors[0]?.message || "Invalid input" 
      }, { status: 400 });
    }
    console.error("Reschedule booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 