import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-utils";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();
    
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // Ensure Prisma connection is established
    try {
      await prisma.$connect();
    } catch (connectError) {
      console.warn('⚠️ Prisma already connected or connection failed:', connectError);
      // Continue anyway - might already be connected
    }

    // Get the latest booking data using select to avoid non-existent fields
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
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
            paidAt: true,
            createdAt: true,
            updatedAt: true,
            payout: {
              select: {
                id: true,
                status: true,
                amount: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        },
        service: { 
          select: { 
            id: true,
            name: true 
          } 
        },
        provider: { 
          select: {
            id: true,
            businessName: true,
            user: { 
              select: { 
                id: true,
                name: true, 
                email: true 
              } 
            } 
          } 
        },
        client: { 
          select: { 
            id: true,
            name: true, 
            email: true 
          } 
        }
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
          escrowAmount: booking.payment.escrowAmount,
          platformFee: booking.payment.platformFee,
          paystackRef: booking.payment.paystackRef,
          paidAt: booking.payment.paidAt,
          createdAt: booking.payment.createdAt,
          updatedAt: booking.payment.updatedAt,
          payout: booking.payment.payout ? {
            id: booking.payment.payout.id,
            status: booking.payment.payout.status,
            amount: booking.payment.payout.amount,
            createdAt: booking.payment.payout.createdAt,
            updatedAt: booking.payment.payout.updatedAt
          } : null
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
