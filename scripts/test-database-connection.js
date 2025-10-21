#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests Supabase connection with proper configuration
 */

const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  // Create Prisma client with optimized settings for Supabase
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Test basic connection
    console.log('📡 Testing basic connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Basic connection successful:', result);

    // Test table access
    console.log('📊 Testing table access...');
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible, count: ${userCount}`);

    const providerCount = await prisma.provider.count();
    console.log(`✅ Provider table accessible, count: ${providerCount}`);

    const bookingCount = await prisma.booking.count();
    console.log(`✅ Booking table accessible, count: ${bookingCount}`);

    // Test if catalogue_items table exists
    console.log('🔍 Checking if catalogue_items table exists...');
    try {
      const catalogueCount = await prisma.catalogueItem.count();
      console.log(`✅ Catalogue items table exists, count: ${catalogueCount}`);
    } catch (error) {
      console.log('ℹ️ Catalogue items table does not exist yet (expected for new migration)');
    }

    console.log('🎉 All database tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
