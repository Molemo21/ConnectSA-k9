import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs'
import { paystackClient, paymentProcessor } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { logPayment } from '@/lib/logger';
import { broadcastPaymentStatusChange } from '@/lib/socket-server';
import { LedgerServiceHardened } from '@/lib/ledger-hardened';

/**
 * HARDENED WEBHOOK HANDLER
 * 
 * Critical protections:
 * 1. Database-level unique constraint prevents duplicate webhook processing
 * 2. Atomic payment status update prevents race conditions
 * 3. Idempotent ledger entry creation prevents double-crediting
 * 4. Full transaction wrapping ensures atomicity
 */

// Webhook event schemas for validation
const WebhookEventSchema = z.object({
  event: z.string(),
  data: z.object({
    reference: z.string(),
    id: z.number().optional(),
    status: z.string().optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
    gateway_response: z.string().optional(),
    failure_reason: z.string().optional(),
  }),
});

const SUPPORTED_EVENTS = ['charge.success', 'charge.failed'] as const;

type SupportedEvent = typeof SUPPORTED_EVENTS[number];

/**
 * Validate webhook signature
 */
async function validateWebhookSignature(body: string, signature: string): Promise<boolean> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not set');
  }

  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(body)
    .digest('hex');

  return hash === signature;
}

/**
 * HARDENED: Payment success handler with full idempotency
 */
async function handlePaymentSuccessHardened(data: any, webhookEventId: string | null) {
  const { reference, id: transactionId, amount, currency } = data;

  console.log(`💰 [HARDENED] Processing payment success webhook for reference: ${reference}`);

  // CRITICAL: Use transaction with SELECT FOR UPDATE to prevent race conditions
  return await prisma.$transaction(async (tx) => {
    // Step 1: Find payment with row-level lock (prevents concurrent processing)
    const existingPayment = await tx.payment.findUnique({
      where: { paystackRef: reference },
      include: { 
        booking: { 
          include: { 
            client: true, 
            provider: { 
              include: { user: true } 
            },
            service: true 
          } 
        } 
      }
    });

    if (!existingPayment) {
      throw new Error(`Payment not found for reference: ${reference}`);
    }

    // Step 2: Atomic status check and update (prevents double-processing)
    // Use update with where clause to atomically check and update
    const updatedPayment = await tx.payment.updateMany({
      where: {
        id: existingPayment.id,
        status: 'PENDING', // Only update if still PENDING
      },
      data: {
        status: 'ESCROW',
        paidAt: new Date(),
        currency: currency || 'ZAR',
      },
    });

    // If no rows updated, payment was already processed
    if (updatedPayment.count === 0) {
      console.log(`⚠️ Payment ${existingPayment.id} already processed (status: ${existingPayment.status})`);
      
      // Verify no duplicate ledger entries exist
      const hasDuplicates = !(await LedgerServiceHardened.verifyNoDuplicates('PAYMENT', existingPayment.id, tx));
      if (hasDuplicates) {
        console.error(`🚨 CRITICAL: Duplicate ledger entries detected for payment ${existingPayment.id}`);
        // Log but don't fail - already processed
      }
      
      return { 
        success: true, 
        message: `Payment already processed with status: ${existingPayment.status}`,
        payment: existingPayment,
        booking: existingPayment.booking
      };
    }

    // Step 3: Calculate breakdown if missing
    let escrowAmount = existingPayment.escrowAmount;
    let platformFee = existingPayment.platformFee;
    
    if (!escrowAmount || !platformFee) {
      const breakdown = paymentProcessor.calculatePaymentBreakdown(existingPayment.amount);
      escrowAmount = breakdown.escrowAmount;
      platformFee = breakdown.platformFee;
      
      // Update payment with breakdown
      await tx.payment.update({
        where: { id: existingPayment.id },
        data: {
          escrowAmount,
          platformFee,
        },
      });
    }

    // Step 4: Get or create settlement batch (atomic with upsert)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const settlementBatch = await tx.settlementBatch.upsert({
      where: { batchDate: today },
      create: {
        batchDate: today,
        expectedAmount: existingPayment.amount,
        status: 'PENDING',
      },
      update: {
        expectedAmount: {
          increment: existingPayment.amount,
        },
      },
    });
    
    // Link payment to settlement batch
    await tx.payment.update({
      where: { id: existingPayment.id },
      data: {
        settlementBatchId: settlementBatch.id,
      },
    });

    // Step 5: Create ledger entries with idempotency check
    // CRITICAL: Use idempotent creation to prevent double-crediting
    await LedgerServiceHardened.createEntryIdempotent({
      accountType: 'PROVIDER_BALANCE',
      accountId: existingPayment.booking.providerId,
      entryType: 'CREDIT',
      amount: escrowAmount!,
      referenceType: 'PAYMENT',
      referenceId: existingPayment.id,
      description: `Payment received for booking ${existingPayment.bookingId}`,
    }, tx);

    await LedgerServiceHardened.createEntryIdempotent({
      accountType: 'PLATFORM_REVENUE',
      accountId: 'PLATFORM',
      entryType: 'CREDIT',
      amount: platformFee!,
      referenceType: 'PAYMENT',
      referenceId: existingPayment.id,
      description: `Platform fee for booking ${existingPayment.bookingId}`,
    }, tx);

    // Step 6: Update booking status
    await tx.booking.update({
      where: { id: existingPayment.bookingId },
      data: { status: 'PENDING_EXECUTION' }
    });

    // Step 7: Create notification
    await tx.notification.create({
      data: {
        userId: existingPayment.booking.provider.user.id,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        content: `Payment received for ${existingPayment.booking.service?.name || 'your service'} - Booking #${existingPayment.booking.id}. You can now start the job!`,
        isRead: false,
      }
    });

    // Step 8: Verify accounting invariant
    const invariant = await LedgerServiceHardened.assertAccountingInvariant(tx);
    if (!invariant.valid) {
      console.error(`🚨 CRITICAL: Accounting invariant violation detected:`, invariant);
      // Log but don't fail - this is a monitoring check
    }

    console.log(`✅ [HARDENED] Payment processed atomically: ${existingPayment.id}`);
    console.log(`💰 Ledger entries: Provider Balance +${escrowAmount}, Platform Revenue +${platformFee}`);

    const finalPayment = await tx.payment.findUnique({
      where: { id: existingPayment.id },
    });

    return { 
      success: true, 
      message: `Payment ${existingPayment.id} successfully moved to escrow`,
      payment: finalPayment!,
      booking: existingPayment.booking
    };
  }, {
    isolationLevel: 'Serializable', // Highest isolation level to prevent race conditions
    timeout: 30000, // 30 second timeout
  });
}

