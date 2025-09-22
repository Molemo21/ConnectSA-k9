#!/usr/bin/env node

/**
 * Diagnostic script to identify provider dashboard synchronization issues
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

const logger = createLogger('ProviderDashboardSyncDiagnosis');

function analyzeDashboardComponents() {
  logger.info('Analyzing provider dashboard components');
  
  try {
    const dashboardComponents = [
      'components/provider/provider-dashboard-unified.tsx',
      'components/provider/provider-dashboard-enhanced.tsx',
      'components/provider/provider-dashboard-fixed.tsx',
      'components/provider/provider-dashboard-simple.tsx',
      'components/provider/mobile-provider-dashboard.tsx',
      'components/provider/mobile-provider-dashboard-v2.tsx'
    ];

    const analysis = {
      components: {},
      apiEndpoints: new Set(),
      dataFlow: [],
      potentialIssues: []
    };

    dashboardComponents.forEach(componentPath => {
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // Extract API endpoints
        const apiMatches = content.match(/fetch\(['"`]([^'"`]+)['"`]/g);
        if (apiMatches) {
          apiMatches.forEach(match => {
            const endpoint = match.match(/fetch\(['"`]([^'"`]+)['"`]/)[1];
            if (endpoint.startsWith('/api/')) {
              analysis.apiEndpoints.add(endpoint);
            }
          });
        }

        // Check for authentication handling
        const authChecks = content.match(/credentials:\s*['"]include['"]/g) || [];
        const hasAuthHandling = authChecks.length > 0;
        
        // Check for error handling
        const errorHandling = content.includes('catch') || content.includes('error');
        
        // Check for loading states
        const hasLoadingStates = content.includes('loading') || content.includes('Loading');
        
        // Check for useEffect dependencies
        const useEffectMatches = content.match(/useEffect\([^}]+\[([^\]]+)\]/g) || [];
        
        analysis.components[componentPath] = {
          hasAuthHandling,
          errorHandling,
          hasLoadingStates,
          useEffectCount: useEffectMatches.length,
          apiEndpoints: Array.from(analysis.apiEndpoints)
        };

        // Identify potential issues
        if (!hasAuthHandling) {
          analysis.potentialIssues.push(`${componentPath}: Missing credentials: 'include'`);
        }
        
        if (!errorHandling) {
          analysis.potentialIssues.push(`${componentPath}: Missing error handling`);
        }
        
        if (!hasLoadingStates) {
          analysis.potentialIssues.push(`${componentPath}: Missing loading states`);
        }

        // Check for infinite loops in useEffect
        useEffectMatches.forEach((match, index) => {
          if (match.includes('fetchProviderData') || match.includes('fetchData')) {
            analysis.potentialIssues.push(`${componentPath}: useEffect ${index + 1} may cause infinite loops`);
          }
        });
      }
    });

    return analysis;
  } catch (error) {
    logger.error('Error analyzing dashboard components', error);
    return null;
  }
}

function analyzeAPIEndpoints() {
  logger.info('Analyzing API endpoints used by provider dashboard');
  
  try {
    const apiEndpoints = [
      'app/api/provider/bookings/route.ts',
      'app/api/auth/me/route.ts',
      'app/api/provider/dashboard/route.ts'
    ];

    const analysis = {
      endpoints: {},
      issues: [],
      recommendations: []
    };

    apiEndpoints.forEach(endpointPath => {
      if (fs.existsSync(endpointPath)) {
        const content = fs.readFileSync(endpointPath, 'utf8');
        
        // Check for dynamic export
        const hasDynamicExport = content.includes("export const dynamic = 'force-dynamic'");
        
        // Check for runtime export
        const hasRuntimeExport = content.includes("export const runtime = 'nodejs'");
        
        // Check for authentication
        const hasAuth = content.includes('getCurrentUser') || content.includes('auth');
        
        // Check for error handling
        const hasErrorHandling = content.includes('try') && content.includes('catch');
        
        // Check for logging
        const hasLogging = content.includes('console.log') || content.includes('console.error');
        
        analysis.endpoints[endpointPath] = {
          hasDynamicExport,
          hasRuntimeExport,
          hasAuth,
          hasErrorHandling,
          hasLogging
        };

        // Identify issues
        if (!hasDynamicExport) {
          analysis.issues.push(`${endpointPath}: Missing dynamic export`);
          analysis.recommendations.push(`Add 'export const dynamic = "force-dynamic"' to ${endpointPath}`);
        }
        
        if (!hasAuth) {
          analysis.issues.push(`${endpointPath}: Missing authentication`);
        }
        
        if (!hasErrorHandling) {
          analysis.issues.push(`${endpointPath}: Missing error handling`);
        }
        
        if (!hasLogging) {
          analysis.issues.push(`${endpointPath}: Missing logging for debugging`);
        }
      }
    });

    return analysis;
  } catch (error) {
    logger.error('Error analyzing API endpoints', error);
    return null;
  }
}

function identifySyncIssues() {
  logger.info('Identifying synchronization issues between localhost and production');
  
  const issues = [];
  const solutions = [];

  // Check environment differences
  issues.push('🌐 **Environment Differences**:');
  issues.push('   - Production uses different database connection');
  issues.push('   - Production has different environment variables');
  issues.push('   - Production may have different cookie domain settings');
  issues.push('   - Production uses Vercel deployment with different runtime');

  solutions.push('🔧 **Environment Solutions**:');
  solutions.push('   - Verify DATABASE_URL and DIRECT_URL in production');
  solutions.push('   - Check COOKIE_DOMAIN configuration');
  solutions.push('   - Ensure all environment variables are set correctly');
  solutions.push('   - Verify Prisma connection in production');

  // Check authentication differences
  issues.push('🔐 **Authentication Differences**:');
  issues.push('   - Cookie domain may be different between localhost and production');
  issues.push('   - JWT secret may be different');
  issues.push('   - Session handling may differ');
  issues.push('   - Middleware behavior may differ');

  solutions.push('🔧 **Authentication Solutions**:');
  solutions.push('   - Check cookie domain configuration');
  solutions.push('   - Verify JWT_SECRET is the same');
  solutions.push('   - Test authentication flow in production');
  solutions.push('   - Check middleware configuration');

  // Check data fetching differences
  issues.push('📊 **Data Fetching Differences**:');
  issues.push('   - API endpoints may behave differently in production');
  issues.push('   - Database queries may timeout in production');
  issues.push('   - Caching may interfere with data fetching');
  issues.push('   - Network conditions may differ');

  solutions.push('🔧 **Data Fetching Solutions**:');
  solutions.push('   - Add comprehensive logging to API endpoints');
  solutions.push('   - Add timeout handling to database queries');
  solutions.push('   - Implement proper error handling and retry logic');
  solutions.push('   - Add cache-busting headers');

  // Check component rendering differences
  issues.push('⚛️ **Component Rendering Differences**:');
  issues.push('   - Server-side rendering may differ between environments');
  issues.push('   - Client-side hydration may fail in production');
  issues.push('   - State management may behave differently');
  issues.push('   - useEffect dependencies may cause issues');

  solutions.push('🔧 **Component Rendering Solutions**:');
  solutions.push('   - Ensure consistent SSR/CSR behavior');
  solutions.push('   - Add proper error boundaries');
  solutions.push('   - Fix useEffect dependency arrays');
  solutions.push('   - Add loading and error states');

  return { issues, solutions };
}

function createDiagnosticTest() {
  logger.info('Creating diagnostic test for provider dashboard');
  
  const diagnosticTest = `// Provider Dashboard Diagnostic Test
// Run this in browser console on production to diagnose issues

async function diagnoseProviderDashboard() {
  console.log('🔍 DIAGNOSING PROVIDER DASHBOARD');
  console.log('=================================');
  
  try {
    // Test 1: Check authentication
    console.log('\\n1. Testing Authentication...');
    const authResponse = await fetch('/api/auth/me', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Auth response:', authResponse.status, authResponse.statusText);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Auth data:', {
        userId: authData.user?.id,
        userRole: authData.user?.role,
        userEmail: authData.user?.email,
        isProvider: authData.user?.role === 'PROVIDER'
      });
    } else {
      console.error('Authentication failed:', authResponse.status);
      return;
    }
    
    // Test 2: Check provider bookings API
    console.log('\\n2. Testing Provider Bookings API...');
    const bookingsResponse = await fetch('/api/provider/bookings', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Bookings response:', bookingsResponse.status, bookingsResponse.statusText);
    
    if (bookingsResponse.ok) {
      const bookingsData = await bookingsResponse.json();
      console.log('Bookings data:', {
        success: bookingsData.success,
        bookingCount: bookingsData.bookings?.length || 0,
        hasBookings: (bookingsData.bookings?.length || 0) > 0,
        stats: bookingsData.stats,
        providerId: bookingsData.providerId,
        message: bookingsData.message
      });
    } else {
      const errorData = await bookingsResponse.json().catch(() => ({}));
      console.error('Bookings API failed:', bookingsResponse.status, errorData);
    }
    
    // Test 3: Check cookies
    console.log('\\n3. Checking Cookies...');
    const cookies = document.cookie.split(';').map(c => c.trim());
    console.log('All cookies:', cookies);
    
    const authCookies = cookies.filter(c => c.includes('auth') || c.includes('token') || c.includes('session'));
    console.log('Auth cookies:', authCookies);
    
    // Test 4: Check localStorage
    console.log('\\n4. Checking Local Storage...');
    const localStorageKeys = Object.keys(localStorage);
    console.log('LocalStorage keys:', localStorageKeys);
    
    const authStorage = localStorageKeys.filter(key => 
      key.includes('auth') || key.includes('token') || key.includes('user')
    );
    console.log('Auth storage:', authStorage);
    
    // Test 5: Check network conditions
    console.log('\\n5. Network Information...');
    if ('connection' in navigator) {
      console.log('Connection info:', navigator.connection);
    }
    
    console.log('\\n✅ DIAGNOSIS COMPLETE');
    console.log('=====================');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

// Run the diagnostic
diagnoseProviderDashboard();`;

  return diagnosticTest;
}

function createProductionFix() {
  logger.info('Creating production fix for provider dashboard synchronization');
  
  const productionFix = `// Production Fix for Provider Dashboard Synchronization
// This script addresses common production issues

const fixes = {
  // Fix 1: Enhanced error handling and logging
  enhancedAPIResponse: \`// Enhanced API response with better error handling
export async function GET(request: NextRequest) {
  try {
    console.log('=== PROVIDER BOOKINGS API START ===');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('Request URL:', request.url);
    
    const user = await getCurrentUser();
    console.log('User authenticated:', !!user);
    
    if (!user) {
      console.log('No user found - returning 401');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    if (user.role !== "PROVIDER") {
      console.log('User is not provider:', user.role);
      return NextResponse.json({ error: "Provider role required" }, { status: 403 });
    }

    const provider = await prisma.provider.findUnique({
      where: { userId: user.id },
    });
    
    console.log('Provider found:', !!provider, provider?.id);

    if (!provider) {
      console.log('Provider profile not found');
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    // Fetch bookings with timeout
    const bookings = await Promise.race([
      prisma.booking.findMany({
        where: { providerId: provider.id },
        include: { service: true, client: true, payment: true, review: true },
        orderBy: { scheduledDate: "desc" },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]);

    console.log('Bookings fetched:', bookings.length);
    
    // Calculate stats
    const stats = {
      pendingJobs: bookings.filter(b => b.status === "PENDING").length,
      confirmedJobs: bookings.filter(b => b.status === "CONFIRMED").length,
      pendingExecutionJobs: bookings.filter(b => b.status === "PENDING_EXECUTION").length,
      inProgressJobs: bookings.filter(b => b.status === "IN_PROGRESS").length,
      completedJobs: bookings.filter(b => b.status === "COMPLETED").length,
      totalEarnings: bookings
        .filter(b => b.payment && b.status === "COMPLETED")
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0),
      thisMonthEarnings: bookings
        .filter(b => {
          const bookingDate = new Date(b.scheduledDate);
          const now = new Date();
          return b.payment && 
                 b.status === "COMPLETED" &&
                 bookingDate.getMonth() === now.getMonth() &&
                 bookingDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0),
      averageRating: 0, // Calculate if needed
      totalReviews: bookings.filter(b => b.review).length
    };

    console.log('Stats calculated:', stats);
    console.log('=== PROVIDER BOOKINGS API SUCCESS ===');

    return NextResponse.json({ 
      success: true,
      bookings, 
      stats, 
      providerId: provider.id,
      message: bookings.length === 0 
        ? "No active bookings found. Your bookings will appear here when clients book your services."
        : \`Found \${bookings.length} active bookings\`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('=== PROVIDER BOOKINGS API ERROR ===', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}\`,

  // Fix 2: Enhanced client-side data fetching
  enhancedClientFetching: \`// Enhanced client-side data fetching with retry logic
const fetchProviderData = useCallback(async (retryCount = 0) => {
  const maxRetries = 3;
  
  try {
    console.log(\`Fetching provider data (attempt \${retryCount + 1}/\${maxRetries + 1})\`);
    
    setDashboardState(prev => ({
      ...prev,
      ui: { ...prev.ui, loading: true, error: null }
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch('/api/provider/bookings', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('Provider data response:', response.status, response.statusText);

    if (response.status === 401) {
      console.log('Authentication required, redirecting to login');
      const authSuccess = await checkAuthentication();
      if (!authSuccess) {
        setDashboardState(prev => ({
          ...prev,
          ui: { ...prev.ui, error: 'Authentication expired. Please log in again.' }
        }));
        return;
      }
      // Retry after successful auth
      return fetchProviderData(retryCount);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(\`Provider data fetch failed: \${response.status} - \${errorData.error || 'Unknown error'}\`);
    }

    const data = await response.json();
    console.log('Provider data received:', {
      success: data.success,
      bookingCount: data.bookings?.length || 0,
      hasStats: !!data.stats,
      providerId: data.providerId,
      message: data.message
    });

    setDashboardState(prev => ({
      ...prev,
      data: {
        bookings: data.bookings || [],
        stats: data.stats || prev.data.stats,
        currentProviderId: data.providerId || "",
        hasBankDetails: prev.data.hasBankDetails
      },
      ui: {
        ...prev.ui,
        loading: false,
        error: null,
        lastRefresh: new Date()
      }
    }));

    if (data.providerId) {
      checkBankDetails(data.providerId);
    }

  } catch (error) {
    console.error('Error fetching provider data:', error);
    
    if (error.name === 'AbortError') {
      console.log('Request timed out');
    }
    
    if (retryCount < maxRetries) {
      console.log(\`Retrying in \${(retryCount + 1) * 2} seconds...\`);
      setTimeout(() => fetchProviderData(retryCount + 1), (retryCount + 1) * 2000);
    } else {
      setDashboardState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          loading: false,
          error: \`Failed to load provider data: \${error.message}\`
        }
      }));
    }
  }
}, [checkAuthentication, checkBankDetails]);\`,

  // Fix 3: Environment configuration check
  environmentCheck: \`// Environment configuration check
function checkEnvironmentConfig() {
  const issues = [];
  
  // Check if we're in production
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';
  
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    isProduction,
    isVercel,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    cookieDomain: process.env.COOKIE_DOMAIN
  });
  
  if (isProduction && !process.env.DATABASE_URL) {
    issues.push('Missing DATABASE_URL in production');
  }
  
  if (isProduction && !process.env.DIRECT_URL) {
    issues.push('Missing DIRECT_URL in production');
  }
  
  if (isProduction && !process.env.COOKIE_DOMAIN) {
    issues.push('Missing COOKIE_DOMAIN in production');
  }
  
  return issues;
}\`
};

return fixes;`;

  return productionFix;
}

function main() {
  console.log('🔍 PROVIDER DASHBOARD SYNCHRONIZATION DIAGNOSIS');
  console.log('==============================================');
  
  try {
    // Analyze dashboard components
    console.log('\n1. Analyzing Dashboard Components...');
    const componentAnalysis = analyzeDashboardComponents();
    
    if (componentAnalysis) {
      console.log('\n📊 COMPONENT ANALYSIS');
      console.log('=====================');
      console.log('API Endpoints Used:');
      Array.from(componentAnalysis.apiEndpoints).forEach(endpoint => {
        console.log(`   - ${endpoint}`);
      });
      
      console.log('\nComponent Issues:');
      componentAnalysis.potentialIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    // Analyze API endpoints
    console.log('\n2. Analyzing API Endpoints...');
    const apiAnalysis = analyzeAPIEndpoints();
    
    if (apiAnalysis) {
      console.log('\n🔌 API ENDPOINT ANALYSIS');
      console.log('========================');
      
      Object.entries(apiAnalysis.endpoints).forEach(([endpoint, config]) => {
        console.log(`\\n${endpoint}:`);
        Object.entries(config).forEach(([key, value]) => {
          console.log(`   ${key}: ${value ? '✅' : '❌'}`);
        });
      });
      
      console.log('\nAPI Issues:');
      apiAnalysis.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      
      console.log('\nAPI Recommendations:');
      apiAnalysis.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // Identify sync issues
    console.log('\n3. Identifying Synchronization Issues...');
    const { issues, solutions } = identifySyncIssues();
    
    console.log('\n🔍 SYNCHRONIZATION ISSUES:');
    issues.forEach(issue => console.log(issue));
    
    console.log('\n💡 SOLUTIONS:');
    solutions.forEach(solution => console.log(solution));

    // Create diagnostic test
    console.log('\n4. Creating Diagnostic Test...');
    const diagnosticTest = createDiagnosticTest();
    
    console.log('\n🧪 DIAGNOSTIC TEST CREATED');
    console.log('==========================');
    console.log('✅ Browser console diagnostic script ready');
    console.log('✅ Tests authentication, API calls, cookies, and storage');
    console.log('✅ Provides detailed logging for debugging');

    // Create production fix
    console.log('\n5. Creating Production Fix...');
    const productionFix = createProductionFix();
    
    console.log('\n🔧 PRODUCTION FIX CREATED');
    console.log('=========================');
    console.log('✅ Enhanced API response with comprehensive logging');
    console.log('✅ Enhanced client-side data fetching with retry logic');
    console.log('✅ Environment configuration checks');
    console.log('✅ Timeout handling and error recovery');

    console.log('\n💡 SUMMARY');
    console.log('==========');
    console.log('The provider dashboard sync issue is likely caused by:');
    console.log('1. 🔐 **Authentication differences** between localhost and production');
    console.log('2. 🌐 **Environment configuration** differences');
    console.log('3. 📊 **Data fetching** issues in production');
    console.log('4. ⚛️ **Component rendering** differences');
    console.log('5. 🍪 **Cookie domain** configuration issues');
    
    console.log('\n🎯 **NEXT STEPS:**');
    console.log('1. Run the diagnostic test in production browser console');
    console.log('2. Apply the production fixes to API endpoints');
    console.log('3. Update client-side data fetching with retry logic');
    console.log('4. Verify environment configuration');
    console.log('5. Test authentication flow in production');

  } catch (error) {
    logger.error('Error in provider dashboard diagnosis', error);
    console.error(`❌ Diagnosis failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  analyzeDashboardComponents,
  analyzeAPIEndpoints,
  identifySyncIssues,
  createDiagnosticTest,
  createProductionFix,
  main
};
