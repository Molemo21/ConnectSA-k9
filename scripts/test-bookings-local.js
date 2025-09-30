#!/usr/bin/env node

/**
 * Test Bookings API Locally
 */

const BASE_URL = 'http://localhost:3000'

async function testBookingsAPI() {
  try {
    console.log('🧪 Testing Bookings API locally...')
    
    const response = await fetch(`${BASE_URL}/api/admin/bookings?page=1&limit=5`)
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Bookings API working locally')
      console.log(`   📊 Found ${data.bookings?.length || 0} bookings`)
      console.log(`   📊 Total count: ${data.totalCount || 0}`)
    } else {
      console.log('❌ Bookings API failed locally')
      console.log(`   Status: ${response.status}`)
      console.log(`   Error: ${data.error || 'Unknown error'}`)
      if (data.details) {
        console.log(`   Details: ${data.details}`)
      }
    }
  } catch (error) {
    console.log('💥 Network error:', error.message)
  }
}

testBookingsAPI()
