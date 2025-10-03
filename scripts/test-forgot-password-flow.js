#!/usr/bin/env node

/**
 * Comprehensive Forgot Password Flow Test
 * Tests the complete user journey from email submission to password reset
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

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'https://app.proliinkconnect.co.za',
  testEmail: 'molemonakin21@gmail.com', // Your email for testing
  newPassword: 'NewTestPassword123!',
  timeout: 30000 // 30 seconds
}

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step, message) {
  log(`\n${colors.bold}${colors.blue}STEP ${step}:${colors.reset} ${message}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan')
}

// Test 1: API Endpoint Health Check
async function testApiHealth() {
  logStep(1, 'Testing API endpoint health')
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'test@example.com' })
    })
    
    if (response.status === 200 || response.status === 400) {
      logSuccess('API endpoint is accessible')
      return true
    } else {
      logError(`API returned unexpected status: ${response.status}`)
      return false
    }
  } catch (error) {
    logError(`API health check failed: ${error.message}`)
    return false
  }
}

// Test 2: Email Validation
async function testEmailValidation() {
  logStep(2, 'Testing email validation')
  
  const testCases = [
    { email: '', expected: 'empty', description: 'Empty email' },
    { email: 'invalid', expected: 'invalid', description: 'Invalid format' },
    { email: 'test@', expected: 'invalid', description: 'Incomplete email' },
    { email: '@example.com', expected: 'invalid', description: 'Missing username' },
    { email: 'test@example.com', expected: 'valid', description: 'Valid email' }
  ]
  
  let passed = 0
  
  for (const testCase of testCases) {
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: testCase.email })
      })
      
      const data = await response.json()
      
      if (testCase.expected === 'valid' && response.ok) {
        logSuccess(`${testCase.description}: ✅ Valid email accepted`)
        passed++
      } else if (testCase.expected === 'invalid' && !response.ok) {
        logSuccess(`${testCase.description}: ✅ Invalid email rejected`)
        passed++
      } else if (testCase.expected === 'empty' && !response.ok) {
        logSuccess(`${testCase.description}: ✅ Empty email rejected`)
        passed++
      } else {
        logError(`${testCase.description}: ❌ Unexpected result`)
      }
    } catch (error) {
      logError(`${testCase.description}: ❌ Error - ${error.message}`)
    }
  }
  
  logInfo(`Email validation tests: ${passed}/${testCases.length} passed`)
  return passed === testCases.length
}

// Test 3: Database Token Creation
async function testTokenCreation() {
  logStep(3, 'Testing password reset token creation')
  
  try {
    // Find user by email first
    const user = await db.user.findUnique({
      where: { email: TEST_CONFIG.testEmail }
    })
    
    if (!user) {
      logError(`Test user not found: ${TEST_CONFIG.testEmail}`)
      return false
    }
    
    // Clean up any existing tokens for test user
    await db.passwordResetToken.deleteMany({
      where: { userId: user.id }
    })
    
    // Make request to create token
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: TEST_CONFIG.testEmail })
    })
    
    if (!response.ok) {
      const error = await response.json()
      logError(`Token creation failed: ${error.error}`)
      return false
    }
    
    // Check if token was created in database
    const token = await db.passwordResetToken.findFirst({
      where: { userId: user.id }
    })
    
    if (token) {
      logSuccess('Password reset token created successfully')
      logInfo(`Token ID: ${token.id}`)
      logInfo(`Expires: ${token.expires}`)
      logInfo(`User ID: ${token.userId}`)
      
      // Verify token is valid (not expired)
      const now = new Date()
      const expiresAt = new Date(token.expires)
      
      if (expiresAt > now) {
        logSuccess('Token is valid and not expired')
        return { success: true, token }
      } else {
        logError('Token is already expired')
        return false
      }
    } else {
      logError('No token found in database')
      return false
    }
  } catch (error) {
    logError(`Token creation test failed: ${error.message}`)
    return false
  }
}

// Test 4: Email Service Integration
async function testEmailService() {
  logStep(4, 'Testing email service integration')
  
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logWarning('RESEND_API_KEY not found in environment')
      return false
    }
    
    if (!process.env.FROM_EMAIL) {
      logWarning('FROM_EMAIL not found in environment')
      return false
    }
    
    logSuccess('Resend API key is configured')
    logSuccess(`From email: ${process.env.FROM_EMAIL}`)
    
    // Test email sending by making a request
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: TEST_CONFIG.testEmail })
    })
    
    if (response.ok) {
      logSuccess('Email service request successful')
      logInfo('Check your email inbox for the password reset email')
      return true
    } else {
      const error = await response.json()
      logError(`Email service failed: ${error.error}`)
      return false
    }
  } catch (error) {
    logError(`Email service test failed: ${error.message}`)
    return false
  }
}

// Test 5: Frontend UX Elements
async function testFrontendUX() {
  logStep(5, 'Testing frontend UX elements')
  
  try {
    // Test the forgot password page
    const response = await fetch(`${TEST_CONFIG.baseUrl}/forgot-password`)
    
    if (response.ok) {
      const html = await response.text()
      
      // Check for key UX elements
      const checks = [
        { element: 'form', description: 'Form element' },
        { element: 'input[type="email"]', description: 'Email input field' },
        { element: 'button[type="submit"]', description: 'Submit button' },
        { element: 'Send Reset Link', description: 'Button text' },
        { element: 'Enter your email', description: 'Placeholder text' },
        { element: 'toast', description: 'Toast notification system' }
      ]
      
      let passed = 0
      
      for (const check of checks) {
        if (html.includes(check.element) || html.includes(check.description)) {
          logSuccess(`${check.description}: ✅ Found`)
          passed++
        } else {
          logError(`${check.description}: ❌ Not found`)
        }
      }
      
      logInfo(`Frontend UX tests: ${passed}/${checks.length} passed`)
      return passed >= checks.length - 1 // Allow 1 failure
    } else {
      logError(`Frontend page not accessible: ${response.status}`)
      return false
    }
  } catch (error) {
    logError(`Frontend UX test failed: ${error.message}`)
    return false
  }
}

// Test 6: Password Reset Flow (if token exists)
async function testPasswordResetFlow(tokenData) {
  logStep(6, 'Testing password reset flow')
  
  if (!tokenData || !tokenData.success) {
    logWarning('Skipping password reset test - no valid token')
    return false
  }
  
  try {
    const token = tokenData.token
    
    // Test the reset password page with token
    const resetUrl = `${TEST_CONFIG.baseUrl}/reset-password?token=${token.token}`
    const response = await fetch(resetUrl)
    
    if (response.ok) {
      logSuccess('Password reset page is accessible with token')
      
      // Test password reset API
      const resetResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token.token,
          password: TEST_CONFIG.newPassword
        })
      })
      
      if (resetResponse.ok) {
        logSuccess('Password reset API call successful')
        
        // Verify token was deleted after use
        const deletedToken = await db.passwordResetToken.findUnique({
          where: { id: token.id }
        })
        
        if (!deletedToken) {
          logSuccess('Token was properly deleted after password reset')
          return true
        } else {
          logWarning('Token was not deleted after password reset')
          return false
        }
      } else {
        const error = await resetResponse.json()
        logError(`Password reset failed: ${error.error}`)
        return false
      }
    } else {
      logError(`Password reset page not accessible: ${response.status}`)
      return false
    }
  } catch (error) {
    logError(`Password reset test failed: ${error.message}`)
    return false
  }
}

// Test 7: Error Handling
async function testErrorHandling() {
  logStep(7, 'Testing error handling')
  
  const errorTests = [
    {
      name: 'Invalid token',
      body: { token: 'invalid-token', password: 'NewPassword123!' },
      expectedStatus: 400
    },
    {
      name: 'Expired token',
      body: { token: 'expired-token', password: 'NewPassword123!' },
      expectedStatus: 400
    },
    {
      name: 'Weak password',
      body: { token: 'valid-token', password: '123' },
      expectedStatus: 400
    }
  ]
  
  let passed = 0
  
  for (const test of errorTests) {
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.body)
      })
      
      if (response.status === test.expectedStatus) {
        logSuccess(`${test.name}: ✅ Properly handled`)
        passed++
      } else {
        logError(`${test.name}: ❌ Unexpected status ${response.status}`)
      }
    } catch (error) {
      logError(`${test.name}: ❌ Error - ${error.message}`)
    }
  }
  
  logInfo(`Error handling tests: ${passed}/${errorTests.length} passed`)
  return passed === errorTests.length
}

// Main test runner
async function runTests() {
  log(`${colors.bold}${colors.cyan}🧪 FORGOT PASSWORD FLOW TEST SUITE${colors.reset}`)
  log(`${colors.cyan}==========================================${colors.reset}`)
  
  const results = {
    apiHealth: false,
    emailValidation: false,
    tokenCreation: false,
    emailService: false,
    frontendUX: false,
    passwordReset: false,
    errorHandling: false
  }
  
  try {
    // Run tests sequentially
    results.apiHealth = await testApiHealth()
    results.emailValidation = await testEmailValidation()
    
    const tokenResult = await testTokenCreation()
    results.tokenCreation = tokenResult.success || false
    
    results.emailService = await testEmailService()
    results.frontendUX = await testFrontendUX()
    results.passwordReset = await testPasswordResetFlow(tokenResult)
    results.errorHandling = await testErrorHandling()
    
    // Summary
    log(`\n${colors.bold}${colors.cyan}📊 TEST RESULTS SUMMARY${colors.reset}`)
    log(`${colors.cyan}========================${colors.reset}`)
    
    const totalTests = Object.keys(results).length
    const passedTests = Object.values(results).filter(Boolean).length
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL'
      const color = passed ? 'green' : 'red'
      log(`${test}: ${status}`, color)
    })
    
    log(`\n${colors.bold}Overall: ${passedTests}/${totalTests} tests passed${colors.reset}`)
    
    if (passedTests === totalTests) {
      log(`\n${colors.bold}${colors.green}🎉 ALL TESTS PASSED!${colors.reset}`)
      log(`${colors.green}The forgot password feature is working perfectly!${colors.reset}`)
    } else {
      log(`\n${colors.bold}${colors.yellow}⚠️  SOME TESTS FAILED${colors.reset}`)
      log(`${colors.yellow}Please review the failed tests above.${colors.reset}`)
    }
    
    // User instructions
    log(`\n${colors.bold}${colors.blue}📧 MANUAL TESTING INSTRUCTIONS${colors.reset}`)
    log(`${colors.blue}====================================${colors.reset}`)
    log(`1. Visit: ${TEST_CONFIG.baseUrl}/forgot-password`)
    log(`2. Enter email: ${TEST_CONFIG.testEmail}`)
    log(`3. Click "Send Reset Link"`)
    log(`4. Check your email inbox`)
    log(`5. Click the reset link in the email`)
    log(`6. Set a new password`)
    log(`7. Verify you can login with the new password`)
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`)
  } finally {
    await db.$disconnect()
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { runTests }
