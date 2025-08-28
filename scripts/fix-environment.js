const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Environment Configuration...\n');

const envPath = path.join(process.cwd(), '.env');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found');
  console.log('💡 Create a .env file with your configuration');
  return;
}

// Read current .env file
let envContent;
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
  return;
}

console.log('📋 Current .env file found');

// Check for critical issues
const issues = [];

// Check if PAYSTACK_WEBHOOK_SECRET is set to the same value as PAYSTACK_SECRET_KEY
const secretKeyMatch = envContent.match(/PAYSTACK_SECRET_KEY=(.+)/);
const webhookSecretMatch = envContent.match(/PAYSTACK_WEBHOOK_SECRET=(.+)/);

if (secretKeyMatch && webhookSecretMatch) {
  const secretKey = secretKeyMatch[1].trim();
  const webhookSecret = webhookSecretMatch[1].trim();
  
  if (secretKey === webhookSecret) {
    issues.push('PAYSTACK_WEBHOOK_SECRET is set to the same value as PAYSTACK_SECRET_KEY');
  }
  
  if (!webhookSecret.startsWith('whsec_')) {
    issues.push('PAYSTACK_WEBHOOK_SECRET should start with "whsec_"');
  }
}

// Display issues
if (issues.length > 0) {
  console.log('\n🚨 Issues Found:');
  issues.forEach((issue, index) => {
    console.log(`  ${index + 1}. ${issue}`);
  });
  
  console.log('\n💡 How to Fix:');
  console.log('1. Go to [Paystack Dashboard](https://dashboard.paystack.com)');
  console.log('2. Navigate to Settings → API Keys & Webhooks');
  console.log('3. Click "Add Webhook"');
  console.log('4. Set URL: https://yourdomain.com/api/webhooks/paystack');
  console.log('5. Select events: charge.success, transfer.success, transfer.failed');
  console.log('6. Copy the Webhook Secret (starts with whsec_)');
  console.log('7. Update your .env file');
  
  console.log('\n📝 Example .env configuration:');
  console.log('```');
  console.log('DATABASE_URL=your_database_url');
  console.log('JWT_SECRET=your_jwt_secret');
  console.log('RESEND_API_KEY=your_resend_key');
  console.log('');
  console.log('# Paystack Configuration');
  console.log('PAYSTACK_SECRET_KEY=sk_test_your_secret_key');
  console.log('PAYSTACK_PUBLIC_KEY=pk_test_your_public_key');
  console.log('PAYSTACK_WEBHOOK_SECRET=whsec_your_webhook_secret');
  console.log('');
  console.log('# App Configuration');
  console.log('NEXTAUTH_SECRET=your_nextauth_secret');
  console.log('NEXTAUTH_URL=http://localhost:3000');
  console.log('```');
  
} else {
  console.log('✅ Environment configuration looks good!');
}

// Check for other potential issues
console.log('\n🔍 Additional Checks:');

// Check if all required variables are present
const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PAYSTACK_SECRET_KEY',
  'PAYSTACK_PUBLIC_KEY',
  'PAYSTACK_WEBHOOK_SECRET'
];

requiredVars.forEach(varName => {
  if (envContent.includes(`${varName}=`)) {
    console.log(`  ✅ ${varName}: Present`);
  } else {
    console.log(`  ❌ ${varName}: Missing`);
  }
});

// Check for test vs live keys
if (envContent.includes('sk_test_')) {
  console.log('  ℹ️  Using Paystack TEST keys (correct for development)');
} else if (envContent.includes('sk_live_')) {
  console.log('  ℹ️  Using Paystack LIVE keys (production mode)');
} else {
  console.log('  ❌ Paystack keys format not recognized');
}

console.log('\n📋 Next Steps:');
console.log('1. Fix the webhook secret configuration');
console.log('2. Restart your development server');
console.log('3. Test webhook delivery');
console.log('4. Run: node scripts/fix-payment-issues.js');

console.log('\n🔗 Useful Links:');
console.log('- Paystack Dashboard: https://dashboard.paystack.com');
console.log('- Webhook Setup Guide: WEBHOOK_SETUP_GUIDE.md');
console.log('- Payment Fix Script: scripts/fix-payment-issues.js');
