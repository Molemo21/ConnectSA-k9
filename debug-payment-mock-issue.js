/**
 * Debug Payment Initialization for Specific Booking
 * 
 * This script debugs the payment initialization for the specific booking
 * that's showing payment=mock in the URL.
 */

const https = require('https');

const PRODUCTION_URL = 'https://app.proliinkconnect.co.za';
const PROBLEM_BOOKING_ID = 'cmgtgu6010001jo0477fz2zwh';

function makeRequest(url, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'PaymentDebugTest/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
            rawData: responseData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: null,
            rawData: responseData,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000);
    req.write(postData);
    req.end();
  });
}

async function debugPaymentInitialization() {
  console.log('🔍 Debug Payment Initialization for Problem Booking');
  console.log('==================================================');
  console.log(`📋 Booking ID: ${PROBLEM_BOOKING_ID}`);
  console.log(`🌐 Production URL: ${PRODUCTION_URL}`);
  
  try {
    // Step 1: Test payment initialization API
    console.log('\n🔍 Step 1: Testing payment initialization API...');
    
    const paymentData = {
      callbackUrl: `${PRODUCTION_URL}/dashboard?payment=success&booking=${PROBLEM_BOOKING_ID}`
    };
    
    console.log('📤 Request data:', JSON.stringify(paymentData, null, 2));
    
    const response = await makeRequest(
      `${PRODUCTION_URL}/api/book-service/${PROBLEM_BOOKING_ID}/pay`,
      paymentData
    );
    
    console.log(`📊 Status Code: ${response.statusCode}`);
    console.log('📄 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.parseError) {
      console.log('❌ JSON Parse Error:', response.parseError);
      console.log('📄 Raw Response:', response.rawData);
    }
    
    // Step 2: Analyze the response
    console.log('\n🔍 Step 2: Analyzing response...');
    
    if (response.statusCode === 200) {
      console.log('✅ Payment initialization successful');
      
      if (response.data && response.data.authorizationUrl) {
        console.log(`🔗 Authorization URL: ${response.data.authorizationUrl}`);
        
        // Check if it's a dummy/mock URL
        if (response.data.authorizationUrl.includes('dummy') || 
            response.data.authorizationUrl.includes('mock') ||
            response.data.authorizationUrl.includes('test')) {
          console.log('⚠️  WARNING: Authorization URL appears to be dummy/mock');
          console.log('🔍 This suggests the payment API is in test/mock mode');
        } else {
          console.log('✅ Authorization URL appears to be legitimate Paystack URL');
        }
        
        // Check if the URL contains the correct callback
        if (response.data.authorizationUrl.includes('callback_url')) {
          console.log('✅ Callback URL is included in authorization URL');
        } else {
          console.log('⚠️  Callback URL might not be included in authorization URL');
        }
      } else {
        console.log('❌ No authorization URL in response');
      }
      
      if (response.data && response.data.message) {
        console.log(`💬 Message: ${response.data.message}`);
      }
      
    } else if (response.statusCode === 401) {
      console.log('⚠️  Payment initialization returned 401 (Unauthorized)');
      console.log('🔍 This suggests authentication is required');
      console.log('💡 The payment button might be working, but authentication is needed');
      
    } else if (response.statusCode === 400) {
      console.log('❌ Payment initialization returned 400 (Bad Request)');
      console.log(`💬 Error: ${response.data?.error || 'No error message'}`);
      console.log(`🔍 Details: ${response.data?.details || 'No details'}`);
      
    } else if (response.statusCode === 500) {
      console.log('❌ Payment initialization returned 500 (Internal Server Error)');
      console.log(`💬 Error: ${response.data?.error || 'No error message'}`);
      console.log(`🔍 Details: ${response.data?.details || 'No details'}`);
      
      // Check for specific error patterns
      if (response.data?.details && response.data.details.includes('userId')) {
        console.log('🔧 The userId column issue might still exist');
      }
      if (response.data?.details && response.data.details.includes('Paystack')) {
        console.log('🔧 There might be a Paystack API issue');
      }
      
    } else {
      console.log(`⚠️  Unexpected status code: ${response.statusCode}`);
      console.log(`📄 Response: ${JSON.stringify(response.data)}`);
    }
    
    // Step 3: Check booking status
    console.log('\n🔍 Step 3: Checking booking status...');
    
    const { PrismaClient } = require('@prisma/client');
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://postgres.qdrktzqfeewwcktgltzy:Motebangnakin@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15&pool_timeout=60&connection_limit=5"
        }
      },
      log: ['error'],
      errorFormat: 'pretty'
    });
    
    try {
      const booking = await prisma.$queryRaw`
        SELECT 
          id, 
          status, 
          "totalAmount", 
          "clientId", 
          "providerId",
          "scheduledDate"
        FROM bookings 
        WHERE id = ${PROBLEM_BOOKING_ID}
      `;
      
      if (booking && booking.length > 0) {
        const bookingData = booking[0];
        console.log('📋 Booking details:');
        console.log(`   ID: ${bookingData.id}`);
        console.log(`   Status: ${bookingData.status}`);
        console.log(`   Amount: R${bookingData.totalAmount}`);
        console.log(`   Client ID: ${bookingData.clientId}`);
        console.log(`   Provider ID: ${bookingData.providerId}`);
        console.log(`   Scheduled: ${bookingData.scheduledDate}`);
        
        // Check if there's already a payment
        const payment = await prisma.$queryRaw`
          SELECT 
            id, 
            status, 
            amount, 
            "paystackRef",
            "createdAt"
          FROM payments 
          WHERE "bookingId" = ${PROBLEM_BOOKING_ID}
        `;
        
        if (payment && payment.length > 0) {
          const paymentData = payment[0];
          console.log('💰 Existing payment:');
          console.log(`   ID: ${paymentData.id}`);
          console.log(`   Status: ${paymentData.status}`);
          console.log(`   Amount: R${paymentData.amount}`);
          console.log(`   Paystack Ref: ${paymentData.paystackRef}`);
          console.log(`   Created: ${paymentData.createdAt}`);
        } else {
          console.log('💰 No existing payment found');
        }
        
      } else {
        console.log('❌ Booking not found');
      }
      
    } catch (dbError) {
      console.log('❌ Database query failed:', dbError.message);
    } finally {
      await prisma.$disconnect();
    }
    
    // Step 4: Summary and recommendations
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEBUG SUMMARY');
    console.log('='.repeat(60));
    
    console.log('🎯 Issue: Payment button redirects to dashboard?payment=mock');
    console.log('🔍 Possible causes:');
    console.log('1. Payment API is in test/mock mode');
    console.log('2. Paystack API is returning dummy responses');
    console.log('3. Environment variables are not set correctly');
    console.log('4. Payment initialization is failing silently');
    console.log('5. Frontend is handling the response incorrectly');
    
    console.log('\n🔧 Recommended actions:');
    console.log('1. Check Vercel environment variables for Paystack keys');
    console.log('2. Verify Paystack API is not in test mode');
    console.log('3. Check if NEXT_PHASE is set incorrectly');
    console.log('4. Review payment API logs in Vercel');
    console.log('5. Test with a different booking ID');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugPaymentInitialization().catch(console.error);
