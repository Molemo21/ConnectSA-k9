import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs'
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { createNotification, NotificationTemplates } from "@/lib/notification-service";
import { logBooking } from "@/lib/logger";
import { broadcastBookingAccepted } from "@/lib/socket-server";

export const dynamic = 'force-dynamic'

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
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
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
      logBooking.error('accept', 'Unauthorized booking acceptance attempt', new Error('Unauthorized'), {
        userId: user?.id,
        userRole: user?.role,
        error_code: 'UNAUTHORIZED'
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/accept/);
    const bookingId = match ? match[1] : null;
    if (!bookingId) {
      logBooking.error('accept', 'Invalid booking ID in acceptance request', new Error('Invalid booking ID'), {
        userId: user.id,
        pathname,
        error_code: 'INVALID_BOOKING_ID'
      });
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ 
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
      logBooking.error('accept', 'Booking not found for acceptance', new Error('Booking not found'), {
        userId: user.id,
        bookingId,
        error_code: 'BOOKING_NOT_FOUND'
      });
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.providerId !== user.provider?.id) {
      logBooking.error('accept', 'Provider not authorized for booking acceptance', new Error('Forbidden'), {
        userId: user.id,
        bookingId,
        providerId: user.provider?.id,
        bookingProviderId: booking.providerId,
        error_code: 'FORBIDDEN'
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (booking.status !== "PENDING") {
      logBooking.error('accept', 'Booking not in pending status for acceptance', new Error('Booking not pending'), {
        userId: user.id,
        bookingId,
        currentStatus: booking.status,
        error_code: 'INVALID_STATUS'
      });
      return NextResponse.json({ error: "Booking is not pending" }, { status: 400 });
    }

    // Note: Proposal update removed - table doesn't exist in database
    logBooking.success('accept', 'Skipping proposal update (table not available)', {
      userId: user.id,
      bookingId,
      providerId: user.provider?.id,
      metadata: { note: 'Proposal table not available in database' }
    });

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    });

    logBooking.success('accept', 'Booking accepted successfully', {
      userId: user.id,
      bookingId,
      providerId: user.provider?.id,
      metadata: {
        previousStatus: 'PENDING',
        newStatus: 'CONFIRMED',
        clientEmail: booking.client.email,
        serviceName: booking.service?.name
      }
    });

    // Create notification for client
    try {
      const notificationData = NotificationTemplates.BOOKING_ACCEPTED(booking);
      await createNotification({
        userId: booking.client.id,
        type: notificationData.type,
        title: notificationData.title,
        content: notificationData.content
      });
      logBooking.success('accept', 'Booking acceptance notification sent to client', {
        userId: user.id,
        bookingId,
        providerId: user.provider?.id,
        metadata: { clientEmail: booking.client.email }
      });
    } catch (notificationError) {
      logBooking.error('accept', 'Failed to create booking acceptance notification', notificationError as Error, {
        userId: user.id,
        bookingId,
        providerId: user.provider?.id,
        error_code: 'NOTIFICATION_FAILED',
        metadata: { clientEmail: booking.client.email }
      });
      // Don't fail the request if notification fails
    }

    // Send booking confirmation email to client
    try {
      const serviceName = booking.service?.name || 'Service';
      const providerName = booking.provider.user.name || 'Service Provider';
      const scheduledDate = new Date(booking.scheduledDate);
      
      await sendBookingConfirmationEmail(
        booking.client.email,
        booking.client.name,
        {
          serviceName,
          providerName,
          date: scheduledDate.toLocaleDateString('en-ZA', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          time: scheduledDate.toLocaleTimeString('en-ZA', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          location: booking.address,
          bookingId: booking.id,
          totalAmount: booking.totalAmount
        }
      );
      
      logBooking.success('accept', 'Booking confirmation email sent to client', {
        userId: user.id,
        bookingId,
        providerId: user.provider?.id,
        metadata: { clientEmail: booking.client.email }
      });
    } catch (emailError) {
      logBooking.error('accept', 'Failed to send booking confirmation email', emailError as Error, {
        userId: user.id,
        bookingId,
        providerId: user.provider?.id,
        error_code: 'EMAIL_FAILED',
        metadata: { clientEmail: booking.client.email }
      });
      // Don't fail the request if email fails
    }

    // Broadcast booking acceptance to connected clients
    try {
      broadcastBookingAccepted(
        {
          id: updated.id,
          status: updated.status,
          scheduledDate: updated.scheduledDate,
          totalAmount: updated.totalAmount,
          service: booking.service,
          provider: booking.provider,
          client: booking.client
        },
        booking.client.id,
        user.provider?.id || ''
      );
      
      logBooking.success('accept', 'Booking acceptance broadcasted via WebSocket', {
        userId: user.id,
        bookingId,
        providerId: user.provider?.id,
        metadata: { 
          clientId: booking.client.id,
          providerId: user.provider?.id 
        }
      });
    } catch (broadcastError) {
      logBooking.error('accept', 'Failed to broadcast booking acceptance', broadcastError as Error, {
        userId: user.id,
        bookingId,
        providerId: user.provider?.id,
        error_code: 'BROADCAST_FAILED',
        metadata: { 
          clientId: booking.client.id,
          providerId: user.provider?.id 
        }
      });
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json({ 
      success: true,
      booking: updated,
      message: "Job offer accepted! Client will be notified to proceed with payment."
    });
  } catch (error) {
    logBooking.error('accept', 'Unexpected booking acceptance error', error as Error, {
      userId: user?.id,
      error_code: 'INTERNAL_ERROR',
      metadata: { errorMessage: (error as Error).message }
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 