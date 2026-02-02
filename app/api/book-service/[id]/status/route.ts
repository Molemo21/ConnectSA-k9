import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paystackClient } from "@/lib/paystack";

export const dynamic = 'force-dynamic'


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookingId = params.id;
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    // Get the booking with payment details
    // Using select instead of include to avoid fetching non-existent payoutStatus field
    let booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        clientId: true,
        providerId: true,
        serviceId: true,
        status: true,
        scheduledDate: true,
        totalAmount: true,
        address: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            escrowAmount: true,
            platformFee: true,
            paystackRef: true,
            authorizationUrl: true,
            accessCode: true,
            paidAt: true,
            currency: true,
            createdAt: true,
            updatedAt: true
          }
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        service: {
          select: {
            name: true,
            category: true
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if user has access to this booking
    if (user.role === "CLIENT" && booking.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === "PROVIDER" && booking.providerId !== user.provider?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Auto-verify pending payments to advance state when Paystack has completed
    if (
      booking.payment &&
      booking.payment.status === 'PENDING' &&
      booking.status === 'CONFIRMED'
    ) {
      try {
        const verification = await paystackClient.verifyPayment(booking.payment.paystackRef);
        if (verification.status && verification.data.status === 'success') {
          // Update payment and booking atomically
          const result = await prisma.$transaction(async (tx) => {
            const updatedPayment = await tx.payment.update({
              where: { id: booking!.payment!.id },
              data: {
                status: 'ESCROW',
                paidAt: new Date(),
                updatedAt: new Date(),
              }
            });
            const updatedBooking = await tx.booking.update({
              where: { id: booking!.id },
              data: { status: 'PENDING_EXECUTION' }
            });
            return { updatedPayment, updatedBooking };
          });

          // Refresh local variable for response
          booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
              payment: true,
              provider: { include: { user: { select: { name: true, email: true, phone: true } } } },
              service: { select: { name: true, category: true } },
            }
          });
        }
      } catch (e) {
        // Swallow verification errors; client can retry or webhook will update
      }
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
        updatedAt: booking.updatedAt
      },
      payment: booking.payment ? {
        id: booking.payment.id,
        amount: booking.payment.amount,
        status: booking.payment.status,
        paystackRef: booking.payment.paystackRef,
        escrowAmount: booking.payment.escrowAmount,
        platformFee: booking.payment.platformFee,
        currency: booking.payment.currency,
        // Hide authorization data if booking is not CONFIRMED
        authorizationUrl: (booking.status === 'CONFIRMED') ? (booking.payment as any).authorizationUrl : null,
        accessCode: (booking.status === 'CONFIRMED') ? (booking.payment as any).accessCode : null,
        paidAt: booking.payment.paidAt,
        createdAt: booking.payment.createdAt,
        updatedAt: booking.payment.updatedAt
      } : null,
      provider: booking.provider ? {
        id: booking.provider.id,
        businessName: booking.provider.businessName,
        user: booking.provider.user
      } : null,
      service: booking.service
    });

  } catch (error) {
    console.error("Get booking status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
