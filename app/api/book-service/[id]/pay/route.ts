import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/pay/);
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
    if (booking.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (booking.status !== "CONFIRMED") {
      return NextResponse.json({ error: "Booking is not confirmed" }, { status: 400 });
    }
    if (booking.payment) {
      return NextResponse.json({ error: "Payment already exists" }, { status: 400 });
    }

    // TODO: Integrate real payment gateway here (Paystack)
    // For now, create a mock payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: bookingId,
        amount: booking.totalAmount,
        paystackRef: `mock_${Date.now()}`, // Mock reference
        status: "paid",
        paidAt: new Date(),
      },
    });

    // TODO: Notify provider (in-app/email)

    return NextResponse.json({ 
      success: true, 
      payment,
      message: "Payment processed successfully" 
    });
  } catch (error) {
    console.error("Pay booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 