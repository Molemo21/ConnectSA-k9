/**
 * Test script to check what the admin stats API returns
 * Run with: node scripts/test-admin-api.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAdminStatsCalculation() {
  try {
    console.log('🧪 Testing Admin Stats Calculation...\n')

    // Simulate what the admin data service does
    console.log('📊 Fetching data exactly as admin-data-service does:\n')

    // Total revenue (COMPLETED bookings)
    const totalRevenue = await prisma.booking.aggregate({
      where: { status: "COMPLETED" },
      _sum: { totalAmount: true }
    })

    console.log('💰 Total Revenue (COMPLETED):')
    console.log(`   Raw result:`, totalRevenue)
    console.log(`   Calculated value: R${totalRevenue._sum?.totalAmount || 0}`)

    // Pending revenue
    const pendingRevenue = await prisma.booking.aggregate({
      where: { status: "PENDING" },
      _sum: { totalAmount: true }
    })

    console.log('\n⏳ Pending Revenue (PENDING):')
    console.log(`   Raw result:`, pendingRevenue)
    console.log(`   Calculated value: R${pendingRevenue._sum?.totalAmount || 0}`)

    // Escrow revenue (PAYMENT_PROCESSING)
    const escrowRevenue = await prisma.booking.aggregate({
      where: { status: "PAYMENT_PROCESSING" },
      _sum: { totalAmount: true }
    })

    console.log('\n🔒 Escrow Revenue (PAYMENT_PROCESSING):')
    console.log(`   Raw result:`, escrowRevenue)
    console.log(`   Calculated value: R${escrowRevenue._sum?.totalAmount || 0}`)

    // Total bookings
    const totalBookings = await prisma.booking.count()
    const completedBookings = await prisma.booking.count({ where: { status: "COMPLETED" } })
    const cancelledBookings = await prisma.booking.count({ where: { status: "CANCELLED" } })

    console.log('\n📈 Booking Counts:')
    console.log(`   Total: ${totalBookings}`)
    console.log(`   Completed: ${completedBookings}`)
    console.log(`   Cancelled: ${cancelledBookings}`)

    console.log('\n✅ This is what should appear in the admin dashboard!')
    console.log(`   Total Revenue should be: R${totalRevenue._sum?.totalAmount || 0}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminStatsCalculation()