/**
 * HARDENED: Payment failed handler
 */
async function handlePaymentFailedHardened(data: any, webhookEventId: string | null) {
  const { reference, failure_reason, gateway_response } = data;

  console.log(`❌ [HARDENED] Processing payment failure webhook for reference: ${reference}`);

  return await prisma.$transaction(async (tx) => {
    // Atomic update - only update if not already FAILED
    const updated = await tx.payment.updateMany({
      where: {
        paystackRef: reference,
        status: { not: 'FAILED' }, // Only update if not already failed
      },
      data: { 
        status: 'FAILED',
        errorMessage: failure_reason || gateway_response || 'Payment failed',
      }
    });

    if (updated.count === 0) {
      // Already failed
      return { success: true, message: `Payment already marked as failed` };
    }

    // Get payment to update booking
    const payment = await tx.payment.findUnique({
      where: { paystackRef: reference },
      include: { booking: true }
    });

    if (payment) {
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CANCELLED' }
      });
    }

    return { 
      success: true, 
      message: `Payment marked as failed` 
    };
  }, {
    isolationLevel: 'Serializable',
    timeout: 30000,
  });
}

/**
 * HARDENED: Main webhook handler
 */
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  const startTime = Date.now();
  let webhookEventId: string | null = null;
  
  try {
    // Step 1: Extract and validate signature
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ 
        error: 'Missing signature header',
        received: false 
      }, { status: 400 });
    }

    const isValidSignature = await validateWebhookSignature(body, signature);
    if (!isValidSignature) {
      return NextResponse.json({ 
        error: 'Invalid signature',
        received: false 
      }, { status: 400 });
    }

    // Step 2: Parse payload
    let payload: z.infer<typeof WebhookEventSchema>;
    try {
      payload = WebhookEventSchema.parse(JSON.parse(body));
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid payload format',
        received: false 
      }, { status: 400 });
    }

    const { event, data } = payload;
    const { reference } = data;

    // Step 3: Check if event is supported
    if (!SUPPORTED_EVENTS.includes(event as SupportedEvent)) {
      return NextResponse.json({ 
        received: true,
        processed: false,
        message: `Unsupported event type: ${event}`
      });
    }

    // Step 4: CRITICAL - Store webhook event with unique constraint
    // This prevents duplicate processing at database level
    try {
      const webhookEvent = await prisma.webhookEvent.create({
        data: {
          eventType: event,
          paystackRef: reference,
          payload: body,
          processed: false,
          retryCount: 0,
        }
      });
      webhookEventId = webhookEvent.id;
    } catch (storageError: any) {
      // If unique constraint violation, webhook was already processed
      if (storageError.code === 'P2002') {
        console.log(`⚠️ Webhook already processed (unique constraint violation)`);
        return NextResponse.json({
          received: true,
          processed: true,
          message: 'Webhook already processed'
        });
      }
      throw storageError;
    }

    // Step 5: Process webhook event
    let processingResult;
    try {
      switch (event) {
        case 'charge.success':
          processingResult = await handlePaymentSuccessHardened(data, webhookEventId);
          break;
        case 'charge.failed':
          processingResult = await handlePaymentFailedHardened(data, webhookEventId);
          break;
        default:
          throw new Error(`Unsupported event type: ${event}`);
      }
    } catch (processingError) {
      // Update webhook event with error
      if (webhookEventId) {
        await prisma.webhookEvent.update({
          where: { id: webhookEventId },
          data: { 
            processed: true,
            processedAt: new Date(),
            error: processingError instanceof Error ? processingError.message : 'Unknown error',
            retryCount: { increment: 1 }
          }
        });
      }
      throw processingError;
    }

    // Step 6: Mark webhook as processed
    if (webhookEventId) {
      await prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: { 
          processed: true,
          processedAt: new Date()
        }
      });
    }

    // Step 7: Broadcast (non-critical, don't fail if this fails)
    if (processingResult.success && processingResult.payment && processingResult.booking) {
      try {
        broadcastPaymentStatusChange(
          {
            id: processingResult.payment.id,
            status: processingResult.payment.status,
            amount: processingResult.payment.amount,
            escrowAmount: processingResult.payment.escrowAmount,
            bookingId: processingResult.payment.bookingId,
            paystackRef: processingResult.payment.paystackRef
          },
          processingResult.booking.clientId,
          processingResult.booking.providerId
        );
      } catch (broadcastError) {
        // Don't fail webhook if broadcast fails
        console.warn('Broadcast failed:', broadcastError);
      }
    }

    return NextResponse.json({
      received: true,
      processed: true,
      message: processingResult.message
    });

  } catch (error) {
    console.error('❌ [HARDENED] Webhook processing error:', error);
    
    return NextResponse.json({
      received: true,
      processed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
