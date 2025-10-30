/**
 * Health Check Script: Verify Booking-Payment Status Consistency
 * 
 * This script runs periodic checks to ensure all bookings with CASH_RECEIVED payments
 * have COMPLETED booking status. It can be run as a cron job or scheduled task.
 * 
 * Usage: npx tsx scripts/health-check-booking-status.ts
 */

import { db } from "@/lib/db-utils";

async function healthCheckBookingStatus() {
  console.log("🏥 Starting booking status health check...");
  const startTime = Date.now();

  try {
    // Find all bookings with CASH_RECEIVED payment but status != COMPLETED
    const inconsistentBookings = await db.booking.findMany({
      where: {
        payment: {
          status: 'CASH_RECEIVED'
        },
        status: {
          not: 'COMPLETED'
        },
        paymentMethod: 'CASH'
      },
      include: {
        payment: true,
        service: {
          select: { name: true }
        },
        client: {
          select: { name: true, email: true }
        },
        provider: {
          select: {
            businessName: true,
            user: {
              select: { name: true }
            }
          }
        }
      }
    });

    console.log(`📊 Health check results: ${inconsistentBookings.length} inconsistent booking(s) found`);

    if (inconsistentBookings.length === 0) {
      console.log("✅ All bookings are consistent! No issues detected.");
      return { 
        success: true, 
        inconsistentCount: 0,
        repairedCount: 0,
        duration: Date.now() - startTime
      };
    }

    console.log(`\n🔧 Found ${inconsistentBookings.length} booking(s) that need repair:`);
    
    let repairedCount = 0;
    let failedRepairs = 0;

    // Repair each booking
    for (const booking of inconsistentBookings) {
      console.log(`\n  • Booking ${booking.id}:`);
      console.log(`    Service: ${booking.service?.name || 'Unknown'}`);
      console.log(`    Client: ${booking.client?.name || 'Unknown'}`);
      console.log(`    Provider: ${booking.provider?.businessName || booking.provider?.user?.name || 'Unknown'}`);
      console.log(`    Current status: ${booking.status}`);
      console.log(`    Payment status: ${booking.payment?.status}`);

      try {
        // Update booking status to COMPLETED
        await db.booking.update({
          where: { id: booking.id },
          data: { status: 'COMPLETED' }
        });

        console.log(`    ✅ Repaired successfully`);
        repairedCount++;
      } catch (error) {
        console.error(`    ❌ Repair failed:`, error);
        failedRepairs++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n📈 Health check summary:`);
    console.log(`   • Total inconsistent: ${inconsistentBookings.length}`);
    console.log(`   • Successfully repaired: ${repairedCount}`);
    console.log(`   • Failed repairs: ${failedRepairs}`);
    console.log(`   • Duration: ${duration}ms`);

    return {
      success: failedRepairs === 0,
      inconsistentCount: inconsistentBookings.length,
      repairedCount,
      failedRepairs,
      duration
    };

  } catch (error) {
    console.error("❌ Health check failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the health check
if (require.main === module) {
  healthCheckBookingStatus()
    .then((result) => {
      console.log("\n✅ Health check completed successfully");
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("\n❌ Health check failed:", error);
      process.exit(1);
    });
}

export { healthCheckBookingStatus };
