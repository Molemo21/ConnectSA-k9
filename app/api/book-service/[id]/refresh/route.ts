import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-utils";

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();
    
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // Get the latest booking data
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        service: { select: { name: true } },
        provider: { 
          include: { 
            user: { select: { name: true, email: true } } 
          } 
        },
        client: { select: { name: true, email: true } }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        totalAmount: booking.totalAmount,
        address: booking.address,
        description: booking.description,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        service: booking.service,
        provider: booking.provider,
        client: booking.client,
        payment: booking.payment ? {
          id: booking.payment.id,
          status: booking.payment.status,
          amount: booking.payment.amount,
          paystackRef: booking.payment.paystackRef,
          paidAt: booking.payment.paidAt,
          createdAt: booking.payment.createdAt,
          updatedAt: booking.payment.updatedAt
        } : null
      }
    });

  } catch (error) {
    console.error('Booking refresh error:', error);
    return NextResponse.json({ 
      error: "Failed to refresh booking data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
