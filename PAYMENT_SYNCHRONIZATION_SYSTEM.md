# Payment Synchronization System

## Overview

This document describes the comprehensive payment synchronization system that ensures the frontend **always reflects the true state** of the database and never displays stale payment information.

## 🎯 Goals Achieved

✅ **Real-time Synchronization**: Frontend always shows current payment status  
✅ **No Stale Data**: Eliminated all cached payment states  
✅ **Robust Error Handling**: Graceful handling of API failures  
✅ **Loading States**: Clear feedback during data fetching  
✅ **Cache Invalidation**: Proper cache management across components  
✅ **Cross-tab Sync**: Changes in one tab reflect in others  
✅ **Optimistic Updates**: Safe rollback on API failures  

## 🏗️ Architecture

### Core Components

1. **`usePaymentSync` Hook**: Central payment synchronization logic
2. **`PaymentStatusSync` Component**: Real-time payment status display
3. **`SynchronizedBookingCard` Component**: Booking card with sync
4. **`SynchronizedDashboard` Component**: Dashboard with real-time updates
5. **`/api/bookings/sync` Endpoint**: Synchronized API with proper cache headers

### Data Flow

```
Database → API Endpoint → Payment Sync Hook → UI Components
    ↑                                        ↓
    ← Cache Invalidation ← User Actions ←
```

## 🔧 Implementation Details

### 1. Payment Sync Hook (`hooks/use-payment-sync.ts`)

**Features:**
- Real-time payment data fetching
- Automatic cache invalidation
- Cross-tab synchronization via localStorage events
- Focus-based refresh for pending payments
- Proper error handling and loading states

**Usage:**
```typescript
const {
  payment,
  booking,
  isLoading,
  isRefreshing,
  error,
  refreshPayment,
  verifyPayment,
  invalidateCache
} = usePaymentSync({
  bookingId: 'booking-123',
  autoRefresh: true,
  refreshInterval: 30000
});
```

### 2. Payment Status Component (`components/ui/payment-status-sync.tsx`)

**Features:**
- Real-time payment status display
- Manual refresh button
- Payment verification with Paystack
- Stuck payment detection and warnings
- Proper loading and error states

**Usage:**
```typescript
<PaymentStatusSync
  bookingId="booking-123"
  paymentRef="paystack-ref"
  showRefreshButton={true}
  onStatusChange={(newStatus) => {
    // Handle status changes
  }}
/>
```

### 3. Synchronized Booking Card (`components/dashboard/synchronized-booking-card.tsx`)

**Features:**
- Real-time booking and payment synchronization
- Action buttons with proper state management
- Payment initialization with cache invalidation
- Error handling for all operations

**Usage:**
```typescript
<SynchronizedBookingCard
  booking={booking}
  onUpdate={handleBookingUpdate}
  onRefresh={handleBookingRefresh}
/>
```

### 4. Synchronized Dashboard (`components/dashboard/synchronized-dashboard.tsx`)

**Features:**
- Real-time dashboard updates
- Payment success callback handling
- Auto-refresh for pending payments
- Cross-tab synchronization
- Comprehensive error handling

**Usage:**
```typescript
<SynchronizedDashboard
  initialBookings={bookings}
  initialUser={user}
/>
```

### 5. Synchronized API Endpoint (`app/api/bookings/sync/route.ts`)

**Features:**
- No-cache headers for payment data
- ETags for conditional requests
- Real-time payment verification with Paystack
- Proper CORS headers
- Comprehensive error handling

## 📊 Cache Management

### Cache Strategy

| Data Type | Cache TTL | Invalidation |
|-----------|-----------|--------------|
| Payment Data | 30 seconds | On status change |
| Booking Data | 5 minutes | On booking update |
| Static Data | 30 minutes | Manual refresh |

### Cache Invalidation Triggers

- Payment status changes
- Booking status updates
- User login/logout
- Manual refresh actions
- Cross-tab events

## 🔄 Synchronization Flow

### 1. Initial Load
```
Component Mount → Fetch Fresh Data → Update State → Render
```

### 2. Auto-Refresh (Pending Payments)
```
Timer (30s) → Fetch Data → Compare Status → Update if Changed
```

### 3. Manual Refresh
```
User Action → Invalidate Cache → Fetch Fresh Data → Update State
```

### 4. Payment Success Callback
```
Payment Success → Invalidate Cache → Refresh All Data → Update UI
```

### 5. Cross-Tab Sync
```
Tab A Changes → localStorage Event → Tab B Refreshes → Update UI
```

## 🧪 Testing

### Test Coverage

- ✅ Payment status synchronization
- ✅ Cache invalidation
- ✅ Error handling
- ✅ Loading states
- ✅ Manual refresh
- ✅ Auto-refresh
- ✅ Cross-tab synchronization
- ✅ API error scenarios

### Running Tests

```bash
npm test -- payment-sync.test.ts
```

### Test Scenarios

