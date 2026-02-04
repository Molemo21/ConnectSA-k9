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
        details: 'Only admins can approve payouts'
      }, { status: 401 });
    }

    const payout = await prisma.payout.findUnique({
      where: { id: params.id },
      include: { 
        payment: {
          include: {
            booking: {
              include: {
                service: true,
                provider: {
                  include: { user: true }
                }
              }
            }
          }
        },
        provider: {
          include: { user: true }
        }
      }
    });

    if (!payout) {
      return NextResponse.json({ 
        error: 'Payout not found' 
      }, { status: 404 });
    }

    if (payout.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ 
        error: `Payout is ${payout.status}, cannot approve`,
        currentStatus: payout.status
      }, { status: 400 });
    }

    // Verify provider balance
    const providerBalance = await LedgerService.getProviderBalance(payout.providerId);
    
    if (providerBalance < payout.amount) {
      return NextResponse.json({
        error: 'Insufficient provider balance',
        details: `Provider balance: R${providerBalance.toFixed(2)}, Required: R${payout.amount.toFixed(2)}`,
        balance: providerBalance,
        requested: payout.amount
      }, { status: 400 });
    }

    // HARDENED: All checks and approval in single atomic transaction
    const { LedgerServiceHardened } = await import('@/lib/ledger-hardened');
    
    await prisma.$transaction(async (tx) => {
      // Re-fetch payout with lock (prevent concurrent approval)
      const currentPayout = await tx.payout.findUnique({
        where: { id: params.id },
      });

      if (!currentPayout) {
        throw new Error('Payout not found');
      }

      if (currentPayout.status !== 'PENDING_APPROVAL') {
        throw new Error(`Payout is ${currentPayout.status}, cannot approve`);
      }

      // Verify provider balance WITHIN transaction
      const providerBalance = await LedgerServiceHardened.getProviderBalance(
        currentPayout.providerId,
        tx
      );
      
      if (providerBalance < currentPayout.amount) {
        throw new Error(`Insufficient provider balance: R${providerBalance.toFixed(2)} < R${currentPayout.amount.toFixed(2)}`);
      }

      // Verify liquidity WITHIN transaction
      const liquidity = await LedgerServiceHardened.verifyLiquidity(currentPayout.amount, tx);
      
      if (!liquidity.sufficient) {
        throw new Error(`Insufficient funds in bank account: R${liquidity.bankBalance.toFixed(2)} < R${liquidity.required.toFixed(2)}`);
      }

      // Atomic approval
      await tx.payout.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: admin.id
        }
      });
    }, {
      isolationLevel: 'Serializable',
      timeout: 30000,
    });

    logPayment.success('admin', 'Payout approved', {
      payoutId: payout.id,
      paymentId: payout.paymentId,
      providerId: payout.providerId,
      amount: payout.amount,
      approvedBy: admin.id
    });

    return NextResponse.json({ 
      success: true, 
      payout: {
        id: payout.id,
        status: 'APPROVED',
        amount: payout.amount
      }
    });

  } catch (error) {
    console.error('❌ Error approving payout:', error);
    
    return NextResponse.json({
      error: 'Failed to approve payout',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
