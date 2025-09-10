# Real-time Booking System

This document explains the comprehensive real-time booking update system implemented to eliminate the need for manual page refreshes when waiting for booking status changes.

## 🎯 Problem Solved

**Before**: Users had to manually reload the page to see when a provider accepted their booking or when payment status changed.

**After**: Real-time updates automatically refresh booking statuses with smart polling, optimistic UI updates, and instant notifications.

## 🚀 Key Features

### 1. Smart Polling System
- **Adaptive Intervals**: Different polling frequencies based on booking status
  - `PENDING`: 5 seconds (most likely to change)
  - `CONFIRMED`: 10 seconds (provider just accepted)
  - `PENDING_EXECUTION`: 15 seconds (payment processing)
  - `IN_PROGRESS`: 30 seconds (provider working)
  - `COMPLETED`: 5 minutes (final state)

- **User Activity Detection**: Faster updates when user is active (mouse/keyboard activity)
- **Exponential Backoff**: Smart retry logic for failed requests
- **Connection Status**: Visual indicator showing live/offline status

### 2. Optimistic UI Updates
- **Immediate Feedback**: UI updates instantly when actions are performed
- **Auto-revert**: Reverts to original state if real update doesn't come within 30 seconds
- **Visual Indicators**: Pulsing animations for active statuses

### 3. Smart Caching
- **Status-based TTL**: Different cache times based on booking status
- **Memory Efficient**: Automatic cleanup of expired cache entries
- **Request Deduplication**: Prevents multiple simultaneous requests for same booking

### 4. Toast Notifications
- **Status Change Alerts**: Instant notifications when booking status changes
- **Emoji Indicators**: Visual cues for different status types
- **Non-intrusive**: Auto-dismiss after 5 seconds

## 📁 File Structure

```
hooks/
├── use-smart-booking.ts          # Main real-time booking hook
├── use-optimistic-booking.ts     # Optimistic UI updates
└── use-realtime-booking.ts       # Basic real-time functionality

components/
├── ui/
│   └── realtime-status-indicator.tsx  # Connection status component
└── dashboard/
    └── realtime-booking-status.tsx    # Real-time booking card

app/
└── realtime-demo/
    └── page.tsx                       # Demo page showing features
```

## 🔧 Usage

### Basic Implementation

```tsx
import { useSmartBooking } from "@/hooks/use-smart-booking"

function MyComponent() {
  const { 
    bookings, 
    refreshBooking, 
    refreshAllBookings, 
    isLoading, 
    isConnected, 
    optimisticUpdate 
  } = useSmartBooking(initialBookings)

  return (
    <div>
      {/* Your booking UI */}
      <RealtimeStatusIndicator 
        isConnected={isConnected}
        isRefreshing={isLoading}
      />
    </div>
  )
}
```

### With Optimistic Updates

```tsx
// When user performs an action that should update status
const handleAcceptBooking = async (bookingId: string) => {
  // Optimistic update - shows immediately
  optimisticUpdate(bookingId, 'CONFIRMED')
  
  // Make API call
  try {
    await acceptBooking(bookingId)
    // Real data will come through polling and confirm the update
  } catch (error) {
    // Optimistic update will auto-revert after 30 seconds
    console.error('Failed to accept booking:', error)
  }
}
```

### Real-time Booking Card

```tsx
import { RealtimeBookingStatus } from "@/components/dashboard/realtime-booking-status"

<RealtimeBookingStatus
  booking={booking}
  isConnected={isConnected}
  isRefreshing={isLoading}
  onRefresh={() => refreshBooking(booking.id)}
/>
```

## ⚙️ Configuration

### Polling Intervals

The system uses different polling intervals based on booking status:

```typescript
const getSmartCacheTTL = (booking: Booking, isUserActive: boolean): number => {
  const baseTTL = {
    'PENDING': 5000,           // 5 seconds
    'CONFIRMED': 10000,        // 10 seconds  
    'PENDING_EXECUTION': 15000, // 15 seconds
    'IN_PROGRESS': 30000,      // 30 seconds
    'COMPLETED': 300000,       // 5 minutes
    'CANCELLED': 300000        // 5 minutes
  }
  
  // Reduce TTL if user is active
  if (isUserActive) {
    ttl = Math.max(ttl * 0.5, 2000) // At least 2 seconds
  }
  
  return ttl
}
```

### User Activity Detection

The system detects user activity through mouse and keyboard events:

```typescript
const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
// User is considered active if activity within last 30 seconds
```

## 🎨 UI Components

### Connection Status Indicator

```tsx
<RealtimeStatusIndicator 
  isConnected={isConnected}
  isRefreshing={isLoading}
  size="md"
  showText={true}
/>
```

### Real-time Booking Card

Shows booking status with live updates, connection status, and refresh controls.

## 🧪 Testing

Visit `/realtime-demo` to see the system in action:

1. **Start Simulation**: Simulates real-time status changes
2. **Connection Status**: Shows live/offline indicator
3. **Status History**: Tracks status changes over time
4. **Interactive Controls**: Test different scenarios

## 🔄 Migration from Old System

### Step 1: Update Imports

```tsx
// Old
import { useBookingData } from "@/hooks/use-booking-data"

// New  
import { useSmartBooking } from "@/hooks/use-smart-booking"
```

### Step 2: Update Hook Usage

```tsx
// Old
const { bookings, refreshBooking, refreshAllBookings, isLoading } = useBookingData(initialBookings)

// New
const { 
  bookings, 
  refreshBooking, 
  refreshAllBookings, 
  isLoading, 
  isConnected, 
  optimisticUpdate 
} = useSmartBooking(initialBookings)
```

### Step 3: Add Status Indicators

```tsx
// Add connection status indicator
<RealtimeStatusIndicator 
  isConnected={isConnected}
  isRefreshing={isLoading}
/>
```

## 🚨 Error Handling

The system includes comprehensive error handling:

- **Network Failures**: Automatic retry with exponential backoff
- **API Errors**: Graceful degradation with user feedback
- **Connection Loss**: Visual indicators and automatic reconnection
- **Optimistic Update Failures**: Auto-revert after timeout

## 📊 Performance Considerations

- **Smart Caching**: Reduces unnecessary API calls
- **Request Deduplication**: Prevents duplicate requests
- **User Activity Detection**: Reduces polling when user is inactive
- **Memory Management**: Automatic cleanup of expired cache entries

## 🔮 Future Enhancements

1. **WebSocket Support**: For even faster real-time updates
2. **Push Notifications**: Browser notifications for status changes
3. **Offline Support**: Queue updates when offline
4. **Custom Polling Intervals**: User-configurable update frequencies

## 🐛 Troubleshooting

### Common Issues

1. **Updates not showing**: Check connection status indicator
2. **Too many requests**: Verify polling intervals are appropriate
3. **Memory leaks**: Ensure components are properly unmounted

### Debug Mode

Enable debug logging by setting `localStorage.debug = 'booking-updates'` in browser console.

## 📝 Best Practices

1. **Use Optimistic Updates**: For immediate user feedback
2. **Show Connection Status**: Keep users informed about update status
3. **Handle Errors Gracefully**: Provide fallback options
4. **Test Thoroughly**: Verify behavior in different network conditions
5. **Monitor Performance**: Watch for excessive API calls

---

This real-time booking system provides a seamless user experience by eliminating the need for manual page refreshes while maintaining optimal performance through smart polling and caching strategies.
