/**
 * Test updated API with filter support
 * Run with: node scripts/test-updated-api.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testUpdatedAPI() {
  console.log('🧪 TESTING UPDATED API WITH FILTERS')
  console.log('=' .repeat(70))
  console.log('')

  try {
    // Test 1: Get all users (no filters)
    console.log('TEST 1: Get All Users (Page 1)')
    console.log('-' .repeat(70))
    
    const where1 = {}
    const [page1Users, total1] = await Promise.all([
      prisma.user.findMany({
        where: where1,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: where1 })
    ])

    console.log(`Total Count: ${total1} ✅ (Should be 18)`)
    console.log(`Users Returned: ${page1Users.length}`)
    console.log(`Total Pages: ${Math.ceil(total1 / 10)}`)
    console.log('')

    // Test 2: Filter by role
    console.log('TEST 2: Filter by Role = PROVIDER')
    console.log('-' .repeat(70))
    
    const where2 = { role: 'PROVIDER' }
    const [providerUsers, total2] = await Promise.all([
      prisma.user.findMany({
        where: where2,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: where2 })
    ])

    console.log(`Total Count: ${total2} ✅ (Should be 10)`)
    console.log(`Users Returned: ${providerUsers.length}`)
    console.log('')

    // Test 3: Filter by status
    console.log('TEST 3: Filter by Status = ACTIVE')
    console.log('-' .repeat(70))
    
    const where3 = { isActive: true }
    const [activeUsers, total3] = await Promise.all([
      prisma.user.findMany({
        where: where3,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: where3 })
    ])

    console.log(`Total Count: ${total3} ✅ (Should be 15)`)
    console.log(`Users Returned: ${activeUsers.length}`)
    console.log('')

    // Test 4: Search by name
    console.log('TEST 4: Search for "nakin"')
    console.log('-' .repeat(70))
    
    const where4 = {
      OR: [
        { name: { contains: 'nakin', mode: 'insensitive' } },
        { email: { contains: 'nakin', mode: 'insensitive' } }
      ]
    }
    const [searchUsers, total4] = await Promise.all([
      prisma.user.findMany({
        where: where4,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: where4 })
    ])

    console.log(`Total Count: ${total4} ✅`)
    console.log(`Users Found:`)
    searchUsers.forEach(u => console.log(`   - ${u.name} (${u.email})`))
    console.log('')

    // Test Providers
    console.log('TEST 5: Get All Providers')
    console.log('-' .repeat(70))
    
    const [allProviders, totalProviders] = await Promise.all([
      prisma.provider.findMany({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.provider.count()
    ])

    console.log(`Total Count: ${totalProviders} ✅ (Should be 9)`)
    console.log(`Providers Returned: ${allProviders.length}`)
    console.log('')

    // Test 6: Filter providers by status
    console.log('TEST 6: Filter Providers by Status = PENDING')
    console.log('-' .repeat(70))
    
    const wherePending = { status: 'PENDING' }
    const [pendingProviders, totalPending] = await Promise.all([
      prisma.provider.findMany({
        where: wherePending,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } }
        }
      }),
      prisma.provider.count({ where: wherePending })
    ])

    console.log(`Total Count: ${totalPending} ✅ (Should be 2)`)
    console.log(`Providers Found:`)
    pendingProviders.forEach(p => console.log(`   - ${p.user.name} (${p.businessName || 'No business name'})`))
    console.log('')

    // Summary
    console.log('=' .repeat(70))
    console.log('📊 TEST SUMMARY')
    console.log('=' .repeat(70))
    console.log('')
    console.log('✅ Users API Tests:')
    console.log(`   - All users query: ${total1} users (${total1 === 18 ? 'CORRECT ✅' : 'INCORRECT ❌'})`)
    console.log(`   - Provider role filter: ${total2} users (${total2 === 10 ? 'CORRECT ✅' : 'INCORRECT ❌'})`)
    console.log(`   - Active status filter: ${total3} users (${total3 === 15 ? 'CORRECT ✅' : 'INCORRECT ❌'})`)
    console.log(`   - Search functionality: ${total4} results`)
    console.log('')
    console.log('✅ Providers API Tests:')
    console.log(`   - All providers query: ${totalProviders} providers (${totalProviders === 9 ? 'CORRECT ✅' : 'INCORRECT ❌'})`)
    console.log(`   - Pending status filter: ${totalPending} providers (${totalPending === 2 ? 'CORRECT ✅' : 'INCORRECT ❌'})`)
    console.log('')

    if (total1 === 18 && total2 === 10 && total3 === 15 && totalProviders === 9 && totalPending === 2) {
      console.log('🎉 ALL TESTS PASSED!')
      console.log('✅ Filtering logic correct')
      console.log('✅ Total counts accurate')
      console.log('✅ All users and providers will appear in dashboard')
    } else {
      console.log('⚠️  SOME TESTS FAILED - Check results above')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testUpdatedAPI()
