const { Client } = require('pg');

async function testCompletePaymentFlow() {
  // Get the actual DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please set DATABASE_URL with your database connection string');
    process.exit(1);
  }

  console.log('🔌 Using database URL:', databaseUrl.replace(/:[^:@]*@/, ':***@')); // Hide password in logs

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    }
  });

  try {
    await client.connect();
    console.log('🔌 Connected to Supabase PostgreSQL database');

    console.log('\n🧪 Testing Complete Payment Flow...\n');

    // Step 1: Check database structure
    console.log('📋 Step 1: Checking database structure...');
    
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('payments', 'bookings', 'webhook_events', 'payouts')
      ORDER BY table_name;
    `);

    console.log('✅ Available tables:', tables.rows.map(row => row.table_name).join(', '));

    // Step 2: Check payment statuses
    console.log('\n💰 Step 2: Checking payment statuses...');
    
    const paymentStatuses = await client.query(`
      SELECT status, COUNT(*) as count
      FROM payments
      GROUP BY status
      ORDER BY count DESC;
    `);

    console.log('📊 Payment status distribution:');
    paymentStatuses.rows.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} payments`);
    });

    // Step 3: Check recent payments
    console.log('\n🔍 Step 3: Checking recent payments...');
    
    const recentPayments = await client.query(`
      SELECT 
        p.id,
        p.status,
        p.amount,
        p."escrowAmount",
        p."platformFee",
        p."paystackRef",
        p."createdAt",
        b.status as booking_status,
        b."totalAmount" as booking_total
      FROM payments p
      JOIN bookings b ON p."bookingId" = b.id
      ORDER BY p."createdAt" DESC
      LIMIT 5;
    `);

    console.log('📋 Recent payments:');
    recentPayments.rows.forEach((payment, index) => {
      console.log(`  ${index + 1}. Payment ${payment.id.substring(0, 8)}...`);
      console.log(`     Status: ${payment.status}`);
      console.log(`     Amount: R${payment.amount}`);
      console.log(`     Escrow: R${payment.escrowAmount}`);
      console.log(`     Platform Fee: R${payment.platformFee}`);
      console.log(`     Paystack Ref: ${payment.paystackRef}`);
      console.log(`     Booking Status: ${payment.booking_status}`);
      console.log(`     Created: ${payment.createdAt}`);
      console.log('');
    });

    // Step 4: Check webhook events
    console.log('📨 Step 4: Checking webhook events...');
    
    try {
      const webhookEvents = await client.query(`
        SELECT 
          event_type,
          paystack_ref,
          processed,
          error,
          retry_count,
          created_at
        FROM webhook_events
        ORDER BY created_at DESC
        LIMIT 10;
      `);

      if (webhookEvents.rows.length > 0) {
        console.log('📊 Recent webhook events:');
        webhookEvents.rows.forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.event_type} - ${event.paystack_ref}`);
          console.log(`     Processed: ${event.processed}`);
          console.log(`     Error: ${event.error || 'None'}`);
          console.log(`     Retries: ${event.retry_count}`);
          console.log(`     Created: ${event.created_at}`);
          console.log('');
        });
      } else {
        console.log('ℹ️  No webhook events found yet');
      }
    } catch (error) {
      console.log('⚠️  WebhookEvents table not found or empty');
    }

    // Step 5: Check payouts
    console.log('💸 Step 5: Checking payouts...');
    
    try {
      const payouts = await client.query(`
        SELECT 
          p.id,
          p.status,
          p.amount,
          p."paystackRef",
          p."createdAt",
          pay.status as payment_status
        FROM payouts p
        JOIN payments pay ON p."paymentId" = pay.id
        ORDER BY p."createdAt" DESC
        LIMIT 5;
      `);

      if (payouts.rows.length > 0) {
        console.log('📊 Recent payouts:');
        payouts.rows.forEach((payout, index) => {
          console.log(`  ${index + 1}. Payout ${payout.id.substring(0, 8)}...`);
          console.log(`     Status: ${payout.status}`);
          console.log(`     Amount: R${payout.amount}`);
          console.log(`     Paystack Ref: ${payout.paystackRef}`);
          console.log(`     Payment Status: ${payout.payment_status}`);
          console.log(`     Created: ${payout.createdAt}`);
          console.log('');
        });
      } else {
        console.log('ℹ️  No payouts found yet');
      }
    } catch (error) {
      console.log('⚠️  Payouts table not found or empty');
    }

    // Step 6: Check booking statuses
    console.log('📅 Step 6: Checking booking statuses...');
    
    const bookingStatuses = await client.query(`
      SELECT 
        b.status,
        COUNT(*) as count,
        COUNT(p.id) as with_payment
      FROM bookings b
      LEFT JOIN payments p ON b.id = p."bookingId"
      GROUP BY b.status
      ORDER BY count DESC;
    `);

    console.log('📊 Booking status distribution:');
    bookingStatuses.rows.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} bookings (${row.with_payment} with payments)`);
    });

    // Step 7: Check for potential issues
    console.log('\n🔍 Step 7: Checking for potential issues...');
    
    // Check for payments without bookings
    const orphanedPayments = await client.query(`
      SELECT COUNT(*) as count
      FROM payments p
      LEFT JOIN bookings b ON p."bookingId" = b.id
      WHERE b.id IS NULL;
    `);

    if (orphanedPayments.rows[0].count > 0) {
      console.log(`⚠️  Found ${orphanedPayments.rows[0].count} orphaned payments (no booking)`);
    } else {
      console.log('✅ No orphaned payments found');
    }

    // Check for bookings with multiple payments
    const duplicatePayments = await client.query(`
      SELECT 
        "bookingId",
        COUNT(*) as payment_count
      FROM payments
      GROUP BY "bookingId"
      HAVING COUNT(*) > 1
      ORDER BY payment_count DESC;
    `);

    if (duplicatePayments.rows.length > 0) {
      console.log(`⚠️  Found ${duplicatePayments.rows.length} bookings with multiple payments:`);
      duplicatePayments.rows.forEach(row => {
        console.log(`     Booking ${row.bookingId}: ${row.payment_count} payments`);
      });
    } else {
      console.log('✅ No duplicate payments found');
    }

    // Check for payments in invalid states
    const invalidPayments = await client.query(`
      SELECT 
        p.id,
        p.status,
        b.status as booking_status
      FROM payments p
      JOIN bookings b ON p."bookingId" = b.id
      WHERE 
        (p.status = 'HELD_IN_ESCROW' AND b.status NOT IN ('PENDING_EXECUTION', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED'))
        OR (p.status = 'RELEASED' AND b.status != 'COMPLETED')
        OR (p.status = 'FAILED' AND b.status NOT IN ('CANCELLED', 'DISPUTED'));
    `);

    if (invalidPayments.rows.length > 0) {
      console.log(`⚠️  Found ${invalidPayments.rows.length} payments in potentially invalid states:`);
      invalidPayments.rows.forEach(row => {
        console.log(`     Payment ${row.id}: ${row.status} with booking status ${row.booking_status}`);
      });
    } else {
      console.log('✅ All payments are in valid states');
    }

    console.log('\n🎉 Payment flow test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing payment flow:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  testCompletePaymentFlow()
    .then(() => {
      console.log('\n✅ Complete payment flow test finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Complete payment flow test failed:', error);
      process.exit(1);
    });
}

module.exports = { testCompletePaymentFlow };
