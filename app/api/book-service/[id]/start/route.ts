import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/start/);
    const bookingId = match ? match[1] : null;
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ 
      where: { id: bookingId },
      include: { 
        payment: true,
        service: true
      }
    });
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.providerId !== user.provider?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Allow both CONFIRMED and PENDING_EXECUTION statuses to start work
    if (!["CONFIRMED", "PENDING_EXECUTION"].includes(booking.status)) {
      return NextResponse.json({ error: "Booking is not ready to start" }, { status: 400 });
    }

    // Payment validation based on payment method
    if (booking.paymentMethod === 'ONLINE') {
      // Prevent starting if payment is already being released (client confirmed completion)
      if (booking.payment?.status === 'PROCESSING_RELEASE') {
        return NextResponse.json({ 
          error: "Cannot start job - payment is already being released",
          details: "The client has confirmed completion and payment is being processed. This job cannot be started."
        }, { status: 400 });
      }
      
      // Prevent starting if payment has already been released
      if (booking.payment?.status === 'RELEASED' || booking.payment?.status === 'COMPLETED') {
        return NextResponse.json({ 
          error: "Cannot start job - payment already released",
          details: "Payment has already been released to the provider. This job cannot be started."
        }, { status: 400 });
      }
      
      // For online payments, ensure payment is secured in escrow
      if (!booking.payment || !['PENDING', 'ESCROW', 'HELD_IN_ESCROW'].includes(booking.payment.status)) {
        return NextResponse.json({ 
          error: "Payment required before starting job",
          details: "Online bookings require secure payment in escrow first."
        }, { status: 400 });
      }
    } else if (booking.paymentMethod === 'CASH') {
      // For cash payments, we only need the payment record to exist
      if (!booking.payment) {
        return NextResponse.json({ 
          error: "Payment record not found",
          details: "Cash bookings require a payment record for tracking."
        }, { status: 400 });
      }
      
      // Cash can start even with CASH_PENDING
      if (booking.payment.status === 'CASH_PENDING') {
        console.log(`💰 Cash booking starting - payment will be collected after completion`);
      }
    } else {
      // Legacy bookings without payment method specified
      if (!booking.payment) {
        return NextResponse.json({ error: "Payment required before starting job" }, { status: 400 });
      }
    }

    // Get full booking data with relations for unified service
    const fullBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: { select: { id: true, name: true, email: true } },
        provider: { 
          include: { 
            user: { select: { id: true, name: true, email: true } }
          }
        },
        service: { select: { name: true } },
        payment: true
      }
    });

    if (!fullBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Use unified service to update status, send notifications, and broadcast
    const { updateBookingStatusWithNotification, getTargetUsersForBookingStatusChange } = await import('@/lib/booking-status-service');
    
    const result = await updateBookingStatusWithNotification({
      bookingId,
      newStatus: "IN_PROGRESS",
      notificationType: 'JOB_STARTED',
      targetUserIds: getTargetUsersForBookingStatusChange(fullBooking, "IN_PROGRESS"),
    });

    const updated = result.booking;

    return NextResponse.json({ 
      success: true, 
      booking: updated,
      message: "Job started successfully" 
    });
  } catch (error) {
    console.error("Start job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 