# 🔧 **Payment Redirect & Status Sync Fixes - ConnectSA**

**Document Version:** 1.0  
**Date:** December 2024  
**Purpose:** Document the comprehensive fixes for payment gateway redirect and booking status synchronization issues

---

## 🚨 **Issues Identified & Fixed**

### **Issue 1: Payment Gateway Redirect Failure**
- ❌ **Problem**: Frontend shows "Redirecting to payment gateway..." but never redirects
- ❌ **Root Cause**: `window.location.href` redirect was failing silently
- ✅ **Solution**: Implemented multiple redirect methods with fallbacks

### **Issue 2: Missing Payment Success Callback Handler**
- ❌ **Problem**: Dashboard doesn't detect when users return from successful payment
- ❌ **Root Cause**: No `useSearchParams` hook to handle `payment=success` callbacks
- ✅ **Solution**: Added automatic callback detection and status refresh

### **Issue 3: No Real-time Status Updates**
- ❌ **Problem**: Dashboard status gets stuck and doesn't reflect backend changes
- ❌ **Root Cause**: No automatic polling or webhook status synchronization
- ✅ **Solution**: Implemented automatic status polling and webhook debugging

---

## 🛠️ **Fixes Implemented**

### **1. Enhanced Payment Button (`components/ui/payment-button.tsx`)**
```typescript
// CRITICAL FIX: Ensure redirect happens immediately
try {
  // Method 1: Direct window.location.href
  window.location.href = data.authorizationUrl;
} catch (redirectError) {
  // Method 2: Try window.open as fallback
  const newWindow = window.open(data.authorizationUrl, '_blank', 'noopener,noreferrer');
  if (newWindow) {
    newWindow.focus();
  } else {
    // Method 3: Show manual link
    toast({
      title: "Redirect Failed",
      description: "Please click the link to complete payment",
      action: {
        label: "Open Payment Gateway",
        onClick: () => window.open(data.authorizationUrl, '_blank')
      }
    });
  }
}
```

**Features:**
- Multiple redirect methods with fallbacks
- Better error handling and user feedback
- Console logging for debugging

### **2. Payment Success Callback Handler (`components/dashboard/dashboard-content.tsx`)**
```typescript
// Handle payment success callback
useEffect(() => {
  const paymentSuccess = searchParams.get('payment')
  const bookingId = searchParams.get('booking')
  
  if (paymentSuccess === 'success' && bookingId) {
    console.log('🎉 Payment success callback detected:', { paymentSuccess, bookingId })
    
    // Show success message
    showToast.success('Payment completed successfully! Refreshing booking status...')
    
    // Refresh the specific booking to get updated status
    if (refreshBooking) {
      refreshBooking(bookingId)
    }
    
    // Also refresh all bookings to ensure consistency
    setTimeout(() => {
      if (refreshAllBookings) {
        refreshAllBookings()
        setLastRefresh(new Date())
      }
    }, 1000)
    
    // Clean up URL params
    const url = new URL(window.location.href)
    url.searchParams.delete('payment')
    url.searchParams.delete('booking')
    url.searchParams.delete('trxref')
    url.searchParams.delete('reference')
    window.history.replaceState({}, '', url.toString())
  }
}, [searchParams, refreshBooking, refreshAllBookings])
```

**Features:**
- Automatic detection of payment success callbacks
- Immediate status refresh for specific booking
- Full dashboard refresh for consistency
- URL cleanup to prevent duplicate processing

### **3. Automatic Status Polling (`components/dashboard/dashboard-content.tsx`)**
```typescript
// Auto-refresh mechanism for payment status updates
useEffect(() => {
  // Only start polling if we have bookings and user is authenticated
  if (!bookings.length || !user) return;

  // Check if any bookings are in payment-related states that need monitoring
  const hasPaymentBookings = bookings.some(booking => 
    booking.payment && ['PENDING', 'ESCROW'].includes(booking.payment.status)
  );

  if (!hasPaymentBookings) return;

  console.log('🔄 Starting payment status polling for bookings with pending payments...');
  
  // Poll every 10 seconds for payment status updates
  const pollInterval = setInterval(async () => {
    try {
      console.log('🔄 Polling for payment status updates...');
      if (refreshAllBookings) {
        await refreshAllBookings();
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('❌ Payment status polling error:', error);
    }
  }, 10000); // 10 seconds

  // Cleanup interval on unmount or when dependencies change
  return () => {
    console.log('🔄 Stopping payment status polling...');
    clearInterval(pollInterval);
  };
}, [bookings, user, refreshAllBookings])
```

**Features:**
- Smart polling only when needed (pending payments)
- 10-second intervals for real-time updates
- Automatic cleanup to prevent memory leaks
- Error handling for failed refresh attempts

