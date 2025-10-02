#!/usr/bin/env node

/**
 * Email Service Test
 * Tests the email sending functionality specifically
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

async function testEmailService() {
  log('📧 EMAIL SERVICE TEST', 'info')
  log('====================', 'info')
  
  try {
    // Test 1: Check Resend API key
    log('\n🔑 Checking Resend API key...')
    if (!process.env.RESEND_API_KEY) {
      log('❌ RESEND_API_KEY not found', 'error')
      return false
    }
    
    const apiKey = process.env.RESEND_API_KEY
    log(`✅ API Key found: ${apiKey.substring(0, 20)}...`, 'success')
    
    // Test 2: Check FROM_EMAIL
    log('\n📧 Checking FROM_EMAIL...')
    if (!process.env.FROM_EMAIL) {
      log('❌ FROM_EMAIL not found', 'error')
      return false
    }
    
    log(`✅ FROM_EMAIL: ${process.env.FROM_EMAIL}`, 'success')
    
    // Test 3: Test Resend API directly
    log('\n🌐 Testing Resend API directly...')
    
    const testEmailData = {
      from: process.env.FROM_EMAIL,
      to: TEST_EMAIL,
      subject: 'Test Email - Proliink Connect',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify Resend integration.</p>
        <p>If you receive this, the email service is working!</p>
      `
    }
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEmailData)
    })
    
    log(`📡 Resend API Response Status: ${response.status}`)
    
    if (response.ok) {
      const result = await response.json()
      log(`✅ Email sent successfully!`, 'success')
      log(`📧 Email ID: ${result.id}`)
      log(`📬 Check your inbox: ${TEST_EMAIL}`)
      return true
    } else {
      const error = await response.json()
      log(`❌ Resend API Error:`, 'error')
      log(`   Status: ${response.status}`)
      log(`   Error: ${JSON.stringify(error, null, 2)}`)
      return false
    }
    
  } catch (error) {
    log(`❌ Email service test failed: ${error.message}`, 'error')
    return false
  }
}

async function testPasswordResetEmail() {
  log('\n🔐 TESTING PASSWORD RESET EMAIL', 'info')
  log('================================', 'info')
  
  try {
    // Find user
    const user = await db.user.findUnique({
      where: { email: TEST_EMAIL },
      select: { id: true, name: true, email: true }
    })
    
    if (!user) {
      log(`❌ User not found: ${TEST_EMAIL}`, 'error')
      return false
    }
    
    log(`✅ User found: ${user.name}`, 'success')
    
    // Create test token
    const token = 'test-token-' + Date.now()
    const expires = new Date(Date.now() + 60 * 60 * 1000)
    
    await db.passwordResetToken.deleteMany({
      where: { userId: user.id }
    })
    
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires
      }
    })
    
    log(`✅ Test token created`, 'success')
    
    // Test the email template
    const resetLink = `https://app.proliinkconnect.co.za/reset-password?token=${token}`
    
    // Import the email template (simplified version)
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Password Reset - Proliink Connect</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981, #f59e0b); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Proliink Connect</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0;">Password Reset Request</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin: 0 0 20px 0;">Reset Your Password</h2>
        
        <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
          Hello ${user.name || 'there'},<br><br>
          We received a request to reset your password for your Proliink Connect account.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: linear-gradient(135deg, #10b981, #f59e0b); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color: #10b981;">${resetLink}</a>
        </p>
        
        <div style="border-top: 1px solid #e5e7eb; margin: 30px 0 0 0; padding: 20px 0 0 0;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This link will expire in 1 hour for security reasons.<br>
            If you didn't request this password reset, please ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
    `
    
    // Send test email
    const emailData = {
      from: process.env.FROM_EMAIL,
      to: user.email,
      subject: 'Password Reset Request - Proliink Connect',
      html: emailHtml
    }
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })
    
    log(`📡 Password Reset Email Response: ${response.status}`)
    
    if (response.ok) {
      const result = await response.json()
      log(`✅ Password reset email sent!`, 'success')
      log(`📧 Email ID: ${result.id}`)
      log(`🔗 Reset Link: ${resetLink}`)
      log(`📬 Check your inbox: ${user.email}`)
      return true
    } else {
      const error = await response.json()
      log(`❌ Password reset email failed:`, 'error')
      log(`   Status: ${response.status}`)
      log(`   Error: ${JSON.stringify(error, null, 2)}`)
      return false
    }
    
  } catch (error) {
    log(`❌ Password reset email test failed: ${error.message}`, 'error')
    return false
  }
}

async function runTests() {
  const emailTest = await testEmailService()
  const passwordResetTest = await testPasswordResetEmail()
  
  log('\n📊 FINAL RESULTS:', 'info')
  log(`Email Service: ${emailTest ? '✅ PASS' : '❌ FAIL'}`, emailTest ? 'success' : 'error')
  log(`Password Reset Email: ${passwordResetTest ? '✅ PASS' : '❌ FAIL'}`, passwordResetTest ? 'success' : 'error')
  
  if (emailTest && passwordResetTest) {
    log('\n🎉 ALL EMAIL TESTS PASSED!', 'success')
    log('The email service is working correctly.', 'success')
    log('The issue might be in the API route logic.', 'warning')
  } else {
    log('\n⚠️  EMAIL TESTS FAILED', 'warning')
    log('Please check the Resend configuration.', 'warning')
  }
  
  await db.$disconnect()
}

if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { runTests }
