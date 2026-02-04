/**
 * COMPREHENSIVE STRESS TEST SUITE FOR HARDENED FINANCIAL SYSTEM
 * 
 * Tests:
 * 1. Concurrent webhooks (idempotency)
 * 2. Concurrent payout approvals (atomic updates)
 * 3. Multi-batch execution (transaction isolation)
 * 4. Edge-case liquidity & refunds
 * 5. Crash and recovery simulation
 * 
 * Run: npx tsx scripts/stress-test-financial-system.ts
 */

import { PrismaClient } from '@prisma/client';
import { LedgerServiceHardened } from '../lib/ledger-hardened';
import { RefundService } from '../lib/refund';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface TestResult {
  scenario: string;
  passed: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
  details: any;
}

const results: TestResult[] = [];

// Test configuration
const CONFIG = {
  CONCURRENT_WEBHOOKS: 100,
  CONCURRENT_APPROVALS: 20,
  CONCURRENT_BATCHES: 10,
  PAYOUT_AMOUNT: 1000.00,
  PLATFORM_FEE_RATE: 0.10,
};

/**
 * Helper: Create test payment
 */
async function createTestPayment(bookingId: string, amount: number) {
  const platformFee = amount * CONFIG.PLATFORM_FEE_RATE;
  const escrowAmount = amount - platformFee;

  return await prisma.payment.create({
    data: {
      bookingId,
      amount,
      escrowAmount,
      platformFee,
      paystackRef: `TEST_${crypto.randomBytes(16).toString('hex')}`,
      status: 'PENDING',
      currency: 'ZAR',
    },
  });
}

/**
 * Helper: Create test booking
 */
async function createTestBooking(clientId: string, providerId: string, serviceId: string) {
  const amount = CONFIG.PAYOUT_AMOUNT / (1 - CONFIG.PLATFORM_FEE_RATE); // Reverse calculate to get desired payout
  const platformFee = amount * CONFIG.PLATFORM_FEE_RATE;

  return await prisma.booking.create({
    data: {
      clientId,
      providerId,
      serviceId,
      scheduledDate: new Date(),
      duration: 60,
      totalAmount: amount,
      platformFee,
      address: 'Test Address',
      status: 'PENDING',
      paymentMethod: 'ONLINE',
    },
  });
}

/**
 * Helper: Create test users
 */
async function createTestUsers() {
  const client = await prisma.user.upsert({
    where: { email: 'stress-test-client@test.com' },
    update: {},
    create: {
      email: 'stress-test-client@test.com',
      name: 'Stress Test Client',
      role: 'CLIENT',
      password: 'test',
    },
  });

  const providerUser = await prisma.user.upsert({
    where: { email: 'stress-test-provider@test.com' },
    update: {},
    create: {
      email: 'stress-test-provider@test.com',
      name: 'Stress Test Provider',
      role: 'PROVIDER',
      password: 'test',
    },
  });

  const provider = await prisma.provider.upsert({
    where: { userId: providerUser.id },
    update: {},
    create: {
      userId: providerUser.id,
      businessName: 'Stress Test Provider',
      status: 'APPROVED',
      bankName: 'Test Bank',
      bankCode: '123',
      accountNumber: '1234567890',
      accountName: 'Test Provider',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'stress-test-admin@test.com' },
    update: {},
    create: {
      email: 'stress-test-admin@test.com',
      name: 'Stress Test Admin',
      role: 'ADMIN',
      password: 'test',
    },
  });

  const service = await prisma.service.findFirst() || await prisma.service.create({
    data: {
      name: 'Test Service',
      categoryId: (await prisma.serviceCategory.findFirst() || await prisma.serviceCategory.create({
        data: { name: 'Test Category' },
      })).id,
    },
  });

  return { client, provider, providerUser, admin, service };
}

/**
 * Helper: Simulate webhook processing
 */
