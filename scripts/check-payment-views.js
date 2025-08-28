const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPaymentViews() {
  try {
    console.log('🔍 Checking Payment Views and Dependencies...\n');

    // Check what views exist
    console.log('📋 Checking for views...');
    try {
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
      views.forEach(view => {
        console.log(`  View: ${view.viewname}`);
        console.log(`    Schema: ${view.schemaname}`);
        console.log(`    Definition: ${view.definition.substring(0, 100)}...`);
      });

      if (views.length === 0) {
        console.log('  No payment-related views found');
      }
    } catch (error) {
      console.log('⚠️ Error checking views:', error.message);
    }

    // Check for rules on the payments table
    console.log('\n📋 Checking for rules on payments table...');
    try {
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
      rules.forEach(rule => {
        console.log(`  Rule: ${rule.rulename}`);
        console.log(`    Event: ${rule.ev_type}`);
        console.log(`    Table: ${rule.table_name}`);
        console.log(`    Definition: ${rule.definition.substring(0, 100)}...`);
      });

      if (rules.length === 0) {
        console.log('  No rules found on payments table');
      }
    } catch (error) {
      console.log('⚠️ Error checking rules:', error.message);
    }

    // Check for triggers on the payments table
    console.log('\n📋 Checking for triggers on payments table...');
    try {
      const triggers = await prisma.$queryRaw`
        SELECT 
          trigger_name,
          event_manipulation,
          action_statement
        FROM information_schema.triggers 
        WHERE event_object_table = 'payments'
      `;
      
      console.log('📊 Triggers found:');
      triggers.forEach(trigger => {
        console.log(`  Trigger: ${trigger.trigger_name}`);
        console.log(`    Event: ${trigger.event_manipulation}`);
        console.log(`    Action: ${trigger.action_statement.substring(0, 100)}...`);
      });

      if (triggers.length === 0) {
        console.log('  No triggers found on payments table');
      }
    } catch (error) {
      console.log('⚠️ Error checking triggers:', error.message);
    }

    // Check table constraints
    console.log('\n📋 Checking table constraints...');
    try {
      const constraints = await prisma.$queryRaw`
        SELECT 
          constraint_name,
          constraint_type,
          table_name
        FROM information_schema.table_constraints 
        WHERE table_name = 'payments'
      `;
      
      console.log('📊 Constraints found:');
      constraints.forEach(constraint => {
        console.log(`  Constraint: ${constraint.constraint_name}`);
        console.log(`    Type: ${constraint.constraint_type}`);
        console.log(`    Table: ${constraint.table_name}`);
      });
    } catch (error) {
      console.log('⚠️ Error checking constraints:', error.message);
    }

    console.log('\n🔍 Analysis complete!');

  } catch (error) {
    console.error('❌ Error checking payment views:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkPaymentViews();
