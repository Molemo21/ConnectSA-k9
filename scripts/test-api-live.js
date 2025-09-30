/**
 * Test the live admin stats API endpoint
 * Run with: node scripts/test-api-live.js
 */

async function testLiveAPI() {
  try {
    console.log('🧪 Testing live admin stats API endpoint...\n')
    console.log('Making request to: http://localhost:3000/api/admin/stats\n')

    const response = await fetch('http://localhost:3000/api/admin/stats', {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })

    console.log('📡 Response Status:', response.status, response.statusText)
    
    if (!response.ok) {
      console.error('❌ API returned error status')
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return
    }

    const data = await response.json()
    
    console.log('\n📊 API Response Data:')
    console.log('====================')
    console.log(JSON.stringify(data, null, 2))

    console.log('\n💰 Revenue Fields:')
    console.log('==================')
    console.log(`Total Revenue: R${data.totalRevenue || 0}`)
    console.log(`Pending Revenue: R${data.pendingRevenue || 0}`)
    console.log(`Escrow Revenue: R${data.escrowRevenue || 0}`)

    console.log('\n📈 Booking Fields:')
    console.log('==================')
    console.log(`Total Bookings: ${data.totalBookings || 0}`)
    console.log(`Completed Bookings: ${data.completedBookings || 0}`)
    console.log(`Cancelled Bookings: ${data.cancelledBookings || 0}`)

    if (data.totalRevenue === 0) {
      console.log('\n⚠️  WARNING: Revenue is ZERO in API response!')
      console.log('This means the issue is in the backend, not the frontend.')
      console.log('\nPossible causes:')
      console.log('1. Database connection using wrong DATABASE_URL')
      console.log('2. Admin data service cache is stale')
      console.log('3. Error in data fetching logic')
    } else {
      console.log('\n✅ Revenue is correct in API response!')
      console.log('The issue might be in the frontend display.')
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message)
    console.error('\nFull error:', error)
  }
}

testLiveAPI()
