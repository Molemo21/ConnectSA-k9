import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get booking with payment and provider info
      const booking = await tx.booking.findUnique({ 
        where: { id: bookingId },
        include: { 
          payment: true,
          provider: true,
          client: true,
          service: true
        }
      });
      
      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.providerId !== user.provider?.id) {
        throw new Error("Forbidden");
      }

      if (booking.status !== "IN_PROGRESS") {
        throw new Error("Booking is not in progress");
      }

      // Note: jobProof table doesn't exist yet, so we skip the duplicate check
      // TODO: Add this check back once the job_proofs table is created

      // Calculate auto-confirmation date
      const autoConfirmAt = new Date();
      autoConfirmAt.setDate(autoConfirmAt.getDate() + PAYMENT_CONSTANTS.AUTO_CONFIRMATION_DAYS);

      // TODO: Create job proof record once the table exists
      // For now, we'll just update the booking status
      // const jobProof = await tx.jobProof.create({
      //   data: {
      //     bookingId: bookingId,
      //     providerId: user.provider.id,
      //     photos: validated.photos || [],
      //     notes: validated.notes || '',
      //     completedAt: new Date(),
      //     autoConfirmAt: autoConfirmAt,
      //   },
      // });

      // Update booking status to AWAITING_CONFIRMATION
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: "AWAITING_CONFIRMATION" },
        include: { client: true, service: true }
      });

      return { booking: updatedBooking };
    });

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
      // Don't fail the request if notification fails
    }

    console.log(`Job completion proof submitted for booking ${bookingId}`);

    return NextResponse.json({ 
      success: true, 
      booking: result.booking,
      message: "Job completion proof submitted successfully. Waiting for client confirmation.",
      autoConfirmDate: null, // No autoConfirmAt in this new logic
    });

  } catch (error) {
    console.error("Job completion error:", error);
    
    if (error instanceof Error) {
      if (error.message === "Booking not found") {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "Booking is not in progress") {
        return NextResponse.json({ error: "Booking is not in progress" }, { status: 400 });
      }
      if (error.message === "Job completion proof already submitted") {
        return NextResponse.json({ error: "Job completion proof already submitted" }, { status: 400 });
      }
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 