/**
 * Comprehensive Authentication Debug Script
 * 
 * This script tests the authentication flow end-to-end to identify
 * why the payment API returns 401 when users are on the dashboard.
 */

const https = require('https');

const PRODUCTION_URL = 'https://app.proliinkconnect.co.za';
const PROBLEM_BOOKING_ID = 'cmgtgu6010001jo0477fz2zwh';

function makeRequest(url, data, method = 'POST', cookies = '') {
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
        'User-Agent': 'AuthDebugTest/1.0'
      }
    };

    // Add cookies if provided
    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

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
            rawData: responseData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: null,
            rawData: responseData,
            parseError: error.message,
            headers: res.headers
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

async function debugAuthenticationFlow() {
  console.log('🔍 Comprehensive Authentication Debug');
  console.log('=====================================');
  console.log(`📋 Booking ID: ${PROBLEM_BOOKING_ID}`);
  console.log(`🌐 Production URL: ${PRODUCTION_URL}`);
  
  try {
    // Step 1: Test auth/me endpoint (what dashboard uses)
    console.log('\n🔍 Step 1: Testing /api/auth/me endpoint...');
    
    const authResponse = await makeRequest(
      `${PRODUCTION_URL}/api/auth/me`,
      {},
      'GET'
    );
    
    console.log(`📊 Auth/me Status: ${authResponse.statusCode}`);
    console.log('📄 Auth/me Response:', JSON.stringify(authResponse.data, null, 2));
    
    if (authResponse.statusCode === 200) {
      console.log('✅ Auth/me endpoint works - user should be authenticated');
      console.log(`👤 User: ${authResponse.data?.user?.email} (${authResponse.data?.user?.role})`);
    } else if (authResponse.statusCode === 401) {
      console.log('❌ Auth/me endpoint returns 401 - user is not authenticated');
      console.log('🔍 This explains why payment API also returns 401');
    } else {
      console.log(`⚠️  Auth/me endpoint returned: ${authResponse.statusCode}`);
    }
    
    // Step 2: Test payment API with same request (no cookies)
    console.log('\n🔍 Step 2: Testing payment API without cookies...');
    
    const paymentData = {
      callbackUrl: `${PRODUCTION_URL}/dashboard?payment=success&booking=${PROBLEM_BOOKING_ID}`
    };
    
    const paymentResponse = await makeRequest(
      `${PRODUCTION_URL}/api/book-service/${PROBLEM_BOOKING_ID}/pay`,
      paymentData,
      'POST'
    );
    
    console.log(`📊 Payment API Status: ${paymentResponse.statusCode}`);
    console.log('📄 Payment API Response:', JSON.stringify(paymentResponse.data, null, 2));
    
    // Step 3: Check if there are any cookie/session issues
    console.log('\n🔍 Step 3: Analyzing authentication state...');
    
    if (authResponse.statusCode === 401 && paymentResponse.statusCode === 401) {
      console.log('✅ CONSISTENT BEHAVIOR: Both endpoints return 401');
      console.log('🔍 This suggests the user is genuinely not authenticated');
      console.log('🔍 Possible causes:');
      console.log('1. User session expired');
      console.log('2. Cookie domain mismatch');
      console.log('3. Token validation failure');
      console.log('4. Database connection issues');
      
    } else if (authResponse.statusCode === 200 && paymentResponse.statusCode === 401) {
      console.log('❌ INCONSISTENT BEHAVIOR: Auth works but payment fails');
      console.log('🔍 This suggests a specific issue with the payment API');
      console.log('🔍 Possible causes:');
      console.log('1. Payment API has different authentication logic');
      console.log('2. Role-based access control issue');
      console.log('3. Database query failure in payment API');
      console.log('4. Different cookie handling in payment API');
      
    } else {
      console.log('⚠️  UNEXPECTED BEHAVIOR: Different status codes');
      console.log(`Auth/me: ${authResponse.statusCode}, Payment: ${paymentResponse.statusCode}`);
    }
    
    // Step 4: Test with a valid session (if we can get one)
    console.log('\n🔍 Step 4: Testing with session simulation...');
    
    // Try to get a valid session by testing login
    const loginData = {
      email: 'test@example.com', // This will fail, but we can see the response
      password: 'testpassword'
    };
    
    const loginResponse = await makeRequest(
      `${PRODUCTION_URL}/api/auth/login`,
      loginData,
      'POST'
    );
    
    console.log(`📊 Login Test Status: ${loginResponse.statusCode}`);
    console.log('📄 Login Test Response:', JSON.stringify(loginResponse.data, null, 2));
    
    // Step 5: Check database connectivity
    console.log('\n🔍 Step 5: Testing database connectivity...');
    
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
      // Test basic database connectivity
      const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Database connectivity: Working');
      
      // Test user table access
      const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
      console.log(`📊 Users in database: ${userCount[0].count}`);
      
      // Test booking access
      const booking = await prisma.$queryRaw`
        SELECT 
          id, 
          status, 
          "totalAmount", 
          "clientId", 
          "providerId"
        FROM bookings 
        WHERE id = ${PROBLEM_BOOKING_ID}
      `;
      
      if (booking && booking.length > 0) {
        const bookingData = booking[0];
        console.log('📋 Booking found:');
        console.log(`   ID: ${bookingData.id}`);
        console.log(`   Status: ${bookingData.status}`);
        console.log(`   Client ID: ${bookingData.clientId}`);
        console.log(`   Provider ID: ${bookingData.providerId}`);
        
        // Test if we can find the client user
        const client = await prisma.$queryRaw`
          SELECT 
            id, 
            email, 
            name, 
            role, 
            "emailVerified",
            "isActive"
          FROM users 
          WHERE id = ${bookingData.clientId}
        `;
        
        if (client && client.length > 0) {
          const clientData = client[0];
          console.log('👤 Client user found:');
          console.log(`   ID: ${clientData.id}`);
          console.log(`   Email: ${clientData.email}`);
          console.log(`   Role: ${clientData.role}`);
          console.log(`   Email Verified: ${clientData.emailVerified}`);
          console.log(`   Is Active: ${clientData.isActive}`);
          
          if (!clientData.isActive) {
            console.log('⚠️  CLIENT USER IS INACTIVE - This could cause 401 errors!');
          }
          if (!clientData.emailVerified) {
            console.log('⚠️  CLIENT EMAIL NOT VERIFIED - This could cause 401 errors!');
          }
        } else {
          console.log('❌ Client user not found - This could cause 401 errors!');
        }
      } else {
        console.log('❌ Booking not found');
      }
      
    } catch (dbError) {
      console.log('❌ Database test failed:', dbError.message);
    } finally {
      await prisma.$disconnect();
    }
    
    // Step 6: Summary and recommendations
    console.log('\n' + '='.repeat(70));
    console.log('📊 AUTHENTICATION FLOW ANALYSIS SUMMARY');
    console.log('='.repeat(70));
    
    console.log('🎯 ROOT CAUSE ANALYSIS:');
    
    if (authResponse.statusCode === 401) {
      console.log('✅ USER IS NOT AUTHENTICATED');
      console.log('🔍 The 401 error is correct - user needs to log in');
      console.log('🔍 This is NOT a bug - it\'s expected behavior');
      
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      console.log('1. User should log in before accessing dashboard');
      console.log('2. Check if session expired');
      console.log('3. Verify cookie settings');
      console.log('4. Test login flow');
      
    } else if (authResponse.statusCode === 200 && paymentResponse.statusCode === 401) {
      console.log('❌ AUTHENTICATION INCONSISTENCY DETECTED');
      console.log('🔍 User is authenticated but payment API fails');
      console.log('🔍 This suggests a bug in the payment API');
      
      console.log('\n🔧 RECOMMENDED FIXES:');
      console.log('1. Check payment API authentication logic');
      console.log('2. Verify role-based access control');
      console.log('3. Check database queries in payment API');
      console.log('4. Ensure consistent cookie handling');
      
    } else {
      console.log('⚠️  UNEXPECTED AUTHENTICATION STATE');
      console.log('🔍 Need further investigation');
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Test with a properly authenticated user');
    console.log('2. Check browser cookies and session state');
    console.log('3. Verify login flow works correctly');
    console.log('4. Test payment API with valid authentication');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugAuthenticationFlow().catch(console.error);















