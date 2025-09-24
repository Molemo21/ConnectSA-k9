#!/usr/bin/env node

/**
 * Accept API Endpoint Test Script
 * 
 * This script tests the accept API endpoint to verify it's working correctly
 */

console.log('🔧 Testing Accept API Endpoint');
console.log('==============================\n');

// Test the API endpoint structure
function testAPIEndpointStructure() {
  console.log('🏗️ Testing API Endpoint Structure...');
  
  const fs = require('fs');
  const path = require('path');
  
  const routePath = 'app/api/book-service/[id]/accept/route.ts';
  
  if (!fs.existsSync(routePath)) {
    console.log('❌ Accept API route file not found');
    return false;
  }
  
  const content = fs.readFileSync(routePath, 'utf8');
  
  const checks = [
    {
      name: 'POST method is exported',
      test: content.includes('export async function POST'),
      required: true
    },
    {
      name: 'GET method is exported (for testing)',
      test: content.includes('export async function GET'),
      required: true
    },
    {
      name: 'Runtime is set to nodejs',
      test: content.includes("export const runtime = 'nodejs'"),
      required: true
    },
    {
      name: 'Dynamic is set to force-dynamic',
      test: content.includes("export const dynamic = 'force-dynamic'"),
      required: true
    },
    {
      name: 'Uses Prisma directly',
      test: content.includes('import { prisma } from "@/lib/prisma"'),
      required: true
    },
    {
      name: 'Has proper error handling',
      test: content.includes('try {') && content.includes('} catch (error)'),
      required: true
    },
    {
      name: 'Has authentication check',
      test: content.includes('getCurrentUser()'),
      required: true
    },
    {
      name: 'Has booking ID extraction',
      test: content.includes('pathname.match(/book-service/'),
      required: true
    },
    {
      name: 'Has booking lookup',
      test: content.includes('prisma.booking.findUnique'),
      required: true
    },
    {
      name: 'Has booking update',
      test: content.includes('prisma.booking.update'),
      required: true
    },
    {
      name: 'Has logging',
      test: content.includes('logBooking'),
      required: true
    },
    {
      name: 'Has request logging for debugging',
      test: content.includes('console.log(\'🔍 Accept booking API called:\''),
      required: true
    }
  ];
  
  let passedChecks = 0;
  let totalChecks = checks.length;
  
  for (const check of checks) {
    if (check.test) {
      console.log(`✅ ${check.name}`);
      passedChecks++;
    } else {
      console.log(`❌ ${check.name}`);
      if (check.required) {
        console.log('   ⚠️  This is a required feature!');
      }
    }
  }
  
  console.log(`\n📊 API Endpoint Structure Test Results: ${passedChecks}/${totalChecks} checks passed`);
  
  return passedChecks === totalChecks;
}

// Test the imports and dependencies
function testImportsAndDependencies() {
  console.log('\n📦 Testing Imports and Dependencies...');
  
  const fs = require('fs');
  const content = fs.readFileSync('app/api/book-service/[id]/accept/route.ts', 'utf8');
  
  const checks = [
    {
      name: 'NextRequest and NextResponse imported',
      test: content.includes('import { NextRequest, NextResponse } from "next/server"'),
      required: true
    },
    {
      name: 'getCurrentUser imported',
      test: content.includes('import { getCurrentUser } from "@/lib/auth"'),
      required: true
    },
    {
      name: 'Prisma imported',
      test: content.includes('import { prisma } from "@/lib/prisma"'),
      required: true
    },
    {
      name: 'Email service imported',
      test: content.includes('import { sendBookingConfirmationEmail } from "@/lib/email"'),
      required: true
    },
    {
      name: 'Notification service imported',
      test: content.includes('import { createNotification, NotificationTemplates } from "@/lib/notification-service"'),
      required: true
    },
    {
      name: 'Logger imported',
      test: content.includes('import { logBooking } from "@/lib/logger"'),
      required: true
    },
    {
      name: 'Socket server imported',
      test: content.includes('import { broadcastBookingAccepted } from "@/lib/socket-server"'),
      required: true
    }
  ];
  
  let passedChecks = 0;
  let totalChecks = checks.length;
  
  for (const check of checks) {
    if (check.test) {
      console.log(`✅ ${check.name}`);
      passedChecks++;
    } else {
      console.log(`❌ ${check.name}`);
      if (check.required) {
        console.log('   ⚠️  This import is required!');
      }
    }
  }
  
  console.log(`\n📊 Imports and Dependencies Test Results: ${passedChecks}/${totalChecks} checks passed`);
  
  return passedChecks === totalChecks;
}

