#!/usr/bin/env node

require('dotenv').config();

const { Client } = require('pg');

async function fixNullableFieldsThorough() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('🔧 Starting thorough nullable fields fix...');
    
    await client.connect();
    console.log('✅ Connected to database');
    
    // First, let's see all the data to understand what we're working with
    console.log('📊 Checking all data...');
    
    const allBookings = await client.query(`
      SELECT id, "totalAmount", "platformFee", "createdAt"
      FROM bookings 
      ORDER BY "createdAt" DESC
      LIMIT 20
    `);
    
    console.log('📊 Sample bookings data:');
    allBookings.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ID: ${row.id}, Total: ${row.totalAmount}, Platform Fee: ${row.platformFee}`);
    });
    
    const allPayments = await client.query(`
      SELECT id, "escrowAmount", "platformFee", "createdAt"
      FROM payments 
      ORDER BY "createdAt" DESC
      LIMIT 20
    `);
    
    console.log('\n📊 Sample payments data:');
    allPayments.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ID: ${row.id}, Escrow: ${row.escrowAmount}, Platform Fee: ${row.platformFee}`);
    });
    
    // Check for any remaining null values
    console.log('\n🔍 Checking for remaining null values...');
    
    const nullCheck = await client.query(`
      SELECT 
        'payments.escrowAmount' as table_field, COUNT(*) as null_count
      FROM payments WHERE "escrowAmount" IS NULL
      UNION ALL
      SELECT 'payments.platformFee' as table_field, COUNT(*) as null_count
      FROM payments WHERE "platformFee" IS NULL
      UNION ALL
      SELECT 'bookings.platformFee' as table_field, COUNT(*) as null_count
      FROM bookings WHERE "platformFee" IS NULL
      UNION ALL
      SELECT 'bookings.totalAmount' as table_field, COUNT(*) as null_count
      FROM bookings WHERE "totalAmount" IS NULL
    `);
    
    console.log('📊 Current null values:');
    nullCheck.rows.forEach(row => {
      console.log(`  ${row.table_field}: ${row.null_count}`);
    });
    
    // If there are still null values, fix them
    let totalFixed = 0;
    
    if (nullCheck.rows.some(row => parseInt(row.null_count) > 0)) {
      console.log('\n🔄 Fixing remaining null values...');
      
      // Fix payments
      const paymentsResult = await client.query(`
        UPDATE payments 
        SET 
          "escrowAmount" = COALESCE("escrowAmount", 0.0),
          "platformFee" = COALESCE("platformFee", 0.0)
        WHERE "escrowAmount" IS NULL OR "platformFee" IS NULL
      `);
      totalFixed += paymentsResult.rowCount;
      console.log(`✅ Fixed ${paymentsResult.rowCount} payment records`);
      
      // Fix bookings
      const bookingsResult = await client.query(`
        UPDATE bookings 
        SET 
          "platformFee" = COALESCE("platformFee", 0.0),
          "totalAmount" = COALESCE("totalAmount", 0.0)
        WHERE "platformFee" IS NULL OR "totalAmount" IS NULL
      `);
      totalFixed += bookingsResult.rowCount;
      console.log(`✅ Fixed ${bookingsResult.rowCount} booking records`);
    }
    
    // Final verification
    console.log('\n🔍 Final verification...');
    const finalCheck = await client.query(`
      SELECT 
        'payments.escrowAmount' as table_field, COUNT(*) as null_count
      FROM payments WHERE "escrowAmount" IS NULL
      UNION ALL
      SELECT 'payments.platformFee' as table_field, COUNT(*) as null_count
      FROM payments WHERE "platformFee" IS NULL
      UNION ALL
      SELECT 'bookings.platformFee' as table_field, COUNT(*) as null_count
      FROM bookings WHERE "platformFee" IS NULL
      UNION ALL
      SELECT 'bookings.totalAmount' as table_field, COUNT(*) as null_count
      FROM bookings WHERE "totalAmount" IS NULL
    `);
    
    console.log('📊 Final null values:');
    finalCheck.rows.forEach(row => {
      console.log(`  ${row.table_field}: ${row.null_count}`);
    });
    
    if (totalFixed > 0) {
      console.log(`\n🎉 Fixed ${totalFixed} records with null values!`);
    } else {
      console.log('\n✅ No null values found - database is clean!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the fix
fixNullableFieldsThorough()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
