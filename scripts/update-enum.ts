import { prisma } from '../lib/prisma-fixed';

async function updateEnum() {
  try {
    console.log('Updating BookingStatus enum...');
    
    // Run the SQL command to add PAID to the enum
    await prisma.$executeRaw`ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PAID'`;
    
    console.log('✅ Successfully added PAID to BookingStatus enum');
    
    // Test if it works now
    const bookings = await prisma.booking.findMany({
      select: { id: true, status: true },
      take: 1
    });
    
    if (bookings.length > 0) {
      const testBooking = bookings[0];
      console.log(`Testing PAID status on booking ${testBooking.id}...`);
      
      const updated = await prisma.booking.update({
        where: { id: testBooking.id },
        data: { status: 'PAID' }
      });
      
      console.log('✅ Successfully updated to PAID status:', updated.status);
      
      // Revert back
      await prisma.booking.update({
        where: { id: testBooking.id },
        data: { status: testBooking.status }
      });
      
      console.log('✅ Reverted back to original status');
    }
    
  } catch (error) {
    console.error('❌ Error updating enum:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEnum(); 