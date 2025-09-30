/**
 * Script to check booking statuses and revenue data
 * Run with: npx tsx scripts/check-booking-revenue.ts
 */

import { db } from '@/lib/db-utils'

async function checkBookingRevenue() {
  try {
    console.log('🔍 Checking booking statuses and revenue data...\n')

    // Count bookings by status
    const bookingsByStatus = await db.booking.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      }
    })

    console.log('📊 Bookings by Status:')
    console.log('=====================')
    bookingsByStatus.forEach(group => {
      console.log(`${group.status}: ${group._count.id} bookings, Total: R${(group._sum.totalAmount || 0).toFixed(2)}`)
    })

    // Total bookings
    const totalBookings = await db.booking.count()
    console.log(`\nTotal Bookings: ${totalBookings}`)

    // Total revenue from COMPLETED bookings
    const completedRevenue = await db.booking.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalAmount: true },
      _count: { id: true }
    })

    console.log(`\n💰 Revenue from COMPLETED Bookings:`)
    console.log(`   Count: ${completedRevenue._count.id}`)
    console.log(`   Total: R${(completedRevenue._sum.totalAmount || 0).toFixed(2)}`)

    // All bookings revenue (regardless of status)
    const allRevenue = await db.booking.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true }
    })

    console.log(`\n📈 Total Potential Revenue (All Bookings):`)
    console.log(`   Count: ${allRevenue._count.id}`)
    console.log(`   Total: R${(allRevenue._sum.totalAmount || 0).toFixed(2)}`)

    // Recent bookings
    const recentBookings = await db.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        scheduledDate: true
      }
    })

    console.log(`\n📋 Recent Bookings:`)
    console.log('==================')
    recentBookings.forEach((booking, i) => {
      console.log(`${i + 1}. ID: ${booking.id.substring(0, 8)}... | Status: ${booking.status} | Amount: R${booking.totalAmount} | Created: ${booking.createdAt.toLocaleDateString()}`)
    })

    console.log('\n✅ Analysis complete!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

checkBookingRevenue()
