import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LedgerService } from "@/lib/ledger";
import { logPayment } from "@/lib/logger";

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
        details: 'Only admins can execute payout batches'
      }, { status: 401 });
    }

    const batch = await prisma.payoutBatch.findUnique({
      where: { id: params.id },
      include: { 
        payouts: {
          include: {
            payment: {
              include: { booking: true }
            }
          }
        }
      }
    });

    if (!batch) {
      return NextResponse.json({ 
        error: 'Batch not found' 
      }, { status: 404 });
    }

    if (batch.status !== 'EXPORTED') {
      return NextResponse.json({
        error: `Batch is ${batch.status}, cannot execute`,
        currentStatus: batch.status,
        expectedStatus: 'EXPORTED'
      }, { status: 400 });
    }

    // HARDENED: Execute all payouts in batch atomically
    const { LedgerServiceHardened } = await import('@/lib/ledger-hardened');
    
    await prisma.$transaction(async (tx) => {
      // Re-verify batch status
      const currentBatch = await tx.payoutBatch.findUnique({
        where: { id: batch.id },
        include: { payouts: { include: { payment: { include: { booking: true } } } } }
      });

      if (!currentBatch || currentBatch.status !== 'EXPORTED') {
        throw new Error(`Batch is ${currentBatch?.status}, cannot execute`);
      }

      // Verify liquidity for entire batch
      const totalAmount = currentBatch.payouts.reduce((sum, p) => sum + p.amount, 0);
      const liquidity = await LedgerServiceHardened.verifyLiquidity(totalAmount, tx);
      
      if (!liquidity.sufficient) {
        throw new Error(`Insufficient funds for batch: R${liquidity.bankBalance.toFixed(2)} < R${liquidity.required.toFixed(2)}`);
      }

      for (const payout of currentBatch.payouts) {
        // Verify payout is still APPROVED
        if (payout.status !== 'APPROVED') {
          throw new Error(`Payout ${payout.id} is ${payout.status}, cannot execute`);
        }

        // Create ledger entry with idempotency (debit bank account)
        await LedgerServiceHardened.createEntryIdempotent({
          accountType: 'BANK_ACCOUNT',
          accountId: 'BANK_MAIN',
          entryType: 'DEBIT',
          amount: payout.amount,
          referenceType: 'PAYOUT',
          referenceId: payout.id,
          description: `Payout executed for provider ${payout.providerId} - Booking ${payout.payment.bookingId}`,
        }, tx);

        // Update payout
        await tx.payout.update({
          where: { id: payout.id },
          data: {
            status: 'COMPLETED',
            executedAt: new Date(),
            executedBy: admin.id,
            manualReference: `BATCH_${batch.batchNumber}_${payout.id}`
          }
        });

        // Update payment
        await tx.payment.update({
          where: { id: payout.paymentId },
          data: { 
            status: 'RELEASED',
            updatedAt: new Date()
          }
        });

        // Update booking
        await tx.booking.update({
          where: { id: payout.payment.bookingId },
          data: { 
            status: 'COMPLETED',
            updatedAt: new Date()
          }
        });
      }

      // Update batch
      await tx.payoutBatch.update({
        where: { id: batch.id },
        data: {
          status: 'EXECUTED',
          executedAt: new Date(),
          executedBy: admin.id
        }
      });
    }, {
      isolationLevel: 'Serializable',
      timeout: 60000, // Longer timeout for batch operations
    });

    logPayment.success('admin', 'Payout batch executed', {
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      payoutCount: batch.payouts.length,
      totalAmount: batch.totalAmount,
      executedBy: admin.id
    });

    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        batchNumber: batch.batchNumber,
        status: 'EXECUTED',
        payoutCount: batch.payouts.length,
        totalAmount: batch.totalAmount
      }
    });

  } catch (error) {
    console.error('❌ Error executing payout batch:', error);
    
    return NextResponse.json({
      error: 'Failed to execute payout batch',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
