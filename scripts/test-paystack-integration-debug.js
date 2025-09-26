require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPaystackIntegration() {
  console.log('🔧 TESTING PAYSTACK INTEGRATION');
  console.log('=================================');

  try {
    // Check environment variables
    console.log('\n📋 Environment Check:');
    console.log(`PAYSTACK_SECRET_KEY: ${process.env.PAYSTACK_SECRET_KEY ? 'Set' : 'Missing'}`);
    console.log(`PAYSTACK_PUBLIC_KEY: ${process.env.PAYSTACK_PUBLIC_KEY ? 'Set' : 'Missing'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`PAYSTACK_TEST_MODE: ${process.env.PAYSTACK_TEST_MODE || 'Not set'}`);

    // Get a specific booking with failed payout
    const failedPayoutBooking = await prisma.booking.findFirst({
      where: {
        status: 'AWAITING_CONFIRMATION',
        payment: {
          status: 'ESCROW'
        }
      },
      include: {
        payment: {
          include: {
            payout: true
          }
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            bankName: true,
            bankCode: true,
            accountNumber: true,
            accountName: true,
            recipientCode: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      }
    });

    if (!failedPayoutBooking) {
      console.log('\n❌ No booking found for testing');
      return;
    }

    console.log(`\n📋 Testing with booking: ${failedPayoutBooking.id}`);
    console.log(`Service: ${failedPayoutBooking.service?.name}`);
    console.log(`Amount: R${failedPayoutBooking.totalAmount}`);
    console.log(`Escrow Amount: R${failedPayoutBooking.payment.escrowAmount}`);
    console.log(`Provider: ${failedPayoutBooking.provider.businessName || 'Unknown'}`);

    // Test Paystack client initialization
    console.log('\n🔧 Testing Paystack Client:');
    try {
      const { paystackClient } = require('../lib/paystack');
      console.log('✅ Paystack client loaded successfully');
      
      // Test recipient creation
      console.log('\n📋 Testing Recipient Creation:');
      const recipientData = {
        type: 'nuban',
        name: failedPayoutBooking.provider.accountName,
        account_number: failedPayoutBooking.provider.accountNumber,
        bank_code: failedPayoutBooking.provider.bankCode
      };

      console.log('Recipient Data:', {
        type: recipientData.type,
        name: recipientData.name,
        account_number: recipientData.account_number ? '***' + recipientData.account_number.slice(-4) : 'missing',
        bank_code: recipientData.bank_code
      });

      const recipientResponse = await paystackClient.createRecipient(recipientData);
      console.log('✅ Recipient creation response:', {
        success: recipientResponse.status,
        recipient_code: recipientResponse.data?.recipient_code,
        message: recipientResponse.message
      });

      if (recipientResponse.data?.recipient_code) {
        // Test transfer creation
        console.log('\n💸 Testing Transfer Creation:');
        const transferData = {
          source: 'balance',
          amount: failedPayoutBooking.payment.escrowAmount,
          recipient: recipientResponse.data.recipient_code,
          reason: `Test payment for ${failedPayoutBooking.service?.name}`,
          reference: `TEST_${Date.now()}`
        };

        console.log('Transfer Data:', {
          source: transferData.source,
          amount: transferData.amount,
          recipient: transferData.recipient,
          reason: transferData.reason,
          reference: transferData.reference
        });

        const transferResponse = await paystackClient.createTransfer(transferData);
        console.log('✅ Transfer creation response:', {
          success: transferResponse.status,
          transfer_code: transferResponse.data?.transfer_code,
          status: transferResponse.data?.status,
          message: transferResponse.message
        });

        if (transferResponse.data?.transfer_code) {
          console.log('\n🎉 Paystack integration test PASSED!');
          console.log('The issue might be in the API logic or error handling.');
        } else {
          console.log('\n❌ Transfer creation failed:', transferResponse);
        }
      } else {
        console.log('\n❌ Recipient creation failed:', recipientResponse);
      }

    } catch (paystackError) {
      console.log('\n❌ Paystack client error:', paystackError.message);
      console.log('Stack:', paystackError.stack);
    }

    // Check existing failed payouts
    console.log('\n📋 Existing Payouts:');
    if (failedPayoutBooking.payment.payout) {
      const payout = failedPayoutBooking.payment.payout;
      console.log(`Payout ID: ${payout.id}`);
      console.log(`Status: ${payout.status}`);
      console.log(`Amount: R${payout.amount}`);
      console.log(`Transfer Code: ${payout.transferCode || 'None'}`);
      console.log(`Paystack Ref: ${payout.paystackRef}`);
      console.log(`Created: ${payout.createdAt}`);
      console.log(`Updated: ${payout.updatedAt}`);
    } else {
      console.log('No payout found for this payment');
    }

  } catch (error) {
    console.error('❌ Error testing Paystack integration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaystackIntegration();