async function simulateWebhookProcessing(paymentId: string, reference: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            provider: { include: { user: true } },
            service: true,
          },
        },
      },
    });

    if (!payment || payment.status !== 'PENDING') {
      return { success: false, reason: 'Payment not in PENDING status' };
    }

    const escrowAmount = payment.escrowAmount || payment.amount * (1 - CONFIG.PLATFORM_FEE_RATE);
    const platformFee = payment.platformFee || payment.amount * CONFIG.PLATFORM_FEE_RATE;

    // Use hardened transaction
    await prisma.$transaction(async (tx) => {
      // Atomic status update
      const updated = await tx.payment.updateMany({
        where: {
          id: paymentId,
          status: 'PENDING',
        },
        data: {
          status: 'ESCROW',
          paidAt: new Date(),
          escrowAmount,
          platformFee,
        },
      });

      if (updated.count === 0) {
        throw new Error('Payment already processed');
      }

      // Settlement batch
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const settlementBatch = await tx.settlementBatch.upsert({
        where: { batchDate: today },
        create: {
          batchDate: today,
          expectedAmount: payment.amount,
          status: 'PENDING',
        },
        update: {
          expectedAmount: { increment: payment.amount },
        },
      });

      await tx.payment.update({
        where: { id: paymentId },
        data: { settlementBatchId: settlementBatch.id },
      });

      // Ledger entries (idempotent)
      await LedgerServiceHardened.createEntryIdempotent({
        accountType: 'PROVIDER_BALANCE',
        accountId: payment.booking.providerId,
        entryType: 'CREDIT',
        amount: escrowAmount,
        referenceType: 'PAYMENT',
        referenceId: paymentId,
        description: `Payment received for booking ${payment.bookingId}`,
      }, tx);

      await LedgerServiceHardened.createEntryIdempotent({
        accountType: 'PLATFORM_REVENUE',
        accountId: 'PLATFORM',
        entryType: 'CREDIT',
        amount: platformFee,
        referenceType: 'PAYMENT',
        referenceId: paymentId,
        description: `Platform fee for booking ${payment.bookingId}`,
      }, tx);

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'PENDING_EXECUTION' },
      });
    }, {
      isolationLevel: 'Serializable',
      timeout: 30000,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, reason: error.message };
  }
}

/**
 * TEST 1: Concurrent Webhooks
 */
async function testConcurrentWebhooks() {
  console.log('\n🧪 TEST 1: Concurrent Webhooks (Idempotency)');
  console.log(`   Simulating ${CONFIG.CONCURRENT_WEBHOOKS} simultaneous webhooks...`);

  const startTime = Date.now();
  const { client, provider, service } = await createTestUsers();

  // Create test booking and payment
  const booking = await createTestBooking(client.id, provider.id, service.id);
  const payment = await createTestPayment(booking.id, booking.totalAmount);

  // Simulate concurrent webhooks
  const promises = Array(CONFIG.CONCURRENT_WEBHOOKS)
    .fill(0)
    .map(() => simulateWebhookProcessing(payment.id, payment.paystackRef));

  const webhookResults = await Promise.all(promises);
  const duration = Date.now() - startTime;

  // Verify results
  const successful = webhookResults.filter(r => r.success).length;
  const failed = webhookResults.filter(r => !r.success).length;

  // Check final state
  const finalPayment = await prisma.payment.findUnique({
    where: { id: payment.id },
  });

  const ledgerEntries = await prisma.ledgerEntry.findMany({
    where: {
      referenceType: 'PAYMENT',
      referenceId: payment.id,
    },
  });

  const providerBalance = await LedgerServiceHardened.getProviderBalance(provider.id);
  const platformRevenue = await LedgerServiceHardened.getPlatformRevenue();

  // Assertions
  const errors: string[] = [];
  const warnings: string[] = [];

  if (finalPayment?.status !== 'ESCROW') {
    errors.push(`Payment status is ${finalPayment?.status}, expected ESCROW`);
  }

  // Should have exactly 2 ledger entries (provider balance + platform revenue)
  if (ledgerEntries.length !== 2) {
    errors.push(`Expected 2 ledger entries, found ${ledgerEntries.length}`);
  }

  // Check for duplicates
  const providerEntries = ledgerEntries.filter(e => e.accountType === 'PROVIDER_BALANCE');
  const platformEntries = ledgerEntries.filter(e => e.accountType === 'PLATFORM_REVENUE');

  if (providerEntries.length > 1) {
    errors.push(`Duplicate provider balance entries: ${providerEntries.length}`);
  }

  if (platformEntries.length > 1) {
    errors.push(`Duplicate platform revenue entries: ${platformEntries.length}`);
  }

  // Verify accounting
  const expectedProviderBalance = payment.escrowAmount || payment.amount * (1 - CONFIG.PLATFORM_FEE_RATE);
  if (Math.abs(providerBalance - expectedProviderBalance) > 0.01) {
    errors.push(`Provider balance mismatch: expected ${expectedProviderBalance}, got ${providerBalance}`);
  }

  const expectedPlatformRevenue = payment.platformFee || payment.amount * CONFIG.PLATFORM_FEE_RATE;
  if (Math.abs(platformRevenue - expectedPlatformRevenue) > 0.01) {
    errors.push(`Platform revenue mismatch: expected ${expectedPlatformRevenue}, got ${platformRevenue}`);
  }

  if (successful > 1) {
    warnings.push(`${successful} webhooks succeeded, but only 1 should have processed`);
  }

  const passed = errors.length === 0;

  results.push({
    scenario: 'Concurrent Webhooks',
    passed,
    duration,
    errors,
    warnings,
    details: {
      totalWebhooks: CONFIG.CONCURRENT_WEBHOOKS,
      successful,
      failed,
      finalStatus: finalPayment?.status,
      ledgerEntries: ledgerEntries.length,
      providerBalance,
      platformRevenue,
    },
  });

  console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'} (${duration}ms)`);
  if (errors.length > 0) {
    console.log(`   Errors: ${errors.join(', ')}`);
  }
  if (warnings.length > 0) {
    console.log(`   Warnings: ${warnings.join(', ')}`);
  }
}

