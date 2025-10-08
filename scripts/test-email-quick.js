#!/usr/bin/env node

/**
 * Quick Email Delivery Test
 * 
 * This script tests email delivery using the Resend API directly.
 * It's a quick way to verify the email service is working.
 * 
 * Usage:
 *   RESEND_API_KEY=your_key node scripts/test-email-quick.js your-email@example.com
 */

const apiKey = process.env.RESEND_API_KEY || 're_SDXQnpH5_EhXAJihxYgJRRgug7xjs6qcX';
const fromEmail = process.env.FROM_EMAIL || 'no-reply@app.proliinkconnect.co.za';
const testEmailAddress = process.argv[2];

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function runEmailTest(toEmail) {
  log('\n📧 QUICK EMAIL DELIVERY TEST', 'blue');
  log('=' .repeat(60), 'blue');
  
  if (!toEmail) {
    log('❌ ERROR: No email address provided', 'red');
    log('\nUsage:', 'yellow');
    log('  node scripts/test-email-quick.js your-email@outlook.com', 'yellow');
    log('  node scripts/test-email-quick.js your-email@yahoo.com', 'yellow');
    log('  node scripts/test-email-quick.js your-email@hotmail.com', 'yellow');
    process.exit(1);
  }
  
  log(`\n📤 Sending test email to: ${toEmail}`, 'blue');
  log(`📧 From: ${fromEmail}`);
  log(`🔑 API Key: ${apiKey.substring(0, 20)}...`);
  
  const emailData = {
    from: fromEmail,
    to: toEmail,
    subject: 'Test Email - Proliink Connect Email Delivery Test',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Email Delivery Test</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #10b981, #f59e0b); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">✉️ Email Test Successful!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">Proliink Connect</p>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin: 0 0 20px 0;">Email Delivery Working! 🎉</h2>
          
          <p style="color: #6b7280; line-height: 1.8; margin: 0 0 20px 0;">
            This is a test email to verify that Proliink Connect can successfully deliver emails to your email address.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;"><strong>Test Details:</strong></p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Recipient:</strong> ${toEmail}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;"><strong>Sent:</strong> ${new Date().toISOString()}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;"><strong>Service:</strong> Resend Email API</p>
          </div>
          
          <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #065f46; font-size: 15px; font-weight: 600;">
              ✅ Success! If you're reading this email, the delivery system is working correctly.
            </p>
          </div>
          
          <p style="color: #6b7280; line-height: 1.6; font-size: 14px; margin: 25px 0 0 0;">
            <strong>What this means:</strong><br>
            Proliink Connect can successfully send verification emails, password resets, and notifications to your email address.
          </p>
        </div>
        
        <div style="margin-top: 20px; text-align: center; padding: 20px;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Proliink Connect - Email Delivery Test<br>
            Powered by Resend
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
EMAIL DELIVERY TEST - Proliink Connect

✅ Success! Email delivery is working correctly.

If you're reading this email, it means Proliink Connect can successfully send emails to your address.

Test Details:
- Recipient: ${toEmail}
- Sent: ${new Date().toISOString()}
- Service: Resend Email API

What this means:
Proliink Connect can successfully send verification emails, password resets, and notifications to your email address.

---
Proliink Connect - Email Delivery Test
Powered by Resend
    `.trim(),
  };
  
  try {
    log('\n⏳ Sending email via Resend API...', 'yellow');
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });
    
    log(`\n📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      log('\n✅ SUCCESS! Email sent successfully!', 'green');
      log(`\n📧 Email Details:`, 'green');
      log(`   Message ID: ${result.id}`, 'green');
      log(`   Recipient: ${toEmail}`, 'green');
      log(`   From: ${fromEmail}`, 'green');
      
      log('\n📬 NEXT STEPS:', 'blue');
      log('   1. Check your email inbox: ' + toEmail, 'blue');
      log('   2. Also check your SPAM/JUNK folder', 'blue');
      log('   3. It may take a few seconds to arrive', 'blue');
      log('   4. If not received, check Resend dashboard:', 'blue');
      log('      https://resend.com/emails', 'blue');
      
      log('\n🎉 Email delivery is WORKING!', 'green');
      log('The system can send emails to non-Gmail addresses.', 'green');
      
      process.exit(0);
    } else {
      const error = await response.json();
      log('\n❌ FAILED! Email could not be sent', 'red');
      log(`\n📋 Error Details:`, 'red');
      log(JSON.stringify(error, null, 2), 'red');
      
      log('\n🔍 Common Issues:', 'yellow');
      
      if (error.message && error.message.includes('domain')) {
        log('   → Domain not verified in Resend', 'yellow');
        log('   → Visit: https://resend.com/domains', 'yellow');
        log('   → Verify: ' + fromEmail.split('@')[1], 'yellow');
      }
      
      if (error.message && error.message.includes('authentication')) {
        log('   → Invalid API key', 'yellow');
        log('   → Check your RESEND_API_KEY environment variable', 'yellow');
      }
      
      if (response.status === 429) {
        log('   → Rate limit exceeded', 'yellow');
        log('   → Wait a few minutes and try again', 'yellow');
      }
      
      process.exit(1);
    }
  } catch (error) {
    log('\n❌ EXCEPTION occurred!', 'red');
    log(`Error: ${error.message}`, 'red');
    log(`\nStack trace:`, 'red');
    log(error.stack, 'red');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runEmailTest(testEmailAddress).catch(error => {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runEmailTest };

