import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
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
    if (!booking.payment) {
      return NextResponse.json({ error: "Payment required before starting job" }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "IN_PROGRESS" },
    });

    // TODO: Create notification for client that job has started (when Notification table is available)
    // await prisma.notification.create({
    //   data: {
    //     userId: booking.clientId,
    //     type: 'JOB_STARTED',
    //     content: `Your ${booking.service?.name || 'service'} has started! Provider is now working on your booking #${booking.id}.`,
    //     read: false,
    //   }
    // });

    // TODO: Notify client (in-app/email) that job has started

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