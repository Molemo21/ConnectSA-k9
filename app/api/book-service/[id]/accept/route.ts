import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs'
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";
import { sendBookingConfirmationEmail } from "@/lib/email";

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
    const match = pathname.match(/book-service\/([^/]+)\/accept/);
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
      data: { status: "CONFIRMED" },
    });

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
      
      console.log(`📧 Booking confirmation email sent to client: ${booking.client.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send booking confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true,
      booking: updated,
      message: "Job offer accepted! Client will be notified to proceed with payment."
    });
  } catch (error) {
    console.error("Accept booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 