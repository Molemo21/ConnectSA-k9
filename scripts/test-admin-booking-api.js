#!/usr/bin/env node

/**
 * Test Script: Check Admin Booking API Directly
 * 
 * This script tests the admin booking API endpoint directly
 * to see if it's working correctly.
 */

const fetch = require('node-fetch')

async function testAdminBookingAPI() {
  console.log('🔍 Testing Admin Booking API...\n')

  try {
    // Test 1: Check if API endpoint is accessible
    console.log('1️⃣ Testing API endpoint accessibility...')
    const response = await fetch('http://localhost:3000/api/admin/bookings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without proper auth, but we can see the error
      }
    })

    console.log(`📊 Response status: ${response.status}`)
    
    if (response.status === 401) {
      console.log('✅ API endpoint is accessible (401 Unauthorized is expected without auth)')
    } else if (response.status === 200) {
      console.log('✅ API endpoint is working!')
      const data = await response.json()
      console.log(`📊 Bookings returned: ${data.bookings?.length || 0}`)
      console.log(`📊 Total count: ${data.totalCount || 0}`)
    } else {
      console.log(`❌ Unexpected status: ${response.status}`)
      const errorText = await response.text()
      console.log(`Error: ${errorText}`)
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message)
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Server is not running. Start the development server with: npm run dev')
    }
  }

  console.log('\n🎯 Test Complete!')
  console.log('\n💡 Next steps:')
  console.log('   1. Check if the development server is running')
  console.log('   2. Test the API with proper authentication')
  console.log('   3. Check the database schema in production')
  console.log('   4. Verify the Prisma client is up to date')
}

// Run the test
testAdminBookingAPI()
