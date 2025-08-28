#!/usr/bin/env node

/**
 * Add Provider Bank Fields
 * 
 * This script adds bank details fields to the providers table
 * to support Paystack transfers.
 * 
 * Usage: node scripts/add-provider-bank-fields.js
 */

const { PrismaClient } = require('@prisma/client');

async function addProviderBankFields() {
  console.log('🔧 Adding Provider Bank Fields\n');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check if columns already exist
    console.log('🔍 Checking current providers table structure:\n');
    
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'providers'
        AND column_name IN ('bankName', 'bankCode', 'accountNumber', 'accountName', 'recipient_code')
        ORDER BY column_name
      `;

      if (tableInfo.length > 0) {
        console.log('Existing bank-related columns:');
        tableInfo.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
        console.log('');
      } else {
        console.log('No bank-related columns found');
        console.log('');
      }
    } catch (error) {
      console.log('❌ Error checking table structure:', error.message);
      console.log('');
    }

    // Add bank details columns
    console.log('🔧 Adding bank details columns to providers table...\n');
    
    try {
      // Add bankName column
      await prisma.$executeRaw`ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "bankName" TEXT`;
      console.log('✅ Added bankName column');
      
      // Add bankCode column
      await prisma.$executeRaw`ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "bankCode" TEXT`;
      console.log('✅ Added bankCode column');
      
      // Add accountNumber column
      await prisma.$executeRaw`ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "accountNumber" TEXT`;
      console.log('✅ Added accountNumber column');
      
      // Add accountName column
      await prisma.$executeRaw`ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "accountName" TEXT`;
      console.log('✅ Added accountName column');
      
      // Add recipient_code column (if not exists)
      await prisma.$executeRaw`ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "recipient_code" TEXT`;
      console.log('✅ Added recipient_code column');
      
      console.log('');
      
    } catch (error) {
      console.log('❌ Error adding columns:', error.message);
      console.log('');
      return;
    }

    // Verify the columns were added
    console.log('🔍 Verifying column addition:\n');
    
    try {
      const updatedTableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'providers'
        AND column_name IN ('bankName', 'bankCode', 'accountNumber', 'accountName', 'recipient_code')
        ORDER BY column_name
      `;

      if (updatedTableInfo.length > 0) {
        console.log('Updated providers table structure:');
        updatedTableInfo.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
        console.log('');
      }
    } catch (error) {
      console.log('❌ Error verifying table structure:', error.message);
      console.log('');
    }

    // Test updating a provider with bank details
    console.log('🧪 Testing provider update with bank details:\n');
    
    try {
      // Get a sample provider
      const sampleProvider = await prisma.provider.findFirst();
      
      if (sampleProvider) {
        console.log('📋 Sample provider found:');
        console.log(`   - ID: ${sampleProvider.id}`);
        console.log(`   - Business Name: ${sampleProvider.businessName || 'Not set'}`);
        console.log('');

        // Update with test bank details
        const updatedProvider = await prisma.provider.update({
          where: { id: sampleProvider.id },
          data: {
            bankName: 'Test Bank',
            bankCode: 'TEST001',
            accountNumber: '1234567890',
            accountName: 'Test Account',
            recipientCode: null // Will be set when creating transfer recipient
          }
        });
        
        console.log('✅ Successfully updated provider with bank details:');
        console.log(`   - Bank Name: ${updatedProvider.bankName}`);
        console.log(`   - Bank Code: ${updatedProvider.bankCode}`);
        console.log(`   - Account Number: ${updatedProvider.accountNumber}`);
        console.log(`   - Account Name: ${updatedProvider.accountName}`);
        console.log(`   - Recipient Code: ${updatedProvider.recipientCode || 'Not set'}`);
        console.log('');
        
        // Revert test data
        await prisma.provider.update({
          where: { id: sampleProvider.id },
          data: {
            bankName: null,
            bankCode: null,
            accountNumber: null,
            accountName: null,
            recipientCode: null
          }
        });
        console.log('🔄 Reverted test bank details');
        console.log('');
        
      } else {
        console.log('⚠️ No providers found for testing');
        console.log('');
      }
      
    } catch (error) {
      console.log('❌ Error testing provider update:', error.message);
      console.log('');
    }

    console.log('🎉 Provider Bank Fields Addition Completed!');
    console.log('💡 The providers table now supports bank details for Paystack transfers');
    console.log('💡 Providers can now store their bank information and recipient codes');

  } catch (error) {
    console.error('\n❌ Error adding provider bank fields:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  addProviderBankFields();
}

module.exports = { addProviderBankFields };
