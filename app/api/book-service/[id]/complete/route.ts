import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";
import { z } from "zod";
import { PAYMENT_CONSTANTS } from "@/lib/paystack";
import { createNotification, NotificationTemplates } from "@/lib/notification-service";

export const dynamic = 'force-dynamic'


const completionSchema = z.object({
  photos: z.array(z.string().url()).optional(),
  notes: z.string().optional(),
});

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
    const match = pathname.match(/book-service\/([^/]+)\/complete/);
    const bookingId = match ? match[1] : null;
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const body = await request.json();
    const validated = completionSchema.parse(body);

    // Get the provider ID from the user's provider relationship
    if (!user.provider?.id) {
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    const providerId = user.provider.id;

    // Get booking with payment and provider info
    const booking = await db.booking.findUnique({ 
      where: { id: bookingId },
      include: { 
        payment: true,
        provider: true,
        client: true,
        service: true
      }
    });
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify the provider owns this booking
    if (booking.providerId !== providerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify booking is in progress
    if (booking.status !== "IN_PROGRESS") {
      return NextResponse.json({ 
        error: "Booking is not in progress", 
        currentStatus: booking.status 
      }, { status: 400 });
    }

    // For cash payments: Ensure payment status is set to CASH_PENDING so client can pay
    let result;
    if (booking.paymentMethod === 'CASH' && booking.payment) {
      // Update both booking status and payment status in a transaction
      const updatedBooking = await db.$transaction(async (tx) => {
        // Update payment status to CASH_PENDING if not already in a valid cash payment state
        // Only update if it's not already CASH_PENDING or CASH_PAID (if client already paid, don't override)
        if (!['CASH_PENDING', 'CASH_PAID', 'CASH_RECEIVED'].includes(booking.payment.status)) {
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: 'CASH_PENDING' }
          });
          console.log(`💰 Updated cash payment status from ${booking.payment.status} to CASH_PENDING for booking ${bookingId}`);
        } else {
          console.log(`💰 Cash payment status already correct: ${booking.payment.status} for booking ${bookingId}`);
        }

        // Update booking status to AWAITING_CONFIRMATION
        const updated = await tx.booking.update({
          where: { id: bookingId },
          data: { status: "AWAITING_CONFIRMATION" },
          include: {
            client: true,
            service: true,
            provider: true,
            payment: true
          }
        });

        return updated;
      });

      result = { booking: updatedBooking };
    } else {
      // For online payments: Just update booking status
      const updatedBooking = await db.booking.update({
        where: { id: bookingId },
        data: { status: "AWAITING_CONFIRMATION" },
        include: {
          client: true,
          service: true,
          provider: true,
          payment: true
        }
      });

      result = { booking: updatedBooking };
    }

    // result is now defined in both branches above

    // Create notification for client about job completion
    try {
      const notificationData = NotificationTemplates.JOB_COMPLETED(result.booking);
      await createNotification({
        userId: result.booking.client.id,
        type: notificationData.type,
        title: notificationData.title,
        content: notificationData.content
      });
      console.log(`🔔 Job completion notification sent to client: ${result.booking.client.email}`);
    } catch (notificationError) {
      console.error('❌ Failed to create job completion notification:', notificationError);
      // Don't fail the request if notification fails - this is expected if the notification table doesn't exist yet
      console.log('ℹ️ Continuing without notification (notification table may not exist yet)');
    }

    console.log(`Job completion proof submitted for booking ${bookingId}`);

        return NextResponse.json({
          success: true,
          booking: result.booking,
          message: "Job completion proof submitted successfully. Waiting for client confirmation.",
        });

  } catch (error) {
    console.error("Job completion error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: "Internal server error",
      message: "Failed to complete job. Please try again."
    }, { status: 500 });
  }
} 