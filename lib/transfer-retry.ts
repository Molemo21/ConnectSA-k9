/**
 * Transfer Retry Utility with Exponential Backoff
 * 
 * Handles automatic retry of failed Paystack transfers with exponential backoff
 * and comprehensive error logging.
 */

import { prisma } from '@/lib/prisma';
import { paystackClient } from '@/lib/paystack';
import { logPayment } from '@/lib/logger';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2
};

export interface TransferRetryData {
  payoutId: string;
  bookingId: string;
  paymentId: string;
  providerId: string;
  userId: string;
  amount: number;
  recipientCode: string;
  reason: string;
  reference: string;
  attemptNumber: number;
}

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(attemptNumber: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attemptNumber - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a failed transfer with exponential backoff
 */
export async function retryFailedTransfer(
  transferData: TransferRetryData,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ success: boolean; transferCode?: string; error?: string }> {
  const { payoutId, bookingId, paymentId, providerId, userId, amount, recipientCode, reason, reference, attemptNumber } = transferData;

  logPayment.success('escrow_release', `Retrying failed transfer (attempt ${attemptNumber}/${config.maxRetries})`, {
    userId,
    bookingId,
    paymentId,
    providerId,
    payoutId,
    metadata: {
      attemptNumber,
      maxRetries: config.maxRetries,
      amount,
      recipientCode,
      reference
    }
  });

  try {
    // Create transfer data
    const transferPayload = {
      source: 'balance' as const,
      amount: amount,
      recipient: recipientCode,
      reason: reason,
      reference: reference,
    };

    // Attempt the transfer
    const transferResponse = await paystackClient.createTransfer(transferPayload);

    if (!transferResponse.data?.transfer_code) {
      throw new Error("Transfer response invalid - no transfer_code received");
    }

    // Update payout with successful transfer
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        transferCode: transferResponse.data.transfer_code,
        status: "PROCESSING",
      }
    });

    // Update payment status to RELEASED
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "RELEASED" }
    });

    // Update booking status to COMPLETED
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "COMPLETED" }
    });

    logPayment.success('escrow_release', 'Transfer retry successful', {
      userId,
      bookingId,
      paymentId,
      providerId,
      payoutId,
      metadata: {
        attemptNumber,
        transferCode: transferResponse.data.transfer_code,
        amount: transferResponse.data.amount,
        status: transferResponse.data.status
      }
    });

    return {
      success: true,
      transferCode: transferResponse.data.transfer_code
    };

  } catch (error) {
    logPayment.error('escrow_release', `Transfer retry attempt ${attemptNumber} failed`, error as Error, {
      userId,
      bookingId,
      paymentId,
      providerId,
      payoutId,
      error_code: 'TRANSFER_RETRY_FAILED',
      metadata: {
        attemptNumber,
        maxRetries: config.maxRetries,
        errorMessage: (error as Error).message
      }
    });

    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Schedule automatic retry for failed transfers
 */
export async function scheduleTransferRetry(
  payoutId: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<void> {
  try {
    // Get payout details
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        payment: {
          include: {
            booking: {
              include: {
                provider: true,
                client: true
              }
            }
          }
        },
        provider: true
      }
    });

    if (!payout) {
      logPayment.error('escrow_release', 'Payout not found for retry', new Error('Payout not found'), {
        payoutId,
        error_code: 'PAYOUT_NOT_FOUND'
      });
      return;
    }

    if (payout.status !== 'FAILED') {
      logPayment.success('escrow_release', 'Payout not in FAILED status, skipping retry', {
        payoutId,
        metadata: { currentStatus: payout.status }
      });
      return;
    }

    // Prepare retry data
    const transferData: TransferRetryData = {
      payoutId: payout.id,
      bookingId: payout.payment.bookingId,
      paymentId: payout.paymentId,
      providerId: payout.providerId,
      userId: payout.payment.booking.clientId,
      amount: payout.amount,
      recipientCode: payout.provider.recipientCode!,
      reason: `Payment for ${payout.payment.booking.service?.name || 'service'} - Booking ${payout.payment.bookingId}`,
      reference: payout.paystackRef,
      attemptNumber: 1
    };

    // Execute retries with exponential backoff
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      transferData.attemptNumber = attempt;

      const result = await retryFailedTransfer(transferData, config);

      if (result.success) {
        logPayment.success('escrow_release', 'Transfer retry completed successfully', {
          userId: transferData.userId,
          bookingId: transferData.bookingId,
          paymentId: transferData.paymentId,
          providerId: transferData.providerId,
          payoutId: transferData.payoutId,
          metadata: {
            totalAttempts: attempt,
            transferCode: result.transferCode
          }
        });
        return;
      }

      // If this was the last attempt, mark payout as permanently failed
      if (attempt === config.maxRetries) {
        await prisma.payout.update({
          where: { id: payoutId },
          data: { status: 'FAILED' }
        });

        logPayment.error('escrow_release', 'All transfer retry attempts exhausted', new Error('Transfer permanently failed'), {
          userId: transferData.userId,
          bookingId: transferData.bookingId,
          paymentId: transferData.paymentId,
          providerId: transferData.providerId,
          payoutId: transferData.payoutId,
          error_code: 'TRANSFER_PERMANENTLY_FAILED',
          metadata: {
            totalAttempts: attempt,
            lastError: result.error
          }
        });

        // TODO: Send notification to client and provider about permanent failure
        return;
      }

      // Wait before next retry
      const delay = calculateDelay(attempt, config);
      logPayment.success('escrow_release', `Waiting ${delay}ms before next retry attempt`, {
        userId: transferData.userId,
        bookingId: transferData.bookingId,
        paymentId: transferData.paymentId,
        providerId: transferData.providerId,
        payoutId: transferData.payoutId,
        metadata: {
          nextAttempt: attempt + 1,
          delayMs: delay
        }
      });

      await sleep(delay);
    }

  } catch (error) {
    logPayment.error('escrow_release', 'Error in transfer retry scheduling', error as Error, {
      payoutId,
      error_code: 'RETRY_SCHEDULING_ERROR',
      metadata: { errorMessage: (error as Error).message }
    });
  }
}

/**
 * Process failed transfer webhook and schedule retry
 */
export async function handleTransferFailureWithRetry(
  payoutId: string,
  failureReason: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<void> {
  try {
    logPayment.error('escrow_release', 'Transfer failed, scheduling retry', new Error(failureReason), {
      payoutId,
      error_code: 'TRANSFER_FAILED',
      metadata: { failureReason }
    });

    // Schedule retry in background (don't await to avoid blocking webhook response)
    setImmediate(() => scheduleTransferRetry(payoutId, config));

  } catch (error) {
    logPayment.error('escrow_release', 'Error handling transfer failure', error as Error, {
      payoutId,
      error_code: 'TRANSFER_FAILURE_HANDLING_ERROR',
      metadata: { errorMessage: (error as Error).message }
    });
  }
}
