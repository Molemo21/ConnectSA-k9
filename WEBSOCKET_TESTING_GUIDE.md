# WebSocket Testing Guide

## 🎯 Overview

This guide provides comprehensive testing instructions for the WebSocket real-time implementation. The testing suite includes automated tests, performance tests, integration tests, and manual testing procedures to ensure your real-time booking system works correctly.

## 🚀 Quick Start

### 1. Start the Server
```bash
npm run dev  # Uses custom server with WebSocket support
```

### 2. Run All Tests
```bash
npm run test:websocket:all  # Runs comprehensive test suite
```

### 3. Manual Testing
```bash
npm run test:websocket:manual  # Opens manual testing page
```

## 📋 Available Test Commands

| Command | Description | Duration |
|---------|-------------|----------|
| `npm run test:websocket` | Basic WebSocket flow tests | ~30s |
| `npm run test:websocket:performance` | Performance and load tests | ~2m |
| `npm run test:websocket:integration` | Integration tests | ~1m |
| `npm run test:websocket:all` | Complete test suite | ~4m |
| `npm run test:websocket:manual` | Manual testing instructions | N/A |

## 🧪 Test Suites

### 1. Flow Tests (`test-websocket-flow.js`)

**Purpose:** Tests basic WebSocket functionality and real-time event flow.

**What it tests:**
- ✅ Server connection and health
- ✅ WebSocket connection establishment
- ✅ User authentication
- ✅ Booking acceptance flow
- ✅ Error handling
- ✅ Fallback mechanisms

**Example Output:**
```
🚀 Starting WebSocket Real-time Flow Tests
============================================================
📡 Testing server connection...
✅ Server is running and responding

🔌 Testing WebSocket connection...
✅ WebSocket connected with ID: abc123

🔐 Testing WebSocket authentication...
✅ Client authenticated successfully

📋 Testing booking acceptance flow...
✅ Booking acceptance event received in real-time

✅ All tests passed! WebSocket real-time flow is working correctly.
```

### 2. Performance Tests (`performance-test.js`)

**Purpose:** Tests WebSocket performance under load and stress conditions.

**What it tests:**
- ✅ Connection capacity (50+ concurrent connections)
- ✅ Event throughput (10+ events/second)
- ✅ Memory usage and potential leaks
- ✅ Connection stability under load
- ✅ Latency measurements

**Configuration:**
```javascript
const CONFIG = {
  concurrentConnections: 50,
  eventsPerSecond: 10,
  testDuration: 30000, // 30 seconds
};
```

**Example Output:**
```
🚀 Starting WebSocket Performance Tests
============================================================
Configuration:
- Concurrent Connections: 50
- Events Per Second: 10
- Test Duration: 30 seconds

🔌 Testing connection capacity...
✅ Connection capacity test completed in 2500ms
   Successful: 48
   Failed: 2
   Success Rate: 96.00%

📡 Testing event throughput...
✅ Event throughput test completed
   Events Sent: 300
   Events Received: 295
   Events Lost: 5
   Success Rate: 98.33%
   Average Latency: 45.2ms
```

### 3. Integration Tests (`integration-test.js`)

**Purpose:** Tests complete integration between WebSocket, API, and database.

**What it tests:**
- ✅ Server health and API endpoints
- ✅ Socket.IO server integration
- ✅ Booking acceptance integration
- ✅ Payment status integration
- ✅ Notification system integration
- ✅ Database integration

**Example Output:**
```
🚀 Starting WebSocket Integration Tests
============================================================
🏥 Testing server health...
✅ Server health check passed

🔌 Testing Socket.IO server integration...
🔗 CLIENT socket connected: def456
🔗 PROVIDER socket connected: ghi789
✅ Socket.IO server integration test passed

📋 Testing booking acceptance integration...
📨 Booking acceptance event received: {action: "accepted", data: {...}}
✅ Booking acceptance integration test passed

✅ All integration tests passed! WebSocket integration is working correctly.
```

## 🔧 Manual Testing

### WebSocket Test Panel

Visit `http://localhost:3000/websocket-test` for interactive testing.

**Features:**
- 🔌 Real-time connection status
- 📡 Send test events
- 📋 View received events
- 🔄 Connection management
- ⚠️ Error handling display

### Manual Test Scenarios

#### Scenario 1: Basic Connection Test
1. Open WebSocket test panel
2. Verify connection shows "Connected" (green)
3. If "Polling" (blue), WebSocket failed but fallback is working
4. If "Error" (red), check server and network

#### Scenario 2: Real-time Event Test
1. Click "📡 Send Test Event"
2. Watch for:
   - Success toast notification
   - Event appears in "Recent Events" list
   - Real-time status updates

#### Scenario 3: Multi-user Test
1. Open 2-3 browser tabs
2. Each shows different User ID
3. Send targeted events between tabs
4. Verify only intended recipients receive events

#### Scenario 4: Booking Flow Test
1. Tab 1: Client dashboard
2. Tab 2: Provider dashboard
3. Simulate booking acceptance
4. Verify real-time updates in client tab

