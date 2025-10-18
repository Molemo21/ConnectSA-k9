/**
 * Manual Payment Callback Processing
 * This will manually process the payment callback from the URL parameters
 */

async function manualPaymentCallbackProcessing() {
  console.log('🔧 Manual Payment Callback Processing...\n');
  
  // Extract parameters from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const payment = urlParams.get('payment');
  const bookingId = urlParams.get('booking');
  const trxref = urlParams.get('trxref');
  const reference = urlParams.get('reference');
  
  console.log('📊 URL Parameters:');
  console.log(`   Payment: ${payment}`);
  console.log(`   Booking ID: ${bookingId}`);
  console.log(`   Trxref: ${trxref}`);
  console.log(`   Reference: ${reference}`);
  
  if (payment === 'success' && bookingId && (reference || trxref)) {
    const refKey = reference || trxref;
    
    console.log('\n🚀 Processing payment callback...');
    console.log(`   Booking ID: ${bookingId}`);
    console.log(`   Reference: ${refKey}`);
    
    try {
      // Show success message
      console.log('✅ Payment completed successfully! Verifying payment...');
      
      // Verify payment with Paystack
      console.log('🔍 Verifying payment with reference:', refKey);
      
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reference: refKey })
      });

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('✅ Payment verification successful:', verifyData);
        console.log(`   Payment Status: ${verifyData.payment?.status}`);
        console.log(`   Booking Status: ${verifyData.booking?.status}`);
        
        // Clean up URL
        console.log('🧹 Cleaning up URL...');
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('payment');
        cleanUrl.searchParams.delete('booking');
        cleanUrl.searchParams.delete('trxref');
        cleanUrl.searchParams.delete('reference');
        window.history.replaceState({}, '', cleanUrl.toString());
        
        console.log('🎉 Payment callback processed successfully!');
        console.log('📋 Next steps:');
        console.log('1. The URL should now be clean (no payment parameters)');
        console.log('2. Refresh the page to see updated booking status');
        console.log('3. The "Paid" step should now be ticked');
        console.log('4. The "Pay Now" button should no longer appear');
        
        // Show success message to user
        alert('Payment completed successfully! The page will now refresh to show updated status.');
        
        // Refresh the page
        window.location.reload();
        
      } else {
        const errorText = await verifyResponse.text();
        console.error('❌ Payment verification failed:', errorText);
        alert('Payment completed but verification failed. Please refresh the page manually.');
      }
      
    } catch (error) {
      console.error('❌ Payment callback processing failed:', error);
      alert('Payment callback processing failed. Please refresh the page manually.');
    }
    
  } else {
    console.log('❌ Invalid payment callback parameters');
    console.log('Expected: payment=success, booking=ID, and (reference or trxref)');
  }
}

// Run the manual processing
manualPaymentCallbackProcessing().catch(console.error);
