/**
 * Debug Payment Button Disappearing Issue
 * 
 * This script tests the payment button behavior when the API
 * returns 401 to understand why it disappears and reappears.
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
        'User-Agent': 'PaymentButtonDebug/1.0'
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

async function debugPaymentButtonDisappearing() {
  console.log('🔍 Debug Payment Button Disappearing Issue');
  console.log('==========================================');
  console.log(`📋 Booking ID: ${PROBLEM_BOOKING_ID}`);
  console.log(`🌐 Production URL: ${PRODUCTION_URL}`);
  
  try {
    // Step 1: Test payment API response
    console.log('\n🔍 Step 1: Testing payment API response...');
    
    const paymentData = {
      callbackUrl: `${PRODUCTION_URL}/dashboard?payment=success&booking=${PROBLEM_BOOKING_ID}`
    };
    
    const response = await makeRequest(
      `${PRODUCTION_URL}/api/book-service/${PROBLEM_BOOKING_ID}/pay`,
      paymentData
    );
    
    console.log(`📊 Status Code: ${response.statusCode}`);
    console.log('📄 Response Data:', JSON.stringify(response.data, null, 2));
    
    // Step 2: Analyze the button behavior
    console.log('\n🔍 Step 2: Analyzing button behavior...');
    
    if (response.statusCode === 401) {
      console.log('✅ Payment API returns 401 Unauthorized');
      console.log('🔍 Expected button behavior:');
      console.log('1. User clicks "Pay" button');
      console.log('2. Button shows "Processing..." (isLoading = true)');
      console.log('3. API returns 401');
      console.log('4. Error handling triggers');
      console.log('5. Button should redirect to login OR show error');
      console.log('6. Button should NOT disappear and reappear');
      
      console.log('\n⚠️  POTENTIAL ISSUES:');
      console.log('1. Error handling might not be working properly');
      console.log('2. State management might have race conditions');
      console.log('3. Authentication redirect might be interfering');
      console.log('4. Button state might not be resetting correctly');
      
    } else if (response.statusCode === 200) {
      console.log('⚠️  Payment API returns 200 - user might be authenticated');
      console.log('🔍 This suggests the issue might be different');
      
    } else {
      console.log(`⚠️  Unexpected status code: ${response.statusCode}`);
    }
    
    // Step 3: Check if there are any other issues
    console.log('\n🔍 Step 3: Checking for other potential issues...');
    
    // Check if the booking exists and is in the right state
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
          "providerId"
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
        
        // Check if booking is in the right state for payment
        if (bookingData.status === 'CONFIRMED') {
          console.log('✅ Booking is in CONFIRMED state - payment should be allowed');
        } else {
          console.log(`⚠️  Booking is in ${bookingData.status} state - payment might not be allowed`);
        }
        
        // Check if there's already a payment
        const payment = await prisma.$queryRaw`
          SELECT 
            id, 
            status, 
            amount, 
            "paystackRef"
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
          
          if (paymentData.status === 'ESCROW' || paymentData.status === 'RELEASED') {
            console.log('⚠️  Payment already exists and is completed - button should not appear');
          } else if (paymentData.status === 'PENDING') {
            console.log('⚠️  Payment exists but is PENDING - button might be in wrong state');
          }
        } else {
          console.log('💰 No existing payment - button should appear');
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
    console.log('📊 PAYMENT BUTTON DISAPPEARING ANALYSIS');
    console.log('='.repeat(60));
    
    console.log('🎯 ISSUE: Payment button disappears and reappears');
    console.log('🔍 LIKELY CAUSES:');
    console.log('1. State management race condition');
    console.log('2. Error handling not working properly');
    console.log('3. Authentication redirect interfering with button state');
    console.log('4. Button state not resetting correctly after error');
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('1. Add better error handling in payment button');
    console.log('2. Ensure state is properly reset after errors');
    console.log('3. Add loading states that persist during errors');
    console.log('4. Prevent button from disappearing during error states');
    console.log('5. Add better user feedback for authentication errors');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Check browser console for JavaScript errors');
    console.log('2. Test payment button with authentication');
    console.log('3. Verify state management is working correctly');
    console.log('4. Add better error handling and user feedback');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugPaymentButtonDisappearing().catch(console.error);
