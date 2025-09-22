import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
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
    const match = pathname.match(/book-service\/([^/]+)\/cancel/);
    const bookingId = match ? match[1] : null;
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

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

    // Check if booking can be cancelled
    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return NextResponse.json({ 
        error: "Booking cannot be cancelled in its current status" 
      }, { status: 400 });
    }

    // Calculate cancellation fee based on time until scheduled date
    const now = new Date();
    const scheduledDate = new Date(booking.scheduledDate);
    const hoursUntilBooking = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let cancellationFee = 0;
    if (hoursUntilBooking < 24) {
      cancellationFee = booking.totalAmount * 0.5; // 50% fee for < 24 hours
    } else if (hoursUntilBooking < 48) {
      cancellationFee = booking.totalAmount * 0.25; // 25% fee for < 48 hours
    }

    // Update booking status and fail any pending payment atomically
    const updated = await prisma.$transaction(async (tx) => {
      // Update booking
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      })

      // If there's a pending payment, mark it as FAILED and clear auth data
      const existingPayment = await tx.payment.findUnique({ where: { bookingId } })
      let updatedPayment: any = null
      if (existingPayment && existingPayment.status === 'PENDING') {
        updatedPayment = await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: 'FAILED',
            authorizationUrl: null as any,
            accessCode: null as any,
            updatedAt: new Date(),
          },
        })
      }

      return { updatedBooking, updatedPayment }
    })

    // TODO: Handle refund logic if payment was made
    // TODO: Notify provider about cancellation
    // TODO: Send cancellation email to client

    return NextResponse.json({ 
      booking: updated.updatedBooking,
      payment: updated.updatedPayment,
      cancellationFee,
      message: "Booking cancelled successfully"
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 