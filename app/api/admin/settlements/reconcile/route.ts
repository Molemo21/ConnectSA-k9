import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LedgerService } from "@/lib/ledger";
import { logPayment } from "@/lib/logger";

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'Only admins can reconcile settlements'
      }, { status: 401 });
    }

    const { settlementBatchId, actualAmount, actualDate, bankStatementRef } = 
      await request.json();

    if (!settlementBatchId || !actualAmount || !actualDate) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'settlementBatchId, actualAmount, and actualDate are required'
      }, { status: 400 });
    }

    const settlementBatch = await prisma.settlementBatch.findUnique({
      where: { id: settlementBatchId },
      include: { payments: true }
    });

    if (!settlementBatch) {
      return NextResponse.json({ 
        error: 'Settlement batch not found' 
      }, { status: 404 });
    }

    if (settlementBatch.status === 'SETTLED') {
      return NextResponse.json({
        error: 'Settlement batch already reconciled',
        currentStatus: settlementBatch.status
      }, { status: 400 });
    }

    // Reconcile settlement
    const actualDateObj = new Date(actualDate);
    const discrepancy = Math.abs(settlementBatch.expectedAmount - actualAmount);
    const hasDiscrepancy = discrepancy > 0.01; // Allow 1 cent tolerance

    await prisma.$transaction(async (tx) => {
      // Update settlement batch
      await tx.settlementBatch.update({
        where: { id: settlementBatchId },
        data: {
          actualAmount,
          actualSettlementDate: actualDateObj,
          status: hasDiscrepancy ? 'DISCREPANCY' : 'SETTLED',
          bankStatementRef: bankStatementRef || null,
          reconciledAt: new Date(),
          reconciledBy: admin.id,
          notes: hasDiscrepancy 
            ? `Discrepancy: Expected R${settlementBatch.expectedAmount}, Actual R${actualAmount}, Difference R${discrepancy}`
            : null
        }
      });

      // Create ledger entry (credit bank account)
      await LedgerService.createEntry({
        accountType: 'BANK_ACCOUNT',
        accountId: 'BANK_MAIN',
        entryType: 'CREDIT',
        amount: actualAmount,
        referenceType: 'SETTLEMENT',
        referenceId: settlementBatchId,
        description: `Settlement for batch ${settlementBatch.batchDate.toISOString().split('T')[0]}`,
        metadata: {
          expectedAmount: settlementBatch.expectedAmount,
          actualAmount,
          discrepancy: hasDiscrepancy ? discrepancy : null,
          bankStatementRef
        }
      });

      // If there's a discrepancy, create adjustment entry
      if (hasDiscrepancy) {
        const adjustmentType = actualAmount > settlementBatch.expectedAmount ? 'CREDIT' : 'DEBIT';
        const adjustmentAmount = Math.abs(discrepancy);

        await LedgerService.createEntry({
          accountType: 'BANK_ACCOUNT',
          accountId: 'BANK_MAIN',
          entryType: adjustmentType,
          amount: adjustmentAmount,
          referenceType: 'ADJUSTMENT',
          referenceId: settlementBatchId,
          description: `Settlement discrepancy adjustment for batch ${settlementBatch.batchDate.toISOString().split('T')[0]}`,
          metadata: {
            expectedAmount: settlementBatch.expectedAmount,
            actualAmount,
            discrepancy
          }
        });
      }
    });

    logPayment.success('admin', 'Settlement reconciled', {
      settlementBatchId,
      expectedAmount: settlementBatch.expectedAmount,
      actualAmount,
      discrepancy: hasDiscrepancy ? discrepancy : 0,
      reconciledBy: admin.id
    });

    return NextResponse.json({
      success: true,
      settlement: {
        id: settlementBatchId,
        status: hasDiscrepancy ? 'DISCREPANCY' : 'SETTLED',
        expectedAmount: settlementBatch.expectedAmount,
        actualAmount,
        discrepancy: hasDiscrepancy ? discrepancy : 0
      }
    });

  } catch (error) {
    console.error('❌ Error reconciling settlement:', error);
    
    return NextResponse.json({
      error: 'Failed to reconcile settlement',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
