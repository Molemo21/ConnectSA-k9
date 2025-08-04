import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
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

    const booking = await prisma.booking.findUnique({ 
      where: { id: bookingId },
      include: { payment: true }
    });
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.providerId !== user.provider?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (booking.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "Booking is not in progress" }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "COMPLETED" },
    });

    // TODO: Notify client (in-app/email) that job has been completed
    // TODO: Trigger payment release to provider (escrow logic)

    return NextResponse.json({ 
      success: true, 
      booking: updated,
      message: "Job completed successfully" 
    });
  } catch (error) {
    console.error("Complete job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 