console.log('🧪 Testing Webhook Endpoint Connection...\n');

console.log('📋 MANUAL TEST INSTRUCTIONS:\n');

console.log('1. Make sure your Next.js app is running:');
console.log('   npm run dev\n');

console.log('2. In a new terminal, test the webhook endpoint:');
console.log('   curl -X POST http://localhost:3000/api/webhooks/paystack \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -H "x-paystack-signature: test-signature" \\');
console.log('     -d \'{"event":"test","data":{"test":true}}\'\n');

console.log('3. Expected response: 401 Unauthorized (invalid signature)');
console.log('   This means the endpoint exists and is working!\n');

console.log('🎯 NEXT STEPS FOR LOCAL DEVELOPMENT:\n');

console.log('STEP 1: Install ngrok');
console.log('   npm install -g ngrok\n');

console.log('STEP 2: Start ngrok tunnel');
console.log('   ngrok http 3000\n');

console.log('STEP 3: Copy the HTTPS URL');
console.log('   Example: https://abc123.ngrok.io\n');

console.log('STEP 4: Configure Paystack Webhook');
console.log('   - Go to: https://dashboard.paystack.com/');
console.log('   - Settings → Webhooks → Add Webhook');
console.log('   - URL: https://YOUR_NGROK_URL.ngrok.io/api/webhooks/paystack');
console.log('   - Events: charge.success, transfer.success, transfer.failed, refund.processed\n');

console.log('STEP 5: Update .env file');
console.log('   Change: PAYSTACK_WEBHOOK_SECRET=whsec_placeholder_for_now');
console.log('   To: PAYSTACK_WEBHOOK_SECRET=sk_test_c8ce9460fa0276d2ff1e1b94d6d478a89d1417f0\n');

console.log('STEP 6: Test complete flow');
console.log('   1. Make a payment through your app');
console.log('   2. Check ngrok terminal for webhook requests');
console.log('   3. Verify payment status updates to ESCROW');
console.log('   4. Test job completion and payment release\n');

console.log('✅ Once webhooks are working, Phase 4 & 5 will be functional!');
console.log('🎉 You\'ll be able to test the complete escrow payment flow!');
