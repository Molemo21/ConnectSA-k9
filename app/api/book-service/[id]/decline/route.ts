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
    const match = pathname.match(/book-service\/([^/]+)\/decline/);
    const bookingId = match ? match[1] : null;
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.providerId !== user.provider?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (booking.status !== "PENDING") {
      return NextResponse.json({ error: "Booking is not pending" }, { status: 400 });
    }

    // Update proposal status
    await prisma.proposal.updateMany({
      where: { 
        bookingId: bookingId,
        providerId: user.provider.id 
      },
      data: { status: "DECLINED" }
    });

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    // TODO: Notify client (in-app/email) that provider declined
    // TODO: Suggest next available provider to client

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