# WebSocket Real-time Implementation Guide

## 🚀 Overview

This implementation provides **real-time WebSocket functionality** for your two-sided platform, enabling instant updates when providers accept bookings, payment status changes, and other critical events. The system includes comprehensive error handling, fallback mechanisms, and production-ready scalability features.

## ✨ Features Implemented

### ✅ Core WebSocket Functionality
- **Socket.IO Server**: Full-featured WebSocket server with authentication
- **Real-time Event Broadcasting**: Instant updates for booking, payment, and payout events
- **User Authentication**: JWT token validation for secure connections
- **Room Management**: User-specific and role-based room subscriptions
- **Connection Management**: Automatic connection handling and cleanup

### ✅ Real-time Dashboard Updates
- **Client Dashboard**: Live updates for booking acceptance, payment status changes
- **Provider Dashboard**: Real-time notifications for new bookings, payment received, payout completed
- **Toast Notifications**: User-friendly popup notifications for important events
- **Notification Panel**: Dedicated notification panel with unread count
- **Connection Status**: Live/Polling/Offline status indicators

### ✅ Fallback & Reliability
- **Polling Fallback**: Automatic 60-second polling when WebSocket fails
- **Auto-reconnection**: Automatic reconnection with exponential backoff
- **Error Handling**: Comprehensive error handling and recovery
- **Graceful Degradation**: System continues to work even without WebSocket

### ✅ Production Features
- **Centralized Logging**: All WebSocket events logged with structured data
- **Error Tracking**: Comprehensive error logging with error codes
- **Performance Monitoring**: Connection metrics and event timing
- **Debug Information**: Detailed logging for troubleshooting

## 🏗️ Architecture

### WebSocket Server Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Routes    │───▶│  Socket Manager  │───▶│  Socket.IO      │
│                 │    │                  │    │  Server         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Event Broadcast │    │ User Management  │    │ Room Management │
│ Functions       │    │ & Authentication │    │ & Subscriptions │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Client-side Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Dashboard     │───▶│  Socket Hook     │───▶│  Socket.IO      │
│   Components    │    │  (useSocket)     │    │  Client         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ UI Updates      │    │ Event Handlers   │    │ Connection      │
│ & Notifications │    │ & State Updates  │    │ Management      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Technical Implementation

### 1. Socket.IO Server Setup
**File**: `lib/socket-server.ts`

**Key Features**:
- Singleton SocketManager for centralized connection handling
- User authentication and room management
- Event broadcasting with targeted user delivery
- Comprehensive logging integration

**Core Classes**:
```typescript
class SocketManager {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userSockets: Map<string, string> = new Map();

  // Event broadcasting methods
  public broadcastBookingEvent(event: SocketEvent)
  public broadcastPaymentEvent(event: SocketEvent)
  public broadcastPayoutEvent(event: SocketEvent)
  public broadcastNotification(event: SocketEvent)
}
```

### 2. Custom Next.js Server
**File**: `server.js`

**Features**:
- Integrates Socket.IO with Next.js
- Production-ready HTTP server
- Proper CORS configuration
- Global Socket.IO instance for API routes

### 3. Socket.IO API Route
**File**: `app/api/socket/route.ts`

**Features**:
- RESTful API for Socket.IO server management
- Broadcast event triggering via HTTP requests
- Server status monitoring and health checks

**Endpoints**:
- `GET /api/socket` - Server status and connected users
- `POST /api/socket` - Trigger event broadcasts

### 4. React Socket Hook
**File**: `lib/socket-client.ts`

**Key Features**:
- Custom React hook for Socket.IO integration
- Automatic connection management and reconnection
- Polling fallback when WebSocket fails
- Event handling with state updates

**Hook Interface**:
```typescript
export function useSocket(options: UseSocketOptions = {}) {
  // Returns: { connected, connecting, error, reconnect, isPolling }
}
```

### 5. Error Handling System
**File**: `lib/websocket-error-handler.ts`

**Features**:
- Comprehensive error classification
- Exponential backoff retry logic
- Fallback strategy selection
- Error statistics and monitoring

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install socket.io socket.io-client
```

### 2. Start the Server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 3. Test WebSocket Connection
Visit `/websocket-test` to see the WebSocket test panel and verify real-time functionality.

## 📡 Event Broadcasting

### Booking Events
```typescript
// When provider accepts a booking
broadcastBookingUpdate(bookingId, 'accepted', bookingData, [clientId]);

// When booking status changes
broadcastBookingUpdate(bookingId, 'status_changed', bookingData, [clientId, providerId]);
```

### Payment Events
```typescript
// When payment status changes
broadcastPaymentUpdate(paymentId, 'status_changed', paymentData, [clientId, providerId]);