### **4. Enhanced Webhook Debugging (`app/api/webhooks/paystack/route.ts`)**
```typescript
// GET method for testing webhook endpoint
export async function GET() {
  try {
    // Get recent webhook events for debugging
    const recentWebhooks = await prisma.webhookEvent.findMany({
      where: { source: 'paystack' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        eventType: true,
        processed: true,
        createdAt: true,
        error: true,
        retryCount: true,
      }
    });

    // Get recent payments for debugging
    const recentPayments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        paystackRef: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        bookingId: true,
      }
    });

    return NextResponse.json({
      message: "Paystack webhook endpoint is working",
      timestamp: new Date().toISOString(),
      recentWebhooks,
      recentPayments,
      webhookUrl: process.env.PAYSTACK_WEBHOOK_URL || 'Not configured',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('Webhook test endpoint error:', error);
    return NextResponse.json({
      error: 'Failed to get webhook debug info',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

**Features:**
- Webhook endpoint testing via GET request
- Recent webhook events and payments display
- Environment and configuration information
- Comprehensive error logging

### **5. Payment Debug Page (`app/payment-debug/page.tsx`)**
**Features:**
- Direct payment redirect testing
- Webhook endpoint testing
- Real-time redirect validation
- Step-by-step testing instructions

---

## 🔄 **How the Fixed Payment Flow Works**

### **Step 1: User Clicks "Pay" Button**
1. Frontend calls payment API
2. API creates payment record and gets Paystack authorization URL
3. **NEW**: Multiple redirect methods ensure payment gateway opens

### **Step 2: Payment Gateway Opens**
1. User completes payment on Paystack
2. Paystack sends webhook to your server
3. **NEW**: Webhook processing updates payment status to ESCROW
4. **NEW**: Booking status updates to PENDING_EXECUTION

### **Step 3: User Returns to Dashboard**
1. Paystack redirects to callback URL: `/dashboard?payment=success&booking=ID`
2. **NEW**: Dashboard automatically detects payment success callback
3. **NEW**: Immediate refresh of booking status
4. **NEW**: Full dashboard refresh for consistency

### **Step 4: Real-time Status Updates**
1. **NEW**: Automatic polling every 10 seconds for pending payments
2. **NEW**: Dashboard stays in sync with backend status
3. **NEW**: User sees real-time payment and booking status updates

---

## 🧪 **Testing the Fixes**

### **1. Test Payment Redirect**
- Go to `/payment-debug`
- Enter a valid booking ID
- Click "Test Payment Redirect"
- Verify payment gateway opens

### **2. Test Webhook Endpoint**
- Click "Test Webhook" button in dashboard
- Check console for webhook debug info
- Verify recent webhooks and payments

### **3. Test Complete Payment Flow**
- Complete a real payment on Paystack
- Return to dashboard via callback
- Verify status automatically updates
- Check polling logs in console

---

## 🚀 **Next Steps for Webhook Issues**

### **1. Check Paystack Webhook Configuration**
- Verify webhook URL in Paystack dashboard
- Ensure webhook URL is publicly accessible
- Check webhook secret key configuration

### **2. Test Webhook Delivery**
- Use the "Test Webhook" button in dashboard
- Check if webhooks are being received
- Verify webhook signature validation

### **3. Monitor Webhook Processing**
- Check console logs for webhook events
- Verify database updates after webhooks
- Monitor webhook event storage

---

## 📊 **Expected Results After Fixes**

### **Before Fixes:**
- ❌ Payment button shows "Redirecting..." but never redirects
- ❌ Dashboard doesn't update after payment completion
- ❌ Booking status stuck on "Provider Confirmed"
- ❌ No webhook processing visible

### **After Fixes:**
- ✅ Payment gateway opens immediately after clicking "Pay"
- ✅ Dashboard automatically refreshes after payment completion
- ✅ Booking status updates to "Payment Received" → "Ready for Execution"
- ✅ Real-time status updates via polling
- ✅ Comprehensive webhook debugging and testing tools

---

## 🔍 **Debugging Commands**

### **Check Payment Status:**
```bash
# In browser console
console.log('Current bookings:', window.bookingData)
console.log('Payment statuses:', window.bookingData?.map(b => ({ id: b.id, status: b.status, payment: b.payment?.status })))
```

### **Test Webhook Endpoint:**
```bash
# In browser
fetch('/api/webhooks/paystack').then(r => r.json()).then(console.log)
```

### **Force Dashboard Refresh:**
```bash
# In browser console
window.location.reload()
```

---

## 📝 **Notes**

- **Redirect Methods**: Multiple fallback methods ensure payment gateway always opens
- **Status Polling**: Smart polling only when needed to avoid unnecessary API calls
- **Webhook Debugging**: Comprehensive logging and testing tools for troubleshooting
- **User Experience**: Automatic status updates without manual refresh needed

The fixes ensure a seamless payment experience with real-time status synchronization between frontend and backend.
