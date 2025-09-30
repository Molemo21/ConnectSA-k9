#!/usr/bin/env node

/**
 * Comprehensive Admin API Test Script
 * Tests all admin API endpoints to ensure they work in production
 */

const BASE_URL = process.env.ADMIN_API_BASE_URL || 'https://app.proliinkconnect.co.za'

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    console.log(`\n🧪 Testing ${method} ${endpoint}...`)
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you'll need proper authentication
        // This is just for testing the endpoint structure
      }
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    const data = await response.json()
    
    if (response.ok) {
      console.log(`✅ ${endpoint} - Status: ${response.status}`)
      if (data.providers) {
        console.log(`   📊 Providers: ${data.providers.length} returned`)
      }
      if (data.bookings) {
        console.log(`   📊 Bookings: ${data.bookings.length} returned`)
      }
      if (data.totalCount !== undefined) {
        console.log(`   📊 Total Count: ${data.totalCount}`)
      }
      return { success: true, data }
    } else {
      console.log(`❌ ${endpoint} - Status: ${response.status}`)
      console.log(`   Error: ${data.error || 'Unknown error'}`)
      if (data.details) {
        console.log(`   Details: ${data.details}`)
      }
      return { success: false, error: data }
    }
  } catch (error) {
    console.log(`💥 ${endpoint} - Network Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🚀 Starting Comprehensive Admin API Tests')
  console.log(`📍 Testing against: ${BASE_URL}`)
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  }
  
  // Test 1: Database connectivity
  console.log('\n📋 Test 1: Database Connectivity')
  const dbTest = await testEndpoint('/api/admin/test-database')
  results.total++
  if (dbTest.success) {
    results.passed++
    console.log('   ✅ Database connection working')
  } else {
    results.failed++
    console.log('   ❌ Database connection failed')
  }
  
  // Test 2: Simple providers API
  console.log('\n📋 Test 2: Simple Providers API')
  const simpleProviders = await testEndpoint('/api/admin/providers-simple')
  results.total++
  if (simpleProviders.success) {
    results.passed++
    console.log('   ✅ Simple providers API working')
  } else {
    results.failed++
    console.log('   ❌ Simple providers API failed')
  }
  
  // Test 3: Main providers API
  console.log('\n📋 Test 3: Main Providers API')
  const providers = await testEndpoint('/api/admin/providers?page=1&limit=5')
  results.total++
  if (providers.success) {
    results.passed++
    console.log('   ✅ Main providers API working')
  } else {
    results.failed++
    console.log('   ❌ Main providers API failed')
  }
  
  // Test 4: Bookings API
  console.log('\n📋 Test 4: Bookings API')
  const bookings = await testEndpoint('/api/admin/bookings?page=1&limit=5')
  results.total++
  if (bookings.success) {
    results.passed++
    console.log('   ✅ Bookings API working')
  } else {
    results.failed++
    console.log('   ❌ Bookings API failed')
  }
  
  // Test 5: Users API
  console.log('\n📋 Test 5: Users API')
  const users = await testEndpoint('/api/admin/users?page=1&limit=5')
  results.total++
  if (users.success) {
    results.passed++
    console.log('   ✅ Users API working')
  } else {
    results.failed++
    console.log('   ❌ Users API failed')
  }
  
  // Test 6: Stats API
  console.log('\n📋 Test 6: Stats API')
  const stats = await testEndpoint('/api/admin/stats')
  results.total++
  if (stats.success) {
    results.passed++
    console.log('   ✅ Stats API working')
  } else {
    results.failed++
    console.log('   ❌ Stats API failed')
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:')
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📈 Total: ${results.total}`)
  console.log(`🎯 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`)
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Admin APIs are working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Check the error details above.')
  }
  
  return results
}

// Run the tests
runTests().catch(console.error)
