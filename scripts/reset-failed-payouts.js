require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetFailedPayouts() {
  console.log('🔄 RESETTING FAILED PAYOUTS');
  console.log('============================');

  try {
    // Find all failed payouts
    const failedPayouts = await prisma.payout.findMany({
      where: {
        status: 'FAILED'
      },
      include: {
        payment: {
          include: {
            booking: {
              include: {
                provider: true,
                client: true,
                service: true
              }
            }
          }
        }
      }
    });

    console.log(`\n📋 Found ${failedPayouts.length} failed payouts:`);
    
    for (const payout of failedPayouts) {
      console.log(`\n--- Payout ${payout.id} ---`);
      console.log(`Booking: ${payout.payment.booking.id}`);
      console.log(`Service: ${payout.payment.booking.service?.name}`);
      console.log(`Client: ${payout.payment.booking.client?.name}`);
      console.log(`Provider: ${payout.payment.booking.provider?.businessName}`);
      console.log(`Amount: R${payout.amount}`);
      console.log(`Status: ${payout.status}`);
      console.log(`Created: ${payout.createdAt}`);
      console.log(`Updated: ${payout.updatedAt}`);
      
      // Reset the payout to PENDING so it can be retried
      const updatedPayout = await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'PENDING',
          transferCode: null, // Clear the failed transfer code
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Reset payout ${payout.id} to PENDING`);
      
      // Also reset the payment status if it's stuck in PROCESSING_RELEASE
      if (payout.payment.status === 'PROCESSING_RELEASE') {
        await prisma.payment.update({
          where: { id: payout.payment.id },
          data: {
            status: 'ESCROW',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Reset payment ${payout.payment.id} to ESCROW`);
      }
      
      // Reset booking status if it's stuck in PAYMENT_PROCESSING
      if (payout.payment.booking.status === 'PAYMENT_PROCESSING') {
        await prisma.booking.update({
          where: { id: payout.payment.booking.id },
          data: {
            status: 'AWAITING_CONFIRMATION',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Reset booking ${payout.payment.booking.id} to AWAITING_CONFIRMATION`);
      }
    }

    console.log(`\n🎉 Successfully reset ${failedPayouts.length} failed payouts`);
    console.log('These payouts can now be retried when the client clicks "Confirm Completion"');

  } catch (error) {
    console.error('❌ Error resetting failed payouts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetFailedPayouts();
