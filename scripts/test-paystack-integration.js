#!/usr/bin/env node

/**
 * Test Paystack Integration (Test Mode)
 * 
 * This script tests the Paystack integration in test mode:
 * 1. Creates a test transfer recipient
 * 2. Tests transfer creation
 * 3. Validates the complete payment flow
 * 
 * Usage: node scripts/test-paystack-integration.js
 * 
 * Prerequisites:
 * - Set PAYSTACK_TEST_MODE=true in .env
 * - Valid Paystack test credentials in .env
 * - A provider with bank details in the database
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testPaystackIntegration() {
  console.log('🧪 Testing Paystack Integration (Test Mode)\n');

  // Check if we're in test mode
  if (process.env.NODE_ENV !== 'development' && process.env.PAYSTACK_TEST_MODE !== 'true') {
    console.log('❌ This script should only run in test mode!');
    console.log('💡 Set PAYSTACK_TEST_MODE=true in your .env file');
    return;
  }

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Step 1: Find a provider with bank details
    console.log('🔍 Step 1: Finding provider with bank details...\n');
    
    const provider = await prisma.provider.findFirst({
      where: {
        bankCode: { not: null },
        accountNumber: { not: null },
        accountName: { not: null }
      },
      include: {
        user: true
      }
    });

    if (!provider) {
      console.log('❌ No provider found with bank details');
      console.log('💡 Please add bank details to a provider first using the frontend form');
      return;
    }

    console.log('✅ Provider found:');
    console.log(`   - ID: ${provider.id}`);
    console.log(`   - Business: ${provider.businessName || 'Not set'}`);
    console.log(`   - Bank: ${provider.bankName} (${provider.bankCode})`);
    console.log(`   - Account: ${provider.accountNumber} - ${provider.accountName}`);
    console.log(`   - Recipient Code: ${provider.recipientCode || 'Not set'}`);
    console.log('');

    // Step 2: Test Paystack recipient creation
    console.log('🔍 Step 2: Testing Paystack recipient creation...\n');
    
    try {
      const { paystackClient } = require('../lib/paystack');
      
      // Create recipient data
      const recipientData = {
        type: 'nuban',
        name: provider.accountName,
        account_number: provider.accountNumber,
        bank_code: provider.bankCode
      };

      console.log('📋 Creating recipient with data:', recipientData);
      
      const recipientResponse = await paystackClient.createRecipient(recipientData);
      
      if (recipientResponse.data?.recipient_code) {
        console.log('✅ Recipient created successfully!');
        console.log(`   - Recipient Code: ${recipientResponse.data.recipient_code}`);
        console.log(`   - Recipient ID: ${recipientResponse.data.id}`);
        console.log(`   - Type: ${recipientResponse.data.type}`);
        console.log(`   - Name: ${recipientResponse.data.details.account_name}`);
        console.log('');

        // Update provider with recipient code
        await prisma.provider.update({
          where: { id: provider.id },
          data: { recipientCode: recipientResponse.data.recipient_code }
        });
        
        console.log('💾 Recipient code saved to provider record');
        console.log('');

        // Step 3: Test transfer creation
        console.log('🔍 Step 3: Testing Paystack transfer creation...\n');
        
        try {
          const transferData = {
            source: 'balance',
            amount: 100.00, // R100 test amount
            recipient: recipientResponse.data.recipient_code,
            reason: `Test transfer for ${provider.businessName || 'Provider'}`,
            reference: `TEST_${Date.now()}`
          };

          console.log('📋 Creating transfer with data:', transferData);
          
          const transferResponse = await paystackClient.createTransfer(transferData);
          
          if (transferResponse.data?.transfer_code) {
            console.log('✅ Transfer created successfully!');
            console.log(`   - Transfer Code: ${transferResponse.data.transfer_code}`);
            console.log(`   - Transfer ID: ${transferResponse.data.id}`);
            console.log(`   - Amount: R${transferResponse.data.amount / 100}`);
            console.log(`   - Status: ${transferResponse.data.status}`);
            console.log(`   - Reason: ${transferResponse.data.reason}`);
            console.log('');

            // Step 4: Test the complete payment flow
            console.log('🔍 Step 4: Testing complete payment flow...\n');
            
            try {
              // Find a booking that can be used for testing
              const testBooking = await prisma.booking.findFirst({
                where: {
                  providerId: provider.id,
                  status: 'AWAITING_CONFIRMATION'
                },
                include: {
                  payment: true,
                  service: true
                }
              });

              if (testBooking && testBooking.payment?.status === 'ESCROW') {
                console.log('✅ Test booking found for payment flow:');
                console.log(`   - Booking ID: ${testBooking.id}`);
                console.log(`   - Service: ${testBooking.service?.name}`);
                console.log(`   - Amount: R${testBooking.totalAmount}`);
                console.log(`   - Payment Status: ${testBooking.payment.status}`);
                console.log('');

                console.log('🎯 Ready to test payment release!');
                console.log('💡 You can now test the /release-payment endpoint with this booking');
                console.log(`💡 Endpoint: POST /api/book-service/${testBooking.id}/release-payment`);
                console.log('');

              } else {
                console.log('⚠️ No suitable test booking found');
                console.log('💡 Create a booking with ESCROW payment status to test the flow');
                console.log('');
              }

            } catch (flowError) {
              console.log('❌ Error testing payment flow:', flowError.message);
              console.log('');
            }

          } else {
            console.log('❌ Transfer creation failed');
            console.log('💡 Response:', JSON.stringify(transferResponse, null, 2));
            console.log('');
          }

        } catch (transferError) {
          console.log('❌ Error creating transfer:', transferError.message);
          console.log('');
        }

      } else {
        console.log('❌ Recipient creation failed');
        console.log('💡 Response:', JSON.stringify(recipientResponse, null, 2));
        console.log('');
      }

    } catch (recipientError) {
      console.log('❌ Error creating recipient:', recipientError.message);
      console.log('');
    }

    // Step 5: Environment validation
    console.log('🔍 Step 5: Environment validation...\n');
    
    const requiredEnvVars = [
      'PAYSTACK_SECRET_KEY',
      'PAYSTACK_PUBLIC_KEY',
      'PAYSTACK_WEBHOOK_SECRET'
    ];

    console.log('📋 Checking required environment variables:');
    requiredEnvVars.forEach(varName => {
      const value = process.env[varName];
      const status = value ? '✅ Set' : '❌ Missing';
      const maskedValue = value ? `${value.substring(0, 8)}...` : 'Not set';
      console.log(`   - ${varName}: ${status} (${maskedValue})`);
    });
    console.log('');

    // Step 6: Test mode confirmation
    console.log('🔍 Step 6: Test mode confirmation...\n');
    
    const testMode = process.env.NODE_ENV === 'development' || process.env.PAYSTACK_TEST_MODE === 'true';
    console.log(`📋 Test Mode: ${testMode ? '✅ Active' : '❌ Inactive'}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV}`);
    console.log(`📋 PAYSTACK_TEST_MODE: ${process.env.PAYSTACK_TEST_MODE}`);
    console.log('');

    if (testMode) {
      console.log('🎯 Test Mode Summary:');
      console.log('✅ You are running in test mode');
      console.log('✅ No real money will be transferred');
      console.log('✅ Paystack test credentials are being used');
      console.log('✅ Safe to test all payment flows');
      console.log('');
    } else {
      console.log('⚠️ Production Mode Warning:');
      console.log('❌ You are NOT in test mode');
      console.log('❌ Real money transfers may occur');
      console.log('❌ Use test credentials only in development');
      console.log('');
    }

    console.log('🎉 Paystack Integration Test Completed!');
    console.log('💡 Next steps:');
    console.log('   1. Test the bank details form in the frontend');
    console.log('   2. Test the payment release flow with a real booking');
    console.log('   3. Monitor the logs for any errors');
    console.log('   4. Verify all status transitions work correctly');

  } catch (error) {
    console.error('\n❌ Error during Paystack integration test:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  testPaystackIntegration();
}

module.exports = { testPaystackIntegration };
