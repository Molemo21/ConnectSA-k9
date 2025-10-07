#!/usr/bin/env node

/**
 * Non-Gmail Email Delivery Test Script
 * 
 * This script specifically tests email delivery to non-Gmail addresses
 * (Outlook, Hotmail, Yahoo, iCloud, etc.) to verify that the email
 * system works correctly with all major email providers.
 * 
 * Usage:
 *   node scripts/test-email-non-gmail-delivery.js
 * 
 * Environment variables required:
 *   RESEND_API_KEY - Your Resend API key
 *   FROM_EMAIL - The verified sender email address
 */

const crypto = require('crypto');

// IMPORTANT: Replace these with YOUR actual test email addresses
const TEST_EMAIL_ADDRESSES = {
  // Replace with your actual test email addresses
  outlook: 'your-email@outlook.com',   // CHANGE THIS
  hotmail: 'your-email@hotmail.com',   // CHANGE THIS
  yahoo: 'your-email@yahoo.com',       // CHANGE THIS
  gmail: 'your-email@gmail.com',       // CHANGE THIS (for comparison)
  // Add more providers as needed
  // icloud: 'your-email@icloud.com',
  // protonmail: 'your-email@protonmail.com',
};

// Configuration
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  resendApiKey: process.env.RESEND_API_KEY || 're_SDXQnpH5_EhXAJihxYgJRRgug7xjs6qcX',
  fromEmail: process.env.FROM_EMAIL || 'no-reply@app.proliinkconnect.co.za',
  timeout: 30000, // 30 seconds for API calls
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  debug: (msg) => console.log(`${colors.dim}🔍 ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`),
  section: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n${'-'.repeat(60)}`),
};

// Test results tracker
const results = {
  tests: [],
  passed: 0,
  failed: 0,
  warnings: 0,
};

function addResult(provider, test, success, message, details = {}) {
  results.tests.push({
    provider,
    test,
    success,
    message,
    details,
    timestamp: new Date().toISOString(),
  });
  
  if (success) {
    results.passed++;
  } else {
    results.failed++;
  }
}

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: Direct Resend API Test
async function testDirectResendAPI(provider, emailAddress) {
  log.section(`Testing Direct Resend API - ${provider}`);
  
  try {
    log.info(`Sending test email to ${emailAddress}...`);
    
    const emailData = {
      from: CONFIG.fromEmail,
      to: emailAddress,
      subject: `Test Email for ${provider} - Proliink Connect`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #f59e0b); padding: 30px; text-align: center; border-radius: 8px;">
            <h1 style="color: white; margin: 0;">🎉 Email Test Successful!</h1>
          </div>
          
          <div style="background: white; padding: 30px; margin-top: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937;">Email Provider: ${provider}</h2>
            <p style="color: #6b7280; line-height: 1.6;">
              This is a test email to verify that Proliink Connect can successfully send emails to <strong>${provider}</strong> addresses.
            </p>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>Email Provider:</strong> ${provider}</p>
              <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Recipient:</strong> ${emailAddress}</p>
              <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>
            
            <p style="color: #10b981; font-weight: bold;">
              ✅ If you're reading this, the email delivery is working correctly!
            </p>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px;">
              Proliink Connect Email Delivery Test<br>
              Sent via Resend
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Email Test for ${provider}

This is a test email to verify that Proliink Connect can successfully send emails to ${provider} addresses.

Email Provider: ${provider}
Recipient: ${emailAddress}
Timestamp: ${new Date().toISOString()}

✅ If you're reading this, the email delivery is working correctly!

---
Proliink Connect Email Delivery Test
      `.trim()
    };
    
    log.debug(`Request payload: ${JSON.stringify({ ...emailData, html: '[HTML CONTENT]', text: '[TEXT CONTENT]' })}`);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });
    
    log.info(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      log.success(`Email sent successfully to ${emailAddress}`);
      log.info(`Message ID: ${result.id}`);
      log.success(`✉️  Check your ${provider} inbox: ${emailAddress}`);
      log.warning('Also check your SPAM/JUNK folder if you don\'t see it in inbox');
      
      addResult(provider, 'Direct Resend API', true, 'Email sent successfully', {
        messageId: result.id,
        email: emailAddress,
      });
      
      return { success: true, messageId: result.id };
    } else {
      const error = await response.json();
      log.error(`Failed to send email to ${emailAddress}`);
      log.error(`Error: ${JSON.stringify(error, null, 2)}`);
      
      addResult(provider, 'Direct Resend API', false, 'Email sending failed', {
        error: error,
        status: response.status,
      });
      
      return { success: false, error };
    }
  } catch (error) {
    log.error(`Exception during email send: ${error.message}`);
    log.error(`Stack: ${error.stack}`);
    
    addResult(provider, 'Direct Resend API', false, `Exception: ${error.message}`, {
      error: error.message,
      stack: error.stack,
    });
    
    return { success: false, error: error.message };
  }
}

