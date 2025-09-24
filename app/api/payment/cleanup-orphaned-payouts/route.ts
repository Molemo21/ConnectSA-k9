import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins or the system to run cleanup
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    console.log(`🧹 Starting cleanup of orphaned and duplicate payouts...`);

    // Find duplicate payouts for the same payment
    const duplicatePayouts = await prisma.$queryRaw`
      SELECT "paymentId", COUNT(*) as count, array_agg(id) as payout_ids
      FROM payouts
      GROUP BY "paymentId"
      HAVING COUNT(*) > 1
    `;

    console.log(`🔍 Found duplicate payouts:`, duplicatePayouts);

    let cleanedCount = 0;
    let errors = [];

    // Clean up duplicate payouts
    for (const duplicate of duplicatePayouts as any[]) {
      try {
        const payoutIds = duplicate.payout_ids;
        const paymentId = duplicate.paymentId;
        
        console.log(`🧹 Cleaning up duplicate payouts for payment ${paymentId}:`, payoutIds);
        
        // Keep the first payout, delete the rest
        const payoutsToDelete = payoutIds.slice(1);
        
        for (const payoutId of payoutsToDelete) {
          await prisma.payout.delete({
            where: { id: payoutId }
          });
          console.log(`🗑️ Deleted duplicate payout: ${payoutId}`);
          cleanedCount++;
        }
      } catch (error) {
        console.error(`❌ Error cleaning up duplicate payouts for payment ${duplicate.paymentId}:`, error);
        errors.push(`Failed to clean payment ${duplicate.paymentId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Find orphaned payouts (payments that don't exist)
    const orphanedPayouts = await prisma.payout.findMany({
      where: {
        payment: null
      }
    });

    console.log(`🔍 Found ${orphanedPayouts.length} orphaned payouts`);

    // Delete orphaned payouts
    for (const payout of orphanedPayouts) {
      try {
        await prisma.payout.delete({
          where: { id: payout.id }
        });
        console.log(`🗑️ Deleted orphaned payout: ${payout.id}`);
        cleanedCount++;
      } catch (error) {
        console.error(`❌ Error deleting orphaned payout ${payout.id}:`, error);
        errors.push(`Failed to delete orphaned payout ${payout.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Find payouts with invalid statuses and reset them
    const invalidStatusPayouts = await prisma.payout.findMany({
      where: {
        status: {
          notIn: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']
        }
      }
    });

    console.log(`🔍 Found ${invalidStatusPayouts.length} payouts with invalid statuses`);

    // Reset invalid status payouts to PENDING
    for (const payout of invalidStatusPayouts) {
      try {
        await prisma.payout.update({
          where: { id: payout.id },
          data: { status: 'PENDING' }
        });
        console.log(`🔄 Reset payout ${payout.id} status to PENDING`);
        cleanedCount++;
      } catch (error) {
        console.error(`❌ Error resetting payout ${payout.id}:`, error);
        errors.push(`Failed to reset payout ${payout.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`🎉 Cleanup completed. Cleaned ${cleanedCount} items.`);

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      cleanedCount,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        duplicatesFound: (duplicatePayouts as any[]).length,
        orphanedFound: orphanedPayouts.length,
        invalidStatusFound: invalidStatusPayouts.length,
        totalCleaned: cleanedCount
      }
    });

  } catch (error) {
    console.error('❌ Payout cleanup error:', error);
    
    return NextResponse.json({
      success: false,
      message: "Payout cleanup failed",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
