/**
 * Test the admin data service directly
 * Run with: node scripts/test-admin-service-direct.js
 */

// Import the admin data service
async function testAdminService() {
  try {
    console.log('🧪 Testing Admin Data Service directly...\n')

    // Dynamically import the admin data service
    const { adminDataService } = await import('../lib/admin-data-service.js')
    
    console.log('✅ Admin data service imported successfully')
    console.log('📊 Fetching admin stats...\n')

    // Clear any cache first
    adminDataService.clearCache()
    console.log('🗑️  Cache cleared')

    // Fetch the stats
    const stats = await adminDataService.getAdminStats()
    
    console.log('📈 Admin Stats Result:')
    console.log('======================')
    console.log(JSON.stringify(stats, null, 2))

    console.log('\n💰 Revenue Breakdown:')
    console.log('====================')
    console.log(`Total Revenue: R${stats.totalRevenue}`)
    console.log(`Pending Revenue: R${stats.pendingRevenue}`)
    console.log(`Escrow Revenue: R${stats.escrowRevenue}`)

    console.log('\n📊 Booking Stats:')
    console.log('=================')
    console.log(`Total Bookings: ${stats.totalBookings}`)
    console.log(`Completed Bookings: ${stats.completedBookings}`)
    console.log(`Cancelled Bookings: ${stats.cancelledBookings}`)

    if (stats.totalRevenue === 0 || stats.totalRevenue === undefined) {
      console.log('\n⚠️  ISSUE FOUND: Revenue is ZERO or undefined!')
      console.log('\nDebugging info:')
      console.log('- Type of totalRevenue:', typeof stats.totalRevenue)
      console.log('- Is totalRevenue null?', stats.totalRevenue === null)
      console.log('- Is totalRevenue undefined?', stats.totalRevenue === undefined)
      console.log('- Completed bookings:', stats.completedBookings)
      
      if (stats.completedBookings > 0) {
        console.log('\n🔍 There ARE completed bookings, but revenue is not calculating!')
        console.log('This suggests an issue with the revenue calculation query.')
      }
    } else {
      console.log('\n✅ Revenue is correctly fetched: R' + stats.totalRevenue)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\nStack trace:', error.stack)
  }
}

testAdminService()