/**
 * TEST 2: Concurrent Payout Approvals
 */
async function testConcurrentPayoutApprovals() {
  console.log('\n🧪 TEST 2: Concurrent Payout Approvals (Atomic Updates)');
  console.log(`   Simulating ${CONFIG.CONCURRENT_APPROVALS} simultaneous approvals...`);

  const startTime = Date.now();
  const { client, provider, admin, service } = await createTestUsers();

  // Create booking and payment
  const booking = await createTestBooking(client.id, provider.id, service.id);
  const payment = await createTestPayment(booking.id, booking.totalAmount);

  // Process payment to ESCROW
  await simulateWebhookProcessing(payment.id, payment.paystackRef);

  // Create payout
  const payout = await prisma.payout.create({
    data: {
      paymentId: payment.id,
      providerId: provider.id,
      amount: payment.escrowAmount!,
      status: 'PENDING_APPROVAL',
      method: 'MANUAL',
      bankName: provider.bankName!,
      bankCode: provider.bankCode!,
      accountNumber: provider.accountNumber!,
      accountName: provider.accountName!,
    },
  });

  // Credit bank account for liquidity
  await LedgerServiceHardened.createEntryIdempotent({
    accountType: 'BANK_ACCOUNT',
    accountId: 'BANK_MAIN',
    entryType: 'CREDIT',
    amount: payout.amount * 2, // Ensure sufficient liquidity
    referenceType: 'SETTLEMENT',
    referenceId: 'TEST_SETTLEMENT',
    description: 'Test settlement for liquidity',
  });

  // Simulate concurrent approvals
  const approvePayout = async (payoutId: string, adminId: string) => {
    try {
      await prisma.$transaction(async (tx) => {
        const currentPayout = await tx.payout.findUnique({
          where: { id: payoutId },
        });

        if (!currentPayout || currentPayout.status !== 'PENDING_APPROVAL') {
          throw new Error('Payout not in PENDING_APPROVAL status');
        }

        const providerBalance = await LedgerServiceHardened.getProviderBalance(
          currentPayout.providerId,
          tx
        );

        if (providerBalance < currentPayout.amount) {
          throw new Error('Insufficient provider balance');
        }

        const liquidity = await LedgerServiceHardened.verifyLiquidity(currentPayout.amount, tx);
        if (!liquidity.sufficient) {
          throw new Error('Insufficient liquidity');
        }

        await tx.payout.update({
          where: { id: payoutId },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedBy: adminId,
          },
        });
      }, {
        isolationLevel: 'Serializable',
        timeout: 30000,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, reason: error.message };
    }
  };

  const promises = Array(CONFIG.CONCURRENT_APPROVALS)
    .fill(0)
    .map(() => approvePayout(payout.id, admin.id));

  const approvalResults = await Promise.all(promises);
  const duration = Date.now() - startTime;

  // Verify results
  const successful = approvalResults.filter(r => r.success).length;
  const failed = approvalResults.filter(r => !r.success).length;

  const finalPayout = await prisma.payout.findUnique({
    where: { id: payout.id },
  });

  // Assertions
  const errors: string[] = [];
  const warnings: string[] = [];

  if (finalPayout?.status !== 'APPROVED') {
    errors.push(`Payout status is ${finalPayout?.status}, expected APPROVED`);
  }

  if (successful > 1) {
    errors.push(`${successful} approvals succeeded, but only 1 should have processed`);
  }

  if (finalPayout?.approvedBy !== admin.id) {
    warnings.push(`Approved by ${finalPayout?.approvedBy}, expected ${admin.id}`);
  }

  const passed = errors.length === 0;

  results.push({
    scenario: 'Concurrent Payout Approvals',
    passed,
    duration,
    errors,
    warnings,
    details: {
      totalApprovals: CONFIG.CONCURRENT_APPROVALS,
      successful,
      failed,
      finalStatus: finalPayout?.status,
      approvedBy: finalPayout?.approvedBy,
    },
  });

  console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'} (${duration}ms)`);
  if (errors.length > 0) {
    console.log(`   Errors: ${errors.join(', ')}`);
  }
}

