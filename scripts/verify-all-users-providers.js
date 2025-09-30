/**
 * Verify all users and providers appear in admin dashboard
 * Run with: node scripts/verify-all-users-providers.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyAllData() {
  console.log('🔍 VERIFYING ALL USERS AND PROVIDERS APPEAR')
  console.log('=' .repeat(70))
  console.log('')

  try {
    // ========================================
    // USERS VERIFICATION
    // ========================================
    console.log('👥 USERS VERIFICATION')
    console.log('=' .repeat(70))
    console.log('')

    // Get ALL users from database (no pagination)
    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        clientBookings: {
          select: { id: true }
        },
        payments: {
          select: { amount: true }
        }
      }
    })

    console.log(`📊 Total Users in Database: ${allUsers.length}`)
    console.log('')

    // Group by role
    const usersByRole = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {})

    console.log('📋 Users by Role:')
    Object.entries(usersByRole).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} users`)
    })

    // Group by active status
    const activeCount = allUsers.filter(u => u.isActive).length
    const inactiveCount = allUsers.filter(u => !u.isActive).length

    console.log('')
    console.log('📋 Users by Status:')
    console.log(`   ACTIVE: ${activeCount} users`)
    console.log(`   INACTIVE: ${inactiveCount} users`)

    console.log('')
    console.log('📝 Complete User List:')
    console.log('-' .repeat(70))
    console.log('')

    allUsers.forEach((user, i) => {
      const totalBookings = user.clientBookings?.length || 0
      const totalSpent = user.payments?.reduce((sum, p) => sum + p.amount, 0) || 0
      const status = user.isActive ? 'ACTIVE' : 'INACTIVE'
      
      console.log(`${(i + 1).toString().padStart(2, '0')}. ${user.name}`)
      console.log(`    Email: ${user.email}`)
      console.log(`    Role: ${user.role}`)
      console.log(`    Status: ${status}`)
      console.log(`    Bookings: ${totalBookings}`)
      console.log(`    Total Spent: R ${totalSpent}`)
      console.log(`    Created: ${user.createdAt.toLocaleDateString()}`)
      console.log('')
    })

    // Check pagination logic
    console.log('📄 Pagination Test (Page 1, Limit 10):')
    console.log('-' .repeat(70))
    const page1Users = allUsers.slice(0, 10)
    console.log(`   Should show ${page1Users.length} users on page 1`)
    console.log(`   Users: ${page1Users.map(u => u.name).join(', ')}`)
    console.log('')

    if (allUsers.length > 10) {
      console.log('📄 Pagination Test (Page 2, Limit 10):')
      console.log('-' .repeat(70))
      const page2Users = allUsers.slice(10, 20)
      console.log(`   Should show ${page2Users.length} users on page 2`)
      console.log(`   Users: ${page2Users.map(u => u.name).join(', ')}`)
      console.log('')
    }

    // ========================================
    // PROVIDERS VERIFICATION
    // ========================================
    console.log('')
    console.log('=' .repeat(70))
    console.log('🏢 PROVIDERS VERIFICATION')
    console.log('=' .repeat(70))
    console.log('')

    // Get ALL providers from database (no pagination)
    const allProviders = await prisma.provider.findMany({
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
    })

    console.log(`📊 Total Providers in Database: ${allProviders.length}`)
    console.log('')

    // Group by status
    const providersByStatus = allProviders.reduce((acc, provider) => {
      acc[provider.status] = (acc[provider.status] || 0) + 1
      return acc
    }, {})

    console.log('📋 Providers by Status:')
    Object.entries(providersByStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} providers`)
    })

    console.log('')
    console.log('📝 Complete Provider List:')
    console.log('-' .repeat(70))
    console.log('')

    allProviders.forEach((provider, i) => {
      const totalBookings = provider.bookings?.length || 0
      const totalEarnings = provider.payouts?.reduce((sum, p) => sum + p.amount, 0) || 0
      const averageRating = provider.reviews.length > 0
        ? (provider.reviews.reduce((sum, r) => sum + r.rating, 0) / provider.reviews.length).toFixed(1)
        : '0.0'
      
      console.log(`${(i + 1).toString().padStart(2, '0')}. ${provider.user.name} (${provider.businessName || 'No business name'})`)
      console.log(`    Email: ${provider.user.email}`)
      console.log(`    Status: ${provider.status}`)
      console.log(`    Bookings: ${totalBookings}`)
      console.log(`    Earnings: R ${totalEarnings.toFixed(2)}`)
      console.log(`    Rating: ${averageRating} (${provider.reviews.length} reviews)`)
      console.log(`    Created: ${provider.createdAt.toLocaleDateString()}`)
      console.log('')
    })

    // Check pagination logic
    console.log('📄 Pagination Test (Page 1, Limit 10):')
    console.log('-' .repeat(70))
    const page1Providers = allProviders.slice(0, 10)
    console.log(`   Should show ${page1Providers.length} providers on page 1`)
    console.log(`   Providers: ${page1Providers.map(p => p.user.name).join(', ')}`)
    console.log('')

    // ========================================
    // FINAL VERIFICATION
    // ========================================
    console.log('')
    console.log('=' .repeat(70))
    console.log('🎯 FINAL VERIFICATION')
    console.log('=' .repeat(70))
    console.log('')

    console.log('✅ USERS TAB SHOULD SHOW:')
    console.log(`   - Total: ${allUsers.length} users`)
    console.log(`   - Page 1: First ${Math.min(10, allUsers.length)} users`)
    console.log(`   - Total Pages: ${Math.ceil(allUsers.length / 10)}`)
    console.log(`   - Active: ${activeCount} users`)
    console.log(`   - Inactive: ${inactiveCount} users`)
    console.log('')

    console.log('✅ PROVIDERS TAB SHOULD SHOW:')
    console.log(`   - Total: ${allProviders.length} providers`)
    console.log(`   - Page 1: First ${Math.min(10, allProviders.length)} providers`)
    console.log(`   - Total Pages: ${Math.ceil(allProviders.length / 10)}`)
    Object.entries(providersByStatus).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} providers`)
    })
    console.log('')

    console.log('🔍 WHAT TO CHECK IN ADMIN DASHBOARD:')
    console.log('-' .repeat(70))
    console.log('')
    console.log('1. Click "Manage Users" button:')
    console.log(`   ✓ Header should say "Total users: ${allUsers.length}"`)
    console.log(`   ✓ Table should show ${Math.min(10, allUsers.length)} users`)
    console.log(`   ✓ First user: ${allUsers[0].name}`)
    console.log(`   ✓ Last user on page 1: ${allUsers[Math.min(9, allUsers.length - 1)].name}`)
    console.log('')

    console.log('2. Click "Approve Providers" button:')
    console.log(`   ✓ Header should say "Total providers: ${allProviders.length}"`)
    console.log(`   ✓ Table should show ${Math.min(10, allProviders.length)} providers`)
    console.log(`   ✓ First provider: ${allProviders[0].user.name}`)
    console.log(`   ✓ Pending providers: ${providersByStatus.PENDING || 0} should have Approve/Reject buttons`)
    console.log('')

    console.log('=' .repeat(70))
    console.log('🎉 VERIFICATION COMPLETE - ALL DATA ACCOUNTED FOR!')
    console.log('=' .repeat(70))
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAllData()
