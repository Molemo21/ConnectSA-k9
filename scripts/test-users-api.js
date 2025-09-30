/**
 * Test users API directly with database
 * Run with: node scripts/test-users-api.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testUsersAPI() {
  try {
    console.log('🧪 Testing Users Data Fetching...\n')

    // Simulate what the admin data service does
    const page = 1
    const limit = 10
    const skip = (page - 1) * limit

    console.log('📊 Fetching users from database...')
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          clientBookings: {
            select: { id: true }
          },
          payments: {
            select: { amount: true }
          }
        }
      }),
      prisma.user.count()
    ])

    console.log(`\n✅ Found ${users.length} users (Total: ${total})`)
    console.log('\n📋 User Data:')
    console.log('=============')

    users.slice(0, 5).forEach((user, i) => {
      const totalBookings = user.clientBookings?.length || 0
      const totalSpent = user.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      const status = user.isActive ? 'ACTIVE' : 'INACTIVE'
      
      console.log(`${i + 1}. ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Status: ${status}`)
      console.log(`   Bookings: ${totalBookings}`)
      console.log(`   Total Spent: R${totalSpent}`)
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`)
      console.log('')
    })

    console.log('✅ User data fetching works correctly!')
    console.log('This data should appear in the admin dashboard.\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\nFull error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testUsersAPI()
