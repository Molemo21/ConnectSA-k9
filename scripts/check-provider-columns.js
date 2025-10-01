#!/usr/bin/env node

/**
 * Check what columns actually exist in the providers table
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking providers table structure...\n');
  
  try {
    // Query the information schema to see actual columns
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'providers'
      ORDER BY ordinal_position;
    `;
    
    console.log('✅ Actual columns in providers table:');
    console.log('=====================================\n');
    
    columns.forEach((col) => {
      console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(25)} | ${col.is_nullable}`);
    });
    
    console.log('\n=====================================');
    console.log(`Total: ${columns.length} columns\n`);
    
    // Check if verificationStatus exists
    const hasVerificationStatus = columns.some(col => col.column_name === 'verificationStatus');
    
    if (hasVerificationStatus) {
      console.log('✅ verificationStatus column EXISTS in database');
    } else {
      console.log('❌ verificationStatus column DOES NOT EXIST in database');
      console.log('   This is causing the internal server error!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