## 📊 Test Results and Reports

### Automated Reports

Test results are saved to `test-results/websocket-test-report.json`:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "duration": 245000,
  "summary": {
    "total": 3,
    "passed": 3,
    "failed": 0
  },
  "tests": [
    {
      "name": "Flow Tests",
      "passed": true,
      "duration": 30000,
      "exitCode": 0
    }
  ]
}
```

### Performance Metrics

**Connection Capacity:**
- Target: 50+ concurrent connections
- Success Rate: >95%
- Connection Time: <5 seconds

**Event Throughput:**
- Target: 10+ events/second
- Success Rate: >98%
- Average Latency: <100ms

**Memory Usage:**
- Peak Heap: <200MB
- Memory Growth: <50MB/hour
- No memory leaks detected

## 🐛 Troubleshooting

### Common Issues

#### Issue: Tests Fail with Connection Errors
**Symptoms:** All tests fail with connection timeout or refused errors

**Solutions:**
1. **Check server is running:**
   ```bash
   curl http://localhost:3000/api/socket
   ```

2. **Verify custom server:**
   ```bash
   npm run dev  # Should show "Ready on http://localhost:3000"
   ```

3. **Check port availability:**
   ```bash
   lsof -i :3000  # Should show Node.js process
   ```

#### Issue: WebSocket Connection Fails
**Symptoms:** Status shows "Error" or "Polling" instead of "Connected"

**Solutions:**
1. **Check browser console for errors**
2. **Verify CORS configuration**
3. **Test with different browsers**
4. **Check firewall settings**

#### Issue: Events Not Received
**Symptoms:** Events are sent but not received in real-time

**Solutions:**
1. **Verify User IDs match between sender and receiver**
2. **Check server logs for broadcast errors**
3. **Test API endpoint directly:**
   ```bash
   curl -X POST http://localhost:3000/api/socket \
     -H "Content-Type: application/json" \
     -d '{"event":{"type":"booking","action":"accepted"},"data":{"id":"test"},"targetUsers":["user_id"]}'
   ```

#### Issue: Performance Tests Fail
**Symptoms:** High connection failure rate or event loss

**Solutions:**
1. **Increase server resources**
2. **Check network stability**
3. **Reduce concurrent connection count**
4. **Optimize server configuration**

### Debug Mode

Enable detailed logging:

```bash
# Server with debug logging
DEBUG=socket.io:* npm run dev

# Client with debug logging
DEBUG=socket.io-client:* npm run dev
```

### Browser Developer Tools

**Network Tab:**
- Monitor WebSocket connections
- Check API requests to `/api/socket`
- Verify polling requests when WebSocket fails

**Console Tab:**
- Look for Socket.IO connection logs
- Check for error messages
- Monitor event reception logs

## 🎯 Success Criteria

Your WebSocket implementation passes if:

### ✅ Flow Tests
- [ ] Server connection successful
- [ ] WebSocket connection established
- [ ] Authentication working
- [ ] Booking acceptance events received
- [ ] Error handling graceful
- [ ] Fallback mechanisms active

### ✅ Performance Tests
- [ ] 95%+ connection success rate
- [ ] 98%+ event delivery success rate
- [ ] Average latency <100ms
- [ ] Memory usage stable
- [ ] No connection drops under load

### ✅ Integration Tests
- [ ] All API endpoints responding
- [ ] Socket.IO server integrated
- [ ] Real-time booking flow working
- [ ] Payment status updates working
- [ ] Notifications delivered
- [ ] Database integration working

## 📈 Continuous Integration

### GitHub Actions Example

```yaml
name: WebSocket Tests
on: [push, pull_request]

jobs:
  websocket-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test:websocket:all
```

### Pre-commit Hooks

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running WebSocket tests..."
npm run test:websocket

if [ $? -ne 0 ]; then
  echo "WebSocket tests failed. Commit aborted."
  exit 1
fi
```

## 🔮 Advanced Testing

### Load Testing

For production load testing:

```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery run websocket-load-test.yml
```

### Monitoring

Set up monitoring for production:

```javascript
// Monitor WebSocket connections
setInterval(() => {
  const stats = {
    connections: io.engine.clientsCount,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  console.log('WebSocket Stats:', stats);
}, 60000); // Every minute
```

### Health Checks

Create health check endpoint:

```javascript
app.get('/health/websocket', (req, res) => {
  const stats = {
    status: io ? 'healthy' : 'unhealthy',
    connections: io?.engine.clientsCount || 0,
    uptime: process.uptime()
  };
  
  res.json(stats);
});
```

---

## 📞 Support

For testing issues:

1. **Check this guide first**
2. **Run manual tests to isolate issues**
3. **Check server and browser logs**
4. **Verify network connectivity**
5. **Test with different browsers/environments**

The comprehensive testing suite ensures your WebSocket real-time implementation is robust, performant, and production-ready! 🚀
