/**
 * Browser test script for mobile bottom nav logout functionality
 * Run this in browser console on small screens to test logout
 */

console.log('🧪 MOBILE BOTTOM NAV LOGOUT TEST');
console.log('=================================');

// Check current screen size
const screenWidth = window.innerWidth;
console.log(`📱 Current screen width: ${screenWidth}px`);

// Check if we're on small screen
const isSmallScreen = screenWidth < 640;
console.log(`📐 Small screen (<640px): ${isSmallScreen ? '✅ YES' : '❌ NO'}`);

// Find mobile bottom nav
const mobileBottomNav = document.querySelector('nav[class*="fixed bottom-0"]');
console.log(`🎯 Mobile bottom nav found: ${mobileBottomNav ? '✅ YES' : '❌ NO'}`);

if (mobileBottomNav) {
  console.log('📋 Mobile bottom nav details:');
  console.log(`   Classes: ${mobileBottomNav.className}`);
  
  // Check visibility
  const computedStyle = window.getComputedStyle(mobileBottomNav);
  console.log(`   Display: ${computedStyle.display}`);
  console.log(`   Visibility: ${computedStyle.visibility}`);
  console.log(`   Z-index: ${computedStyle.zIndex}`);
  
  // Find logout button
  const logoutButton = mobileBottomNav.querySelector('button[class*="text-red-400"]');
  console.log(`🔴 Logout button found: ${logoutButton ? '✅ YES' : '❌ NO'}`);
  
  if (logoutButton) {
    console.log('📋 Logout button details:');
    console.log(`   Text: "${logoutButton.textContent?.trim()}"`);
    console.log(`   Disabled: ${logoutButton.disabled ? '❌ YES' : '✅ NO'}`);
    console.log(`   Classes: ${logoutButton.className}`);
    
    // Check if button is clickable
    const buttonStyle = window.getComputedStyle(logoutButton);
    const isClickable = !buttonStyle.pointerEvents.includes('none') && !logoutButton.disabled;
    console.log(`   Clickable: ${isClickable ? '✅ YES' : '❌ NO'}`);
  }
}

// Check authentication state
const authToken = document.cookie.split(';').find(c => c.trim().startsWith('auth-token='));
console.log(`🔐 Auth token present: ${authToken ? '✅ YES' : '❌ NO'}`);

// Enhanced logout test function
function testMobileBottomNavLogout() {
  console.log('🔄 TESTING MOBILE BOTTOM NAV LOGOUT...');
  
  const logoutButton = document.querySelector('nav[class*="fixed bottom-0"] button[class*="text-red-400"]');
  
  if (!logoutButton) {
    console.log('❌ No logout button found in mobile bottom nav');
    return false;
  }
  
  console.log('✅ Logout button found, testing...');
  
  // Check initial state
  const initialAuthToken = document.cookie.split(';').find(c => c.trim().startsWith('auth-token='));
  console.log(`🔐 Initial auth token: ${initialAuthToken ? 'PRESENT' : 'ABSENT'}`);
  
  // Simulate click
  console.log('🖱️ Clicking logout button...');
  logoutButton.click();
  
  // Monitor logout process
  let checkCount = 0;
  const maxChecks = 10;
  
  const checkLogout = () => {
    checkCount++;
    console.log(`⏱️ Checking logout progress (${checkCount}/${maxChecks})...`);
    
    const currentAuthToken = document.cookie.split(';').find(c => c.trim().startsWith('auth-token='));
    const tokenCleared = !currentAuthToken;
    
    console.log(`🔐 Current auth token: ${currentAuthToken ? 'STILL PRESENT' : 'CLEARED'}`);
    
    if (tokenCleared) {
      console.log('🎉 LOGOUT SUCCESSFUL! Auth token cleared');
      return true;
    }
    
    if (checkCount >= maxChecks) {
      console.log('❌ LOGOUT FAILED! Auth token still present after multiple checks');
      return false;
    }
    
    // Check again in 1 second
    setTimeout(checkLogout, 1000);
  };
  
  // Start checking after a short delay
  setTimeout(checkLogout, 500);
}

// Make test function available globally
window.testMobileBottomNavLogout = testMobileBottomNavLogout;

// Auto-run test if conditions are met
if (isSmallScreen && mobileBottomNav && document.querySelector('nav[class*="fixed bottom-0"] button[class*="text-red-400"]')) {
  console.log('🤖 Auto-testing mobile bottom nav logout in 3 seconds...');
  console.log('💡 You can also run testMobileBottomNavLogout() manually');
  
  setTimeout(() => {
    console.log('🚀 Starting auto-test...');
    testMobileBottomNavLogout();
  }, 3000);
} else {
  console.log('⚠️ Auto-test skipped. Reasons:');
  console.log(`   Small screen: ${isSmallScreen ? '✅' : '❌'}`);
  console.log(`   Mobile bottom nav: ${mobileBottomNav ? '✅' : '❌'}`);
  console.log(`   Logout button: ${document.querySelector('nav[class*="fixed bottom-0"] button[class*="text-red-400"]') ? '✅' : '❌'}`);
}

console.log('🎯 TEST READY');
console.log('=============');
console.log('💡 Commands available:');
console.log('   - testMobileBottomNavLogout() - Test logout functionality');
console.log('   - Check browser console for detailed logout logs');
console.log('   - Monitor network tab for logout API calls');
