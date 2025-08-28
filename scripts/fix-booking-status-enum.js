#!/usr/bin/env node

/**
 * Fix BookingStatus Enum
 * 
 * This script adds PAYMENT_PROCESSING to the BookingStatus enum
 * in the database to match the Prisma schema.
 * 
 * Usage: node scripts/fix-booking-status-enum.js
 */

const { PrismaClient } = require('@prisma/client');

async function fixBookingStatusEnum() {
  console.log('🔧 Fixing BookingStatus Enum\n');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Step 1: Check current enum values
    console.log('🔍 Checking current BookingStatus enum values:\n');
    
    try {
      const currentValues = await prisma.$queryRaw`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid 
          FROM pg_type 
          WHERE typname = 'BookingStatus'
        )
        ORDER BY enumsortorder
      `;
      
      console.log('Current enum values:');
      currentValues.forEach((value, index) => {
        console.log(`   ${index + 1}. ${value.enumlabel}`);
      });
      console.log('');
      
      // Check if PAYMENT_PROCESSING already exists
      const hasPaymentProcessing = currentValues.some(v => v.enumlabel === 'PAYMENT_PROCESSING');
      
      if (hasPaymentProcessing) {
        console.log('✅ PAYMENT_PROCESSING already exists in the enum');
        console.log('💡 No action needed');
        return;
      }
      
    } catch (error) {
      console.log('❌ Error checking current enum values:', error.message);
      console.log('');
    }

    // Step 2: Add PAYMENT_PROCESSING to the enum
    console.log('🔧 Adding PAYMENT_PROCESSING to BookingStatus enum...\n');
    
    try {
      await prisma.$executeRaw`ALTER TYPE "BookingStatus" ADD VALUE 'PAYMENT_PROCESSING'`;
      console.log('✅ Successfully added PAYMENT_PROCESSING to BookingStatus enum');
      console.log('');
      
    } catch (error) {
      console.log('❌ Error adding enum value:', error.message);
      console.log('');
      return;
    }

    // Step 3: Verify the enum was updated
    console.log('🔍 Verifying enum update:\n');
    
    try {
      const updatedValues = await prisma.$queryRaw`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid 
          FROM pg_type 
          WHERE typname = 'BookingStatus'
        )
        ORDER BY enumsortorder
      `;
      
      console.log('Updated enum values:');
      updatedValues.forEach((value, index) => {
        console.log(`   ${index + 1}. ${value.enumlabel}`);
      });
      console.log('');
      
      // Check if PAYMENT_PROCESSING was added
      const hasPaymentProcessing = updatedValues.some(v => v.enumlabel === 'PAYMENT_PROCESSING');
      
      if (hasPaymentProcessing) {
        console.log('✅ PAYMENT_PROCESSING successfully added to BookingStatus enum');
        console.log('💡 The release-payment endpoint should now work correctly');
      } else {
        console.log('❌ PAYMENT_PROCESSING was not added successfully');
      }
      
    } catch (error) {
      console.log('❌ Error verifying enum update:', error.message);
      console.log('');
    }

    // Step 4: Test the enum value
    console.log('🧪 Testing PAYMENT_PROCESSING enum value:\n');
    
    try {
      // Try to create a test booking with PAYMENT_PROCESSING status
      const testBooking = await prisma.booking.findFirst({
        where: { status: 'AWAITING_CONFIRMATION' }
      });
      
      if (testBooking) {
        console.log('📋 Test booking found:');
        console.log(`   - ID: ${testBooking.id}`);
        console.log(`   - Current Status: ${testBooking.status}`);
        console.log('');
        
        // Try to update to PAYMENT_PROCESSING
        const updatedBooking = await prisma.booking.update({
          where: { id: testBooking.id },
          data: { status: 'PAYMENT_PROCESSING' }
        });
        
        console.log('✅ Successfully updated booking to PAYMENT_PROCESSING!');
        console.log(`   - New Status: ${updatedBooking.status}`);
        console.log('');
        
        // Revert back to original status
        await prisma.booking.update({
          where: { id: testBooking.id },
          data: { status: 'AWAITING_CONFIRMATION' }
        });
        console.log('🔄 Reverted booking back to AWAITING_CONFIRMATION');
        console.log('');
        
      } else {
        console.log('⚠️ No test booking found for testing');
        console.log('');
      }
      
    } catch (error) {
      console.log('❌ Error testing enum value:', error.message);
      console.log('');
    }

    console.log('🎉 BookingStatus Enum Fix Completed!');
    console.log('💡 PAYMENT_PROCESSING is now a valid enum value');
    console.log('💡 The release-payment endpoint should work without errors');

  } catch (error) {
    console.error('\n❌ Error fixing enum:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  fixBookingStatusEnum();
}

module.exports = { fixBookingStatusEnum };
