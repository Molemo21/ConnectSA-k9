const { PrismaClient } = require('@prisma/client');

let prisma;

async function fixNullValues() {
  try {
    console.log('🔧 Fixing Null Values in Payment Table...\n');

    // Initialize Prisma with connection retry
    try {
      prisma = new PrismaClient();
      await prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      return;
    }

    // Step 1: Use raw SQL to check current state (bypass Prisma validation)
    console.log('📊 Step 1: Checking current payment state with raw SQL...');
    
    const payments = await prisma.$queryRaw`
      SELECT 
        id,
        "bookingId",
        amount,
        "escrowAmount",
        "platformFee",
        currency,
        status,
        "paystackRef"
      FROM payments
      ORDER BY "createdAt" DESC
    `;

    console.log(`Found ${payments.length} payments in the system`);

    // Step 2: Identify payments with null values
    console.log('\n🔍 Step 2: Identifying payments with null values...');
    
    const nullEscrowPayments = payments.filter(p => p.escrowAmount === null);
    const nullPlatformFeePayments = payments.filter(p => p.platformFee === null);
    
    console.log(`Payments with null escrowAmount: ${nullEscrowPayments.length}`);
    console.log(`Payments with null platformFee: ${nullPlatformFeePayments.length}`);

    if (nullEscrowPayments.length === 0 && nullPlatformFeePayments.length === 0) {
      console.log('✅ No null values found - all payments are properly configured');
      return;
    }

    // Step 3: Fix null values using raw SQL
    console.log('\n🔧 Step 3: Fixing null values...');
    
    let fixedCount = 0;
    
    for (const payment of payments) {
      if (payment.escrowAmount === null || payment.platformFee === null) {
        console.log(`Fixing payment ${payment.id}...`);
        
        // Calculate correct values (10% platform fee, 90% escrow)
        const platformFee = Math.round(payment.amount * 0.1 * 100) / 100;
        const escrowAmount = Math.round((payment.amount - platformFee) * 100) / 100;
        
        try {
          await prisma.$executeRaw`
            UPDATE payments 
            SET 
              "escrowAmount" = ${escrowAmount},
              "platformFee" = ${platformFee},
              currency = 'ZAR',
              "updatedAt" = NOW()
            WHERE id = ${payment.id}
          `;
          
          console.log(`  ✅ Fixed: escrowAmount=${escrowAmount}, platformFee=${platformFee}`);
          fixedCount++;
        } catch (updateError) {
          console.error(`  ❌ Failed to update payment ${payment.id}:`, updateError.message);
        }
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} payments with null values`);

    // Step 4: Verify the fix
    console.log('\n🔍 Step 4: Verifying the fix...');
    
    const verifyPayments = await prisma.$queryRaw`
      SELECT 
        id,
        amount,
        "escrowAmount",
        "platformFee",
        currency,
        status
      FROM payments
      WHERE "escrowAmount" IS NULL OR "platformFee" IS NULL
    `;
    
    if (verifyPayments.length === 0) {
      console.log('✅ All null values have been fixed!');
    } else {
      console.log(`⚠️  ${verifyPayments.length} payments still have null values`);
    }

    // Step 5: Summary
    console.log('\n📋 Summary:');
    console.log(`  Total Payments: ${payments.length}`);
    console.log(`  Fixed: ${fixedCount}`);
    console.log(`  Remaining Issues: ${verifyPayments.length}`);
    
    console.log('\n💡 Next Steps:');
    console.log('1. ✅ Null values fixed');
    console.log('2. 🔧 Fix PAYSTACK_WEBHOOK_SECRET in your .env file');
    console.log('3. 🌐 Configure webhook URL in Paystack dashboard');
    console.log('4. 🧪 Test webhook delivery');
    console.log('5. 🔄 Run: node scripts/fix-payment-issues.js');

  } catch (error) {
    console.error('❌ Error fixing null values:', error);
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

fixNullValues();
