#!/usr/bin/env node

/**
 * Check what booking statuses exist in production database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.qdrktzqfeewwcktgltzy:Motebangnakin@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10&pool_timeout=60&connection_limit=5"
    }
  }
});

async function main() {
  try {
    console.log('🔍 Connecting to production database...\n');
    await prisma.$connect();
    console.log('✅ Connected!\n');

    // Check actual booking statuses in the database
    console.log('📊 Checking booking statuses in database...\n');
    const statusResult = await prisma.$queryRaw`
      SELECT status::text, COUNT(*) as count
      FROM bookings
      GROUP BY status
      ORDER BY status;
    `;

    console.log('Booking statuses found in database:');
    console.log('===================================');
    statusResult.forEach(row => {
      console.log(`  ${row.status.padEnd(25)} - ${row.count} bookings`);
    });
    console.log('');

    // Check the BookingStatus enum definition in database
    console.log('📋 Checking BookingStatus enum definition in database...\n');
    const enumResult = await prisma.$queryRaw`
      SELECT e.enumlabel as value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'BookingStatus'
      ORDER BY e.enumsortorder;
    `;

    console.log('BookingStatus enum values defined in database:');
    console.log('==============================================');
    enumResult.forEach(row => {
      console.log(`  - ${row.value}`);
    });
    console.log('');

    // Compare
    const dbEnumValues = new Set(enumResult.map(r => r.value));
    const actualStatuses = new Set(statusResult.map(r => r.status));

    const extraInDb = [...actualStatuses].filter(s => !dbEnumValues.has(s));
    const missingFromDb = [...dbEnumValues].filter(s => !actualStatuses.has(s));

    if (extraInDb.length > 0) {
      console.log('❌ PROBLEM: Bookings have statuses NOT in the enum:');
      extraInDb.forEach(status => {
        const count = statusResult.find(r => r.status === status)?.count || 0;
        console.log(`   - "${status}" (${count} bookings)`);
      });
      console.log('');
      console.log('💡 Solution: Add these to BookingStatus enum in schema.prisma:');
      extraInDb.forEach(status => {
        console.log(`   ${status}`);
      });
    }

    if (missingFromDb.length > 0) {
      console.log('\nℹ️ Enum values not currently used by any bookings:');
      missingFromDb.forEach(status => {
        console.log(`   - ${status}`);
      });
      console.log('');
    }

    if (extraInDb.length === 0) {
      console.log('✅ All booking statuses match the enum definition!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

main();

