import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";
import { createNotification, NotificationTemplates } from "@/lib/notification-service";

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
    const match = pathname.match(/book-service\/([^/]+)\/decline/);
    const bookingId = match ? match[1] : null;
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const booking = await db.booking.findUnique({ 
      where: { id: bookingId },
      include: {
        client: { select: { name: true, email: true } },
        provider: { 
          include: { 
            user: { select: { name: true } }
          }
        },
        service: { select: { name: true } }
      }
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.providerId !== user.provider?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (booking.status !== "PENDING") {
      return NextResponse.json({ error: "Booking is not pending" }, { status: 400 });
    }

    // Note: Proposal update removed - table doesn't exist in database
    console.log('ℹ️ Skipping proposal update (table not available)');

    const updated = await db.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    // Create notification for client about booking decline
    try {
      const notificationData = NotificationTemplates.BOOKING_DECLINED(booking);
      await createNotification({
        userId: booking.clientId,
        type: notificationData.type,
        title: notificationData.title,
        content: notificationData.content
      });
      console.log(`🔔 Booking decline notification sent to client: ${booking.client?.email || 'unknown'}`);
    } catch (notificationError) {
      console.error('❌ Failed to create booking decline notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Broadcast real-time update to client
    try {
      const { broadcastBookingUpdate } = await import('@/lib/socket-server');
      
      // Get the full updated booking with relations for the client
      const fullBooking = await db.booking.findUnique({
        where: { id: bookingId },
        include: {
          client: { select: { name: true, email: true } },
          provider: { 
            include: { 
              user: { select: { name: true, email: true } }
            }
          },
          service: { select: { name: true } },
          payment: true
        }
      });

      if (fullBooking) {
        // Broadcast to the client who made the booking
        broadcastBookingUpdate(
          bookingId, 
          'declined', 
          fullBooking, 
          [fullBooking.clientId]
        );

        console.log('📡 Real-time update broadcasted to client:', {
          bookingId,
          clientId: fullBooking.clientId,
          action: 'declined'
        });
      }
    } catch (broadcastError) {
      console.error('❌ Failed to broadcast real-time update:', broadcastError);
      // Don't fail the request if broadcasting fails
    }

    return NextResponse.json({ 
      success: true,
      booking: updated,
      message: "Job offer declined. Client will be notified to choose another provider."
    });
  } catch (error) {
    console.error("Decline booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 