const fetch = require('node-fetch');

async function testWebhookConnection() {
  try {
    console.log('🧪 Testing Webhook Endpoint Connection...\n');

    // Test the webhook endpoint
    const response = await fetch('http://localhost:3000/api/webhooks/paystack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': 'test-signature'
      },
      body: JSON.stringify({
        event: 'test',
        data: { test: true }
      })
    });

    console.log(`📡 Webhook endpoint response: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.log('✅ Webhook endpoint is accessible!');
      console.log('   Status 401 is expected (invalid signature)');
      console.log('   This means the endpoint exists and is working\n');
      
      console.log('🎯 NEXT: Set up ngrok and configure Paystack webhook');
      console.log('1. Install ngrok: npm install -g ngrok');
      console.log('2. Run: ngrok http 3000');
      console.log('3. Copy the https URL to Paystack dashboard');
      console.log('4. Update your .env file with correct webhook secret');
      
    } else if (response.status === 404) {
      console.log('❌ Webhook endpoint not found');
      console.log('   Make sure your Next.js app is running on port 3000');
      
    } else {
      console.log('⚠️ Unexpected response status');
      console.log('   Check your app logs for more details');
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Is your Next.js app running? (npm run dev)');
    console.log('2. Is it running on port 3000?');
    console.log('3. Check if there are any build errors');
  }
}

// Run the test
testWebhookConnection();
