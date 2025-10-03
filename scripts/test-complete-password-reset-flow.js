#!/usr/bin/env node

/**
 * Complete Password Reset Flow Test
 * Tests the entire flow from forgot-password to reset-password
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

async function testCompleteFlow() {
  log('🔄 COMPLETE PASSWORD RESET FLOW TEST', 'info')
  log('====================================', 'info')
  
  try {
    // Step 1: Generate a password reset token
    log('\n📧 Step 1: Generating password reset token...')
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: TEST_EMAIL })
    })
    
    if (!response.ok) {
      const error = await response.json()
      log(`❌ Failed to generate token: ${error.error}`, 'error')
      return false
    }
    
    log('✅ Password reset token generated successfully', 'success')
    
    // Step 2: Get the token from database
    log('\n🔍 Step 2: Retrieving token from database...')
    const user = await db.user.findUnique({
      where: { email: TEST_EMAIL }
    })
    
    if (!user) {
      log(`❌ User not found: ${TEST_EMAIL}`, 'error')
      return false
    }
    
    const token = await db.passwordResetToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!token) {
      log('❌ No password reset token found', 'error')
      return false
    }
    
    log(`✅ Token found: ${token.token.substring(0, 10)}... (${token.token.length} chars)`, 'success')
    log(`⏰ Token expires: ${token.expires}`, 'info')
    
    // Step 3: Test token validation
    log('\n🔐 Step 3: Testing token validation...')
    if (token.token.length !== 64) {
      log(`❌ Token length invalid: ${token.token.length} (expected 64)`, 'error')
      return false
    }
    
    log('✅ Token format is valid', 'success')
    
    // Step 4: Test reset password API
    log('\n🔄 Step 4: Testing reset password API...')
    const resetResponse = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token.token,
        password: 'NewTestPassword123!'
      })
    })
    
    if (!resetResponse.ok) {
      const error = await resetResponse.json()
      log(`❌ Reset password failed: ${error.error}`, 'error')
      return false
    }
    
    const resetData = await resetResponse.json()
    log(`✅ Password reset successful: ${resetData.message}`, 'success')
    
    // Step 5: Verify token was deleted
    log('\n🗑️ Step 5: Verifying token cleanup...')
    const deletedToken = await db.passwordResetToken.findUnique({
      where: { id: token.id }
    })
    
    if (deletedToken) {
      log('⚠️ Token was not deleted after use', 'warning')
    } else {
      log('✅ Token was properly deleted after use', 'success')
    }
    
    // Step 6: Test with invalid token
    log('\n🚫 Step 6: Testing with invalid token...')
    const invalidResponse = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: 'invalid-token-123',
        password: 'NewTestPassword123!'
      })
    })
    
    if (invalidResponse.ok) {
      log('❌ Invalid token was accepted (should be rejected)', 'error')
      return false
    }
    
    const invalidError = await invalidResponse.json()
    log(`✅ Invalid token properly rejected: ${invalidError.error}`, 'success')
    
    log('\n🎉 ALL TESTS PASSED!', 'success')
    log('The complete password reset flow is working correctly.', 'success')
    
    return true
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'error')
    return false
  } finally {
    await db.$disconnect()
  }
}

if (require.main === module) {
  testCompleteFlow().catch(console.error)
}

module.exports = { testCompleteFlow }
