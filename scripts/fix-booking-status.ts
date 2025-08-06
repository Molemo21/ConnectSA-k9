import { prisma } from '../lib/prisma-fixed';

async function fixBookingStatus() {
  try {
    console.log('Checking booking status enum values...');
    
    // First, let's check what values are currently in the database
    const bookings = await prisma.booking.findMany({
      select: { id: true, status: true }
    });
    
    console.log('Current booking statuses:', bookings.map(b => ({ id: b.id, status: b.status })));
    
    // Check if we can create a booking with PAID status
    console.log('Testing PAID status...');
    
    // Try to update an existing booking to PAID status
    if (bookings.length > 0) {
      const testBooking = bookings[0];
      console.log(`Attempting to update booking ${testBooking.id} to PAID status...`);
      
      try {
        const updated = await prisma.booking.update({
          where: { id: testBooking.id },
          data: { status: 'PAID' }
        });
        console.log('✅ Successfully updated to PAID status:', updated.status);
        
        // Revert back to original status
        await prisma.booking.update({
          where: { id: testBooking.id },
          data: { status: testBooking.status }
        });
        console.log('✅ Reverted back to original status');
        
      } catch (error) {
        console.error('❌ Failed to update to PAID status:', error);
      }
    }
    
    console.log('✅ Booking status check completed');
    
  } catch (error) {
    console.error('❌ Error checking booking status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBookingStatus(); 