import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paystackClient } from "@/lib/paystack";

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    // Only admins can trigger auto-recovery
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    console.log('🚀 Auto-recovery process started by admin:', user.id);

    // Find all payments stuck in PENDING status
    const stuckPayments = await prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: { 
        booking: { 
          include: { 
            service: true,
            provider: { include: { user: true } }
          } 
        } 
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`🔍 Found ${stuckPayments.length} payments stuck in PENDING status`);

    if (stuckPayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No stuck payments found",
        recovered: 0,
        total: 0
      });
    }

    const recoveryResults = [];
    let recoveredCount = 0;
    let failedCount = 0;

    // Process each stuck payment
    for (const payment of stuckPayments) {
      try {
        console.log(`🔄 Processing payment ${payment.id} (${payment.paystackRef})`);
        
        // Verify payment with Paystack
        const paystackVerification = await paystackClient.verifyPayment(payment.paystackRef);
        
        if (paystackVerification.status && paystackVerification.data.status === 'success') {
          console.log(`✅ Payment ${payment.id} verified as successful with Paystack`);
          
          // Update payment status to ESCROW
          const updatedPayment = await prisma.payment.update({
            where: { id: payment.id },
            data: { 
              status: 'ESCROW',
              paidAt: new Date(),
              transactionId: paystackVerification.data.id?.toString() || null,
              updatedAt: new Date()
            }
          });

          // Update booking status if it's still CONFIRMED
          let updatedBooking = null;
          if (payment.booking.status === 'CONFIRMED') {
            updatedBooking = await prisma.booking.update({
              where: { id: payment.bookingId },
              data: { status: 'PENDING_EXECUTION' }
            });
            console.log(`✅ Booking ${payment.bookingId} status updated to PENDING_EXECUTION`);
          }

          // Create notification for provider
          await prisma.notification.create({
            data: {
              userId: payment.booking.provider.user.id,
              type: 'PAYMENT_RECEIVED',
              title: 'Payment Received',
              message: `Payment received for ${payment.booking.service?.name || 'your service'} - Booking #${payment.booking.id}. You can now start the job!`,
              isRead: false,
            }
          });

          recoveryResults.push({
            paymentId: payment.id,
            paystackRef: payment.paystackRef,
            status: 'RECOVERED',
            previousStatus: 'PENDING',
            newStatus: 'ESCROW',
            amount: payment.amount,
            message: 'Payment successfully recovered from PENDING to ESCROW'
          });

          recoveredCount++;
          console.log(`🎉 Payment ${payment.id} successfully recovered`);

        } else if (paystackVerification.data.status === 'failed') {
          console.log(`❌ Payment ${payment.id} failed with Paystack`);
          
          // Update payment status to FAILED
          await prisma.payment.update({
            where: { id: payment.id },
            data: { 
              status: 'FAILED',
              updatedAt: new Date()
            }
          });

          recoveryResults.push({
            paymentId: payment.id,
            paystackRef: payment.paystackRef,
            status: 'FAILED',
            previousStatus: 'PENDING',
            newStatus: 'FAILED',
            amount: payment.amount,
            message: 'Payment marked as failed based on Paystack verification'
          });

          failedCount++;
          console.log(`⚠️ Payment ${payment.id} marked as failed`);

        } else {
          console.log(`ℹ️ Payment ${payment.id} status unclear: ${paystackVerification.data.status}`);
          
          recoveryResults.push({
            paymentId: payment.id,
            paystackRef: payment.paystackRef,
            status: 'UNKNOWN',
            previousStatus: 'PENDING',
            newStatus: 'PENDING',
            amount: payment.amount,
            message: `Payment status unclear: ${paystackVerification.data.status}`
          });
        }

      } catch (error) {
        console.error(`❌ Error processing payment ${payment.id}:`, error);
        
        recoveryResults.push({
          paymentId: payment.id,
          paystackRef: payment.paystackRef,
          status: 'ERROR',
          previousStatus: 'PENDING',
          newStatus: 'PENDING',
          amount: payment.amount,
          message: `Error during recovery: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    // Get updated payment counts
    const updatedCounts = await prisma.payment.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    console.log(`✅ Auto-recovery completed. Results:`, {
      total: stuckPayments.length,
      recovered: recoveredCount,
      failed: failedCount,
      updatedCounts
    });

    return NextResponse.json({
      success: true,
      message: `Auto-recovery completed successfully`,
      summary: {
        total: stuckPayments.length,
        recovered: recoveredCount,
        failed: failedCount,
        errors: recoveryResults.filter(r => r.status === 'ERROR').length
      },
      results: recoveryResults,
      updatedCounts: updatedCounts.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>)
    });

  } catch (error) {
    console.error('❌ Auto-recovery error:', error);
    return NextResponse.json({ 
      error: 'Auto-recovery failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
