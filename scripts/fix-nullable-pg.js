#!/usr/bin/env node

require('dotenv').config();

const { Client } = require('pg');

async function fixNullableFields() {
  // Parse DATABASE_URL to get connection details
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('🔧 Starting nullable fields fix with direct PostgreSQL connection...');
    
    await client.connect();
    console.log('✅ Connected to database');
    
    // Check current state
    console.log('📊 Checking current data...');
    
    const checkResult = await client.query(`
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
    checkResult.rows.forEach(row => {
      console.log(`  ${row.table_field}: ${row.null_count}`);
    });
    
    // Fix payments table
    console.log('🔄 Fixing payments table...');
    const paymentsResult = await client.query(`
      UPDATE payments 
      SET 
        "escrowAmount" = COALESCE("escrowAmount", 0.0),
        "platformFee" = COALESCE("platformFee", 0.0)
      WHERE "escrowAmount" IS NULL OR "platformFee" IS NULL
    `);
    console.log(`✅ Updated ${paymentsResult.rowCount} payment records`);
    
    // Fix bookings table
    console.log('🔄 Fixing bookings table...');
    const bookingsResult = await client.query(`
      UPDATE bookings 
      SET 
        "platformFee" = COALESCE("platformFee", 0.0),
        "totalAmount" = COALESCE("totalAmount", 0.0)
      WHERE "platformFee" IS NULL OR "totalAmount" IS NULL
    `);
    console.log(`✅ Updated ${bookingsResult.rowCount} booking records`);
    
    // Verify fixes
    console.log('🔍 Verifying fixes...');
    const verifyResult = await client.query(`
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
    
    console.log('📊 Remaining null values:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.table_field}: ${row.null_count}`);
    });
    
    console.log('🎉 All fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Check if pg is installed
try {
  require('pg');
} catch (error) {
  console.log('📦 Installing pg package...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install pg', { stdio: 'inherit' });
    console.log('✅ pg package installed');
  } catch (installError) {
    console.error('❌ Failed to install pg package:', installError.message);
    process.exit(1);
  }
}

// Run the fix
fixNullableFields()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
