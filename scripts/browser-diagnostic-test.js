// Provider Dashboard Browser Diagnostic Test
// Copy and paste this into the browser console on production to diagnose issues

async function diagnoseProviderDashboard() {
  console.log('🔍 DIAGNOSING PROVIDER DASHBOARD');
  console.log('=================================');
  
  try {
    // Test 1: Check authentication
    console.log('\n1. Testing Authentication...');
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
      
      if (authData.user?.role !== 'PROVIDER') {
        console.error('❌ User is not a provider! Role:', authData.user?.role);
        return;
      }
    } else {
      console.error('❌ Authentication failed:', authResponse.status);
      return;
    }
    
    // Test 2: Check provider bookings API
    console.log('\n2. Testing Provider Bookings API...');
    const bookingsResponse = await fetch('/api/provider/bookings', {
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('Bookings response:', bookingsResponse.status, bookingsResponse.statusText);
    console.log('Response headers:', Object.fromEntries(bookingsResponse.headers.entries()));
    
    if (bookingsResponse.ok) {
      const bookingsData = await bookingsResponse.json();
      console.log('✅ Bookings data received:', {
        success: bookingsData.success,
        bookingCount: bookingsData.bookings?.length || 0,
        hasBookings: (bookingsData.bookings?.length || 0) > 0,
        stats: bookingsData.stats,
        providerId: bookingsData.providerId,
        message: bookingsData.message,
        timestamp: bookingsData.timestamp
      });
      
      // Check if bookings data is valid
      if (!bookingsData.bookings || !Array.isArray(bookingsData.bookings)) {
        console.error('❌ Invalid bookings data structure');
      }
      
      if (!bookingsData.stats) {
        console.error('❌ Missing stats data');
      }
      
      if (!bookingsData.providerId) {
        console.error('❌ Missing provider ID');
      }
      
    } else {
      const errorData = await bookingsResponse.json().catch(() => ({}));
      console.error('❌ Bookings API failed:', bookingsResponse.status, errorData);
    }
    
    // Test 3: Check cookies
    console.log('\n3. Checking Cookies...');
    const cookies = document.cookie.split(';').map(c => c.trim());
    console.log('All cookies:', cookies);
    
    const authCookies = cookies.filter(c => c.includes('auth') || c.includes('token') || c.includes('session'));
    console.log('Auth cookies:', authCookies);
    
    if (authCookies.length === 0) {
      console.error('❌ No authentication cookies found');
    }
    
    // Test 4: Check localStorage
    console.log('\n4. Checking Local Storage...');
    const localStorageKeys = Object.keys(localStorage);
    console.log('LocalStorage keys:', localStorageKeys);
    
    const authStorage = localStorageKeys.filter(key => 
      key.includes('auth') || key.includes('token') || key.includes('user')
    );
    console.log('Auth storage:', authStorage);
    
    // Test 5: Check network conditions
    console.log('\n5. Network Information...');
    if ('connection' in navigator) {
      console.log('Connection info:', {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      });
    }
    
    // Test 6: Check current URL and environment
    console.log('\n6. Environment Information...');
    console.log('Current URL:', window.location.href);
    console.log('User Agent:', navigator.userAgent);
    console.log('Online:', navigator.onLine);
    
    // Test 7: Test API response times
    console.log('\n7. Testing API Response Times...');
    
    const startTime = Date.now();
    const testResponse = await fetch('/api/provider/bookings', {
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    const responseTime = Date.now() - startTime;
    
    console.log(`API response time: ${responseTime}ms`);
    
    if (responseTime > 10000) {
      console.warn('⚠️ Slow API response (>10s)');
    } else if (responseTime > 5000) {
      console.warn('⚠️ Moderate API response (>5s)');
    } else {
      console.log('✅ Good API response time');
    }
    
    console.log('\n✅ DIAGNOSIS COMPLETE');
    console.log('=====================');
    console.log('If you see any ❌ errors above, those are the issues to fix.');
    console.log('If everything shows ✅, the dashboard should be working.');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Auto-run the diagnostic
console.log('🚀 Starting Provider Dashboard Diagnostic...');
diagnoseProviderDashboard();

// Also export the function for manual use
window.diagnoseProviderDashboard = diagnoseProviderDashboard;
