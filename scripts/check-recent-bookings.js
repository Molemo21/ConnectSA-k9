const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentBookings() {
  try {
    console.log('🔍 Checking recent bookings and their status...\n');

    // Get recent bookings with their providers and bank details
    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['AWAITING_CONFIRMATION', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
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
        },
        payment: {
          select: {
            status: true,
            amount: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`📊 Found ${bookings.length} recent bookings\n`);

    if (bookings.length === 0) {
      console.log('❌ No recent bookings found');
      return;
    }

    bookings.forEach((booking, index) => {
      console.log(`📋 Booking ${index + 1}:`);
      console.log(`   ID: ${booking.id}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Service: ${booking.service.name}`);
      console.log(`   Client: ${booking.client.name} (${booking.client.email})`);
      console.log(`   Provider: ${booking.provider.user.name} (${booking.provider.user.email})`);
      console.log(`   Amount: R${booking.totalAmount}`);
      console.log(`   Payment Status: ${booking.payment?.status || 'No payment'}`);
      
      // Check provider bank details
      const hasCompleteBankDetails = booking.provider.bankName && 
                                   booking.provider.bankCode && 
                                   booking.provider.accountNumber && 
                                   booking.provider.accountName;
      
      console.log(`   Provider Bank Details: ${hasCompleteBankDetails ? '✅ Complete' : '❌ Incomplete'}`);
      
      if (hasCompleteBankDetails) {
        console.log(`   Bank: ${booking.provider.bankName} (${booking.provider.bankCode})`);
        console.log(`   Account: ${booking.provider.accountName} (****${booking.provider.accountNumber.slice(-4)})`);
        console.log(`   Recipient Code: ${booking.provider.recipientCode || 'Not set'}`);
      } else {
        console.log(`   Missing: ${!booking.provider.bankName ? 'Bank Name ' : ''}${!booking.provider.bankCode ? 'Bank Code ' : ''}${!booking.provider.accountNumber ? 'Account Number ' : ''}${!booking.provider.accountName ? 'Account Name' : ''}`);
      }
      
      console.log(`   Created: ${booking.createdAt.toISOString()}`);
      console.log('');
    });

    // Check for bookings that might be stuck
    const awaitingConfirmation = bookings.filter(b => b.status === 'AWAITING_CONFIRMATION');
    const inProgress = bookings.filter(b => b.status === 'IN_PROGRESS');
    const completed = bookings.filter(b => b.status === 'COMPLETED');

    console.log('📈 Summary:');
    console.log(`   AWAITING_CONFIRMATION: ${awaitingConfirmation.length}`);
    console.log(`   IN_PROGRESS: ${inProgress.length}`);
    console.log(`   COMPLETED: ${completed.length}`);

    // Check which bookings might be failing due to bank details
    const bookingsWithIncompleteBankDetails = bookings.filter(b => 
      !(b.provider.bankName && b.provider.bankCode && b.provider.accountNumber && b.provider.accountName)
    );

    if (bookingsWithIncompleteBankDetails.length > 0) {
      console.log('\n⚠️  Bookings with providers missing bank details:');
      bookingsWithIncompleteBankDetails.forEach(booking => {
        console.log(`   - Booking ${booking.id}: ${booking.provider.user.name} (${booking.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking recent bookings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkRecentBookings();
