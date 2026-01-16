/**
 * Payment System Fixes Verification Script
 * 
 * This script verifies that all payment system fixes are properly implemented
 * and the system is ready for use.
 * 
 * Usage: npx tsx scripts/verify-payment-fixes.ts
 */

import { prisma } from '@/lib/prisma';
import { paymentProcessor } from '@/lib/paystack';

interface VerificationResult {
  check: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

function addResult(check: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any) {
  results.push({ check, status, message, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${check}: ${message}`);
  if (details) {
    console.log(`   Details:`, details);
  }
}

async function verifyPrismaModels() {
  console.log('\n📦 Verifying Prisma Models...\n');

  try {
    // Check if Payout model is available
    try {
      await prisma.payout.count();
      addResult('Payout Model', 'PASS', 'Payout model is available in Prisma client');
    } catch (error) {
      addResult('Payout Model', 'FAIL', 'Payout model not available - run: npx prisma generate', { error: (error as Error).message });
    }

    // Check if WebhookEvent model is available
    try {
      await prisma.webhookEvent.count();
      addResult('WebhookEvent Model', 'PASS', 'WebhookEvent model is available in Prisma client');
    } catch (error) {
      addResult('WebhookEvent Model', 'FAIL', 'WebhookEvent model not available - run: npx prisma generate', { error: (error as Error).message });
    }

    // Check Payment model has required fields
    try {
      const samplePayment = await prisma.payment.findFirst({
        select: {
          id: true,
          amount: true,
          escrowAmount: true,
          platformFee: true,
          status: true,
        }
      });
      
      if (samplePayment) {
        const hasEscrowAmount = 'escrowAmount' in samplePayment;
        const hasPlatformFee = 'platformFee' in samplePayment;
        
        if (hasEscrowAmount && hasPlatformFee) {
          addResult('Payment Model Fields', 'PASS', 'Payment model has escrowAmount and platformFee fields');
        } else {
          addResult('Payment Model Fields', 'FAIL', 'Payment model missing escrowAmount or platformFee fields');
        }
      } else {
        addResult('Payment Model Fields', 'WARNING', 'No payments found to verify fields');
      }
    } catch (error) {
      addResult('Payment Model Fields', 'FAIL', 'Error checking Payment model fields', { error: (error as Error).message });
    }

  } catch (error) {
    addResult('Prisma Connection', 'FAIL', 'Cannot connect to database', { error: (error as Error).message });
  }
}

async function verifyPaymentBreakdown() {
  console.log('\n💰 Verifying Payment Breakdown...\n');

  try {
    // Check payments missing breakdown
    const paymentsWithoutBreakdown = await prisma.payment.findMany({
      where: {
        OR: [
          { escrowAmount: null },
          { platformFee: null }
        ]
      },
      select: {
        id: true,
        amount: true,
        escrowAmount: true,
        platformFee: true,
        status: true,
        createdAt: true,
      },
      take: 10
    });

    if (paymentsWithoutBreakdown.length === 0) {
      addResult('Payment Breakdown', 'PASS', 'All payments have escrowAmount and platformFee');
    } else {
      addResult('Payment Breakdown', 'WARNING', 
        `${paymentsWithoutBreakdown.length} payment(s) missing breakdown data. Run: npm run db:backfill-payments`,
        { 
          count: paymentsWithoutBreakdown.length,
          sampleIds: paymentsWithoutBreakdown.slice(0, 5).map(p => p.id)
        }
      );
    }

    // Verify breakdown calculation
    const testAmount = 1000;
    const breakdown = paymentProcessor.calculatePaymentBreakdown(testAmount);
    
    if (breakdown.escrowAmount === 900 && breakdown.platformFee === 100) {
      addResult('Breakdown Calculation', 'PASS', 'Payment breakdown calculation is correct');
    } else {
      addResult('Breakdown Calculation', 'FAIL', 
        'Payment breakdown calculation incorrect',
        { expected: { escrowAmount: 900, platformFee: 100 }, actual: breakdown }
      );
    }

  } catch (error) {
    addResult('Payment Breakdown', 'FAIL', 'Error checking payment breakdown', { error: (error as Error).message });
  }
}

async function verifyDatabaseTables() {
  console.log('\n🗄️ Verifying Database Tables...\n');

  try {
    // Check if payouts table exists
    try {
      const payoutCount = await prisma.payout.count();
      addResult('Payouts Table', 'PASS', `Payouts table exists (${payoutCount} records)`);
    } catch (error) {
      addResult('Payouts Table', 'FAIL', 
        'Payouts table does not exist. Run: npx prisma db push',
        { error: (error as Error).message }
      );
    }

    // Check if webhook_events table exists
    try {
      const webhookCount = await prisma.webhookEvent.count();
      addResult('WebhookEvents Table', 'PASS', `WebhookEvents table exists (${webhookCount} records)`);
    } catch (error) {
      addResult('WebhookEvents Table', 'FAIL', 
        'WebhookEvents table does not exist. Run: npx prisma db push',
        { error: (error as Error).message }
      );
    }

    // Check payments table structure
    try {
      const paymentWithBreakdown = await prisma.payment.findFirst({
        where: {
          escrowAmount: { not: null },
          platformFee: { not: null }
        }
      });

      if (paymentWithBreakdown) {
        addResult('Payments Table Structure', 'PASS', 'Payments table has escrowAmount and platformFee columns');
      } else {
        addResult('Payments Table Structure', 'WARNING', 
          'No payments with breakdown found. Table structure may be correct but data needs backfilling.'
        );
      }
    } catch (error) {
      addResult('Payments Table Structure', 'FAIL', 
        'Error checking payments table structure',
        { error: (error as Error).message }
      );
    }

  } catch (error) {
    addResult('Database Connection', 'FAIL', 'Cannot connect to database', { error: (error as Error).message });
  }
}

async function verifyEnvironmentVariables() {
  console.log('\n🔐 Verifying Environment Variables...\n');

  const requiredVars = {
    'PAYSTACK_SECRET_KEY': process.env.PAYSTACK_SECRET_KEY,
    'PAYSTACK_PUBLIC_KEY': process.env.PAYSTACK_PUBLIC_KEY,
  };

  const optionalVars = {
    'PAYSTACK_WEBHOOK_SECRET': process.env.PAYSTACK_WEBHOOK_SECRET,
  };

  // Check required variables
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      const isValid = key === 'PAYSTACK_SECRET_KEY' 
        ? (value.startsWith('sk_test_') || value.startsWith('sk_live_'))
        : (value.startsWith('pk_test_') || value.startsWith('pk_live_'));
      
      if (isValid) {
        addResult(key, 'PASS', `Set and format is valid (${value.substring(0, 8)}...)`);
      } else {
        addResult(key, 'WARNING', `Set but format may be invalid (should start with sk_test_/sk_live_ or pk_test_/pk_live_)`);
      }
    } else {
      addResult(key, 'FAIL', 'Not set in environment variables');
    }
  }

  // Check optional variables
  for (const [key, value] of Object.entries(optionalVars)) {
    if (value) {
      addResult(key, 'PASS', 'Set (optional)');
    } else {
      addResult(key, 'WARNING', 'Not set (optional - only needed if Paystack provides separate webhook secret)');
    }
  }
}

async function verifyCodeChanges() {
  console.log('\n📝 Verifying Code Changes...\n');

  try {
    // Check if paymentProcessor is available
    try {
      const testBreakdown = paymentProcessor.calculatePaymentBreakdown(100);
      if (testBreakdown.escrowAmount && testBreakdown.platformFee) {
        addResult('Payment Processor', 'PASS', 'Payment processor is available and working');
      } else {
        addResult('Payment Processor', 'FAIL', 'Payment processor calculation failed');
      }
    } catch (error) {
      addResult('Payment Processor', 'FAIL', 'Payment processor not available', { error: (error as Error).message });
    }

    // Check if paystackClient is available
    try {
      const { paystackClient } = await import('@/lib/paystack');
      const publicKey = paystackClient.getPublicKey();
      if (publicKey) {
        addResult('Paystack Client', 'PASS', 'Paystack client is available');
      } else {
        addResult('Paystack Client', 'WARNING', 'Paystack client available but public key not set');
      }
    } catch (error) {
      addResult('Paystack Client', 'FAIL', 'Paystack client not available', { error: (error as Error).message });
    }

  } catch (error) {
    addResult('Code Verification', 'FAIL', 'Error verifying code changes', { error: (error as Error).message });
  }
}

async function generateSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARNING').length;
  const total = results.length;

  console.log(`Total Checks: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('❌ FAILED CHECKS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.check}: ${r.message}`);
    });
    console.log('');
  }

  if (warnings > 0) {
    console.log('⚠️  WARNINGS:');
    results.filter(r => r.status === 'WARNING').forEach(r => {
      console.log(`   - ${r.check}: ${r.message}`);
    });
    console.log('');
  }

  if (failed === 0 && warnings === 0) {
    console.log('🎉 All checks passed! Payment system fixes are ready to use.\n');
    return true;
  } else if (failed === 0) {
    console.log('✅ All critical checks passed. Review warnings above.\n');
    return true;
  } else {
    console.log('❌ Some checks failed. Please fix the issues above before proceeding.\n');
    return false;
  }
}

async function main() {
  console.log('🔍 Payment System Fixes Verification');
  console.log('='.repeat(60));
  console.log('Verifying all payment system fixes are properly implemented...\n');

  try {
    await verifyPrismaModels();
    await verifyPaymentBreakdown();
    await verifyDatabaseTables();
    await verifyEnvironmentVariables();
    await verifyCodeChanges();

    const allPassed = await generateSummary();

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal error during verification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { verifyPaymentFixes };

