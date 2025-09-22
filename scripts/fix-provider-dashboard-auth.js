#!/usr/bin/env node

/**
 * Fix provider dashboard authentication issue
 */

const fs = require('fs');
const path = require('path');

// Structured logging utility
const createLogger = (context) => ({
  info: (message, data = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  error: (message, error, data = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      context,
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  warn: (message, data = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  }
});

const logger = createLogger('FixProviderDashboardAuth');

function enhanceAuthDebugAPI() {
  logger.info('Enhancing auth debug API');
  
  const authDebugContent = `import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserSafe } from "@/lib/auth"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
      return NextResponse.json({
        error: "Service temporarily unavailable during deployment"
      }, { status: 503 });
    }

    const user = await getCurrentUserSafe()
    const cookieHeader = request.headers.get("cookie") || ""
    
    // Extract cookie names
    const cookies = cookieHeader
      .split(";")
      .map(c => c.trim())
      .filter(c => c.length > 0)
      .map(c => c.split("=")[0])
    
    const hasAuthToken = cookieHeader.includes("auth-token=")
    
    return NextResponse.json({
      isAuthenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        provider: user.provider
      } : null,
      hasAuthToken,
      cookies,
      cookieHeader: cookieHeader.substring(0, 200) + (cookieHeader.length > 200 ? "..." : ""),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Auth debug API error:', error)
    return NextResponse.json({
      isAuthenticated: false,
      user: null,
      hasAuthToken: false,
      cookies: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}`;

  try {
    fs.writeFileSync('app/api/auth/debug/route.ts', authDebugContent);
    logger.info('Enhanced auth debug API created');
    return true;
  } catch (error) {
    logger.error('Error creating auth debug API', error);
    return false;
  }
}

function enhanceLoginFlow() {
  logger.info('Enhancing login flow');
  
  const loginEnhancement = `// Enhanced login flow with better cookie handling
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { verifyPassword, setAuthCookie, getUserDashboardPath } from "@/lib/auth"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const runtime = 'nodejs'

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
      return NextResponse.json({
        error: "Service temporarily unavailable during deployment"
      }, { status: 503 });
    }

    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Find user with provider info if applicable
    const user = await db.user.findUnique({
      where: { email },
      include: {
        provider: {
          select: {
            status: true,
          },
        },
      },
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Require verified email before issuing session
    if (!user.emailVerified) {
      return NextResponse.json({ error: "Please verify your email before logging in." }, { status: 403 })
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({ error: "Account has been deactivated" }, { status: 401 })
    }

    // Create auth user object
    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    }

    // Set auth cookie with enhanced configuration
    await setAuthCookie(authUser)

    // Determine redirect URL
    const redirectUrl = await getUserDashboardPath(
      user.role, 
      user.emailVerified, 
      user.provider?.status
    )

    console.log('Login successful:', {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      redirectUrl,
      providerStatus: user.provider?.status
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      redirectUrl
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}`;

  try {
    // Update the existing login route
    const loginRoutePath = 'app/api/auth/login/route.ts';
    if (fs.existsSync(loginRoutePath)) {
      const existingContent = fs.readFileSync(loginRoutePath, 'utf8');
      
      // Check if already enhanced
      if (existingContent.includes('Enhanced login flow')) {
        logger.info('Login route already enhanced');
        return true;
      }
      
      // Backup original
      fs.writeFileSync(loginRoutePath + '.backup', existingContent);
      
      // Write enhanced version
      fs.writeFileSync(loginRoutePath, loginEnhancement);
      logger.info('Enhanced login route');
      return true;
    } else {
      logger.error('Login route not found');
      return false;
    }
  } catch (error) {
    logger.error('Error enhancing login flow', error);
    return false;
  }
}

function createAuthenticationTest() {
  logger.info('Creating authentication test');
  
  const testContent = `#!/usr/bin/env node

/**
 * Test authentication flow end-to-end
 */

const https = require('https');
const http = require('http');

async function testAuthenticationFlow() {
  const baseUrl = 'https://app.proliinkconnect.co.za';
  
  console.log('🔐 TESTING AUTHENTICATION FLOW');
  console.log('===============================');
  
  try {
    // Test 1: Check if user can access auth debug
    console.log('\\n1. Testing auth debug endpoint...');
    const debugResponse = await makeRequest(\`\${baseUrl}/api/auth/debug\`);
    console.log(\`   Status: \${debugResponse.status}\`);
    console.log(\`   Authenticated: \${debugResponse.data.isAuthenticated}\`);
    console.log(\`   Has auth token: \${debugResponse.data.hasAuthToken}\`);
    
    if (!debugResponse.data.isAuthenticated) {
      console.log('   ❌ User is not authenticated');
      console.log('   💡 User needs to log in through the browser');
      console.log('   💡 Or cookies might not be working properly');
    } else {
      console.log('   ✅ User is authenticated');
      console.log(\`   👤 User: \${debugResponse.data.user?.email} (\${debugResponse.data.user?.role})\`);
    }
    
    // Test 2: Check provider dashboard API
    console.log('\\n2. Testing provider dashboard API...');
    const dashboardResponse = await makeRequest(\`\${baseUrl}/api/provider/bookings\`);
    console.log(\`   Status: \${dashboardResponse.status}\`);
    
    if (dashboardResponse.status === 200) {
      console.log('   ✅ Provider dashboard API is working');
    } else {
      console.log(\`   ❌ Provider dashboard API failed: \${dashboardResponse.status}\`);
      console.log(\`   Error: \${dashboardResponse.data.error || 'Unknown error'}\`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const request = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: response.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: response.statusCode,
            data: data
          });
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
    
    request.end();
  });
}

if (require.main === module) {
  testAuthenticationFlow().catch(console.error);
}

module.exports = { testAuthenticationFlow };
`;

  try {
    fs.writeFileSync('scripts/test-auth-flow.js', testContent);
    logger.info('Created authentication test script');
    return true;
  } catch (error) {
    logger.error('Error creating authentication test', error);
    return false;
  }
}

function main() {
  console.log('🔧 FIXING PROVIDER DASHBOARD AUTHENTICATION ISSUE');
  console.log('================================================');
  
  let successCount = 0;
  let totalTasks = 3;

  try {
    // Task 1: Enhance auth debug API
    console.log('\n1. Enhancing auth debug API...');
    if (enhanceAuthDebugAPI()) {
      successCount++;
      console.log('   ✅ Auth debug API enhanced');
    } else {
      console.log('   ❌ Failed to enhance auth debug API');
    }

    // Task 2: Enhance login flow
    console.log('\n2. Enhancing login flow...');
    if (enhanceLoginFlow()) {
      successCount++;
      console.log('   ✅ Login flow enhanced');
    } else {
      console.log('   ❌ Failed to enhance login flow');
    }

    // Task 3: Create authentication test
    console.log('\n3. Creating authentication test...');
    if (createAuthenticationTest()) {
      successCount++;
      console.log('   ✅ Authentication test created');
    } else {
      console.log('   ❌ Failed to create authentication test');
    }

    console.log('\n📊 SUMMARY');
    console.log('===========');
    console.log(`✅ Successful tasks: ${successCount}/${totalTasks}`);
    console.log(`❌ Failed tasks: ${totalTasks - successCount}/${totalTasks}`);

    if (successCount === totalTasks) {
      console.log('\n🎉 PROVIDER DASHBOARD AUTH FIX COMPLETE!');
      console.log('========================================');
      console.log('✅ Enhanced auth debug API for better troubleshooting');
      console.log('✅ Enhanced login flow with better cookie handling');
      console.log('✅ Created authentication test script');
      
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Deploy these changes to production');
      console.log('2. Test authentication using /auth-debug page');
      console.log('3. Ensure user is properly logged in');
      console.log('4. Verify provider dashboard loads correctly');
      
      console.log('\n🔍 TROUBLESHOOTING:');
      console.log('1. Visit /auth-debug to check authentication status');
      console.log('2. If not authenticated, log in through /login');
      console.log('3. Check browser cookies for auth-token');
      console.log('4. Verify user has PROVIDER role');
    } else {
      console.log('\n⚠️  SOME FIXES FAILED');
      console.log('Please review the errors above and apply fixes manually');
    }

  } catch (error) {
    logger.error('Error in provider dashboard auth fix', error);
    console.error(`❌ Fix failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  enhanceAuthDebugAPI,
  enhanceLoginFlow,
  createAuthenticationTest
};
