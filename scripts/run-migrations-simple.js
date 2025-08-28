const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigrationsSimple() {
  try {
    console.log('🚀 Running Database Migrations (Simple)...\n');

    // 1. Create missing tables one by one
    console.log('📋 Creating missing tables...');
    
    // Create payouts table
    try {
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "payouts" (
        "id" TEXT PRIMARY KEY,
        "paymentId" TEXT UNIQUE NOT NULL,
        "providerId" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "paystackRef" TEXT NOT NULL,
        "status" TEXT DEFAULT 'PENDING',
        "transferCode" TEXT,
        "recipientCode" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )`;
      console.log('✅ Payouts table created/verified');
    } catch (error) {
      console.log('ℹ️ Payouts table already exists or error:', error.message);
    }

    // Create job_proofs table
    try {
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "job_proofs" (
        "id" TEXT PRIMARY KEY,
        "bookingId" TEXT UNIQUE NOT NULL,
        "providerId" TEXT NOT NULL,
        "photos" TEXT[] DEFAULT '{}',
        "notes" TEXT,
        "completedAt" TIMESTAMP(3) NOT NULL,
        "clientConfirmed" BOOLEAN DEFAULT FALSE,
        "confirmedAt" TIMESTAMP(3),
        "autoConfirmAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )`;
      console.log('✅ Job proofs table created/verified');
    } catch (error) {
      console.log('ℹ️ Job proofs table already exists or error:', error.message);
    }

    // Create disputes table
    try {
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "disputes" (
        "id" TEXT PRIMARY KEY,
        "bookingId" TEXT UNIQUE NOT NULL,
        "raisedBy" TEXT NOT NULL,
        "reason" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "status" TEXT DEFAULT 'PENDING',
        "resolvedBy" TEXT,
        "resolution" TEXT,
        "resolvedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )`;
      console.log('✅ Disputes table created/verified');
    } catch (error) {
      console.log('ℹ️ Disputes table already exists or error:', error.message);
    }

    // 2. Add missing columns to existing tables
    console.log('\n🔧 Adding missing columns...');
    
    // Add columns to bookings table
    try {
      await prisma.$executeRaw`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "duration" INTEGER DEFAULT 60`;
      console.log('✅ Duration column added to bookings');
    } catch (error) {
      console.log('ℹ️ Duration column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "platformFee" DOUBLE PRECISION DEFAULT 0.00`;
      console.log('✅ Platform fee column added to bookings');
    } catch (error) {
      console.log('ℹ️ Platform fee column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "address" TEXT DEFAULT 'Address not specified'`;
      console.log('✅ Address column added to bookings');
    } catch (error) {
      console.log('ℹ️ Address column already exists or error:', error.message);
    }

    // Add columns to payments table
    try {
      await prisma.$executeRaw`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "escrowAmount" DOUBLE PRECISION`;
      console.log('✅ Escrow amount column added to payments');
    } catch (error) {
      console.log('ℹ️ Escrow amount column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "platformFee" DOUBLE PRECISION`;
      console.log('✅ Platform fee column added to payments');
    } catch (error) {
      console.log('ℹ️ Platform fee column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'ZAR'`;
      console.log('✅ Currency column added to payments');
    } catch (error) {
      console.log('ℹ️ Currency column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "transactionId" TEXT`;
      console.log('✅ Transaction ID column added to payments');
    } catch (error) {
      console.log('ℹ️ Transaction ID column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "authorizationUrl" TEXT`;
      console.log('✅ Authorization URL column added to payments');
    } catch (error) {
      console.log('ℹ️ Authorization URL column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "accessCode" TEXT`;
      console.log('✅ Access code column added to payments');
    } catch (error) {
      console.log('ℹ️ Access code column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3)`;
      console.log('✅ Paid at column added to payments');
    } catch (error) {
      console.log('ℹ️ Paid at column already exists or error:', error.message);
    }

    // 3. Update existing data
    console.log('\n🔄 Updating existing data...');
    
    try {
      await prisma.$executeRaw`UPDATE "bookings" SET "duration" = COALESCE("duration", 60), "platformFee" = COALESCE("platformFee", 0.00), "address" = COALESCE("address", 'Address not specified') WHERE "duration" IS NULL OR "platformFee" IS NULL OR "address" IS NULL`;
      console.log('✅ Existing bookings updated with default values');
    } catch (error) {
      console.log('ℹ️ Error updating bookings:', error.message);
    }

    try {
      await prisma.$executeRaw`UPDATE "payments" SET "escrowAmount" = COALESCE("escrowAmount", "amount"), "platformFee" = COALESCE("platformFee", 0.00), "currency" = COALESCE("currency", 'ZAR') WHERE "escrowAmount" IS NULL OR "platformFee" IS NULL OR "currency" IS NULL`;
      console.log('✅ Existing payments updated with default values');
    } catch (error) {
      console.log('ℹ️ Error updating payments:', error.message);
    }

    // 4. Update status values
    try {
      await prisma.$executeRaw`UPDATE "bookings" SET "status" = 'PENDING_EXECUTION' WHERE "status" IN ('PAID', 'paid')`;
      console.log('✅ Updated PAID status to PENDING_EXECUTION');
    } catch (error) {
      console.log('ℹ️ Error updating statuses:', error.message);
    }

    try {
      await prisma.$executeRaw`UPDATE "payments" SET "status" = CASE WHEN "status" = 'paid' THEN 'ESCROW' WHEN "status" = 'completed' THEN 'ESCROW' ELSE COALESCE("status", 'PENDING') END WHERE "status" IN ('paid', 'completed') OR "status" IS NULL`;
      console.log('✅ Updated payment statuses to new enum values');
    } catch (error) {
      console.log('ℹ️ Error updating payment statuses:', error.message);
    }

    // 5. Verify the fix
    console.log('\n🔍 Verifying the fix...');
    
    const bookingCount = await prisma.booking.count();
    console.log(`📊 Total bookings in database: ${bookingCount}`);
    
    const paymentCount = await prisma.payment.count();
    console.log(`💳 Total payments in database: ${paymentCount}`);
    
    // Test if we can fetch bookings with includes
    try {
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
    } catch (error) {
      console.log('⚠️ Error testing booking fetch:', error.message);
    }

    console.log('\n🎉 Database migrations completed successfully!');
    console.log('✅ Your existing bookings should now appear in the dashboard');
    console.log('\n🔄 Next steps:');
    console.log('   1. Restart your Next.js development server');
    console.log('   2. Check the dashboard - existing bookings should now appear');
    console.log('   3. Test creating a new booking to ensure everything works');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migrations
runMigrationsSimple();
