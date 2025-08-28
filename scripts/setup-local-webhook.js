const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Local Webhook Setup for Development\n');

console.log('📋 PREREQUISITES:');
console.log('1. Make sure your Next.js app is running on port 3000');
console.log('2. Have your Paystack dashboard open in another tab\n');

console.log('🔧 STEP 1: Install ngrok globally');
console.log('Run this command:');
console.log('   npm install -g ngrok\n');

console.log('🌐 STEP 2: Start ngrok tunnel');
console.log('In a new terminal, run:');
console.log('   ngrok http 3000\n');

console.log('📊 STEP 3: Copy the HTTPS URL');
console.log('ngrok will show something like:');
console.log('   Forwarding    https://abc123.ngrok.io -> http://localhost:3000');
console.log('   Copy the https:// URL\n');

console.log('⚙️ STEP 4: Configure Paystack Webhook');
console.log('1. Go to: https://dashboard.paystack.com/');
console.log('2. Navigate to: Settings → Webhooks');
console.log('3. Click: "Add Webhook"');
console.log('4. Webhook URL: https://YOUR_NGROK_URL.ngrok.io/api/webhooks/paystack');
console.log('5. Events to listen for:');
console.log('   ☑️ charge.success');
console.log('   ☑️ transfer.success');
console.log('   ☑️ transfer.failed');
console.log('   ☑️ refund.processed');
console.log('6. Click: "Save Webhook"\n');

console.log('🔐 STEP 5: Update Environment Variables');
console.log('You need to manually update your .env file:');
console.log('   Change: PAYSTACK_WEBHOOK_SECRET=whsec_placeholder_for_now');
console.log('   To: PAYSTACK_WEBHOOK_SECRET=sk_test_c8ce9460fa0276d2ff1e1b94d6d478a89d1417f0\n');

console.log('🧪 STEP 6: Test the Webhook');
console.log('1. Make a test payment through your app');
console.log('2. Check ngrok terminal for incoming webhook requests');
console.log('3. Check your app logs for webhook processing');
console.log('4. Verify database updates\n');

console.log('💡 TIPS:');
console.log('- Keep ngrok running while testing');
console.log('- Each time you restart ngrok, you get a new URL');
console.log('- Update Paystack webhook URL if ngrok URL changes');
console.log('- Use ngrok dashboard to inspect webhook requests\n');

console.log('🔍 TROUBLESHOOTING:');
console.log('If webhooks fail:');
console.log('1. Check ngrok is running and accessible');
console.log('2. Verify webhook URL in Paystack dashboard');
console.log('3. Check webhook secret in .env file');
console.log('4. Look for errors in your app logs\n');

console.log('🎯 NEXT STEPS:');
console.log('After setting up webhooks:');
console.log('1. Test payment flow end-to-end');
console.log('2. Verify payment status updates to ESCROW');
console.log('3. Test job completion and payment release');
console.log('4. Test dispute handling\n');

console.log('✅ Once this is working, Phase 4 & 5 will be functional!');
