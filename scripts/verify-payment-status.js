/**
 * Script to verify payment status and help with frontend synchronization
 * This can be used to manually check and update payment status
 */

const { PrismaClient } = require('@prisma/client');

// Safety check: Require DATABASE_URL from environment
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is required');
  console.error('   Please set DATABASE_URL in your .env file or environment');
  console.error('   Example: DATABASE_URL="postgresql://user:pass@host:port/db"');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function verifyPaymentStatus() {
  console.log('🔍 Verifying payment status and frontend synchronization...\n');
  
  try {
    // Get all recent payments
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
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
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log(`📊 Found ${payments.length} recent payments:\n`);

    payments.forEach((payment, index) => {
      console.log(`${index + 1}. Payment ID: ${payment.id}`);
      console.log(`   Reference: ${payment.paystackRef}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Amount: ${payment.amount} ZAR`);
      console.log(`   Client: ${payment.booking.client.email}`);
      console.log(`   Provider: ${payment.booking.provider.user.email}`);
      console.log(`   Service: ${payment.booking.service?.name || 'Unknown'}`);
      console.log(`   Booking Status: ${payment.booking.status}`);
      console.log(`   Created: ${payment.createdAt.toISOString()}`);
      console.log(`   Updated: ${payment.updatedAt.toISOString()}`);
      console.log('');
    });

    // Check for any inconsistencies
    console.log('🔍 Checking for inconsistencies...\n');
    
    const inconsistencies = [];
    
    payments.forEach(payment => {
      // Check if payment is in ESCROW but booking is not PENDING_EXECUTION
      if (payment.status === 'ESCROW' && payment.booking.status !== 'PENDING_EXECUTION') {
        inconsistencies.push({
          type: 'booking_status_mismatch',
          payment: payment.id,
          paymentStatus: payment.status,
          bookingStatus: payment.booking.status,
          issue: `Payment is ESCROW but booking is ${payment.booking.status}`
        });
      }
      
      // Check if payment is PENDING for too long (more than 1 hour)
      if (payment.status === 'PENDING') {
        const hoursSinceCreated = (Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreated > 1) {
          inconsistencies.push({
            type: 'stuck_pending',
            payment: payment.id,
            hoursStuck: hoursSinceCreated.toFixed(2),
            issue: `Payment stuck in PENDING for ${hoursSinceCreated.toFixed(2)} hours`
          });
        }
      }
    });

    if (inconsistencies.length > 0) {
      console.log(`⚠️  Found ${inconsistencies.length} inconsistencies:\n`);
      inconsistencies.forEach((inc, index) => {
        console.log(`${index + 1}. ${inc.issue}`);
        console.log(`   Payment ID: ${inc.payment}`);
        if (inc.paymentStatus) console.log(`   Payment Status: ${inc.paymentStatus}`);
        if (inc.bookingStatus) console.log(`   Booking Status: ${inc.bookingStatus}`);
        if (inc.hoursStuck) console.log(`   Hours Stuck: ${inc.hoursStuck}`);
        console.log('');
      });
    } else {
      console.log('✅ No inconsistencies found!');
    }

    // Summary
    const statusCounts = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Payment Status Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} payments`);
    });

    console.log('\n💡 Frontend Synchronization Tips:');
    console.log('   1. Clear browser cache and refresh the page');
    console.log('   2. Check if the frontend is polling for updates correctly');
    console.log('   3. Verify that the API endpoints are returning updated data');
    console.log('   4. Check browser console for any JavaScript errors');
    console.log('   5. Try logging out and logging back in to refresh session data');

  } catch (error) {
    console.error('❌ Error verifying payment status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyPaymentStatus()
  .then(() => {
    console.log('\n🏁 Payment status verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });
