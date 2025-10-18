/**
 * Test Payment Initialization After Schema Fix
 * 
 * This script tests the payment initialization API after updating
 * the Prisma schema to match the production database structure.
 */

const https = require('https');

const PRODUCTION_URL = 'https://app.proliinkconnect.co.za';

// First, let's find a booking that can be paid
async function findPayableBooking() {
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
    // Find a booking that can be paid
    const booking = await prisma.booking.findFirst({
      where: {
        status: {
          in: ['CONFIRMED', 'PENDING']
        },
        payment: null // No existing payment
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (booking) {
      console.log(`📋 Found payable booking: ${booking.id}`);
      console.log(`💰 Amount: R${booking.totalAmount}`);
      console.log(`👤 Client: ${booking.client?.email}`);
      console.log(`🏢 Service: ${booking.service?.name}`);
      console.log(`📊 Status: ${booking.status}`);
      return booking;
    } else {
      console.log('❌ No payable bookings found');
      return null;
    }
  } catch (error) {
    console.log('❌ Error finding booking:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

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
        'User-Agent': 'PaymentInitializationTest/1.0'
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

async function testPaymentInitialization() {
  console.log('🧪 Testing Payment Initialization After Schema Fix');
  console.log('==================================================');
  
  try {
    // Step 1: Find a payable booking
    console.log('🔍 Step 1: Finding a payable booking...');
    const booking = await findPayableBooking();
    
    if (!booking) {
      console.log('❌ Cannot test payment initialization - no payable bookings found');
      return;
    }
    
    // Step 2: Test payment initialization API
    console.log('\n🚀 Step 2: Testing payment initialization API...');
    console.log(`📋 Booking ID: ${booking.id}`);
    
    const paymentData = {
      callbackUrl: `${PRODUCTION_URL}/dashboard?payment=success&booking=${booking.id}`
    };
    
    const response = await makeRequest(
      `${PRODUCTION_URL}/api/book-service/${booking.id}/pay`,
      paymentData
    );
    
    console.log(`📊 Status Code: ${response.statusCode}`);
    console.log('');
    
    if (response.parseError) {
      console.log('❌ JSON Parse Error:', response.parseError);
      console.log('📄 Raw Response:', response.rawData);
      return;
    }
    
    console.log('📄 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    
    // Analyze the response
    if (response.statusCode === 200) {
      console.log('🎉 SUCCESS: Payment initialization is now working!');
      console.log('✅ The schema synchronization issue has been RESOLVED!');
      
      if (response.data && response.data.authorizationUrl) {
        console.log(`🔗 Authorization URL: ${response.data.authorizationUrl}`);
        console.log(`💰 Amount: R${response.data.amount}`);
        console.log(`📊 Status: ${response.data.status}`);
      }
    } else if (response.statusCode === 400) {
      console.log('⚠️  Payment initialization returned 400 (Bad Request)');
      console.log(`💬 Error: ${response.data?.error || 'No error message'}`);
      
      if (response.data?.error && response.data.error.includes('already been completed')) {
        console.log('ℹ️  This booking already has a completed payment (expected behavior)');
      } else {
        console.log('🔍 This might be a different validation issue');
      }
    } else if (response.statusCode === 500) {
      console.log('❌ FAILED: 500 error still exists');
      console.log(`💬 Error: ${response.data?.error || 'No error message'}`);
      console.log(`🔍 Details: ${response.data?.details || 'No details'}`);
      
      if (response.data?.details && response.data.details.includes('userId')) {
        console.log('');
        console.log('🔧 The schema fix may not have been deployed yet.');
        console.log('Please check:');
        console.log('1. The deployment is complete');
        console.log('2. The Prisma client has been regenerated');
        console.log('3. The schema changes are active');
      } else {
        console.log('');
        console.log('🔍 Different error - the userId issue may be resolved,');
        console.log('but there might be another issue causing the 500 error.');
      }
    } else {
      console.log(`⚠️  Unexpected status: ${response.statusCode}`);
      console.log(`📄 Response: ${JSON.stringify(response.data)}`);
    }
    
  } catch (error) {
    console.log(`❌ REQUEST FAILED: ${error.message}`);
  }
  
  console.log('');
  console.log('📋 Test Results Summary:');
  console.log('- Status 200: ✅ Complete success - payment initialized');
  console.log('- Status 400: ⚠️  Validation error - check booking status');
  console.log('- Status 500: ❌ Still failing - check deployment or other issues');
  console.log('- Request Failed: 🌐 Network/connection issue');
  console.log('');
  console.log('🎯 Expected Outcome:');
  console.log('After updating the Prisma schema to match production database,');
  console.log('the payment initialization should work without userId column errors.');
}

// Run the test
testPaymentInitialization().catch(console.error);
