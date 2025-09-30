/**
 * Simple script to check booking revenue data
 * Run with: node scripts/check-revenue-simple.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRevenue() {
  try {
    console.log('🔍 Checking booking data...\n')

    // Count all bookings
    const totalBookings = await prisma.booking.count()
    console.log(`📊 Total Bookings: ${totalBookings}`)

    // Count by each status
    const statuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'AWAITING_CONFIRMATION', 'PAYMENT_PROCESSING', 'PENDING_EXECUTION', 'DISPUTED']
    
    console.log('\n📋 Bookings by Status:')
    console.log('=====================')
    
    for (const status of statuses) {
      const count = await prisma.booking.count({
        where: { status }
      })
      
      const revenue = await prisma.booking.aggregate({
        where: { status },
        _sum: { totalAmount: true }
      })
      
      if (count > 0) {
        console.log(`${status}: ${count} bookings, Total: R${(revenue._sum.totalAmount || 0).toFixed(2)}`)
      }
    }

    // Revenue from COMPLETED bookings (what admin dashboard shows)
    const completedRevenue = await prisma.booking.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalAmount: true },
      _count: { id: true }
    })

    console.log(`\n💰 Total Revenue (COMPLETED bookings only):`)
    console.log(`   Bookings: ${completedRevenue._count.id}`)
    console.log(`   Revenue: R${(completedRevenue._sum.totalAmount || 0).toFixed(2)}`)

    // All revenue regardless of status
    const allRevenue = await prisma.booking.aggregate({
      _sum: { totalAmount: true }
    })

    console.log(`\n📈 Potential Revenue (ALL bookings):`)
    console.log(`   Total: R${(allRevenue._sum.totalAmount || 0).toFixed(2)}`)

    // Show recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true
      }
    })

    if (recentBookings.length > 0) {
      console.log(`\n📝 Recent Bookings:`)
      console.log('==================')
      recentBookings.forEach((booking, i) => {
        console.log(`${i + 1}. Status: ${booking.status.padEnd(20)} | Amount: R${booking.totalAmount} | Created: ${booking.createdAt.toLocaleDateString()}`)
      })
    } else {
      console.log('\n⚠️  No bookings found in database')
    }

    console.log('\n💡 Note: Admin dashboard shows revenue from COMPLETED bookings only.')
    console.log('   To see revenue, bookings need to have status = "COMPLETED"')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkRevenue()
