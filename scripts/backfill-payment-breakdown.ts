/**
 * Backfill Payment Breakdown Script
 * 
 * This script calculates and saves escrowAmount and platformFee for existing payments
 * that don't have these values set.
 * 
 * Usage: npx tsx scripts/backfill-payment-breakdown.ts
 */

import { prisma } from '@/lib/prisma';
import { paymentProcessor } from '@/lib/paystack';

async function backfillPaymentBreakdown() {
  console.log('🔄 Starting payment breakdown backfill...');

  try {
    // Find payments missing escrowAmount or platformFee
    const payments = await prisma.payment.findMany({
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
        bookingId: true,
        status: true,
      }
    });

    console.log(`📊 Found ${payments.length} payments to backfill`);

    if (payments.length === 0) {
      console.log('✅ No payments need backfilling. All payments have breakdown data.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const payment of payments) {
      try {
        // Calculate breakdown
        const breakdown = paymentProcessor.calculatePaymentBreakdown(payment.amount);
        
        // Update payment with calculated values
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            escrowAmount: breakdown.escrowAmount,
            platformFee: breakdown.platformFee,
          }
        });
        
        successCount++;
        console.log(`✅ Updated payment ${payment.id}:`, {
          amount: payment.amount,
          escrowAmount: breakdown.escrowAmount,
          platformFee: breakdown.platformFee
        });
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to update payment ${payment.id}:`, error);
      }
    }

    console.log('\n📊 Backfill Summary:');
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total processed: ${payments.length}`);

    if (errorCount > 0) {
      console.log('\n⚠️ Some payments failed to update. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ Backfill completed successfully!');
    }

  } catch (error) {
    console.error('❌ Fatal error during backfill:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  backfillPaymentBreakdown()
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { backfillPaymentBreakdown };

