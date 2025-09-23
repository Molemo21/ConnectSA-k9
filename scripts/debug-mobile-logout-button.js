/**
 * Debug script for mobile logout button responsiveness
 * Run this in mobile browser console to test logout button
 */

console.log('🔍 MOBILE LOGOUT BUTTON DEBUG SCRIPT');
console.log('====================================');

// Check if we're on mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
console.log('📱 Mobile device detected:', isMobile);

// Find the mobile bottom nav
const mobileBottomNav = document.querySelector('nav[class*="fixed bottom-0"]');
console.log('🎯 Mobile bottom nav found:', !!mobileBottomNav);

if (mobileBottomNav) {
  console.log('📋 Mobile bottom nav details:');
  console.log('   Classes:', mobileBottomNav.className);
  console.log('   Visible:', window.getComputedStyle(mobileBottomNav).display !== 'none');
  console.log('   Z-index:', window.getComputedStyle(mobileBottomNav).zIndex);
  
  // Find logout button
  const logoutButton = mobileBottomNav.querySelector('button[class*="text-red-400"]');
  console.log('🔴 Logout button found:', !!logoutButton);
  
  if (logoutButton) {
    console.log('📋 Logout button details:');
    console.log('   Text:', logoutButton.textContent?.trim());
    console.log('   Classes:', logoutButton.className);
    console.log('   Disabled:', logoutButton.disabled);
    console.log('   Visible:', window.getComputedStyle(logoutButton).display !== 'none');
    console.log('   Clickable:', !logoutButton.disabled && window.getComputedStyle(logoutButton).pointerEvents !== 'none');
    
    // Test button click
    console.log('🧪 Testing button click...');
    
    // Add click event listener for testing
    const testClick = () => {
      console.log('✅ Button click event fired!');
    };
    
    logoutButton.addEventListener('click', testClick);
    
    // Test programmatic click
    console.log('🖱️ Simulating click...');
    logoutButton.click();
    
    // Remove test listener
    setTimeout(() => {
      logoutButton.removeEventListener('click', testClick);
    }, 1000);
  }
} else {
  console.log('❌ Mobile bottom nav not found');
}

// Check for any JavaScript errors
const originalError = window.onerror;
window.onerror = function(msg, url, line, col, error) {
  console.log('❌ JavaScript Error:', msg, 'at', url + ':' + line + ':' + col);
  if (originalError) originalError.apply(this, arguments);
};

// Test function to manually trigger logout
function testLogout() {
  console.log('🔄 Manually testing logout...');
  
  const logoutButton = document.querySelector('nav[class*="fixed bottom-0"] button[class*="text-red-400"]');
  
  if (logoutButton) {
    console.log('✅ Logout button found, clicking...');
    logoutButton.click();
    
    // Check if logout function is called
    setTimeout(() => {
      const authToken = document.cookie.split(';').find(c => c.trim().startsWith('auth-token='));
      console.log('🔐 Auth token status after logout:', authToken ? 'STILL PRESENT' : 'CLEARED');
    }, 2000);
  } else {
    console.log('❌ Logout button not found');
  }
}

// Make test function available globally
window.testLogout = testLogout;

console.log('🎯 DEBUG SCRIPT READY');
console.log('=====================');
console.log('💡 Commands available:');
console.log('   - testLogout() - Test logout functionality');
console.log('   - Check console for detailed button information');
console.log('   - Look for touch/click event logs');

// Auto-test if on mobile
if (isMobile) {
  console.log('🤖 Auto-testing in 2 seconds...');
  setTimeout(testLogout, 2000);
}
