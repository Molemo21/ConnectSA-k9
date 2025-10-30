/**
 * Data Repair Script: Fix Booking Status Inconsistency
 * 
 * This script fixes bookings where payment is CASH_RECEIVED but booking status is not COMPLETED.
 * This can happen if a transaction partially failed or if there was a race condition.
 */

import { db } from "@/lib/db-utils";

async function repairBookingStatus() {
  console.log("🔍 Starting booking status repair...");

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

    console.log(`📊 Found ${inconsistentBookings.length} inconsistent bookings`);

    if (inconsistentBookings.length === 0) {
      console.log("✅ No inconsistent bookings found. All data is correct!");
      return;
    }

    // Repair each booking
    for (const booking of inconsistentBookings) {
      console.log(`\n🔧 Repairing booking ${booking.id}:`);
      console.log(`   Service: ${booking.service?.name || 'Unknown'}`);
      console.log(`   Client: ${booking.client?.name || 'Unknown'}`);
      console.log(`   Provider: ${booking.provider?.businessName || booking.provider?.user?.name || 'Unknown'}`);
      console.log(`   Current status: ${booking.status}`);
      console.log(`   Payment status: ${booking.payment?.status}`);

      try {
        // Update booking status to COMPLETED
        const updated = await db.booking.update({
          where: { id: booking.id },
          data: { status: 'COMPLETED' }
        });

        console.log(`   ✅ Updated booking status to COMPLETED`);

        // Create notification for client
        try {
          await db.notification.create({
            data: {
              userId: booking.clientId,
              type: 'INFO',
              title: 'Booking Status Updated',
              message: `Your booking for "${booking.service?.name || 'service'}" has been marked as completed. The cash payment was already confirmed.`,
              data: {
                bookingId: booking.id,
                repairScript: true
              }
            }
          });
          console.log(`   ✅ Notification created for client`);
        } catch (notifError) {
          console.warn(`   ⚠️  Failed to create notification: ${notifError}`);
        }

      } catch (error) {
        console.error(`   ❌ Failed to repair booking ${booking.id}:`, error);
      }
    }

    console.log(`\n✅ Repair complete! Fixed ${inconsistentBookings.length} booking(s)`);
  } catch (error) {
    console.error("❌ Error during repair:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the repair script
if (require.main === module) {
  repairBookingStatus()
    .then(() => {
      console.log("\n✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Script failed:", error);
      process.exit(1);
    });
}

export { repairBookingStatus };
