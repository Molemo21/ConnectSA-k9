/**
 * Script to debug frontend payment synchronization issues
 * This helps identify why the frontend still shows payment required
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres.qdrktzqfeewwcktgltzy:Motebangnakin@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10&pool_timeout=60&connection_limit=5"
    }
  }
});

async function debugFrontendPaymentIssue() {
  console.log('🔍 Debugging frontend payment synchronization issues...\n');
  
  try {
    // Get all payments with their booking details
    const payments = await prisma.payment.findMany({
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

    console.log(`📊 Found ${payments.length} payments in database:\n`);

    // Group by client to see which user might be having issues
    const paymentsByClient = payments.reduce((acc, payment) => {
      const clientEmail = payment.booking.client.email;
      if (!acc[clientEmail]) {
        acc[clientEmail] = [];
      }
      acc[clientEmail].push(payment);
      return acc;
    }, {});

    Object.entries(paymentsByClient).forEach(([clientEmail, clientPayments]) => {
      console.log(`👤 Client: ${clientEmail}`);
      console.log(`   Total Payments: ${clientPayments.length}`);
      
      clientPayments.forEach((payment, index) => {
        const isRecent = (Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24) < 7;
        const statusIcon = payment.status === 'ESCROW' ? '✅' : 
                          payment.status === 'RELEASED' ? '🎉' : 
                          payment.status === 'PENDING' ? '⏳' : '❌';
        
        console.log(`   ${index + 1}. ${statusIcon} ${payment.status} - ${payment.amount} ZAR`);
        console.log(`      Booking: ${payment.booking.id} (${payment.booking.status})`);
        console.log(`      Service: ${payment.booking.service?.name || 'Unknown'}`);
        console.log(`      Date: ${payment.createdAt.toLocaleDateString()} ${isRecent ? '(Recent)' : '(Older)'}`);
        console.log(`      Reference: ${payment.paystackRef}`);
        console.log('');
      });
    });

    // Check for potential frontend issues
    console.log('🔍 Potential Frontend Issues:\n');

    // 1. Check for payments that should show as paid but might appear as unpaid
    const escrowPayments = payments.filter(p => p.status === 'ESCROW');
    if (escrowPayments.length > 0) {
      console.log(`1. ✅ ${escrowPayments.length} payments are in ESCROW status (should show as paid)`);
      console.log('   These payments should NOT require additional payment from the frontend');
      console.log('');
    }

    // 2. Check for any PENDING payments that might be stuck
    const pendingPayments = payments.filter(p => p.status === 'PENDING');
    if (pendingPayments.length > 0) {
      console.log(`2. ⚠️  ${pendingPayments.length} payments are still PENDING`);
      console.log('   These payments might still show as requiring payment');
      pendingPayments.forEach(payment => {
        const hoursStuck = (Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60);
        console.log(`   - ${payment.paystackRef}: Stuck for ${hoursStuck.toFixed(1)} hours`);
      });
      console.log('');
    }

    // 3. Check for booking status mismatches
    const mismatchedBookings = payments.filter(p => 
      p.status === 'ESCROW' && p.booking.status !== 'PENDING_EXECUTION'
    );
    if (mismatchedBookings.length > 0) {
      console.log(`3. 🔄 ${mismatchedBookings.length} payments have booking status mismatches`);
      console.log('   These might cause frontend confusion');
      mismatchedBookings.forEach(payment => {
        console.log(`   - Payment ${payment.status} but Booking ${payment.booking.status}`);
      });
      console.log('');
    }

    // 4. Check for very recent payments that might not have propagated
    const veryRecentPayments = payments.filter(p => 
      (Date.now() - p.updatedAt.getTime()) / (1000 * 60) < 5
    );
    if (veryRecentPayments.length > 0) {
      console.log(`4. 🆕 ${veryRecentPayments.length} payments were updated in the last 5 minutes`);
      console.log('   These might not have propagated to the frontend yet');
      console.log('');
    }

    // Frontend troubleshooting steps
    console.log('🛠️  Frontend Troubleshooting Steps:\n');
    console.log('1. **Clear Browser Cache**:');
    console.log('   - Press Ctrl+Shift+R (or Cmd+Shift+R on Mac) to hard refresh');
    console.log('   - Or go to browser settings and clear cache/cookies');
    console.log('');
    
    console.log('2. **Check Specific Booking**:');
    console.log('   - Identify which specific booking is showing payment required');
    console.log('   - Check if the booking ID matches one of the payments above');
    console.log('');
    
    console.log('3. **Force Refresh Payment Status**:');
    console.log('   - Look for a "Check Status" or "Refresh" button on the payment');
    console.log('   - Or try logging out and logging back in');
    console.log('');
    
    console.log('4. **Check Browser Console**:');
    console.log('   - Open browser developer tools (F12)');
    console.log('   - Check for any JavaScript errors');
    console.log('   - Look for failed API calls');
    console.log('');
    
    console.log('5. **API Testing**:');
    console.log('   - Test the payment verification endpoint directly');
    console.log('   - Use the payment reference to verify status');

  } catch (error) {
    console.error('❌ Error debugging frontend payment issue:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugFrontendPaymentIssue()
  .then(() => {
    console.log('\n🏁 Frontend payment debugging completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Debugging failed:', error);
    process.exit(1);
  });
