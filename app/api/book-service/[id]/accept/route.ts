import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Simplified imports to identify the problematic one
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";
import { createNotification, NotificationTemplates } from "@/lib/notification-service";

// Test endpoint to verify route accessibility
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "Accept booking endpoint is accessible",
    method: "GET",
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  // Log the request for debugging
  console.log('🔍 Accept booking API called:', {
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString()
  });

  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "PROVIDER") {
      console.log('❌ Unauthorized booking acceptance attempt:', {
        userId: user?.id,
        userRole: user?.role
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/accept/);
    const bookingId = match ? match[1] : null;
    if (!bookingId) {
      console.log('❌ Invalid booking ID in acceptance request:', { pathname });
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    console.log('🔍 Processing booking acceptance:', { bookingId, userId: user.id });

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
      console.log('❌ Booking not found:', { bookingId });
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    
    if (booking.providerId !== user.provider?.id) {
      console.log('❌ Provider not authorized:', {
        userId: user.id,
        bookingProviderId: booking.providerId,
        userProviderId: user.provider?.id
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    if (booking.status !== "PENDING") {
      console.log('❌ Booking not in pending status:', {
        bookingId,
        currentStatus: booking.status
      });
      return NextResponse.json({ error: "Booking is not pending" }, { status: 400 });
    }

    console.log('✅ Updating booking status to CONFIRMED:', { bookingId });

    const updated = await db.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    });

    console.log('✅ Booking accepted successfully:', {
      bookingId,
      newStatus: updated.status
    });

    // Create notification for client about booking acceptance
    try {
      const notificationData = NotificationTemplates.BOOKING_ACCEPTED(booking);
      await createNotification({
        userId: booking.clientId,
        type: notificationData.type,
        title: notificationData.title,
        content: notificationData.content
      });
      console.log(`🔔 Booking acceptance notification sent to client: ${booking.client?.email || 'unknown'}`);
    } catch (notificationError) {
      console.error('❌ Failed to create booking acceptance notification:', notificationError);
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
          'accepted', 
          fullBooking, 
          [fullBooking.clientId]
        );

        console.log('📡 Real-time update broadcasted to client:', {
          bookingId,
          clientId: fullBooking.clientId,
          action: 'accepted'
        });
      }
    } catch (broadcastError) {
      console.error('❌ Failed to broadcast real-time update:', broadcastError);
      // Don't fail the request if broadcasting fails
    }

    return NextResponse.json({ 
      success: true,
      booking: updated,
      message: "Job offer accepted! Client will be notified to proceed with payment."
    });
  } catch (error) {
    console.error('❌ Unexpected booking acceptance error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 