// When payment is released
broadcastPaymentUpdate(paymentId, 'released', paymentData, [providerId]);
```

### Notification Events
```typescript
// Send notification to specific users
broadcastNotification([userId1, userId2], 'info', 'Title', 'Message');
```

## 🔧 Frontend Integration

### Client Dashboard
```typescript
const { connected, error, reconnect } = useSocket({
  userId: currentUser.id,
  role: 'CLIENT',
  enablePolling: true,
  onBookingUpdate: (event) => {
    if (event.action === 'accepted') {
      toast.success('🎉 Your booking has been accepted!');
      // Update UI state
    }
  }
});
```

### Provider Dashboard
```typescript
const { connected, error, reconnect } = useSocket({
  userId: currentUser.id,
  role: 'PROVIDER',
  enablePolling: true,
  onBookingUpdate: (event) => {
    if (event.action === 'created') {
      toast.success('🎉 New booking request!');
      // Update UI state
    }
  }
});
```

## 🛡️ Error Handling & Fallbacks

### Automatic Fallbacks
1. **WebSocket Connection Fails** → Switch to polling mode
2. **Event Broadcasting Fails** → Manual refresh required
3. **Authentication Fails** → Retry with exponential backoff
4. **Network Issues** → Automatic reconnection attempts

### Error Classification
- **Retryable Errors**: Connection timeouts, network issues
- **Non-retryable Errors**: Authentication failures, authorization errors
- **Fallback Strategies**: Polling, manual refresh, connection retry

## 📊 Monitoring & Debugging

### Connection Status
```typescript
const { connected, connecting, error, isPolling } = useSocket(options);

// Show connection status to users
{connected && <Badge>Live</Badge>}
{isPolling && <Badge>Polling</Badge>}
{error && <Badge variant="destructive">Offline</Badge>}
```

### Error Statistics
```typescript
const errorHandler = WebSocketErrorHandler.getInstance();
const stats = errorHandler.getErrorStats();
// { totalErrors, recentErrors, retryableErrors, mostCommonError }
```

### Logging
All WebSocket events are logged with structured data:
```typescript
logger.info('socket_event', 'Booking update received', {
  userId,
  role,
  event: { type, action, data }
});
```

## 🔄 Scalability Considerations

### Horizontal Scaling
- **Redis Adapter**: For multiple server instances
- **Load Balancing**: Sticky sessions for WebSocket connections
- **Database Events**: Real-time updates from database changes

### Performance Optimization
- **Event Debouncing**: Prevent duplicate rapid events
- **Selective Broadcasting**: Only send relevant updates
- **Connection Pooling**: Efficient resource management

### Future Enhancements
- **Supabase Realtime**: Alternative to Socket.IO
- **AWS/Azure Integration**: Cloud-native WebSocket services
- **Message Queues**: Reliable event delivery with Redis/RabbitMQ

## 🧪 Testing

### Test Suite
Run the comprehensive test suite:
```bash
npm test __tests__/websocket-integration.test.ts
```

### Manual Testing
1. Open WebSocket test panel at `/websocket-test`
2. Send test events and verify real-time updates
3. Test connection failures and fallback mechanisms
4. Verify error handling and recovery

### Production Testing
1. Test with multiple concurrent users
2. Verify performance under load
3. Test network interruption scenarios
4. Validate error recovery mechanisms

## 📝 API Reference

### Socket Events

#### Client Events (emit)
- `authenticate` - Authenticate user connection
- `join_room` - Join specific room
- `leave_room` - Leave specific room

#### Server Events (listen)
- `booking_update` - Booking status changes
- `payment_update` - Payment status changes
- `payout_update` - Payout status changes
- `notification` - General notifications
- `authenticated` - Authentication success
- `auth_error` - Authentication failure

### API Endpoints

#### GET /api/socket
Returns server status and connected users count.

#### POST /api/socket
Broadcast events to connected users.
```json
{
  "event": {
    "type": "booking",
    "action": "accepted"
  },
  "data": {
    "id": "booking_123",
    "status": "CONFIRMED"
  },
  "targetUsers": ["user_123"]
}
```

## 🚨 Troubleshooting

### Common Issues

#### WebSocket Connection Fails
1. Check server is running with custom server (`node server.js`)
2. Verify CORS configuration
3. Check network connectivity
4. Review browser console for errors

#### Events Not Received
1. Verify user authentication
2. Check room subscriptions
3. Confirm event broadcasting
4. Review server logs

#### Performance Issues
1. Monitor connection count
2. Check error rates
3. Review memory usage
4. Optimize event frequency

### Debug Mode
Enable detailed logging:
```typescript
// In development
process.env.NODE_ENV = 'development';

// Check logs
console.log('Socket status:', io.sockets.sockets.size);
```

## 🎯 Best Practices

### Development
1. Always test WebSocket functionality in development
2. Use the test panel for debugging
3. Monitor connection status in UI
4. Handle offline states gracefully

### Production
1. Monitor error rates and connection counts
2. Set up alerting for WebSocket failures
3. Implement rate limiting for events
4. Use connection pooling and load balancing

### Security
1. Validate all incoming events
2. Implement proper authentication
3. Rate limit connection attempts
4. Monitor for suspicious activity

## 🔮 Future Roadmap

### Phase 2 Enhancements
- [ ] Redis adapter for horizontal scaling
- [ ] Message persistence for offline users
- [ ] Advanced notification preferences
- [ ] Real-time analytics dashboard

### Phase 3 Integrations
- [ ] Supabase Realtime migration
- [ ] AWS API Gateway WebSocket
- [ ] Azure SignalR Service
- [ ] Advanced caching strategies

---

## 📞 Support

For issues or questions about the WebSocket implementation:

1. Check the troubleshooting section above
2. Review server and client logs
3. Test with the WebSocket test panel
4. Run the integration test suite

The system is designed to be robust and production-ready with comprehensive error handling and fallback mechanisms. Enjoy your real-time booking platform! 🚀
