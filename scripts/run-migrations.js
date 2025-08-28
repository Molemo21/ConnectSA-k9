const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigrations() {
  try {
    console.log('🚀 Running Database Migrations...\n');

    // 1. Create missing tables
    console.log('📋 Creating missing tables...');
    const createTablesSQL = fs.readFileSync(
      path.join(__dirname, 'create-missing-tables.sql'), 
      'utf8'
    );
    
    await prisma.$executeRawUnsafe(createTablesSQL);
    console.log('✅ Missing tables created successfully');

    // 2. Fix existing bookings
    console.log('\n🔧 Fixing existing bookings...');
    const fixBookingsSQL = fs.readFileSync(
      path.join(__dirname, 'fix-existing-bookings.sql'), 
      'utf8'
    );
    
    await prisma.$executeRawUnsafe(fixBookingsSQL);
    console.log('✅ Existing bookings fixed successfully');

    // 3. Verify the fix
    console.log('\n🔍 Verifying the fix...');
    
    const bookingCount = await prisma.booking.count();
    console.log(`📊 Total bookings in database: ${bookingCount}`);
    
    const paymentCount = await prisma.payment.count();
    console.log(`💳 Total payments in database: ${paymentCount}`);
    
    // Test if we can fetch bookings with includes
    const testBookings = await prisma.booking.findMany({
      take: 1,
      include: {
        service: true,
        provider: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              }
            }
          }
        },
        payment: true,
        review: true,
      },
    });
    
    if (testBookings.length > 0) {
      console.log('✅ Successfully fetched booking with all relations');
      console.log(`   Booking ID: ${testBookings[0].id}`);
      console.log(`   Status: ${testBookings[0].status}`);
      console.log(`   Service: ${testBookings[0].service?.name || 'N/A'}`);
      console.log(`   Payment: ${testBookings[0].payment ? 'Exists' : 'None'}`);
    }

    console.log('\n🎉 Database migrations completed successfully!');
    console.log('✅ Your existing bookings should now appear in the dashboard');
    console.log('\n🔄 Next steps:');
    console.log('   1. Restart your Next.js development server');
    console.log('   2. Check the dashboard - existing bookings should now appear');
    console.log('   3. Test creating a new booking to ensure everything works');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.error('\n🔧 This suggests some tables are missing.');
      console.error('   Please check your database connection and run the scripts manually.');
    }
    
    console.error('\n📋 Manual steps:');
    console.error('   1. Connect to your database (e.g., via Supabase dashboard)');
    console.error('   2. Run scripts/create-missing-tables.sql');
    console.error('   3. Run scripts/fix-existing-bookings.sql');
    
  } finally {
    await prisma.$disconnect();
  }
}

// Run migrations
runMigrations();
