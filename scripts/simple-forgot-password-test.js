#!/usr/bin/env node

/**
 * Simple Forgot Password Test
 * Tests the API step by step to identify the exact issue
 */

const { PrismaClient } = require('@prisma/client')

// Initialize Prisma client
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

const TEST_EMAIL = 'molemonakin21@gmail.com'
const BASE_URL = 'https://app.proliinkconnect.co.za'

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  }
  console.log(`${colors[type]}${message}${colors.reset}`)
}

async function testStep(step, description, testFn) {
  log(`\n🔍 STEP ${step}: ${description}`)
  try {
    const result = await testFn()
    if (result) {
      log(`✅ PASS`, 'success')
      return true
    } else {
      log(`❌ FAIL`, 'error')
      return false
    }
  } catch (error) {
    log(`❌ ERROR: ${error.message}`, 'error')
    return false
  }
}

async function runTests() {
  log('🧪 SIMPLE FORGOT PASSWORD TEST', 'info')
  log('================================', 'info')
  
  let passed = 0
  let total = 0
  
  // Test 1: Check if user exists
  total++
  const userExists = await testStep(1, 'Check if test user exists', async () => {
    const user = await db.user.findUnique({
      where: { email: TEST_EMAIL },
      select: { id: true, name: true, email: true }
    })
    
    if (user) {
      log(`   User found: ${user.name} (${user.email})`)
      return true
    } else {
      log(`   User not found: ${TEST_EMAIL}`)
      return false
    }
  })
  if (userExists) passed++
  
  // Test 2: Check database connection
  total++
  const dbWorks = await testStep(2, 'Test database connection', async () => {
    const count = await db.user.count()
    log(`   Total users in database: ${count}`)
    return count >= 0
  })
  if (dbWorks) passed++
  
  // Test 3: Test token creation directly
  total++
  const tokenCreation = await testStep(3, 'Test token creation in database', async () => {
    if (!userExists) {
      log('   Skipping - user does not exist')
      return false
    }
    
    const user = await db.user.findUnique({
      where: { email: TEST_EMAIL }
    })
    
    // Clean up existing tokens
    await db.passwordResetToken.deleteMany({
      where: { userId: user.id }
    })
    
    // Create new token
    const token = 'test-token-' + Date.now()
    const expires = new Date(Date.now() + 60 * 60 * 1000)
    
    const newToken = await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires
      }
    })
    
    log(`   Token created: ${newToken.id}`)
    return true
  })
  if (tokenCreation) passed++
  
  // Test 4: Test API endpoint
  total++
  const apiTest = await testStep(4, 'Test API endpoint', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: TEST_EMAIL })
    })
    
    log(`   API Response Status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      log(`   API Response: ${JSON.stringify(data)}`)
      return true
    } else {
      const error = await response.json()
      log(`   API Error: ${JSON.stringify(error)}`)
      return false
    }
  })
  if (apiTest) passed++
  
  // Test 5: Check environment variables
  total++
  const envTest = await testStep(5, 'Check environment variables', async () => {
    const required = ['DATABASE_URL', 'RESEND_API_KEY', 'FROM_EMAIL']
    let allPresent = true
    
    for (const envVar of required) {
      if (process.env[envVar]) {
        log(`   ✅ ${envVar}: ${process.env[envVar].substring(0, 20)}...`)
      } else {
        log(`   ❌ ${envVar}: Not set`)
        allPresent = false
      }
    }
    
    return allPresent
  })
  if (envTest) passed++
  
  // Summary
  log(`\n📊 RESULTS: ${passed}/${total} tests passed`, passed === total ? 'success' : 'warning')
  
  if (passed === total) {
    log('\n🎉 ALL TESTS PASSED!', 'success')
    log('The forgot password feature should be working.', 'success')
  } else {
    log('\n⚠️  SOME TESTS FAILED', 'warning')
    log('Please check the failed tests above.', 'warning')
  }
  
  // Manual testing instructions
  log('\n📋 MANUAL TESTING STEPS:', 'info')
  log('1. Open browser and go to: https://app.proliinkconnect.co.za/forgot-password', 'info')
  log('2. Enter email: ' + TEST_EMAIL, 'info')
  log('3. Click "Send Reset Link" button', 'info')
  log('4. Check for toast notification', 'info')
  log('5. Check your email inbox', 'info')
  log('6. Click the reset link in the email', 'info')
  log('7. Set a new password', 'info')
  
  await db.$disconnect()
}

if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { runTests }