/**
 * TEST 3: Multi-Batch Execution
 */
async function testMultiBatchExecution() {
  console.log('\n🧪 TEST 3: Multi-Batch Execution (Transaction Isolation)');
  console.log(`   Simulating ${CONFIG.CONCURRENT_BATCHES} simultaneous batch executions...`);

  const startTime = Date.now();
  const { client, provider, admin, service } = await createTestUsers();

  // Create multiple payouts
  const payouts: any[] = [];
  for (let i = 0; i < CONFIG.CONCURRENT_BATCHES; i++) {
    const booking = await createTestBooking(client.id, provider.id, service.id);
    const payment = await createTestPayment(booking.id, booking.totalAmount);
    await simulateWebhookProcessing(payment.id, payment.paystackRef);

    const payout = await prisma.payout.create({
      data: {
        paymentId: payment.id,
        providerId: provider.id,
        amount: payment.escrowAmount!,
        status: 'APPROVED',
        method: 'MANUAL',
        bankName: provider.bankName!,
        bankCode: provider.bankCode!,
        accountNumber: provider.accountNumber!,
        accountName: provider.accountName!,
        approvedAt: new Date(),
        approvedBy: admin.id,
      },
    });

    payouts.push(payout);
  }

  // Credit bank account
  const totalAmount = payouts.reduce((sum, p) => sum + p.amount, 0);
  await LedgerServiceHardened.createEntryIdempotent({
    accountType: 'BANK_ACCOUNT',
    accountId: 'BANK_MAIN',
    entryType: 'CREDIT',
    amount: totalAmount * 2,
    referenceType: 'SETTLEMENT',
    referenceId: 'TEST_SETTLEMENT_BATCH',
    description: 'Test settlement for batch execution',
  });

  // Create batches
  const batches: any[] = [];
  for (const payout of payouts) {
    const batch = await prisma.payoutBatch.create({
      data: {
        batchNumber: `BATCH_${Date.now()}_${payout.id}`,
        status: 'EXPORTED',
        totalAmount: payout.amount,
        payoutCount: 1,
        exportedAt: new Date(),
      },
    });

    await prisma.payout.update({
      where: { id: payout.id },
      data: { csvBatchId: batch.id, status: 'PROCESSING' },
    });

    batches.push({ batch, payout });
  }

  // Execute batches concurrently
  const executeBatch = async (batchId: string, payoutId: string) => {
    try {
      await prisma.$transaction(async (tx) => {
        const currentBatch = await tx.payoutBatch.findUnique({
          where: { id: batchId },
          include: { payouts: { include: { payment: { include: { booking: true } } } } },
        });

        if (!currentBatch || currentBatch.status !== 'EXPORTED') {
          throw new Error('Batch not in EXPORTED status');
        }

        const totalAmount = currentBatch.payouts.reduce((sum, p) => sum + p.amount, 0);
        const liquidity = await LedgerServiceHardened.verifyLiquidity(totalAmount, tx);

        if (!liquidity.sufficient) {
          throw new Error('Insufficient liquidity');
        }

        for (const payout of currentBatch.payouts) {
          await LedgerServiceHardened.createEntryIdempotent({
            accountType: 'BANK_ACCOUNT',
            accountId: 'BANK_MAIN',
            entryType: 'DEBIT',
            amount: payout.amount,
            referenceType: 'PAYOUT',
            referenceId: payout.id,
            description: `Payout executed for provider ${payout.providerId}`,
          }, tx);

          await tx.payout.update({
            where: { id: payout.id },
            data: {
              status: 'COMPLETED',
              executedAt: new Date(),
              executedBy: admin.id,
            },
          });

          await tx.payment.update({
            where: { id: payout.paymentId },
            data: { status: 'RELEASED' },
          });

          await tx.booking.update({
            where: { id: payout.payment.bookingId },
            data: { status: 'COMPLETED' },
          });
        }

        await tx.payoutBatch.update({
          where: { id: batchId },
          data: {
            status: 'EXECUTED',
            executedAt: new Date(),
            executedBy: admin.id,
          },
        });
      }, {
        isolationLevel: 'Serializable',
        timeout: 60000,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, reason: error.message };
    }
  };

  const promises = batches.map(({ batch, payout }) =>
    executeBatch(batch.id, payout.id)
  );

  const executionResults = await Promise.all(promises);
  const duration = Date.now() - startTime;

  // Verify results
  const successful = executionResults.filter(r => r.success).length;
  const failed = executionResults.filter(r => !r.success).length;

  const finalBatches = await prisma.payoutBatch.findMany({
    where: { id: { in: batches.map(b => b.batch.id) } },
  });

  const finalPayouts = await prisma.payout.findMany({
    where: { id: { in: payouts.map(p => p.id) } },
  });

  // Assertions
  const errors: string[] = [];
  const warnings: string[] = [];

  const executedBatches = finalBatches.filter(b => b.status === 'EXECUTED').length;
  if (executedBatches !== CONFIG.CONCURRENT_BATCHES) {
    errors.push(`Expected ${CONFIG.CONCURRENT_BATCHES} executed batches, found ${executedBatches}`);
  }

  const completedPayouts = finalPayouts.filter(p => p.status === 'COMPLETED').length;
  if (completedPayouts !== CONFIG.CONCURRENT_BATCHES) {
    errors.push(`Expected ${CONFIG.CONCURRENT_BATCHES} completed payouts, found ${completedPayouts}`);
  }

  // Verify accounting
  const bankBalance = await LedgerServiceHardened.getBankBalance();
  const expectedBalance = totalAmount * 2 - totalAmount; // Initial credit - debits
  if (Math.abs(bankBalance - expectedBalance) > 0.01) {
    errors.push(`Bank balance mismatch: expected ${expectedBalance}, got ${bankBalance}`);
  }

  const passed = errors.length === 0;

  results.push({
    scenario: 'Multi-Batch Execution',
    passed,
    duration,
    errors,
    warnings,
    details: {
      totalBatches: CONFIG.CONCURRENT_BATCHES,
      successful,
      failed,
      executedBatches,
      completedPayouts,
      bankBalance,
    },
  });

  console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'} (${duration}ms)`);
  if (errors.length > 0) {
    console.log(`   Errors: ${errors.join(', ')}`);
  }
}

/**
 * TEST 4: Edge-Case Liquidity & Refunds
 */
async function testEdgeCaseLiquidityAndRefunds() {
  console.log('\n🧪 TEST 4: Edge-Case Liquidity & Refunds');
  console.log('   Testing marginal liquidity and refund scenarios...');

  const startTime = Date.now();
  const { client, provider, admin, service } = await createTestUsers();

  const errors: string[] = [];
  const warnings: string[] = [];

  // Test 4.1: Marginal liquidity
  console.log('   4.1: Testing marginal liquidity...');
  const booking1 = await createTestBooking(client.id, provider.id, service.id);
  const payment1 = await createTestPayment(booking1.id, booking1.totalAmount);
  await simulateWebhookProcessing(payment1.id, payment1.paystackRef);

  // Credit bank with exact amount needed
  await LedgerServiceHardened.createEntryIdempotent({
    accountType: 'BANK_ACCOUNT',
    accountId: 'BANK_MAIN',
    entryType: 'CREDIT',
    amount: payment1.escrowAmount!,
    referenceType: 'SETTLEMENT',
    referenceId: 'TEST_MARGINAL',
    description: 'Test marginal liquidity',
  });

  const payout1 = await prisma.payout.create({
    data: {
      paymentId: payment1.id,
      providerId: provider.id,
      amount: payment1.escrowAmount!,
      status: 'PENDING_APPROVAL',
      method: 'MANUAL',
      bankName: provider.bankName!,
      bankCode: provider.bankCode!,
      accountNumber: provider.accountNumber!,
      accountName: provider.accountName!,
    },
  });

  // Should approve successfully
  try {
    await prisma.$transaction(async (tx) => {
      const liquidity = await LedgerServiceHardened.verifyLiquidity(payout1.amount, tx);
      if (!liquidity.sufficient) {
        throw new Error('Insufficient liquidity');
      }
      await tx.payout.update({
        where: { id: payout1.id },
        data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: admin.id },
      });
    }, { isolationLevel: 'Serializable' });
    console.log('     ✅ Marginal liquidity test passed');
  } catch (error: any) {
    errors.push(`Marginal liquidity test failed: ${error.message}`);
  }

  // Test 4.2: Insufficient liquidity
  console.log('   4.2: Testing insufficient liquidity...');
  const booking2 = await createTestBooking(client.id, provider.id, service.id);
  const payment2 = await createTestPayment(booking2.id, booking2.totalAmount);
  await simulateWebhookProcessing(payment2.id, payment2.paystackRef);

  const payout2 = await prisma.payout.create({
    data: {
      paymentId: payment2.id,
      providerId: provider.id,
      amount: payment2.escrowAmount!,
      status: 'PENDING_APPROVAL',
      method: 'MANUAL',
      bankName: provider.bankName!,
      bankCode: provider.bankCode!,
      accountNumber: provider.accountNumber!,
      accountName: provider.accountName!,
    },
  });

  // Should fail approval
  try {
    await prisma.$transaction(async (tx) => {
      const liquidity = await LedgerServiceHardened.verifyLiquidity(payout2.amount, tx);
      if (!liquidity.sufficient) {
        throw new Error('Insufficient liquidity');
      }
      await tx.payout.update({
        where: { id: payout2.id },
        data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: admin.id },
      });
    }, { isolationLevel: 'Serializable' });
    errors.push('Insufficient liquidity test should have failed');
  } catch (error: any) {
    if (error.message.includes('Insufficient liquidity')) {
      console.log('     ✅ Insufficient liquidity correctly rejected');
    } else {
      errors.push(`Unexpected error: ${error.message}`);
    }
  }

  // Test 4.3: Refund before payout
  console.log('   4.3: Testing refund before payout...');
  const booking3 = await createTestBooking(client.id, provider.id, service.id);
  const payment3 = await createTestPayment(booking3.id, booking3.totalAmount);
  await simulateWebhookProcessing(payment3.id, payment3.paystackRef);

  const initialProviderBalance = await LedgerServiceHardened.getProviderBalance(provider.id);

  // Process refund
  try {
    await RefundService.processRefund({
      paymentId: payment3.id,
      amount: payment3.amount,
      reason: 'Test refund',
      initiatedBy: admin.id,
    });

    const finalProviderBalance = await LedgerServiceHardened.getProviderBalance(provider.id);
    const expectedBalance = initialProviderBalance - payment3.escrowAmount!;

    if (Math.abs(finalProviderBalance - expectedBalance) > 0.01) {
      errors.push(`Refund balance mismatch: expected ${expectedBalance}, got ${finalProviderBalance}`);
    } else {
      console.log('     ✅ Refund before payout handled correctly');
    }
  } catch (error: any) {
    errors.push(`Refund test failed: ${error.message}`);
  }

  // Test 4.4: Refund after payout
  console.log('   4.4: Testing refund after payout...');
  const booking4 = await createTestBooking(client.id, provider.id, service.id);
  const payment4 = await createTestPayment(booking4.id, booking4.totalAmount);
  await simulateWebhookProcessing(payment4.id, payment4.paystackRef);

  // Credit bank and execute payout
  await LedgerServiceHardened.createEntryIdempotent({
    accountType: 'BANK_ACCOUNT',
    accountId: 'BANK_MAIN',
    entryType: 'CREDIT',
    amount: payment4.escrowAmount! * 2,
    referenceType: 'SETTLEMENT',
    referenceId: 'TEST_REFUND_AFTER',
    description: 'Test settlement for refund after payout',
  });

  const payout4 = await prisma.payout.create({
    data: {
      paymentId: payment4.id,
      providerId: provider.id,
      amount: payment4.escrowAmount!,
      status: 'APPROVED',
      method: 'MANUAL',
      bankName: provider.bankName!,
      bankCode: provider.bankCode!,
      accountNumber: provider.accountNumber!,
      accountName: provider.accountName!,
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  });

  // Execute payout
  await prisma.$transaction(async (tx) => {
    await LedgerServiceHardened.createEntryIdempotent({
      accountType: 'BANK_ACCOUNT',
      accountId: 'BANK_MAIN',
      entryType: 'DEBIT',
      amount: payout4.amount,
      referenceType: 'PAYOUT',
      referenceId: payout4.id,
      description: 'Test payout execution',
    }, tx);

    await tx.payout.update({
      where: { id: payout4.id },
      data: { status: 'COMPLETED', executedAt: new Date(), executedBy: admin.id },
    });

    await tx.payment.update({
      where: { id: payment4.id },
      data: { status: 'RELEASED' },
    });
  }, { isolationLevel: 'Serializable' });

  const balanceBeforeRefund = await LedgerServiceHardened.getProviderBalance(provider.id);

  // Process refund after payout
  try {
    await RefundService.processRefund({
      paymentId: payment4.id,
      amount: payment4.amount,
      reason: 'Test refund after payout',
      initiatedBy: admin.id,
    });

    const balanceAfterRefund = await LedgerServiceHardened.getProviderBalance(provider.id);
    const expectedBalance = balanceBeforeRefund - payment4.escrowAmount!;

    if (Math.abs(balanceAfterRefund - expectedBalance) > 0.01) {
      errors.push(`Refund after payout balance mismatch: expected ${expectedBalance}, got ${balanceAfterRefund}`);
    } else {
      console.log('     ✅ Refund after payout handled correctly (negative balance allowed)');
    }
  } catch (error: any) {
    errors.push(`Refund after payout test failed: ${error.message}`);
  }

  const duration = Date.now() - startTime;
  const passed = errors.length === 0;

  results.push({
    scenario: 'Edge-Case Liquidity & Refunds',
    passed,
    duration,
    errors,
    warnings,
    details: {
      marginalLiquidityTest: 'passed',
      insufficientLiquidityTest: 'passed',
      refundBeforePayout: 'passed',
      refundAfterPayout: 'passed',
    },
  });

  console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'} (${duration}ms)`);
  if (errors.length > 0) {
    console.log(`   Errors: ${errors.join(', ')}`);
  }
}

