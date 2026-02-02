import { prisma } from '@/lib/prisma';
import { paystackClient } from '@/lib/paystack';
import { LedgerService } from '@/lib/ledger';
import { logPayment } from '@/lib/logger';

/**
 * RefundService - Handles refunds with ledger tracking
 * 
 * Supports:
 * - Full or partial refunds
 * - Refunds after payout (creates provider debt)
 * - Platform fee refund tracking
 */
export class RefundService {
  /**
   * Process refund for a payment
   */
  static async processRefund(params: {
    paymentId: string;
    amount: number;  // Full or partial
    reason: string;
    initiatedBy: string;  // Admin user ID
  }) {
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: { 
        booking: {
          include: {
            provider: true
          }
        },
        payout: true
      }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Validate refund amount
    if (params.amount <= 0 || params.amount > payment.amount) {
      throw new Error(`Invalid refund amount. Must be between 0 and ${payment.amount}`);
    }

    // Check if payment is refundable
    if (payment.status === 'REFUNDED') {
      throw new Error('Payment already refunded');
    }

    if (payment.status === 'FAILED' || payment.status === 'PENDING') {
      throw new Error('Payment cannot be refunded in current status');
    }

    // Process Paystack refund (collection only)
    let refundResponse;
    try {
      refundResponse = await paystackClient.processRefund({
        transaction: payment.paystackRef,
        amount: params.amount,
        reason: params.reason,
      });
    } catch (paystackError) {
      logPayment.error('refund', 'Paystack refund failed', paystackError as Error, {
        paymentId: params.paymentId,
        amount: params.amount,
        paystackRef: payment.paystackRef
      });
      throw new Error(`Paystack refund failed: ${paystackError instanceof Error ? paystackError.message : 'Unknown error'}`);
    }

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        paymentId: params.paymentId,
        amount: params.amount,
        reason: params.reason,
        paystackRefundId: refundResponse.data.id.toString(),
        status: 'PROCESSING',
        initiatedBy: params.initiatedBy,
      }
    });

    // Calculate refund breakdown (same ratio as original payment)
    const refundRatio = params.amount / payment.amount;
    const refundEscrowAmount = (payment.escrowAmount || 0) * refundRatio;
    const refundPlatformFee = (payment.platformFee || 0) * refundRatio;

    // Create ledger entries
    // Debit provider balance (can go negative - this is debt)
    await LedgerService.createEntry({
      accountType: 'PROVIDER_BALANCE',
      accountId: payment.booking.providerId,
      entryType: 'DEBIT',
      amount: refundEscrowAmount,
      referenceType: 'REFUND',
      referenceId: refund.id,
      description: `Refund for payment ${params.paymentId} - Booking ${payment.bookingId}`,
      metadata: {
        originalPaymentId: params.paymentId,
        refundAmount: params.amount,
        refundRatio
      }
    });

    // Debit platform revenue
    await LedgerService.createEntry({
      accountType: 'PLATFORM_REVENUE',
      accountId: 'PLATFORM',
      entryType: 'DEBIT',
      amount: refundPlatformFee,
      referenceType: 'REFUND',
      referenceId: refund.id,
      description: `Platform fee refund for payment ${params.paymentId}`,
      metadata: {
        originalPaymentId: params.paymentId,
        refundAmount: params.amount,
        refundRatio
      }
    });

    // If payout already made, provider balance goes negative (debt)
    // This is OK - future payouts will offset debt
    if (payment.payout && payment.payout.status === 'COMPLETED') {
      const providerBalance = await LedgerService.getProviderBalance(payment.booking.providerId);
      logPayment.warning('refund', 'Refund after payout creates provider debt', {
        paymentId: params.paymentId,
        payoutId: payment.payout.id,
        providerId: payment.booking.providerId,
        providerBalance, // Will be negative
        refundAmount: params.amount
      });
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: params.paymentId },
      data: { 
        status: 'REFUNDED',
        updatedAt: new Date()
      }
    });

    // Update refund status
    await prisma.refund.update({
      where: { id: refund.id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      }
    });

    logPayment.success('refund', 'Refund processed successfully', {
      refundId: refund.id,
      paymentId: params.paymentId,
      amount: params.amount,
      refundEscrowAmount,
      refundPlatformFee,
      initiatedBy: params.initiatedBy
    });

    return refund;
  }

  /**
   * Get refund history for a payment
   */
  static async getRefundHistory(paymentId: string) {
    return await prisma.refund.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