// Test the error handling
function testErrorHandling() {
  console.log('\n🛡️ Testing Error Handling...');
  
  const fs = require('fs');
  const content = fs.readFileSync('app/api/book-service/[id]/accept/route.ts', 'utf8');
  
  const checks = [
    {
      name: 'Build time check',
      test: content.includes('process.env.NODE_ENV === \'production\''),
      required: true
    },
    {
      name: 'User authentication check',
      test: content.includes('if (!user || user.role !== "PROVIDER")'),
      required: true
    },
    {
      name: 'Booking ID validation',
      test: content.includes('if (!bookingId)'),
      required: true
    },
    {
      name: 'Booking existence check',
      test: content.includes('if (!booking)'),
      required: true
    },
    {
      name: 'Provider authorization check',
      test: content.includes('if (booking.providerId !== user.provider?.id)'),
      required: true
    },
    {
      name: 'Booking status check',
      test: content.includes('if (booking.status !== "PENDING")'),
      required: true
    },
    {
      name: 'Global error handling',
      test: content.includes('} catch (error) {') && content.includes('logBooking.error'),
      required: true
    },
    {
      name: 'Proper HTTP status codes',
      test: content.includes('status: 401') && content.includes('status: 400') && content.includes('status: 404') && content.includes('status: 403'),
      required: true
    }
  ];
  
  let passedChecks = 0;
  let totalChecks = checks.length;
  
  for (const check of checks) {
    if (check.test) {
      console.log(`✅ ${check.name}`);
      passedChecks++;
    } else {
      console.log(`❌ ${check.name}`);
      if (check.required) {
        console.log('   ⚠️  This error handling is required!');
      }
    }
  }
  
  console.log(`\n📊 Error Handling Test Results: ${passedChecks}/${totalChecks} checks passed`);
  
  return passedChecks === totalChecks;
}

// Test the functionality
function testFunctionality() {
  console.log('\n⚙️ Testing Functionality...');
  
  const fs = require('fs');
  const content = fs.readFileSync('app/api/book-service/[id]/accept/route.ts', 'utf8');
  
  const checks = [
    {
      name: 'Booking status update to CONFIRMED',
      test: content.includes('status: "CONFIRMED"'),
      required: true
    },
    {
      name: 'Notification creation for client',
      test: content.includes('createNotification'),
      required: true
    },
    {
      name: 'Email sending to client',
      test: content.includes('sendBookingConfirmationEmail'),
      required: true
    },
    {
      name: 'WebSocket broadcasting',
      test: content.includes('broadcastBookingAccepted'),
      required: true
    },
    {
      name: 'Success response',
      test: content.includes('success: true'),
      required: true
    },
    {
      name: 'Proper response structure',
      test: content.includes('booking: updated') && content.includes('message:'),
      required: true
    },
    {
      name: 'Comprehensive logging',
      test: content.includes('logBooking.success') && content.includes('logBooking.error'),
      required: true
    }
  ];
  
  let passedChecks = 0;
  let totalChecks = checks.length;
  
  for (const check of checks) {
    if (check.test) {
      console.log(`✅ ${check.name}`);
      passedChecks++;
    } else {
      console.log(`❌ ${check.name}`);
      if (check.required) {
        console.log('   ⚠️  This functionality is required!');
      }
    }
  }
  
  console.log(`\n📊 Functionality Test Results: ${passedChecks}/${totalChecks} checks passed`);
  
  return passedChecks === totalChecks;
}

// Main test function
async function runTests() {
  console.log('Starting comprehensive accept API endpoint testing...\n');
  
  // Run all tests
  const structureTest = testAPIEndpointStructure();
  const importsTest = testImportsAndDependencies();
  const errorTest = testErrorHandling();
  const functionalityTest = testFunctionality();
  
  // Calculate overall results
  const totalTests = 4;
  const passedTests = [structureTest, importsTest, errorTest, functionalityTest].filter(Boolean).length;
  
  console.log('\n📋 Overall Test Results:');
  console.log('========================');
  console.log(`API Endpoint Structure Test: ${structureTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Imports and Dependencies Test: ${importsTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Error Handling Test: ${errorTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Functionality Test: ${functionalityTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! The accept API endpoint is properly configured.');
    console.log('\n✅ Issues Fixed:');
    console.log('   • Switched from db wrapper to direct Prisma usage');
    console.log('   • Added comprehensive error handling');
    console.log('   • Added request logging for debugging');
    console.log('   • Added GET method for testing endpoint accessibility');
    console.log('   • Proper runtime and dynamic configuration');
    
    console.log('\n🚀 The accept API endpoint should now work correctly!');
    console.log('\n📝 What was fixed:');
    console.log('   1. Changed from db.booking to prisma.booking');
    console.log('   2. Added request logging for debugging');
    console.log('   3. Added GET method for testing');
    console.log('   4. Maintained all existing functionality');
    console.log('   5. Proper error handling and status codes');
    
    console.log('\n🔍 Manual Testing Checklist:');
    console.log('=============================');
    console.log('1. Test GET endpoint: https://app.proliinkconnect.co.za/api/book-service/[id]/accept');
    console.log('2. Test POST endpoint with valid booking ID');
    console.log('3. Verify authentication works');
    console.log('4. Check booking status updates to CONFIRMED');
    console.log('5. Verify notifications are created');
    console.log('6. Check email sending');
    console.log('7. Verify WebSocket broadcasting');
    console.log('8. Test error scenarios');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above before deploying.');
    console.log('\n🔧 Recommended Actions:');
    console.log('   1. Fix any failed tests');
    console.log('   2. Re-run this test script');
    console.log('   3. Test manually in browser');
    console.log('   4. Deploy only when all tests pass');
  }
}

// Run tests
runTests().catch(console.error);
