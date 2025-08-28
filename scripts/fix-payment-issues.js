const { PrismaClient } = require('@prisma/client');

let prisma;

async function fixPaymentIssues() {
  try {
    console.log('🔧 Fixing Payment System Issues...\n');

    // Initialize Prisma with connection retry
    try {
      prisma = new PrismaClient();
      await prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      console.log('💡 This might be due to a Prisma connection issue');
      console.log('💡 Try restarting your development server');
      return;
    }

    // Step 1: Check current payment state
    console.log('\n📊 Step 1: Analyzing current payment state...');
    
    let payments;
    try {
      payments = await prisma.payment.findMany({
        include: {
          booking: {
            include: {
              service: true
            }
          }
        }
      });
    } catch (queryError) {
      console.error('❌ Error querying payments:', queryError.message);
      if (queryError.message.includes('prepared statement')) {
        console.log('💡 This is a known Prisma issue. Try:');
        console.log('   1. Restart your development server');
        console.log('   2. Run: npx prisma generate');
        console.log('   3. Run: npx prisma db push');
      }
      return;
    }

    console.log(`Found ${payments.length} payments in the system`);

    // Step 2: Fix null escrow and platform fee values
    console.log('\n🔧 Step 2: Fixing null escrow and platform fee values...');
    
    let fixedCount = 0;
    for (const payment of payments) {
      if (payment.escrowAmount === null || payment.platformFee === null) {
        console.log(`Fixing payment ${payment.id}...`);
        
        // Calculate correct values (10% platform fee, 90% escrow)
        const platformFee = Math.round(payment.amount * 0.1 * 100) / 100;
        const escrowAmount = Math.round((payment.amount - platformFee) * 100) / 100;
        
        try {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              escrowAmount: escrowAmount,
              platformFee: platformFee,
              currency: 'ZAR' // Ensure currency is set
            }
          });
          
          console.log(`  ✅ Fixed: escrowAmount=${escrowAmount}, platformFee=${platformFee}`);
          fixedCount++;
        } catch (updateError) {
          console.error(`  ❌ Failed to update payment ${payment.id}:`, updateError.message);
        }
      }
    }
    
    console.log(`Fixed ${fixedCount} payments with null values`);

    // Step 3: Check webhook events
    console.log('\n📨 Step 3: Checking webhook events...');
    
    let webhookEvents;
    try {
      webhookEvents = await prisma.webhookEvent.findMany();
    } catch (webhookError) {
      console.error('❌ Error querying webhook events:', webhookError.message);
      webhookEvents = [];
    }
    
    console.log(`Found ${webhookEvents.length} webhook events`);
    
    if (webhookEvents.length === 0) {
      console.log('❌ No webhook events found - this explains why payments are stuck!');
      console.log('💡 You need to configure Paystack webhooks properly');
    }

    // Step 4: Process pending payments manually (simulate webhook processing)
    console.log('\n🔄 Step 4: Processing pending payments manually...');
    
    const pendingPayments = payments.filter(p => p.status === 'PENDING');
    console.log(`Found ${pendingPayments.length} payments in PENDING status`);
    
    if (pendingPayments.length > 0) {
      console.log('⚠️  WARNING: These payments are stuck because webhooks are not working!');
      console.log('💡 To fix this permanently, you need to:');
      console.log('   1. Configure Paystack webhook URL in your dashboard');
      console.log('   2. Set the correct webhook secret in your environment');
      console.log('   3. Ensure your webhook endpoint is publicly accessible');
      
      // Optionally, we can manually update some payments to simulate webhook processing
      // This is for testing purposes only
      const simulateWebhook = process.argv.includes('--simulate-webhook');
      
      if (simulateWebhook) {
        console.log('\n🧪 Simulating webhook processing for testing...');
        
        for (const payment of pendingPayments.slice(0, 3)) { // Only process first 3 for safety
          console.log(`Simulating successful payment for ${payment.id}...`);
          
          try {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'HELD_IN_ESCROW',
                paidAt: new Date()
              }
            });
            
            await prisma.booking.update({
              where: { id: payment.bookingId },
              data: {
                status: 'PENDING_EXECUTION'
              }
            });
            
            console.log(`  ✅ Updated payment ${payment.id} to HELD_IN_ESCROW`);
          } catch (simulateError) {
            console.error(`  ❌ Failed to simulate webhook for ${payment.id}:`, simulateError.message);
          }
        }
      }
    }

    // Step 5: Create missing webhook event records for audit
    console.log('\n📝 Step 5: Creating audit records for existing payments...');
    
    let auditCount = 0;
    for (const payment of payments) {
      try {
        // Check if webhook event exists for this payment
        const existingEvent = await prisma.webhookEvent.findFirst({
          where: { paystackRef: payment.paystackRef }
        });
        
        if (!existingEvent) {
          // Create a placeholder webhook event for audit purposes
          await prisma.webhookEvent.create({
            data: {
              eventType: 'manual.audit',
              paystackRef: payment.paystackRef,
              payload: {
                paymentId: payment.id,
                amount: payment.amount,
                status: payment.status,
                note: 'Created during manual audit - webhook not received'
              },
              processed: true,
              processedAt: new Date(),
              error: 'Webhook not received - manual intervention required'
            }
          });
          
          console.log(`  📝 Created audit record for payment ${payment.id}`);
          auditCount++;
        }
      } catch (auditError) {
        console.error(`  ❌ Failed to create audit record for ${payment.id}:`, auditError.message);
      }
    }
    
    console.log(`Created ${auditCount} audit records`);

    // Step 6: Summary and recommendations
    console.log('\n📋 Step 6: Summary and Recommendations...');
    
    let finalPayments;
    try {
      finalPayments = await prisma.payment.findMany();
    } catch (finalError) {
      console.error('❌ Error getting final payment count:', finalError.message);
      finalPayments = payments; // Use the payments we already have
    }
    
    const finalPending = finalPayments.filter(p => p.status === 'PENDING');
    const finalEscrow = finalPayments.filter(p => p.status === 'HELD_IN_ESCROW');
    
    console.log('\n📊 Final Payment Status:');
    console.log(`  Total Payments: ${finalPayments.length}`);
    console.log(`  PENDING: ${finalPending.length}`);
    console.log(`  HELD_IN_ESCROW: ${finalEscrow.length}`);
    console.log(`  Other Statuses: ${finalPayments.length - finalPending.length - finalEscrow.length}`);
    
    console.log('\n🚨 CRITICAL ISSUES TO RESOLVE:');
    console.log('1. Configure Paystack webhook URL in your dashboard');
    console.log('2. Set PAYSTACK_WEBHOOK_SECRET in your environment (should start with whsec_)');
    console.log('3. Ensure your webhook endpoint is publicly accessible');
    console.log('4. Test webhook delivery with Paystack test mode');
    
    console.log('\n💡 IMMEDIATE ACTIONS:');
    console.log('1. Check your .env file for PAYSTACK_WEBHOOK_SECRET');
    console.log('2. Verify webhook URL in Paystack dashboard');
    console.log('3. Test webhook endpoint with a tool like ngrok for local development');
    console.log('4. Monitor webhook events in your application logs');

  } catch (error) {
    console.error('❌ Error fixing payment issues:', error);
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect();
        console.log('\n✅ Database disconnected');
      } catch (disconnectError) {
        console.error('❌ Error disconnecting from database:', disconnectError.message);
      }
    }
  }
}

// Check if --simulate-webhook flag is passed
const simulateWebhook = process.argv.includes('--simulate-webhook');
if (simulateWebhook) {
  console.log('🧪 SIMULATION MODE: Will simulate webhook processing for testing');
}

fixPaymentIssues();