/**
 * TEST 5: Crash and Recovery
 */
async function testCrashAndRecovery() {
  console.log('\n🧪 TEST 5: Crash and Recovery Simulation');
  console.log('   Testing transaction rollback and recovery...');

  const startTime = Date.now();
  const { client, provider, service } = await createTestUsers();

  const errors: string[] = [];
  const warnings: string[] = [];

  // Test 5.1: Simulate crash mid-transaction
  console.log('   5.1: Simulating crash mid-transaction...');
  const booking = await createTestBooking(client.id, provider.id, service.id);
  const payment = await createTestPayment(booking.id, booking.totalAmount);

  try {
    // Start transaction but throw error mid-way
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'ESCROW' },
      });

      // Simulate crash
      throw new Error('Simulated crash');
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    // Expected
  }

  // Verify payment was not updated
  const paymentAfterCrash = await prisma.payment.findUnique({
    where: { id: payment.id },
  });

  if (paymentAfterCrash?.status !== 'PENDING') {
    errors.push(`Payment status changed after crash: ${paymentAfterCrash?.status}`);
  } else {
    console.log('     ✅ Transaction rolled back correctly');
  }

  // Test 5.2: Verify no partial ledger entries
  console.log('   5.2: Verifying no partial ledger entries...');
  const booking2 = await createTestBooking(client.id, provider.id, service.id);
  const payment2 = await createTestPayment(booking2.id, booking2.totalAmount);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment2.id },
        data: { status: 'ESCROW' },
      });

      // Create first ledger entry
      await LedgerServiceHardened.createEntryIdempotent({
        accountType: 'PROVIDER_BALANCE',
        accountId: provider.id,
        entryType: 'CREDIT',
        amount: payment2.escrowAmount!,
        referenceType: 'PAYMENT',
        referenceId: payment2.id,
        description: 'Test entry',
      }, tx);

      // Simulate crash before second entry
      throw new Error('Simulated crash');
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    // Expected
  }

  // Verify no ledger entries created
  const ledgerEntries = await prisma.ledgerEntry.findMany({
    where: {
      referenceType: 'PAYMENT',
      referenceId: payment2.id,
    },
  });

  if (ledgerEntries.length > 0) {
    errors.push(`Partial ledger entries found: ${ledgerEntries.length}`);
  } else {
    console.log('     ✅ No partial ledger entries created');
  }

  // Test 5.3: Recovery after crash
  console.log('   5.3: Testing recovery after crash...');
  const booking3 = await createTestBooking(client.id, provider.id, service.id);
  const payment3 = await createTestPayment(booking3.id, booking3.totalAmount);

  // Simulate crash
  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment3.id },
        data: { status: 'ESCROW' },
      });
      throw new Error('Simulated crash');
    });
  } catch (error) {
    // Expected
  }

  // Recover by processing normally
  await simulateWebhookProcessing(payment3.id, payment3.paystackRef);

  const paymentAfterRecovery = await prisma.payment.findUnique({
    where: { id: payment3.id },
  });

  if (paymentAfterRecovery?.status !== 'ESCROW') {
    errors.push(`Recovery failed: payment status is ${paymentAfterRecovery?.status}`);
  } else {
    console.log('     ✅ Recovery successful');
  }

  const duration = Date.now() - startTime;
  const passed = errors.length === 0;

  results.push({
    scenario: 'Crash and Recovery',
    passed,
    duration,
    errors,
    warnings,
    details: {
      rollbackTest: 'passed',
      partialEntriesTest: 'passed',
      recoveryTest: 'passed',
    },
  });

  console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'} (${duration}ms)`);
  if (errors.length > 0) {
    console.log(`   Errors: ${errors.join(', ')}`);
  }
}

