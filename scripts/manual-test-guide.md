# Manual WebSocket Testing Guide

## 🎯 Overview

This guide provides step-by-step instructions for manually testing the complete WebSocket real-time flow in your booking platform. Follow these tests to verify that real-time updates work correctly when providers accept bookings.

## 🚀 Prerequisites

1. **Start the server with WebSocket support:**
   ```bash
   npm run dev  # Uses custom server with Socket.IO
   ```

2. **Verify server is running:**
   - Visit `http://localhost:3000/api/socket`
   - Should return: `{"success":true,"status":"active","connectedUsers":0,"message":"Socket.IO server is running"}`

3. **Open WebSocket test panel:**
   - Visit `http://localhost:3000/websocket-test`
   - Verify connection shows "Connected" status

## 📋 Test Scenarios

### Test 1: Basic WebSocket Connection

**Objective:** Verify WebSocket connection and authentication work correctly.

**Steps:**
1. Open browser developer tools (F12)
2. Go to `http://localhost:3000/websocket-test`
3. Check the connection status indicator
4. Look for these indicators:
   - ✅ **Connected** (green) = WebSocket working
   - 🔄 **Polling** (blue) = Fallback mode active
   - ❌ **Error** (red) = Connection failed

**Expected Result:** Status should show "Connected" with green indicator.

**Debug Steps if Failed:**
- Check browser console for errors
- Verify server is running on port 3000
- Check network tab for WebSocket connection

---

### Test 2: Real-time Event Broadcasting

**Objective:** Test that events can be sent and received in real-time.

**Steps:**
1. On the WebSocket test panel, click "📡 Send Test Event"
2. Watch for:
   - Success toast notification
   - Event appears in "Recent Events" list
   - Event shows correct timestamp and data

**Expected Result:** 
- Toast appears: "📡 Test event sent!"
- Event appears in list with type "booking" and action "accepted"

**Debug Steps if Failed:**
- Check browser console for errors
- Verify API endpoint `/api/socket` is accessible
- Check server logs for broadcast errors

---

### Test 3: Booking Acceptance Flow (End-to-End)

**Objective:** Test the complete booking flow with real-time updates.

**Setup:**
1. Open two browser tabs/windows
2. Tab 1: Client dashboard (or WebSocket test panel)
3. Tab 2: Provider dashboard (or WebSocket test panel)

**Steps:**

#### Part A: Client Side Setup
1. In Tab 1 (Client), note the User ID shown in the test panel
2. Ensure connection status shows "Connected"

#### Part B: Provider Side Setup  
1. In Tab 2 (Provider), note the User ID shown in the test panel
2. Ensure connection status shows "Connected"

#### Part C: Simulate Booking Acceptance
1. In Tab 2 (Provider), click "📡 Send Test Event"
2. **Immediately** switch to Tab 1 (Client)
3. Watch for real-time updates

**Expected Result:**
- Client tab should receive the booking acceptance event
- Toast notification: "🎉 Booking accepted!"
- Event appears in Recent Events list
- Status updates in real-time

**Debug Steps if Failed:**
- Check both tabs show "Connected" status
- Verify events are being sent to correct User IDs
- Check browser console in both tabs
- Test with browser developer tools network tab open

---

### Test 4: Error Handling and Recovery

**Objective:** Test WebSocket error handling and fallback mechanisms.

**Steps:**

#### Part A: Connection Loss Test
1. Ensure WebSocket test panel shows "Connected"
2. Stop the server (`Ctrl+C` in terminal)
3. Wait 10-15 seconds
4. Check the connection status

**Expected Result:** Status should change to "Error" or "Polling"

#### Part B: Recovery Test
1. Restart the server (`npm run dev`)
2. Wait 5-10 seconds
3. Check if connection automatically recovers

**Expected Result:** Status should return to "Connected" automatically

**Debug Steps if Failed:**
- Check server logs for connection errors
- Verify automatic reconnection is working
- Test manual reconnect button

---

### Test 5: Multiple User Simulation

**Objective:** Test real-time updates with multiple connected users.

**Setup:**
1. Open 3-4 browser tabs/windows
2. Each tab should show different User IDs
3. Ensure all tabs show "Connected" status

**Steps:**
1. In Tab 1, send a test event targeting Tab 2's User ID
2. Verify Tab 2 receives the event
3. Verify Tab 3 and Tab 4 do NOT receive the event
4. Send a broadcast event (no target users)
5. Verify all tabs receive the event

**Expected Result:**
- Targeted events only reach specified users
- Broadcast events reach all connected users
- Each tab maintains its own event history

---

### Test 6: Performance and Load Testing

**Objective:** Test WebSocket performance under load.