1. **ESCROW Payment Display**: Verify correct status display
2. **PENDING Payment Refresh**: Test auto-refresh functionality
3. **API Error Handling**: Test graceful error recovery
4. **Cache Invalidation**: Test cache clearing on updates
5. **Cross-tab Sync**: Test localStorage event handling

## 🚀 Usage Examples

### Basic Payment Status Display

```typescript
import { PaymentStatusSync } from '@/components/ui/payment-status-sync';

function BookingCard({ booking }) {
  return (
    <div>
      <h3>{booking.service.name}</h3>
      <PaymentStatusSync
        bookingId={booking.id}
        paymentRef={booking.payment?.paystackRef}
        showRefreshButton={true}
      />
    </div>
  );
}
```

### Dashboard with Real-time Updates

```typescript
import { SynchronizedDashboard } from '@/components/dashboard/synchronized-dashboard';

function DashboardPage({ initialBookings, initialUser }) {
  return (
    <SynchronizedDashboard
      initialBookings={initialBookings}
      initialUser={initialUser}
    />
  );
}
```

### Custom Payment Sync Hook Usage

```typescript
import { usePaymentSync } from '@/hooks/use-payment-sync';

function CustomPaymentComponent({ bookingId }) {
  const {
    payment,
    isLoading,
    error,
    refreshPayment
  } = usePaymentSync({
    bookingId,
    autoRefresh: true
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Status: {payment?.status}</p>
      <button onClick={refreshPayment}>Refresh</button>
    </div>
  );
}
```

## 🔍 Monitoring & Debugging

### Debug Information

The system provides comprehensive logging for debugging:

```typescript
// Enable debug mode
localStorage.setItem('payment-sync-debug', 'true');
```

### Common Debug Scenarios

1. **Stale Payment Status**: Check cache invalidation
2. **Missing Updates**: Verify auto-refresh intervals
3. **API Errors**: Check network and authentication
4. **Cross-tab Issues**: Verify localStorage events

### Performance Monitoring

- Cache hit/miss ratios
- API response times
- Refresh frequency
- Error rates

## 🛡️ Security Considerations

### Data Protection

- No sensitive data in localStorage
- Secure API endpoints with authentication
- Proper CORS configuration
- Input validation and sanitization

### Rate Limiting

- Auto-refresh limited to 30-second intervals
- Manual refresh debounced
- API rate limiting on backend

## 📈 Performance Optimizations

### Caching Strategy

- Intelligent cache TTL based on data type
- Conditional requests with ETags
- Background refresh for pending payments
- Debounced manual refresh actions

### Network Optimization

- Request deduplication
- Batch API calls where possible
- Efficient data structures
- Minimal payload sizes

## 🔧 Configuration

### Environment Variables

```env
# Payment sync configuration
PAYMENT_SYNC_REFRESH_INTERVAL=30000
PAYMENT_SYNC_CACHE_TTL=30000
PAYMENT_SYNC_DEBUG=false
```

### Component Props

```typescript
interface PaymentSyncConfig {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showRefreshButton?: boolean;
  onStatusChange?: (status: string) => void;
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Payment Status Not Updating**
   - Check auto-refresh interval
   - Verify cache invalidation
   - Check API endpoint connectivity

2. **Stale Data Display**
   - Clear browser cache
   - Check localStorage events
   - Verify cross-tab synchronization

3. **API Errors**
   - Check network connectivity
   - Verify authentication
   - Check API endpoint status

4. **Performance Issues**
   - Reduce refresh frequency
   - Optimize cache TTL
   - Check for memory leaks

### Debug Commands

```bash
# Check payment status
curl -X GET "https://app.proliinkconnect.co.za/api/payment/verify?reference=REF123"

# Verify booking sync
curl -X GET "https://app.proliinkconnect.co.za/api/bookings/sync"

# Check cache status
localStorage.getItem('payment-cache-invalidated')
```

## 📚 Best Practices

### Development

1. **Always use the sync components** instead of manual state management
2. **Handle loading and error states** properly
3. **Implement proper cache invalidation** on user actions
4. **Test cross-tab synchronization** during development
5. **Monitor API performance** and adjust refresh intervals

### Production

1. **Monitor error rates** and API performance
2. **Set appropriate cache TTLs** based on usage patterns
3. **Implement proper logging** for debugging
4. **Test payment flows** thoroughly before deployment
5. **Have fallback mechanisms** for API failures

## 🔄 Migration Guide

### From Old System

1. Replace `useBookingData` with `usePaymentSync`
2. Replace `PaymentStatusDisplay` with `PaymentStatusSync`
3. Replace booking cards with `SynchronizedBookingCard`
4. Update dashboard to use `SynchronizedDashboard`
5. Test all payment flows thoroughly

### Breaking Changes

- Payment status is now always fetched from API
- Cache invalidation is automatic
- Error handling is more robust
- Loading states are more comprehensive

## 📞 Support

For issues or questions about the payment synchronization system:

1. Check the troubleshooting section
2. Review the test suite for examples
3. Check browser console for debug information
4. Verify API endpoint status
5. Contact the development team

---

This system ensures that users never see stale payment information and provides a robust, real-time payment experience across all devices and tabs.
