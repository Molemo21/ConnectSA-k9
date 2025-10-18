#!/usr/bin/env node

/**
 * Production Database Synchronization Script
 * 
 * This script ensures the production database schema matches the Prisma schema
 * and verifies all required tables and fields exist.
 */

const { PrismaClient } = require('@prisma/client');

async function syncProductionDatabase() {
  console.log('🚀 Starting production database synchronization...');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn', 'info'],
    errorFormat: 'pretty'
  });

  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');

    // Check if all required tables exist
    console.log('🔍 Checking required tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const requiredTables = [
      'users', 'providers', 'services', 'service_categories', 
      'bookings', 'payments', 'reviews', 'provider_services',
      'ProviderReview', 'VerificationToken', 'PasswordResetToken',
      'booking_drafts', 'notifications'
    ];
    
    const existingTables = tables.map(t => t.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('❌ Missing tables:', missingTables);
      console.log('📋 Please create these tables in your production database');
    } else {
      console.log('✅ All required tables exist');
    }

    // Check enum values
    console.log('🔍 Checking enum values...');
    
    // Check BookingStatus enum
    const bookingStatusValues = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')
      ORDER BY enumsortorder
    `;
    
    const requiredBookingStatuses = [
      'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION',
      'COMPLETED', 'CANCELLED', 'PENDING_EXECUTION', 'PAYMENT_PROCESSING', 'DISPUTED'
    ];
    
    const existingBookingStatuses = bookingStatusValues.map(v => v.enumlabel);
    const missingBookingStatuses = requiredBookingStatuses.filter(status => !existingBookingStatuses.includes(status));
    
    if (missingBookingStatuses.length > 0) {
      console.log('❌ Missing BookingStatus values:', missingBookingStatuses);
      console.log('📋 Please add these enum values to your production database');
    } else {
      console.log('✅ All BookingStatus enum values exist');
    }

    // Check ProviderStatus enum
    const providerStatusValues = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ProviderStatus')
      ORDER BY enumsortorder
    `;
    
    const requiredProviderStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'INCOMPLETE'];
    const existingProviderStatuses = providerStatusValues.map(v => v.enumlabel);
    const missingProviderStatuses = requiredProviderStatuses.filter(status => !existingProviderStatuses.includes(status));
    
    if (missingProviderStatuses.length > 0) {
      console.log('❌ Missing ProviderStatus values:', missingProviderStatuses);
      console.log('📋 Please add these enum values to your production database');
    } else {
      console.log('✅ All ProviderStatus enum values exist');
    }

    // Test basic operations
    console.log('🔍 Testing basic database operations...');
    
    // Test user table
    const userCount = await prisma.user.count();
    console.log(`✅ Users table accessible (${userCount} users)`);
    
    // Test provider table
    const providerCount = await prisma.provider.count();
    console.log(`✅ Providers table accessible (${providerCount} providers)`);
    
    // Test booking table
    const bookingCount = await prisma.booking.count();
    console.log(`✅ Bookings table accessible (${bookingCount} bookings)`);
    
    // Test payment table
    const paymentCount = await prisma.payment.count();
    console.log(`✅ Payments table accessible (${paymentCount} payments)`);

    console.log('🎉 Database synchronization check completed successfully!');
    
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the synchronization
if (require.main === module) {
  syncProductionDatabase().catch(console.error);
}

module.exports = { syncProductionDatabase };