// Test 2: Test Signup Flow with Email Verification
async function testSignupFlow(provider, emailAddress) {
  log.section(`Testing Signup Flow - ${provider}`);
  
  try {
    const timestamp = Date.now();
    const testUser = {
      name: `Test ${provider} User`,
      email: emailAddress,
      password: `TestPass${timestamp}!`,
      phone: `+271${timestamp.toString().slice(-8)}`,
      role: 'CLIENT',
    };
    
    log.info(`Attempting signup with email: ${emailAddress}`);
    log.debug(`User data: ${JSON.stringify({ ...testUser, password: '[REDACTED]' })}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
    
    const response = await fetch(`${CONFIG.baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    log.info(`Signup response status: ${response.status} ${response.statusText}`);
    
    const responseData = await response.json();
    log.debug(`Response data: ${JSON.stringify(responseData, null, 2)}`);
    
    if (response.ok) {
      log.success(`Signup successful for ${emailAddress}`);
      
      // Check if email was sent
      if (responseData.emailFailed) {
        log.error(`⚠️  Account created but email failed to send!`);
        log.warning('This is the issue we\'re investigating');
        
        if (responseData.emailStatus) {
          log.error(`Email error: ${responseData.emailStatus.error}`);
        }
        
        addResult(provider, 'Signup Flow', false, 'Account created but email failed', {
          user: responseData.user,
          emailError: responseData.emailStatus?.error,
        });
        
        return { success: false, emailFailed: true, user: responseData.user };
      } else {
        log.success(`✉️  Verification email should be sent to ${emailAddress}`);
        log.success('Check your inbox and SPAM folder!');
        
        addResult(provider, 'Signup Flow', true, 'Account created and email sent', {
          user: responseData.user,
        });
        
        return { success: true, user: responseData.user };
      }
    } else {
      // Check if user already exists
      if (responseData.error && responseData.error.includes('already exists')) {
        log.warning(`User already exists: ${emailAddress}`);
        log.info('This is expected if you ran the test before');
        
        addResult(provider, 'Signup Flow', true, 'User already exists (expected)', {
          note: 'Previous test data',
        });
        
        return { success: true, userExists: true };
      } else {
        log.error(`Signup failed: ${responseData.error}`);
        
        addResult(provider, 'Signup Flow', false, `Signup failed: ${responseData.error}`, {
          error: responseData.error,
          status: response.status,
        });
        
        return { success: false, error: responseData.error };
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      log.error(`Signup request timeout after ${CONFIG.timeout}ms`);
      addResult(provider, 'Signup Flow', false, 'Request timeout', {
        timeout: CONFIG.timeout,
      });
    } else {
      log.error(`Exception during signup: ${error.message}`);
      addResult(provider, 'Signup Flow', false, `Exception: ${error.message}`, {
        error: error.message,
      });
    }
    
    return { success: false, error: error.message };
  }
}

// Test 3: Test Resend Verification
async function testResendVerification(provider, emailAddress) {
  log.section(`Testing Resend Verification - ${provider}`);
  
  try {
    log.info(`Requesting resend verification for ${emailAddress}...`);
    
    const response = await fetch(`${CONFIG.baseUrl}/api/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: emailAddress }),
    });
    
    log.info(`Resend response status: ${response.status} ${response.statusText}`);
    
    const responseData = await response.json();
    log.debug(`Response data: ${JSON.stringify(responseData, null, 2)}`);
    
    if (response.ok) {
      log.success(`Resend verification request successful`);
      log.success(`✉️  Verification email should be sent to ${emailAddress}`);
      log.success('Check your inbox and SPAM folder!');
      
      addResult(provider, 'Resend Verification', true, 'Resend successful', {
        message: responseData.message,
      });
      
      return { success: true };
    } else {
      // Check if already verified
      if (responseData.error && responseData.error.includes('already verified')) {
        log.warning('User is already verified (this is expected)');
        
        addResult(provider, 'Resend Verification', true, 'User already verified (expected)', {
          note: 'Account is verified',
        });
        
        return { success: true, alreadyVerified: true };
      } else {
        log.error(`Resend verification failed: ${responseData.error}`);
        
        addResult(provider, 'Resend Verification', false, `Failed: ${responseData.error}`, {
          error: responseData.error,
          status: response.status,
        });
        
        return { success: false, error: responseData.error };
      }
    }
  } catch (error) {
    log.error(`Exception during resend: ${error.message}`);
    
    addResult(provider, 'Resend Verification', false, `Exception: ${error.message}`, {
      error: error.message,
    });
    
    return { success: false, error: error.message };
  }
}

// Verify configuration
function verifyConfiguration() {
  log.section('Verifying Configuration');
  
  let configValid = true;
  
  // Check API Key
  if (!CONFIG.resendApiKey) {
    log.error('RESEND_API_KEY is not set!');
    log.error('Set it in your environment or .env file');
    configValid = false;
  } else {
    log.success(`API Key: ${CONFIG.resendApiKey.substring(0, 20)}...`);
  }
  
  // Check FROM email
  if (!CONFIG.fromEmail) {
    log.error('FROM_EMAIL is not set!');
    configValid = false;
  } else {
    log.success(`From Email: ${CONFIG.fromEmail}`);
  }
  
  // Check test emails
  const validEmails = Object.entries(TEST_EMAIL_ADDRESSES).filter(
    ([_, email]) => email && !email.includes('your-email')
  );
  
  if (validEmails.length === 0) {
    log.error('No valid test email addresses configured!');
    log.error('Please edit the TEST_EMAIL_ADDRESSES object in this script');
    log.error('Replace the placeholder emails with your actual test addresses');
    configValid = false;
  } else {
    log.success(`Test emails configured: ${validEmails.length}`);
    validEmails.forEach(([provider, email]) => {
      log.info(`  ${provider}: ${email}`);
    });
  }
  
  if (!configValid) {
    log.error('\n❌ Configuration is invalid. Please fix the issues above.');
    process.exit(1);
  }
  
  log.success('\n✅ Configuration is valid\n');
  return true;
}

// Main test execution
async function runTests() {
  log.header('📧 NON-GMAIL EMAIL DELIVERY TEST SUITE');
  
  // Verify configuration
  verifyConfiguration();
  
  log.info(`Base URL: ${CONFIG.baseUrl}`);
  log.info(`Testing email delivery to non-Gmail providers...`);
  log.info('');
  
  // Filter out invalid/placeholder emails
  const validTestEmails = Object.entries(TEST_EMAIL_ADDRESSES).filter(
    ([_, email]) => email && !email.includes('your-email')
  );
  
  if (validTestEmails.length === 0) {
    log.error('No valid test emails found. Please update TEST_EMAIL_ADDRESSES.');
    process.exit(1);
  }
  
  // Run tests for each provider
  for (const [provider, emailAddress] of validTestEmails) {
    log.header(`Testing ${provider.toUpperCase()} (${emailAddress})`);
    
    // Test 1: Direct Resend API (always test this first)
    await testDirectResendAPI(provider, emailAddress);
    await sleep(2000); // Wait 2 seconds between tests
    
    // Test 2: Signup flow
    await testSignupFlow(provider, emailAddress);
    await sleep(2000);
    
    // Test 3: Resend verification
    await testResendVerification(provider, emailAddress);
    await sleep(2000);
  }
  
  // Print summary
  printSummary();
}

function printSummary() {
  log.header('📊 TEST RESULTS SUMMARY');
  
  console.log(`\n${colors.bright}Overall Results:${colors.reset}`);
  console.log(`  Total Tests: ${results.passed + results.failed}`);
  console.log(`  ${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${results.failed}${colors.reset}`);
  
  if (results.tests.length > 0) {
    console.log(`\n${colors.bright}Detailed Results:${colors.reset}\n`);
    
    // Group by provider
    const byProvider = {};
    results.tests.forEach(test => {
      if (!byProvider[test.provider]) {
        byProvider[test.provider] = [];
      }
      byProvider[test.provider].push(test);
    });
    
    Object.entries(byProvider).forEach(([provider, tests]) => {
      console.log(`${colors.bright}${provider.toUpperCase()}:${colors.reset}`);
      tests.forEach(test => {
        const icon = test.success ? '✅' : '❌';
        const color = test.success ? colors.green : colors.red;
        console.log(`  ${icon} ${color}${test.test}: ${test.message}${colors.reset}`);
        
        if (!test.success && test.details.error) {
          console.log(`     ${colors.dim}Error: ${JSON.stringify(test.details.error)}${colors.reset}`);
        }
      });
      console.log('');
    });
  }
  
  // Final recommendations
  console.log(`${colors.bright}Recommendations:${colors.reset}`);
  
  if (results.failed === 0) {
    log.success('🎉 All tests passed! Email delivery is working correctly.');
    log.success('Check your email inboxes (and spam folders) to confirm receipt.');
  } else {
    log.warning('Some tests failed. Please review the errors above.');
    log.info('\nCommon issues and solutions:');
    log.info('1. Domain not verified in Resend:');
    log.info('   → Visit https://resend.com/domains and verify your domain');
    log.info('2. DNS records not configured:');
    log.info('   → Add SPF, DKIM, and DMARC records to your DNS');
    log.info('3. Invalid API key:');
    log.info('   → Check that RESEND_API_KEY is correct');
    log.info('4. Rate limiting:');
    log.info('   → Wait a few minutes and try again');
    log.info('5. Email provider blocking:');
    log.info('   → Check Resend dashboard for bounce/complaint reports');
  }
  
  log.info('\n📧 Next Steps:');
  log.info('1. Check all test email inboxes (including spam folders)');
  log.info('2. Verify emails arrived successfully');
  log.info('3. Check Resend dashboard: https://resend.com/emails');
  log.info('4. Review server logs for any additional errors');
  log.info('5. If emails didn\'t arrive, check DNS configuration');
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    log.error(`Test execution failed: ${error.message}`);
    log.error(error.stack);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testDirectResendAPI,
  testSignupFlow,
  testResendVerification,
};

