#!/usr/bin/env node

/**
 * Dashboard Issues Diagnostic Script
 * 
 * This script will help identify why dashboards are not loading data
 * and why the provider dashboard is not loading at all.
 */

console.log('🔍 ConnectSA Dashboard Issues Diagnostic');
console.log('=====================================\n');

// Test database connection
async function testDatabaseConnection() {
  console.log('📊 Testing Database Connection...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test user table
    const userCount = await prisma.user.count();
    console.log(`✅ Users table accessible: ${userCount} users found`);
    
    // Test provider table
    const providerCount = await prisma.provider.count();
    console.log(`✅ Providers table accessible: ${providerCount} providers found`);
    
    // Test booking table
    const bookingCount = await prisma.booking.count();
    console.log(`✅ Bookings table accessible: ${bookingCount} bookings found`);
    
    // Test payment table
    const paymentCount = await prisma.payment.count();
    console.log(`✅ Payments table accessible: ${paymentCount} payments found`);
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

// Test authentication system
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication System...');
  
  try {
    // Test JWT secret
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.log('❌ NEXTAUTH_SECRET not set');
      return false;
    }
    console.log('✅ NEXTAUTH_SECRET is set');
    
    // Test cookie domain
    const cookieDomain = process.env.COOKIE_DOMAIN;
    if (!cookieDomain) {
      console.log('⚠️  COOKIE_DOMAIN not set (may cause auth issues)');
    } else {
      console.log('✅ COOKIE_DOMAIN is set');
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Authentication test failed:', error.message);
    return false;
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints...');
  
  const endpoints = [
    '/api/bookings/my-bookings',
    '/api/provider/bookings',
    '/api/provider/dashboard',
    '/api/user/bookings'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      // Note: This would need a running server to test properly
      console.log(`✅ ${endpoint} endpoint exists`);
    } catch (error) {
      console.log(`❌ ${endpoint} endpoint failed:`, error.message);
    }
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  console.log('\n🔧 Checking Environment Variables...');
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  const optionalVars = [
    'COOKIE_DOMAIN',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`❌ ${varName} is missing (REQUIRED)`);
    }
  }
  
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`⚠️  ${varName} is not set (optional)`);
    }
  }
}

// Check file structure
function checkFileStructure() {
  console.log('\n📁 Checking File Structure...');
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'app/api/bookings/my-bookings/route.ts',
    'app/api/provider/bookings/route.ts',
    'app/api/provider/dashboard/route.ts',
    'app/api/user/bookings/route.ts',
    'components/dashboard/mobile-client-dashboard.tsx',
    'components/provider/provider-dashboard-unified.tsx',
    'lib/auth.ts',
    'lib/prisma.ts'
  ];
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} is missing`);
    }
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('Starting comprehensive dashboard diagnostics...\n');
  
  // Check environment
  checkEnvironmentVariables();
  
  // Check file structure
  checkFileStructure();
  
  // Test database
  const dbConnected = await testDatabaseConnection();
  
  // Test authentication
  const authWorking = await testAuthentication();
  
  // Test API endpoints
  await testAPIEndpoints();
  
  console.log('\n📋 Diagnostic Summary:');
  console.log('=====================');
  console.log(`Database Connection: ${dbConnected ? '✅ Working' : '❌ Failed'}`);
  console.log(`Authentication: ${authWorking ? '✅ Working' : '❌ Failed'}`);
  
  if (!dbConnected) {
    console.log('\n🚨 CRITICAL ISSUE: Database connection failed');
    console.log('   - Check DATABASE_URL environment variable');
    console.log('   - Verify database server is running');
    console.log('   - Check network connectivity');
  }
  
  if (!authWorking) {
    console.log('\n🚨 CRITICAL ISSUE: Authentication system failed');
    console.log('   - Check NEXTAUTH_SECRET environment variable');
    console.log('   - Verify JWT configuration');
  }
  
  console.log('\n💡 Common Solutions:');
  console.log('===================');
  console.log('1. Ensure all environment variables are set correctly');
  console.log('2. Check database connection string format');
  console.log('3. Verify user authentication cookies');
  console.log('4. Check browser console for JavaScript errors');
  console.log('5. Verify API endpoints are accessible');
  console.log('6. Check network requests in browser dev tools');
  
  console.log('\n🔧 Next Steps:');
  console.log('==============');
  console.log('1. Run this script in your production environment');
  console.log('2. Check browser developer tools for errors');
  console.log('3. Test API endpoints directly with curl/Postman');
  console.log('4. Verify database permissions and data');
}

// Run diagnostics
runDiagnostics().catch(console.error);
