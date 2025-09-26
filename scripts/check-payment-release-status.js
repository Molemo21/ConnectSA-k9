require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPaymentReleaseStatus() {
  console.log('🔍 CHECKING PAYMENT RELEASE STATUS');
  console.log('=====================================');

  try {
    // Get recent bookings with AWAITING_CONFIRMATION status
    const awaitingConfirmationBookings = await prisma.booking.findMany({
      where: {
        status: 'AWAITING_CONFIRMATION'
      },
      include: {
        payment: true,
        provider: {
          select: {
            id: true,
            businessName: true,
            bankName: true,
            bankCode: true,
            accountNumber: true,
            accountName: true,
            recipientCode: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        client: {
          select: {
            name: true,
            email: true
          }
        },
          service: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      console.log(`\n📋 Found ${awaitingConfirmationBookings.length} bookings awaiting confirmation:`);
      
      for (const booking of awaitingConfirmationBookings) {
        console.log(`\n--- Booking ${booking.id} ---`);
        console.log(`Service: ${booking.service?.name || 'Unknown'}`);
        console.log(`Client: ${booking.client?.name || 'Unknown'} (${booking.client?.email})`);
        console.log(`Provider: ${booking.provider?.businessName || 'Unknown'} (${booking.provider?.user?.email})`);
        console.log(`Amount: R${booking.totalAmount}`);
        console.log(`Status: ${booking.status}`);
        
        if (booking.payment) {
          console.log(`Payment Status: ${booking.payment.status}`);
          console.log(`Escrow Amount: R${booking.payment.escrowAmount}`);
          console.log(`Paystack Ref: ${booking.payment.paystackRef}`);
        } else {
          console.log('❌ No payment found');
        }

        if (booking.provider) {
          console.log(`Provider Bank Details:`);
          console.log(`  Bank Name: ${booking.provider.bankName || 'Missing'}`);
          console.log(`  Bank Code: ${booking.provider.bankCode || 'Missing'}`);
          console.log(`  Account Number: ${booking.provider.accountNumber ? '***' + booking.provider.accountNumber.slice(-4) : 'Missing'}`);
          console.log(`  Account Name: ${booking.provider.accountName || 'Missing'}`);
          console.log(`  Recipient Code: ${booking.provider.recipientCode || 'Missing'}`);
          
          // Check if bank details are complete
          const hasCompleteBankDetails = !!(booking.provider.bankName && 
                                           booking.provider.bankCode && 
                                           booking.provider.accountNumber && 
                                           booking.provider.accountName);
          console.log(`  Complete Bank Details: ${hasCompleteBankDetails ? '✅ Yes' : '❌ No'}`);
        }

        // Get payouts for this payment
        if (booking.payment) {
          const payouts = await prisma.payout.findMany({
            where: {
              paymentId: booking.payment.id
            }
          });
          
          if (payouts.length > 0) {
            console.log(`Payouts:`);
            payouts.forEach((payout, index) => {
              console.log(`  Payout ${index + 1}: ${payout.status} - R${payout.amount}`);
              console.log(`    Transfer Code: ${payout.transferCode || 'None'}`);
              console.log(`    Paystack Ref: ${payout.paystackRef || 'None'}`);
            });
          } else {
            console.log('No payouts found');
          }
        }
      }

    // Check for any stuck payments
    const stuckPayments = await prisma.payment.findMany({
      where: {
        status: 'PROCESSING_RELEASE',
        createdAt: {
          lt: new Date(Date.now() - 5 * 60 * 1000) // Older than 5 minutes
        }
      },
      include: {
        booking: {
          include: {
            provider: true,
            client: true,
            service: true
          }
        },
        payout: true
      }
    });

    if (stuckPayments.length > 0) {
      console.log(`\n⚠️ Found ${stuckPayments.length} stuck payments:`);
      stuckPayments.forEach(payment => {
        console.log(`\n--- Stuck Payment ${payment.id} ---`);
        console.log(`Booking: ${payment.booking.id}`);
        console.log(`Service: ${payment.booking.service?.name}`);
        console.log(`Amount: R${payment.escrowAmount}`);
        console.log(`Status: ${payment.status}`);
        console.log(`Created: ${payment.createdAt}`);
        console.log(`Updated: ${payment.updatedAt}`);
      });
    }

    // Check Paystack environment
    console.log(`\n🔧 PAYSTACK CONFIGURATION:`);
    console.log(`Secret Key: ${process.env.PAYSTACK_SECRET_KEY ? 'Set' : 'Missing'}`);
    console.log(`Public Key: ${process.env.PAYSTACK_PUBLIC_KEY ? 'Set' : 'Missing'}`);
    console.log(`Test Mode: ${process.env.PAYSTACK_TEST_MODE || 'Not set'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

  } catch (error) {
    console.error('❌ Error checking payment release status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPaymentReleaseStatus();
