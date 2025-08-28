require('dotenv').config({ path: '.env' });

console.log('🔍 Checking Environment Configuration...\n');

// Check required environment variables
const requiredVars = [
  'PAYSTACK_SECRET_KEY',
  'PAYSTACK_PUBLIC_KEY',
  'DATABASE_URL'
];

console.log('📋 Required Environment Variables:');
let allSet = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    const maskedValue = varName.includes('SECRET') || varName.includes('KEY') 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
      : value;
    
    console.log(`  ✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`  ❌ ${varName}: NOT SET`);
    allSet = false;
  }
});

console.log('\n🔐 Paystack Configuration Analysis:');

// Check Paystack keys format
const secretKey = process.env.PAYSTACK_SECRET_KEY;
const publicKey = process.env.PAYSTACK_PUBLIC_KEY;
const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

let environmentMode = 'unknown';
let signatureMethod = 'unknown';

if (secretKey) {
  if (secretKey.startsWith('sk_test_')) {
    environmentMode = 'TEST';
    signatureMethod = 'PAYSTACK_SECRET_KEY';
    console.log('  ✅ Secret Key: Test mode (correct for development)');
    console.log('  🔐 Signature Verification: Will use PAYSTACK_SECRET_KEY');
  } else if (secretKey.startsWith('sk_live_')) {
    environmentMode = 'LIVE';
    signatureMethod = 'PAYSTACK_WEBHOOK_SECRET';
    console.log('  ✅ Secret Key: Live mode (production)');
    console.log('  🔐 Signature Verification: Will use PAYSTACK_WEBHOOK_SECRET');
  } else {
    console.log('  ❌ Secret Key: Invalid format (should start with sk_test_ or sk_live_)');
  }
}

if (publicKey) {
  if (publicKey.startsWith('pk_test_')) {
    console.log('  ✅ Public Key: Test mode (correct for development)');
  } else if (publicKey.startsWith('pk_live_')) {
    console.log('  ✅ Public Key: Live mode (production)');
  } else {
    console.log('  ❌ Public Key: Invalid format (should start with pk_test_ or pk_live_)');
  }
}

// Check webhook secret based on environment mode
if (environmentMode === 'TEST') {
  if (webhookSecret) {
    console.log('  ℹ️  Webhook Secret: Present but not needed in test mode');
    console.log('  💡 You can remove PAYSTACK_WEBHOOK_SECRET for test mode');
  } else {
    console.log('  ✅ Webhook Secret: Not needed in test mode');
  }
} else if (environmentMode === 'LIVE') {
  if (webhookSecret) {
    if (webhookSecret.startsWith('whsec_')) {
      console.log('  ✅ Webhook Secret: Correct format for live mode');
    } else {
      console.log('  ❌ Webhook Secret: Invalid format (should start with whsec_)');
      console.log('  💡 Current value appears to be incorrect');
    }
  } else {
    console.log('  ❌ Webhook Secret: REQUIRED for live mode');
    console.log('  💡 Set PAYSTACK_WEBHOOK_SECRET in your environment');
  }
}

console.log('\n🌐 Webhook URL Configuration:');
console.log('  📍 Your webhook endpoint: /api/webhooks/paystack');
console.log('  💡 For local development, use ngrok to expose your local server');
console.log('  💡 For production, use your actual domain');

console.log('\n📊 Database Connection:');
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
    console.log('  🏠 Database: Local development');
  } else if (dbUrl.includes('supabase')) {
    console.log('  ☁️  Database: Supabase (cloud)');
  } else {
    console.log('  🌐 Database: Other cloud provider');
  }
} else {
  console.log('  ❌ Database: No DATABASE_URL set');
}

console.log('\n🚨 Issues Found:');
if (!allSet) {
  console.log('  ❌ Missing required environment variables');
  console.log('  💡 Add missing variables to your .env file');
} else {
  console.log('  ✅ All required environment variables are set');
}

// Check environment-specific issues
if (environmentMode === 'TEST') {
  console.log('  ✅ Test mode configuration looks good');
} else if (environmentMode === 'LIVE') {
  if (!webhookSecret) {
    console.log('  ❌ Live mode requires PAYSTACK_WEBHOOK_SECRET');
  } else if (!webhookSecret.startsWith('whsec_')) {
    console.log('  ❌ Live mode webhook secret format invalid');
  } else {
    console.log('  ✅ Live mode configuration looks good');
  }
} else {
  console.log('  ❌ Environment mode not detected');
}

console.log('\n💡 Next Steps:');
if (!allSet) {
  console.log('1. Add missing environment variables to .env');
  console.log('2. Restart your development server');
} else if (environmentMode === 'TEST') {
  console.log('1. ✅ Test mode configured correctly');
  console.log('2. Configure webhook URL in Paystack dashboard');
  console.log('3. Test webhook delivery');
} else if (environmentMode === 'LIVE') {
  if (!webhookSecret || !webhookSecret.startsWith('whsec_')) {
    console.log('1. Get correct webhook secret from Paystack dashboard');
    console.log('2. Update PAYSTACK_WEBHOOK_SECRET in .env');
    console.log('3. Restart your development server');
  } else {
    console.log('1. ✅ Live mode configured correctly');
    console.log('2. Configure webhook URL in Paystack dashboard');
    console.log('3. Test webhook delivery');
  }
} else {
  console.log('1. Check PAYSTACK_SECRET_KEY format');
  console.log('2. Ensure it starts with sk_test_ or sk_live_');
  console.log('3. Restart your development server');
}

console.log('\n🔧 To fix payment issues, run:');
console.log('  node scripts/fix-payment-issues.js');

console.log('\n📚 For detailed configuration help, see:');
console.log('  ENVIRONMENT_SETUP.md');
console.log('  WEBHOOK_SETUP_GUIDE.md');
