/**
 * Test providers API directly with database
 * Run with: node scripts/test-providers-api.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testProvidersAPI() {
  try {
    console.log('🧪 Testing Providers Data Fetching...\n')

    // Simulate what the admin data service does
    const page = 1
    const limit = 10
    const skip = (page - 1) * limit

    console.log('📊 Fetching providers from database...')
    
    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          },
          bookings: {
            select: { id: true }
          },
          payouts: {
            select: { amount: true }
          },
          reviews: {
            select: { rating: true }
          }
        }
      }),
      prisma.provider.count()
    ])

    console.log(`\n✅ Found ${providers.length} providers (Total: ${total})`)
    console.log('\n📋 Provider Data:')
    console.log('================')

    providers.forEach((provider, i) => {
      const averageRating = provider.reviews.length > 0 
        ? provider.reviews.reduce((sum, review) => sum + review.rating, 0) / provider.reviews.length
        : 0
      const totalBookings = provider.bookings?.length || 0
      const totalEarnings = provider.payouts?.reduce((sum, payout) => sum + payout.amount, 0) || 0
      
      console.log(`${i + 1}. ${provider.user.name} (${provider.businessName || 'No business name'})`)
      console.log(`   Email: ${provider.user.email}`)
      console.log(`   Status: ${provider.status}`)
      console.log(`   Bookings: ${totalBookings}`)
      console.log(`   Earnings: R${totalEarnings}`)
      console.log(`   Rating: ${averageRating.toFixed(1)} (${provider.reviews.length} reviews)`)
      console.log(`   Created: ${provider.createdAt.toLocaleDateString()}`)
      console.log('')
    })

    console.log('✅ Provider data fetching works correctly!')
    console.log('This data should appear in the admin dashboard.\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\nFull error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testProvidersAPI()
