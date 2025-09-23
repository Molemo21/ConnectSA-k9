/**
 * Browser diagnostic script for small screen logout testing
 * Run this in browser console on small screens to debug logout issues
 */

console.log('🔍 SMALL SCREEN LOGOUT DIAGNOSTIC SCRIPT');
console.log('========================================');

// Check current screen size
const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;
console.log(`📱 Current screen size: ${screenWidth}x${screenHeight}`);

// Check if we're in the expected small screen range
const isSmallScreen = screenWidth < 640;
const isMediumScreen = screenWidth >= 640 && screenWidth < 1024;
const isLargeScreen = screenWidth >= 1024;

console.log(`📐 Screen size classification:`);
console.log(`   Small screen (0-639px): ${isSmallScreen ? '✅ YES' : '❌ NO'}`);
console.log(`   Medium screen (640-1023px): ${isMediumScreen ? '✅ YES' : '❌ NO'}`);
console.log(`   Large screen (1024px+): ${isLargeScreen ? '✅ YES' : '❌ NO'}`);

// Check for MobileBottomNav element
const mobileBottomNav = document.querySelector('nav[class*="fixed bottom-0"]');
console.log(`🎯 MobileBottomNav found: ${mobileBottomNav ? '✅ YES' : '❌ NO'}`);

if (mobileBottomNav) {
  const navClasses = mobileBottomNav.className;
  console.log(`   Classes: ${navClasses}`);
  
  // Check if it has sm:hidden
  const hasSmHidden = navClasses.includes('sm:hidden');
  console.log(`   Has sm:hidden: ${hasSmHidden ? '✅ YES' : '❌ NO'}`);
  
  // Check if it's visible
  const computedStyle = window.getComputedStyle(mobileBottomNav);
  const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
  console.log(`   Is visible: ${isVisible ? '✅ YES' : '❌ NO'}`);
  console.log(`   Display: ${computedStyle.display}`);
  console.log(`   Visibility: ${computedStyle.visibility}`);
  
  // Check for logout button
  const logoutButton = mobileBottomNav.querySelector('button[class*="text-red-400"]');
  console.log(`   Logout button found: ${logoutButton ? '✅ YES' : '❌ NO'}`);
  
  if (logoutButton) {
    const buttonText = logoutButton.textContent?.trim();
    console.log(`   Logout button text: "${buttonText}"`);
    
    // Check if button is clickable
    const buttonStyle = window.getComputedStyle(logoutButton);
    const isClickable = !buttonStyle.pointerEvents.includes('none') && !logoutButton.disabled;
    console.log(`   Logout button clickable: ${isClickable ? '✅ YES' : '❌ NO'}`);
    console.log(`   Button disabled: ${logoutButton.disabled ? '❌ YES' : '✅ NO'}`);
  }
}

// Check for mobile header
const mobileHeader = document.querySelector('header[class*="sticky top-0"]');
console.log(`📱 Mobile header found: ${mobileHeader ? '✅ YES' : '❌ NO'}`);

if (mobileHeader) {
  const headerClasses = mobileHeader.className;
  console.log(`   Header classes: ${headerClasses}`);
  
  // Check if it has lg:hidden
  const hasLgHidden = headerClasses.includes('lg:hidden');
  console.log(`   Has lg:hidden: ${hasLgHidden ? '✅ YES' : '❌ NO'}`);
  
  // Check for user avatar button
  const userAvatar = mobileHeader.querySelector('button[class*="rounded-full"]');
  console.log(`   User avatar button found: ${userAvatar ? '✅ YES' : '❌ NO'}`);
  
  if (userAvatar) {
    const isClickable = !userAvatar.disabled;
    console.log(`   User avatar clickable: ${isClickable ? '✅ YES' : '❌ NO'}`);
  }
}

// Check for desktop sidebar
const desktopSidebar = document.querySelector('div[class*="hidden lg:flex"]');
console.log(`💻 Desktop sidebar found: ${desktopSidebar ? '✅ YES' : '❌ NO'}`);

// Check authentication state
const authToken = document.cookie.split(';').find(c => c.trim().startsWith('auth-token='));
console.log(`🔐 Auth token present: ${authToken ? '✅ YES' : '❌ NO'}`);

// Check for any JavaScript errors
console.log('🚨 Checking for JavaScript errors...');
const originalError = window.onerror;
window.onerror = function(msg, url, line, col, error) {
  console.log(`❌ JavaScript Error: ${msg} at ${url}:${line}:${col}`);
  if (originalError) originalError.apply(this, arguments);
};

// Test logout functionality
console.log('🧪 Testing logout functionality...');

// Function to test logout
function testLogout() {
  console.log('🔄 Attempting logout...');
  
  // Check if useLogout hook is available (this won't work in console, but we can check for the button)
  const logoutButton = document.querySelector('button[class*="text-red-400"]');
  
  if (logoutButton) {
    console.log('✅ Logout button found, simulating click...');
    
    // Simulate click
    logoutButton.click();
    
    // Check if anything happened after a short delay
    setTimeout(() => {
      const newAuthToken = document.cookie.split(';').find(c => c.trim().startsWith('auth-token='));
      console.log(`🔐 Auth token after logout attempt: ${newAuthToken ? '❌ STILL PRESENT' : '✅ CLEARED'}`);
    }, 1000);
  } else {
    console.log('❌ No logout button found');
  }
}

// Make test function available globally
window.testLogout = testLogout;

console.log('🎯 DIAGNOSTIC COMPLETE');
console.log('======================');
console.log('💡 If logout is still not working:');
console.log('   1. Run testLogout() to simulate logout');
console.log('   2. Check browser console for errors');
console.log('   3. Verify the correct components are rendering');
console.log('   4. Test on actual mobile device, not just browser resize');

// Auto-run test if on small screen
if (isSmallScreen && mobileBottomNav) {
  console.log('🤖 Auto-testing logout on small screen...');
  setTimeout(testLogout, 2000);
}
