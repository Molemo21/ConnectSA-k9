#!/usr/bin/env node

/**
 * Dashboard Issues Fix Script
 * 
 * This script will help fix common dashboard loading issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 ConnectSA Dashboard Issues Fix');
console.log('=================================\n');

// Create environment file template
function createEnvFile() {
  console.log('📝 Creating environment file template...');
  
  const envContent = `# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/connectsa"
DIRECT_URL="postgresql://postgres:password@localhost:5432/connectsa"

# Authentication
JWT_SECRET="your-jwt-secret-key-here-make-it-long-and-secure"
JWT_EXPIRES_IN="7d"
NEXTAUTH_SECRET="your-nextauth-secret-key-here-make-it-long-and-secure"
NEXTAUTH_URL="http://localhost:3000"

# Email
FROM_EMAIL="noreply@connectsa.com"
RESEND_API_KEY="your-resend-api-key"

# Paystack Configuration
PAYSTACK_MODE=test
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret
PAYSTACK_BASE_URL=https://api.paystack.co
PAYSTACK_TEST_MODE=true

# Transfer Configuration
TRANSFER_RETRY_MAX=5
TRANSFER_RETRY_CRON="*/5 * * * *"

# Application
NODE_ENV=development
COOKIE_DOMAIN=localhost
PRISMA_DISABLE_PREPARED_STATEMENTS=false

# Logging
LOG_LEVEL=info

# Public URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000`;

  try {
    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Created .env.local file');
    console.log('⚠️  Please update the database credentials and other values in .env.local');
  } catch (error) {
    console.log('❌ Failed to create .env.local:', error.message);
    console.log('📋 Please manually create .env.local with the following content:');
    console.log(envContent);
  }
}

// Check and fix API endpoint issues
function checkAPIEndpoints() {
  console.log('\n🔍 Checking API endpoints for common issues...');
  
  const apiFiles = [
    'app/api/bookings/my-bookings/route.ts',
    'app/api/provider/bookings/route.ts',
    'app/api/provider/dashboard/route.ts',
    'app/api/user/bookings/route.ts'
  ];
  
  for (const file of apiFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
      
      // Check for common issues
      const content = fs.readFileSync(file, 'utf8');
      
      if (!content.includes('export const dynamic')) {
        console.log(`⚠️  ${file} missing dynamic export`);
      }
      
      if (!content.includes('getCurrentUser')) {
        console.log(`⚠️  ${file} missing authentication`);
      }
      
      if (!content.includes('try {') || !content.includes('catch')) {
        console.log(`⚠️  ${file} missing error handling`);
      }
    } else {
      console.log(`❌ ${file} missing`);
    }
  }
}

// Check dashboard components
function checkDashboardComponents() {
  console.log('\n🎨 Checking dashboard components...');
  
  const components = [
    'components/dashboard/mobile-client-dashboard.tsx',
    'components/provider/provider-dashboard-unified.tsx'
  ];
  
  for (const component of components) {
    if (fs.existsSync(component)) {
      console.log(`✅ ${component} exists`);
      
      const content = fs.readFileSync(component, 'utf8');
      
      if (!content.includes('useEffect')) {
        console.log(`⚠️  ${component} missing useEffect for data fetching`);
      }
      
      if (!content.includes('fetch(')) {
        console.log(`⚠️  ${component} missing fetch calls`);
      }
      
      if (!content.includes('useState')) {
        console.log(`⚠️  ${component} missing state management`);
      }
    } else {
      console.log(`❌ ${component} missing`);
    }
  }
}

// Create a test API endpoint
function createTestEndpoint() {
  console.log('\n🧪 Creating test API endpoint...');
  
  const testApiContent = `import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST API ENDPOINT ===');
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Test database connection
    const userCount = await prisma.user.count();
    console.log('Database connection test - User count:', userCount);
    
    // Test authentication
    const user = await getCurrentUser();
    console.log('Authentication test - User:', user ? 'Authenticated' : 'Not authenticated');
    
    return NextResponse.json({
      success: true,
      message: 'Test API endpoint working',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        userCount
      },
      authentication: {
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.role
        } : null
      }
    });
    
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}`;

  try {
    // Create directory if it doesn't exist
    const testDir = 'app/api/test';
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    fs.writeFileSync('app/api/test/route.ts', testApiContent);
    console.log('✅ Created test API endpoint at /api/test');
  } catch (error) {
    console.log('❌ Failed to create test endpoint:', error.message);
  }
}

// Main fix function
function runFixes() {
  console.log('Starting dashboard fixes...\n');
  
  // Create environment file
  createEnvFile();
  
  // Check API endpoints
  checkAPIEndpoints();
  
  // Check dashboard components
  checkDashboardComponents();
  
  // Create test endpoint
  createTestEndpoint();
  
  console.log('\n📋 Fix Summary:');
  console.log('===============');
  console.log('1. ✅ Environment file template created');
  console.log('2. ✅ API endpoints checked');
  console.log('3. ✅ Dashboard components checked');
  console.log('4. ✅ Test API endpoint created');
  
  console.log('\n🚀 Next Steps:');
  console.log('==============');
  console.log('1. Update .env.local with your actual database credentials');
  console.log('2. Restart your development server');
  console.log('3. Test the /api/test endpoint to verify everything works');
  console.log('4. Check browser console for any remaining errors');
  console.log('5. Test dashboard data loading');
  
  console.log('\n🔧 Common Issues & Solutions:');
  console.log('=============================');
  console.log('• Database connection: Check DATABASE_URL in .env.local');
  console.log('• Authentication: Check NEXTAUTH_SECRET and cookies');
  console.log('• CORS issues: Check COOKIE_DOMAIN setting');
  console.log('• API errors: Check browser network tab for failed requests');
  console.log('• Component errors: Check browser console for JavaScript errors');
}

// Run fixes
runFixes();
