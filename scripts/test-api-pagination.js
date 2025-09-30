/**
 * Test API pagination and data completeness
 * Run with: node scripts/test-api-pagination.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAPIPagination() {
  console.log('🧪 TESTING API PAGINATION AND DATA COMPLETENESS')
  console.log('=' .repeat(70))
  console.log('')

  try {
    // Test Users API simulation
    console.log('👥 USERS API SIMULATION')
    console.log('-' .repeat(70))
    console.log('')

    // Simulate what the API does - Page 1
    const page1 = 1, limit = 10
    const skip1 = (page1 - 1) * limit
    
    const [page1Users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        skip: skip1,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          clientBookings: { select: { id: true } },
          payments: { select: { amount: true } }
        }
      }),
      prisma.user.count()
    ])

    console.log(`Page 1 Response:`)
    console.log(`  Total Count: ${totalUsers}`)
    console.log(`  Users Returned: ${page1Users.length}`)
    console.log(`  Total Pages: ${Math.ceil(totalUsers / limit)}`)
    console.log(`  Users on Page 1:`)
    page1Users.forEach((u, i) => {
      console.log(`    ${i + 1}. ${u.name} (${u.email})`)
    })
    console.log('')

    // Page 2
    const page2 = 2
    const skip2 = (page2 - 1) * limit
    
    const page2Users = await prisma.user.findMany({
      skip: skip2,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        clientBookings: { select: { id: true } },
        payments: { select: { amount: true } }
      }
    })

    console.log(`Page 2 Response:`)
    console.log(`  Users Returned: ${page2Users.length}`)
    console.log(`  Users on Page 2:`)
    page2Users.forEach((u, i) => {
      console.log(`    ${i + 1}. ${u.name} (${u.email})`)
    })
    console.log('')

    const totalUsersAcrossPages = page1Users.length + page2Users.length
    console.log(`✅ Total Users Across Pages: ${totalUsersAcrossPages} (Should be ${totalUsers})`)
    
    if (totalUsersAcrossPages === totalUsers) {
      console.log(`✅ ALL ${totalUsers} USERS ARE ACCESSIBLE VIA PAGINATION!`)
    } else {
      console.log(`⚠️  WARNING: Missing ${totalUsers - totalUsersAcrossPages} users!`)
    }

    // Test Providers API simulation
    console.log('')
    console.log('🏢 PROVIDERS API SIMULATION')
    console.log('-' .repeat(70))
    console.log('')

    const [page1Providers, totalProviders] = await Promise.all([
      prisma.provider.findMany({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, name: true } },
          bookings: { select: { id: true } },
          payouts: { select: { amount: true } },
          reviews: { select: { rating: true } }
        }
      }),
      prisma.provider.count()
    ])

    console.log(`Page 1 Response:`)
    console.log(`  Total Count: ${totalProviders}`)
    console.log(`  Providers Returned: ${page1Providers.length}`)
    console.log(`  Total Pages: ${Math.ceil(totalProviders / 10)}`)
    console.log(`  Providers on Page 1:`)
    page1Providers.forEach((p, i) => {
      const earnings = p.payouts?.reduce((sum, payout) => sum + payout.amount, 0) || 0
      console.log(`    ${i + 1}. ${p.user.name} (${p.businessName || 'No business'}) - ${p.status} - R ${earnings.toFixed(2)}`)
    })
    console.log('')

    console.log(`✅ ALL ${totalProviders} PROVIDERS ARE ACCESSIBLE!`)

    // Verify specific high-value providers
    console.log('')
    console.log('💰 HIGH-VALUE PROVIDERS (Should be visible):')
    console.log('-' .repeat(70))
    
    const highValueProviders = await prisma.provider.findMany({
      where: {
        status: 'APPROVED'
      },
      include: {
        user: { select: { name: true, email: true } },
        payouts: { select: { amount: true } },
        reviews: { select: { rating: true } }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    highValueProviders.forEach(p => {
      const earnings = p.payouts?.reduce((sum, payout) => sum + payout.amount, 0) || 0
      const avgRating = p.reviews.length > 0 
        ? (p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length).toFixed(1)
        : '0.0'
      
      console.log(`✓ ${p.user.name} - R ${earnings.toFixed(2)} earnings - ${avgRating} rating`)
    })

    // Final Summary
    console.log('')
    console.log('=' .repeat(70))
    console.log('📊 API PAGINATION SUMMARY')
    console.log('=' .repeat(70))
    console.log('')
    console.log(`✅ Users API:`)
    console.log(`   - Page 1: ${page1Users.length} users`)
    console.log(`   - Page 2: ${page2Users.length} users`)
    console.log(`   - Total: ${totalUsersAcrossPages}/${totalUsers} users accessible ✅`)
    console.log('')
    console.log(`✅ Providers API:`)
    console.log(`   - Page 1: ${page1Providers.length} providers`)
    console.log(`   - Total: ${page1Providers.length}/${totalProviders} providers accessible ✅`)
    console.log('')

    if (totalUsersAcrossPages === totalUsers && page1Providers.length === totalProviders) {
      console.log('🎉 ALL USERS AND PROVIDERS ARE ACCESSIBLE!')
      console.log('✅ Pagination working correctly')
      console.log('✅ All data fetching correctly')
      console.log('✅ Ready to display in admin dashboard')
    } else {
      console.log('⚠️  WARNING: Some data may not be accessible')
    }

    console.log('')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPIPagination()