**Steps:**
1. Open 5-10 browser tabs
2. Ensure all show "Connected" status
3. Rapidly send test events from different tabs
4. Monitor for:
   - Connection stability
   - Event delivery consistency
   - Browser performance

**Expected Result:**
- All connections remain stable
- Events are delivered consistently
- No browser performance degradation

---

## 🐛 Troubleshooting Common Issues

### Issue: WebSocket Connection Fails

**Symptoms:** Status shows "Error" or "Polling" instead of "Connected"

**Solutions:**
1. **Check server status:**
   ```bash
   curl http://localhost:3000/api/socket
   ```

2. **Verify server is running custom server:**
   ```bash
   # Should show: "Ready on http://localhost:3000"
   npm run dev
   ```

3. **Check browser console for errors:**
   - Look for CORS errors
   - Check WebSocket connection errors
   - Verify socket.io-client is loaded

4. **Test with different browsers:**
   - Chrome, Firefox, Safari
   - Check if issue is browser-specific

### Issue: Events Not Received

**Symptoms:** Events are sent but not received in real-time

**Solutions:**
1. **Verify User IDs match:**
   - Check target users in API calls
   - Ensure authentication is working

2. **Check server logs:**
   ```bash
   # Look for broadcast errors in server console
   ```

3. **Test API endpoint directly:**
   ```bash
   curl -X POST http://localhost:3000/api/socket \
     -H "Content-Type: application/json" \
     -d '{"event":{"type":"booking","action":"accepted"},"data":{"id":"test"},"targetUsers":["your_user_id"]}'
   ```

4. **Verify room subscriptions:**
   - Check if users are joining correct rooms
   - Verify authentication is working

### Issue: Polling Fallback Not Working

**Symptoms:** WebSocket fails but polling doesn't activate

**Solutions:**
1. **Check polling configuration:**
   - Verify `enablePolling: true` in socket options
   - Check polling interval settings

2. **Test polling manually:**
   - Disconnect WebSocket
   - Check if polling requests are made
   - Verify polling endpoint responses

### Issue: Browser Performance Issues

**Symptoms:** Browser becomes slow or unresponsive

**Solutions:**
1. **Limit concurrent connections:**
   - Close unnecessary tabs
   - Test with fewer simultaneous connections

2. **Check memory usage:**
   - Monitor browser task manager
   - Clear browser cache if needed

3. **Optimize event frequency:**
   - Reduce test event frequency
   - Check for memory leaks in event handlers

---

## 📊 Success Criteria

Your WebSocket implementation is working correctly if:

✅ **Connection Status:** Shows "Connected" when server is running
✅ **Event Broadcasting:** Test events are sent and received in real-time
✅ **Booking Flow:** Provider acceptance triggers immediate client notification
✅ **Error Handling:** Connection errors are handled gracefully
✅ **Recovery:** Automatic reconnection works after server restart
✅ **Multi-user:** Events are delivered to correct target users
✅ **Performance:** System remains stable under load

---

## 🔧 Advanced Testing

### Using Browser Developer Tools

1. **Network Tab:**
   - Monitor WebSocket connections
   - Check API requests to `/api/socket`
   - Verify polling requests when WebSocket fails

2. **Console Tab:**
   - Look for Socket.IO connection logs
   - Check for error messages
   - Monitor event reception logs

3. **Application Tab:**
   - Check WebSocket connections in Storage
   - Monitor local storage for connection state

### Using Command Line Tools

1. **Test server endpoint:**
   ```bash
   curl -v http://localhost:3000/api/socket
   ```

2. **Send test events:**
   ```bash
   curl -X POST http://localhost:3000/api/socket \
     -H "Content-Type: application/json" \
     -d '{"event":{"type":"booking","action":"accepted"},"data":{"id":"test_booking","status":"CONFIRMED"},"targetUsers":["test_user"]}'
   ```

3. **Monitor server logs:**
   ```bash
   # Run server with verbose logging
   DEBUG=socket.io:* npm run dev
   ```

---

## 📝 Test Report Template

Use this template to document your test results:

```
WebSocket Real-time Testing Report
Date: ___________
Tester: ___________
Environment: ___________

Test Results:
□ Test 1: Basic WebSocket Connection - PASS/FAIL
□ Test 2: Real-time Event Broadcasting - PASS/FAIL  
□ Test 3: Booking Acceptance Flow - PASS/FAIL
□ Test 4: Error Handling and Recovery - PASS/FAIL
□ Test 5: Multiple User Simulation - PASS/FAIL
□ Test 6: Performance and Load Testing - PASS/FAIL

Issues Found:
- Issue 1: ________________
- Issue 2: ________________

Overall Status: ✅ PASS / ❌ FAIL

Notes:
_________________________
```

This comprehensive testing approach ensures your WebSocket real-time implementation is robust and production-ready! 🚀
