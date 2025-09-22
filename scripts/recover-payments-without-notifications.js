/**
 * Recover stuck PENDING payments without creating notifications
 * This bypasses the schema issue by skipping notification creation
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres.qdrktzqfeewwcktgltzy:Motebangnakin@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10&pool_timeout=60&connection_limit=5"
    }
  }
});

async function recoverPaymentsWithoutNotifications() {
  console.log('🔄 Recovering stuck payments (without notifications)...');
  
  try {
    const pendingPayments = await prisma.payment.findMany({
      where: { status: 'PENDING' },
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

    console.log(`📊 Found ${pendingPayments.length} stuck PENDING payments`);

    if (pendingPayments.length === 0) {
      console.log('✅ No stuck payments found.');
      return;
    }

    let recoveredCount = 0;
    
    for (const payment of pendingPayments) {
      try {
        console.log(`\n🔍 Processing payment: ${payment.paystackRef}`);
        console.log(`   Amount: ${payment.amount} ZAR`);
        console.log(`   Client: ${payment.booking.client.email}`);
        console.log(`   Provider: ${payment.booking.provider.user.email}`);
        console.log(`   Service: ${payment.booking.service?.name || 'Unknown'}`);

        // Update payment and booking status without notifications
        await prisma.$transaction(async (tx) => {
          // Update payment status to ESCROW
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'ESCROW',
              paidAt: new Date()
            }
          });

          // Update booking status
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'PENDING_EXECUTION' }
          });
        });

        recoveredCount++;
        console.log(`   ✅ Successfully recovered payment: ${payment.paystackRef}`);

      } catch (error) {
        console.log(`   ❌ Failed to recover payment ${payment.paystackRef}: ${error.message}`);
      }
    }

    console.log(`\n📊 Recovery Summary:`);
    console.log(`   ✅ Successfully recovered: ${recoveredCount} payments`);
    console.log(`   ❌ Failed to recover: ${pendingPayments.length - recoveredCount} payments`);

    // Show final status
    const finalStats = await prisma.payment.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    console.log('\n📊 Final payment status distribution:');
    finalStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.status} payments`);
    });

  } catch (error) {
    console.error('❌ Recovery process failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the recovery
recoverPaymentsWithoutNotifications()
  .then(() => {
    console.log('\n🏁 Payment recovery completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Recovery process crashed:', error);
    process.exit(1);
  });
