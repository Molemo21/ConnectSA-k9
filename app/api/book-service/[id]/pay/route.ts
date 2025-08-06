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

    // Use a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Get booking with payment info
      const booking = await tx.booking.findUnique({ 
        where: { id: bookingId },
        include: { client: true, provider: true, payment: true }
      });
      
      if (!booking) {
        throw new Error("Booking not found");
      }

      // Check if user is the client for this booking
      if (booking.clientId !== user.id) {
        throw new Error("Forbidden");
      }

      // Check if booking can be paid
      if (booking.status !== "CONFIRMED") {
        throw new Error("Payment can only be made for confirmed bookings");
      }

      // Check if payment already exists
      if (booking.payment) {
        throw new Error("Payment already exists for this booking");
      }

      // Double-check if payment exists (race condition protection)
      const existingPayment = await tx.payment.findUnique({
        where: { bookingId: bookingId }
      });

      if (existingPayment) {
        throw new Error("Payment already exists for this booking");
      }

      // Calculate payment amounts
      const serviceAmount = booking.totalAmount || 0;
      const platformFee = serviceAmount * 0.1; // 10% platform fee
      const totalAmount = serviceAmount + platformFee;

      // TODO: Integrate with Paystack or other payment gateway
      // For now, we'll simulate a successful payment
      const paystackRef = `PS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          bookingId: bookingId,
          amount: totalAmount,
          paystackRef: paystackRef,
          status: "PAID",
          paidAt: new Date(),
        },
      });

      // Update booking status - keep as CONFIRMED, don't change to PAID
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { 
          // Don't change status - keep as CONFIRMED
          // status: "PAID", // Remove this line
        },
        include: { payment: true }
      });

      return { payment, booking: updatedBooking };
    });

    // TODO: Send payment confirmation email to client
    // TODO: Send payment notification to provider
    // TODO: Handle escrow logic

    return NextResponse.json({ 
      payment: result.payment,
      booking: result.booking,
      message: "Payment processed successfully! Your booking is now confirmed."
    });

  } catch (error) {
    console.error("Payment error:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === "Booking not found") {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "Payment can only be made for confirmed bookings") {
        return NextResponse.json({ error: "Payment can only be made for confirmed bookings" }, { status: 400 });
      }
      if (error.message === "Payment already exists for this booking") {
        return NextResponse.json({ error: "Payment already exists for this booking" }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 