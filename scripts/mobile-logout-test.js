/**
 * Mobile-specific logout test script
 * Run this in mobile browser console to test logout
 */

console.log('📱 MOBILE LOGOUT TEST SCRIPT');
console.log('============================');

// Detect mobile browser
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
console.log('📱 Mobile browser detected:', isMobile);

// Check mobile-specific features
const mobileChecks = {
  touchSupport: 'ontouchstart' in window,
  orientationSupport: 'onorientationchange' in window,
  devicePixelRatio: window.devicePixelRatio,
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,
  networkStatus: navigator.onLine,
  storageAvailable: typeof(Storage) !== "undefined",
  localStorageAvailable: (function() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch(e) {
      return false;
    }
  })(),
  sessionStorageAvailable: (function() {
    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      return true;
    } catch(e) {
      return false;
    }
  })()
};

console.log('🔍 Mobile capability checks:', mobileChecks);

// Enhanced logout test with mobile-specific handling
async function testMobileLogout() {
  console.log('🔄 Testing mobile logout...');
  
  try {
    // Check network connectivity
    if (!navigator.onLine) {
      console.log('❌ No network connection');
      return false;
    }
    
    // Check storage availability
    if (!mobileChecks.localStorageAvailable) {
      console.log('⚠️ LocalStorage not available');
    }
    
    if (!mobileChecks.sessionStorageAvailable) {
      console.log('⚠️ SessionStorage not available');
    }
    
    // Find logout button
    const logoutButton = document.querySelector('nav[class*="fixed bottom-0"] button[class*="text-red-400"]');
    if (!logoutButton) {
      console.log('❌ Logout button not found');
      return false;
    }
    
    console.log('✅ Logout button found');
    
    // Simulate touch event
    const touchEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [{
        clientX: 0,
        clientY: 0,
        identifier: 0
      }]
    });
    
    logoutButton.dispatchEvent(touchEvent);
    
    // Simulate click
    logoutButton.click();
    
    console.log('🖱️ Logout button clicked');
    
    // Monitor logout progress
    let attempts = 0;
    const maxAttempts = 15;
    
    const checkProgress = () => {
      attempts++;
      console.log(`⏱️ Checking logout progress (${attempts}/${maxAttempts})...`);
      
      const authToken = document.cookie.split(';').find(c => c.trim().startsWith('auth-token='));
      const tokenCleared = !authToken;
      
      console.log(`🔐 Auth token status: ${tokenCleared ? 'CLEARED ✅' : 'STILL PRESENT ❌'}`);
      
      if (tokenCleared) {
        console.log('🎉 MOBILE LOGOUT SUCCESSFUL!');
        return true;
      }
      
      if (attempts >= maxAttempts) {
        console.log('❌ MOBILE LOGOUT FAILED - Token not cleared');
        return false;
      }
      
      setTimeout(checkProgress, 1000);
    };
    
    setTimeout(checkProgress, 1000);
    
  } catch (error) {
    console.error('❌ Mobile logout test error:', error);
    return false;
  }
}

// Make function available globally
window.testMobileLogout = testMobileLogout;

console.log('🎯 Mobile test ready');
console.log('💡 Run testMobileLogout() to test logout on mobile');
