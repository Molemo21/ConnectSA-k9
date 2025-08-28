const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProposalsTable() {
  try {
    console.log('🔍 Checking Proposals Table...\n');

    // 1. Check if proposals table exists
    console.log('📋 Checking if proposals table exists...');
    
    try {
      const proposalCount = await prisma.proposal.count();
      console.log(`✅ Proposals table exists. Count: ${proposalCount}`);
    } catch (error) {
      if (error.message.includes('does not exist') || error.message.includes('Unknown table')) {
        console.log('❌ Proposals table does not exist');
        console.log('   This is why the send-offer API is failing');
        return;
      } else {
        console.log('⚠️ Error checking proposals table:', error.message);
      }
    }

    // 2. Check proposals table structure
    console.log('\n🔍 Checking proposals table structure...');
    
    try {
      const proposals = await prisma.proposal.findMany({
        take: 1,
        select: {
          id: true,
          bookingId: true,
          providerId: true,
          status: true,
          message: true,
          createdAt: true,
        }
      });
      
      if (proposals.length > 0) {
        console.log('✅ Sample proposal data:');
        const proposal = proposals[0];
        console.log(`   ID: ${proposal.id}`);
        console.log(`   Booking ID: ${proposal.bookingId}`);
        console.log(`   Provider ID: ${proposal.providerId}`);
        console.log(`   Status: ${proposal.status}`);
        console.log(`   Message: ${proposal.message}`);
        console.log(`   Created: ${proposal.createdAt}`);
      } else {
        console.log('ℹ️ No proposals found in table');
      }
    } catch (error) {
      console.log('❌ Error fetching proposal data:', error.message);
    }

    // 3. Check if we can create a test proposal
    console.log('\n🧪 Testing proposal creation...');
    
    try {
      // First check if we have any bookings to reference
      const bookingCount = await prisma.booking.count();
      console.log(`📊 Total bookings: ${bookingCount}`);
      
      if (bookingCount > 0) {
        const testBooking = await prisma.booking.findFirst({
          select: { id: true, providerId: true }
        });
        
        if (testBooking) {
          console.log(`🔗 Test booking found: ${testBooking.id}`);
          
          // Try to create a test proposal
          const testProposal = await prisma.proposal.create({
            data: {
              bookingId: testBooking.id,
              providerId: testBooking.providerId,
              status: 'TEST',
              message: 'Test proposal for API testing',
            }
          });
          
          console.log('✅ Test proposal created successfully:', testProposal.id);
          
          // Clean up test proposal
          await prisma.proposal.delete({
            where: { id: testProposal.id }
          });
          console.log('🧹 Test proposal cleaned up');
        }
      } else {
        console.log('❌ No bookings found to test with');
      }
    } catch (error) {
      console.log('❌ Error testing proposal creation:', error.message);
      console.log('   This explains why the send-offer API is failing');
    }

  } catch (error) {
    console.error('❌ Error checking proposals table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkProposalsTable();
