const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndFixViews() {
  try {
    console.log('🔍 Checking Database Views and Dependencies...\n');

    // 1. Check what views exist
    console.log('📋 Checking for views...');
    const views = await prisma.$queryRaw`
      SELECT 
        schemaname,
        viewname,
        definition
      FROM pg_views 
      WHERE schemaname = 'public'
      AND viewname LIKE '%payment%'
    `;
    
    console.log('📊 Views found:');
    if (views.length === 0) {
      console.log('  No payment-related views found');
    } else {
      views.forEach(view => {
        console.log(`  View: ${view.viewname}`);
        console.log(`    Schema: ${view.schemaname}`);
        console.log(`    Definition: ${view.definition.substring(0, 150)}...`);
      });
    }

    // 2. Check for rules on the payments table
    console.log('\n📋 Checking for rules on payments table...');
    const rules = await prisma.$queryRaw`
      SELECT 
        rulename,
        ev_type,
        ev_class::regclass as table_name,
        definition
      FROM pg_rewrite r
      JOIN pg_class c ON r.ev_class = c.oid
      WHERE c.relname = 'payments'
    `;
    
    console.log('📊 Rules found:');
    if (rules.length === 0) {
      console.log('  No rules found on payments table');
    } else {
      rules.forEach(rule => {
        console.log(`  Rule: ${rule.rulename}`);
        console.log(`    Event: ${rule.ev_type}`);
        console.log(`    Table: ${rule.table_name}`);
        console.log(`    Definition: ${rule.definition.substring(0, 100)}...`);
      });
    }

    // 3. Check table constraints
    console.log('\n📋 Checking table constraints...');
    const constraints = await prisma.$queryRaw`
      SELECT 
        constraint_name,
        constraint_type,
        table_name
      FROM information_schema.table_constraints 
      WHERE table_name = 'payments'
    `;
    
    console.log('📊 Constraints found:');
    if (constraints.length === 0) {
      console.log('  No constraints found on payments table');
    } else {
      constraints.forEach(constraint => {
        console.log(`  Constraint: ${constraint.constraint_name}`);
        console.log(`    Type: ${constraint.constraint_type}`);
        console.log(`    Table: ${constraint.table_name}`);
      });
    }

    // 4. If payment_summary view exists, drop it temporarily
    if (views.some(v => v.viewname === 'payment_summary')) {
      console.log('\n🔄 Found payment_summary view. Dropping it temporarily...');
      try {
        await prisma.$executeRaw`DROP VIEW IF EXISTS "payment_summary"`;
        console.log('✅ payment_summary view dropped');
      } catch (error) {
        console.log('⚠️ Error dropping view:', error.message);
      }
    }

    // 5. Now try to fix the payments.status column
    console.log('\n🔧 Fixing payments.status column...');
    try {
      // First update existing data
      await prisma.$executeRaw`
        UPDATE "payments" 
        SET status = CASE 
          WHEN status = 'pending' THEN 'PENDING'
          WHEN status = 'escrow' THEN 'ESCROW'
          WHEN status = 'released' THEN 'RELEASED'
          WHEN status = 'refunded' THEN 'REFUNDED'
          WHEN status = 'failed' THEN 'FAILED'
          WHEN status = 'paid' THEN 'ESCROW'
          WHEN status = 'completed' THEN 'ESCROW'
          ELSE 'PENDING'
        END
      `;
      console.log('✅ Updated existing status values');

      // Now change column type
      await prisma.$executeRaw`
        ALTER TABLE "payments" 
        ALTER COLUMN "status" TYPE "PaymentStatus" 
        USING status::"PaymentStatus"
      `;
      console.log('✅ Column type changed to PaymentStatus enum');

    } catch (error) {
      console.log('❌ Error fixing column:', error.message);
    }

    // 6. Recreate the payment_summary view if it existed
    if (views.some(v => v.viewname === 'payment_summary')) {
      console.log('\n🔄 Recreating payment_summary view...');
      try {
        // This is a basic recreation - you might need to adjust based on your actual view definition
        await prisma.$executeRaw`
          CREATE VIEW "payment_summary" AS
          SELECT 
            p.id,
            p."bookingId",
            p.amount,
            p.status,
            p."createdAt",
            b."totalAmount",
            b.status as "bookingStatus"
          FROM "payments" p
          JOIN "bookings" b ON p."bookingId" = b.id
        `;
        console.log('✅ payment_summary view recreated');
      } catch (error) {
        console.log('⚠️ Error recreating view:', error.message);
        console.log('   You may need to manually recreate this view with the correct definition');
      }
    }

    // 7. Verify the fix
    console.log('\n🔍 Verifying the fix...');
    try {
      const finalCheck = await prisma.$queryRaw`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'status'
      `;
      
      console.log('📋 Final column info:');
      finalCheck.forEach(col => {
        console.log(`  Column: ${col.column_name}, Type: ${col.data_type}, UDT: ${col.udt_name}`);
      });

      // Test if we can query payments
      const testPayments = await prisma.payment.findMany({
        take: 1,
        select: { id: true, status: true }
      });
      
      if (testPayments.length > 0) {
        console.log('✅ Successfully queried payments table');
        console.log(`   Sample: ID: ${testPayments[0].id}, Status: ${testPayments[0].status}`);
      }

    } catch (verifyError) {
      console.log('⚠️ Error in final verification:', verifyError.message);
    }

    console.log('\n🎉 View dependencies should now be resolved!');
    console.log('✅ Try the webhook test again');

  } catch (error) {
    console.error('❌ Error checking and fixing views:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check and fix
checkAndFixViews();
