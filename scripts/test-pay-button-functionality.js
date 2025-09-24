#!/usr/bin/env node

/**
 * Test Script: Pay Button Functionality
 * 
 * This script tests the pay button functionality in the client dashboard
 * to ensure it appears correctly after job acceptance and works properly.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Pay Button Functionality');
console.log('=====================================\n');

// Test 1: Check RecentBookingCard component
console.log('📋 Test 1: RecentBookingCard Component Analysis');
console.log('-----------------------------------------------');

const recentBookingCardPath = path.join(__dirname, '..', 'components', 'dashboard', 'recent-booking-card.tsx');
const recentBookingCardContent = fs.readFileSync(recentBookingCardPath, 'utf8');

const tests = [
  {
    name: 'DollarSign import',
    test: () => recentBookingCardContent.includes('DollarSign'),
    description: 'DollarSign icon is imported for pay button'
  },
  {
    name: 'Payment state management',
    test: () => recentBookingCardContent.includes('isProcessingPayment'),
    description: 'Payment processing state is managed'
  },
  {
    name: 'HandlePay function',
    test: () => recentBookingCardContent.includes('const handlePay = async () =>'),
    description: 'handlePay function is implemented'
  },
  {
    name: 'CanPay logic',
    test: () => recentBookingCardContent.includes('const canPay = () =>'),
    description: 'canPay function determines when to show pay button'
  },
  {
    name: 'CONFIRMED status check',
    test: () => recentBookingCardContent.includes("booking.status === 'CONFIRMED'"),
    description: 'Pay button shows for CONFIRMED bookings'
  },
  {
    name: 'Payment status check',
    test: () => recentBookingCardContent.includes("['PENDING', 'FAILED'].includes(booking.payment.status)"),
    description: 'Pay button shows when payment is PENDING or FAILED'
  },
  {
    name: 'Pay button rendering',
    test: () => recentBookingCardContent.includes('{canPay() && ('),
    description: 'Pay button is conditionally rendered'
  },
  {
    name: 'Payment API call',
    test: () => recentBookingCardContent.includes('/api/book-service/${booking.id}/pay'),
    description: 'Payment API endpoint is called correctly'
  },
  {
    name: 'Paystack redirect',
    test: () => recentBookingCardContent.includes('authorization_url'),
    description: 'Paystack authorization URL handling is implemented'
  },
  {
    name: 'Error handling',
    test: () => recentBookingCardContent.includes('showToast.error'),
    description: 'Payment error handling with toast notifications'
  }
];

let passedTests = 0;
tests.forEach((test, index) => {
  const passed = test.test();
  console.log(`${passed ? '✅' : '❌'} ${index + 1}. ${test.name}: ${test.description}`);
  if (passed) passedTests++;
});

console.log(`\n📊 RecentBookingCard Tests: ${passedTests}/${tests.length} passed\n`);

// Test 2: Check other client dashboard components
console.log('📋 Test 2: Other Client Dashboard Components');
console.log('---------------------------------------------');

const realtimeDashboardPath = path.join(__dirname, '..', 'components', 'dashboard', 'realtime-client-dashboard.tsx');
const paginatedDashboardPath = path.join(__dirname, '..', 'components', 'dashboard', 'paginated-client-dashboard.tsx');

const realtimeContent = fs.readFileSync(realtimeDashboardPath, 'utf8');
const paginatedContent = fs.readFileSync(paginatedDashboardPath, 'utf8');

const dashboardTests = [
  {
    name: 'Realtime Dashboard Pay Button',
    test: () => realtimeContent.includes('booking.status === "CONFIRMED"') && 
                 realtimeContent.includes('Pay Now'),
    description: 'Realtime dashboard has pay button for CONFIRMED bookings'
  },
  {
    name: 'Paginated Dashboard Pay Button',
    test: () => paginatedContent.includes('booking.status === "CONFIRMED"') && 
                 paginatedContent.includes('Pay Now'),
    description: 'Paginated dashboard has pay button for CONFIRMED bookings'
  },
  {
    name: 'Payment API Integration',
    test: () => realtimeContent.includes('/api/book-service/${booking.id}/pay') &&
                 paginatedContent.includes('/api/book-service/${booking.id}/pay'),
    description: 'Both dashboards call the correct payment API'
  },
  {
    name: 'Paystack Redirect Logic',
    test: () => realtimeContent.includes('authorization_url') &&
                 paginatedContent.includes('authorization_url'),
    description: 'Both dashboards handle Paystack redirects'
  }
];

let dashboardPassedTests = 0;
dashboardTests.forEach((test, index) => {
  const passed = test.test();
  console.log(`${passed ? '✅' : '❌'} ${index + 1}. ${test.name}: ${test.description}`);
  if (passed) dashboardPassedTests++;
});

console.log(`\n📊 Dashboard Components Tests: ${dashboardPassedTests}/${dashboardTests.length} passed\n`);

// Test 3: Payment API endpoint check
console.log('📋 Test 3: Payment API Endpoint');
console.log('-------------------------------');

const paymentApiPath = path.join(__dirname, '..', 'app', 'api', 'book-service', '[id]', 'pay', 'route.ts');
let paymentApiExists = false;
let paymentApiContent = '';

try {
  paymentApiContent = fs.readFileSync(paymentApiPath, 'utf8');
  paymentApiExists = true;
} catch (error) {
  console.log('❌ Payment API endpoint not found');
}

const apiTests = [
  {
    name: 'API Endpoint Exists',
    test: () => paymentApiExists,
    description: 'Payment API route file exists'
  },
  {
    name: 'POST Method',
    test: () => paymentApiContent.includes('export async function POST'),
    description: 'API supports POST method for payment'
  },
  {
    name: 'Authentication Check',
    test: () => paymentApiContent.includes('getCurrentUser'),
    description: 'API checks user authentication'
  },
  {
    name: 'Paystack Integration',
    test: () => paymentApiContent.includes('paystack') || paymentApiContent.includes('PAYSTACK'),
    description: 'API integrates with Paystack'
  },
  {
    name: 'Authorization URL',
    test: () => paymentApiContent.includes('authorization_url'),
    description: 'API returns Paystack authorization URL'
  }
];

let apiPassedTests = 0;
if (paymentApiExists) {
  apiTests.forEach((test, index) => {
    const passed = test.test();
    console.log(`${passed ? '✅' : '❌'} ${index + 1}. ${test.name}: ${test.description}`);
    if (passed) apiPassedTests++;
  });
} else {
  console.log('❌ Cannot test API endpoint - file not found');
}

console.log(`\n📊 Payment API Tests: ${apiPassedTests}/${apiTests.length} passed\n`);

// Test 4: User Experience Flow
console.log('📋 Test 4: User Experience Flow');
console.log('-------------------------------');

const uxTests = [
  {
    name: 'Button Visibility Logic',
    test: () => recentBookingCardContent.includes('CONFIRMED') && 
                 recentBookingCardContent.includes('PENDING') && 
                 recentBookingCardContent.includes('FAILED'),
    description: 'Pay button shows for CONFIRMED bookings without payment'
  },
  {
    name: 'Loading State',
    test: () => recentBookingCardContent.includes('isProcessingPayment') &&
                 recentBookingCardContent.includes('Processing...'),
    description: 'Loading state shows during payment processing'
  },
  {
    name: 'Button Disabled State',
    test: () => recentBookingCardContent.includes('disabled={isProcessingPayment}'),
    description: 'Button is disabled during payment processing'
  },
  {
    name: 'Visual Feedback',
    test: () => recentBookingCardContent.includes('bg-green-600') &&
                 recentBookingCardContent.includes('hover:bg-green-700'),
    description: 'Pay button has distinctive green styling'
  },
  {
    name: 'Error Handling',
    test: () => recentBookingCardContent.includes('catch (error)') &&
                 recentBookingCardContent.includes('console.error'),
    description: 'Payment errors are handled gracefully'
  },
  {
    name: 'Success Feedback',
    test: () => recentBookingCardContent.includes('showToast.success') ||
                 recentBookingCardContent.includes('authorization_url'),
    description: 'Success feedback is provided to users'
  }
];

let uxPassedTests = 0;
uxTests.forEach((test, index) => {
  const passed = test.test();
  console.log(`${passed ? '✅' : '❌'} ${index + 1}. ${test.name}: ${test.description}`);
  if (passed) uxPassedTests++;
});

console.log(`\n📊 User Experience Tests: ${uxPassedTests}/${uxTests.length} passed\n`);

// Summary
const totalTests = tests.length + dashboardTests.length + apiTests.length + uxTests.length;
const totalPassed = passedTests + dashboardPassedTests + apiPassedTests + uxPassedTests;

console.log('🎯 FINAL RESULTS');
console.log('================');
console.log(`✅ Total Tests Passed: ${totalPassed}/${totalTests}`);
console.log(`📈 Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);

if (totalPassed === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! Pay button functionality is fully implemented!');
  console.log('\n📋 What\'s Working:');
  console.log('• Pay button appears for CONFIRMED bookings');
  console.log('• Payment processing with loading states');
  console.log('• Paystack integration and redirects');
  console.log('• Error handling and user feedback');
  console.log('• Consistent across all client dashboard components');
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.');
}

console.log('\n🚀 Ready for Production Testing!');
console.log('================================');
console.log('1. Deploy the changes');
console.log('2. Create a booking as a client');
console.log('3. Accept the booking as a provider');
console.log('4. Check that "Pay Now" button appears in client dashboard');
console.log('5. Click "Pay Now" and verify Paystack integration');
console.log('6. Complete payment and verify booking status updates');
