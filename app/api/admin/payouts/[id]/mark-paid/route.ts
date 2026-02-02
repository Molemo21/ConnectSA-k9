import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";
import { broadcastPayoutUpdate, broadcastPaymentUpdate, broadcastBookingUpdate } from "@/lib/socket-server";

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentUser();
    
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'Only admins can mark payouts as paid'
      }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { paystackTransferRef, notes } = body;

    const payout = await prisma.payout.findUnique({
      where: { id: params.id },
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        payment: {
          include: {
            booking: {
              include: {
                client: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!payout) {
      return NextResponse.json({ 
        error: 'Payout not found' 
      }, { status: 404 });
    }

    if (payout.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Payout already marked as completed',
        currentStatus: payout.status
      }, { status: 400 });
    }

    // Update payout status to COMPLETED
    const updatedPayout = await prisma.$transaction(async (tx) => {
      // Update payout
      const payoutUpdate = await tx.payout.update({
        where: { id: params.id },
        data: {
          status: 'COMPLETED',
          paystackRef: paystackTransferRef || payout.paystackRef,
          updatedAt: new Date()
        }
      });

      // Update payment status to RELEASED
      await tx.payment.update({
        where: { id: payout.paymentId },
        data: {
          status: 'RELEASED',
          updatedAt: new Date()
        }
      });

      // Update booking status to COMPLETED when payment is released
      await tx.booking.update({
        where: { id: payout.payment.booking.id },
        data: {
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      });

      return payoutUpdate;
    });

    // Notify provider that payment has been released
    try {
      await createNotification({
        userId: payout.provider.userId,
        type: 'PAYMENT_RELEASED',
        title: 'Payment Released',
        content: `Your payout of R${payout.amount.toFixed(2)} for booking ${payout.payment.booking.id} has been processed and released to your bank account.`,
      });
    } catch (notificationError) {
      console.warn('⚠️ Failed to notify provider (payout still marked as paid):', notificationError);
    }

    // Notify client that payment was released
    try {
      await createNotification({
        userId: payout.payment.booking.clientId,
        type: 'PAYMENT_RELEASED',
        title: 'Payment Released to Provider',
        content: `Payment of R${payout.amount.toFixed(2)} has been released to ${payout.provider.businessName || payout.provider.user.name} for your booking.`,
      });
    } catch (notificationError) {
      console.warn('⚠️ Failed to notify client:', notificationError);
    }

    // Broadcast real-time socket events for instant UI updates
    try {
      // Get admin user IDs for broadcasting
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });
      const adminIds = adminUsers.map((admin: { id: string }) => admin.id);
      
      // Broadcast payout completion to provider, client, and admins
      broadcastPayoutUpdate(updatedPayout.id, 'completed', {
        id: updatedPayout.id,
        status: updatedPayout.status,
        amount: updatedPayout.amount,
        paymentId: payout.paymentId,
        bookingId: payout.payment.booking.id
      }, [payout.provider.userId, payout.payment.booking.clientId, ...adminIds]);

      // Broadcast payment status change (ESCROW -> RELEASED)
      broadcastPaymentUpdate(payout.paymentId, 'status_changed', {
        id: payout.paymentId,
        status: 'RELEASED',
        payoutId: updatedPayout.id,
        updatedAt: new Date().toISOString()
      }, [payout.provider.userId, payout.payment.booking.clientId, ...adminIds]);

      // Broadcast booking update (payment released) - include status change to COMPLETED
      broadcastBookingUpdate(payout.payment.booking.id, 'payment_released', {
        id: payout.payment.booking.id,
        status: 'COMPLETED', // Booking is now completed
        paymentStatus: 'RELEASED',
        payoutId: updatedPayout.id,
        updatedAt: new Date().toISOString()
      }, [payout.provider.userId, payout.payment.booking.clientId, ...adminIds]);

      console.log(`⚡ Socket events broadcasted for payout ${updatedPayout.id} completion`);
    } catch (socketError) {
      console.warn('⚠️ Failed to emit socket events (payout still marked as paid):', socketError);
      // Don't fail the request if socket emission fails
    }

    console.log(`✅ Payout ${params.id} marked as paid by admin ${admin.id}`);

    return NextResponse.json({
      success: true,
      message: 'Payout marked as completed successfully',
      payout: {
        id: updatedPayout.id,
        status: updatedPayout.status,
        amount: updatedPayout.amount
      }
    });

  } catch (error) {
    console.error('❌ Error marking payout as paid:', error);
    
    return NextResponse.json({
      error: 'Failed to mark payout as paid',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