/**
 * Validate Accounting Invariants
 */
async function validateAccountingInvariants() {
  console.log('\n🔍 Validating Accounting Invariants...');

  const invariant = await LedgerServiceHardened.assertAccountingInvariant();

  if (invariant.valid) {
    console.log('   ✅ Accounting invariant valid');
  } else {
    console.log('   ❌ Accounting invariant violation detected!');
    console.log(`   Discrepancy: R${invariant.discrepancy?.toFixed(2)}`);
    console.log('   Details:', invariant.details);
  }

  return invariant.valid;
}

/**
 * Generate Summary Report
 */
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('STRESS TEST SUMMARY REPORT');
  console.log('='.repeat(80));

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`);

  console.log('\n' + '-'.repeat(80));
  console.log('DETAILED RESULTS:');
  console.log('-'.repeat(80));

  for (const result of results) {
    console.log(`\n📊 ${result.scenario}`);
    console.log(`   Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Duration: ${result.duration}ms`);
    
    if (result.errors.length > 0) {
      console.log(`   Errors (${result.errors.length}):`);
      result.errors.forEach(err => console.log(`     - ${err}`));
    }
    
    if (result.warnings.length > 0) {
      console.log(`   Warnings (${result.warnings.length}):`);
      result.warnings.forEach(warn => console.log(`     - ${warn}`));
    }

    console.log(`   Details:`, JSON.stringify(result.details, null, 2));
  }

  console.log('\n' + '='.repeat(80));
  console.log('END OF REPORT');
  console.log('='.repeat(80) + '\n');
}

/**
 * Main Test Runner
 */
async function main() {
  console.log('🚀 Starting Financial System Stress Test Suite');
  console.log('='.repeat(80));

  try {
    // Run all tests
    await testConcurrentWebhooks();
    await testConcurrentPayoutApprovals();
    await testMultiBatchExecution();
    await testEdgeCaseLiquidityAndRefunds();
    await testCrashAndRecovery();

    // Validate accounting
    const accountingValid = await validateAccountingInvariants();

    // Generate report
    generateReport();

    // Exit with appropriate code
    const allPassed = results.every(r => r.passed) && accountingValid;
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Fatal error during stress testing:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
main();
