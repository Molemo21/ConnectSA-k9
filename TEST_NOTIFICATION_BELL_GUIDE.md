# 🔔 How to Test Notification Bell Functionality

This guide explains how to test the notification bell consistency implementation using the available test files.

---

## 📋 **Available Test Files**

1. **`test-notification-bell-frontend.html`** - Browser-based UI test suite
2. **`test-notification-bell-functionality.js`** - (Currently empty - may need implementation)

---

## 🚀 **Method 1: Using the HTML Test File (Recommended)**

The HTML test file provides a beautiful, interactive browser-based testing interface.

### **Step 1: Start Your Development Server**

Make sure your Next.js application is running:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Your app should be accessible at `http://localhost:3000` (or your configured port).

### **Step 2: Log In to Your Application**

1. Open your browser and navigate to `http://localhost:3000`
2. **Log in** with a user account (client or provider)
3. Make sure you have some notifications (create a booking, accept a booking, etc.)

### **Step 3: Open the Test File**

You have two options:

#### **Option A: Direct File Access**
1. Open `test-notification-bell-frontend.html` in your browser
   - Right-click the file → "Open with" → Your browser
   - Or double-click the file if HTML files open with your browser by default

#### **Option B: Serve via Development Server**
1. Copy `test-notification-bell-frontend.html` to the `public` folder:
   ```bash
   cp test-notification-bell-frontend.html public/test-notifications.html
   ```
2. Navigate to: `http://localhost:3000/test-notifications.html`

**⚠️ Important:** Make sure you're logged in to the same domain/browser session for authentication to work!

### **Step 4: Run the Tests**

1. **Open Browser Console** (Press `F12` or `Ctrl+Shift+I`)
   - This will show detailed logs of all API calls

2. **Click "Run All Tests"**
   - This will test all notification functionality automatically

3. **Or Test Individually:**
   - Click individual test buttons to test specific features:
     - ✅ Fetch Notifications
     - ✅ Mark as Read
     - ✅ Mark All as Read
     - ✅ Delete Notification
     - ✅ Refresh Notifications
     - ✅ Notification Navigation

### **Step 5: Review Results**

The test page will show:
- **Results Log:** Detailed logs of each test operation
- **Test Summary:** Count of passed/failed/total tests
- **Color-coded messages:**
  - 🟢 Green = Success
  - 🔴 Red = Failed
  - 🟡 Yellow = Warning
  - 🔵 Blue = Info

---

## 🧪 **Method 2: Manual Testing in Browser**

### **Test Desktop Notification Bell**

1. **Open Desktop Dashboard:**
   - Client: `http://localhost:3000/dashboard`
   - Provider: `http://localhost:3000/provider/dashboard`

2. **Test the Bell Icon:**
   - ✅ Click the bell icon → Popup should open
   - ✅ Check unread count badge displays correctly
   - ✅ Verify notifications are shown
   - ✅ Click "View Details" on a notification → Should navigate to booking card
   - ✅ Click "Mark as Read" → Notification should disappear from unread
   - ✅ Click "Delete" → Notification should be removed
   - ✅ Click "Mark All as Read" → All notifications should be marked read

### **Test Mobile Notification Bell (Client)**

1. **Open Mobile View:**
   - Resize browser to mobile width (< 1024px)
   - Or use browser DevTools device emulation (F12 → Device toolbar)
   - Navigate to: `http://localhost:3000/dashboard`

2. **Test the Bell Icon:**
   - ✅ Click the bell icon in the mobile header
   - ✅ Verify popup opens (should match desktop functionality)
   - ✅ Check unread count badge shows actual count (not just dot)
   - ✅ Test all actions (mark as read, delete, etc.)
   - ✅ Test "View Details" navigation

### **Test Mobile Notification Bell (Provider)**

1. **Open Provider Mobile Dashboard:**
   - Resize browser to mobile width (< 1024px)
   - Navigate to: `http://localhost:3000/provider/dashboard`

2. **Test the Bell Icon:**
   - ✅ Click the bell icon in the mobile header
   - ✅ Verify popup opens with real notifications (not mock data)
   - ✅ Check unread count badge matches desktop style
   - ✅ Test all actions
   - ✅ Verify "View Details" works

---

## 🧪 **Method 3: Using Console Commands**

You can test directly in the browser console:

### **1. Test Fetch Notifications**

```javascript
fetch('/api/notifications', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('Notifications:', data.notifications);
  console.log('Unread Count:', data.unreadCount);
});
```

### **2. Test Mark as Read**

```javascript
// First, get a notification ID
fetch('/api/notifications', { credentials: 'include' })
  .then(r => r.json())
  .then(data => {
    const firstNotification = data.notifications[0];
    if (firstNotification) {
      return fetch(`/api/notifications/${firstNotification.id}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });
    }
  })
  .then(r => r.json())
  .then(data => console.log('Marked as read:', data));
```

### **3. Test Mark All as Read**

```javascript
fetch('/api/notifications/read-all', {
  method: 'PATCH',
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('All marked as read:', data));
```

### **4. Test Delete Notification**

```javascript
// Get first notification ID
fetch('/api/notifications', { credentials: 'include' })
  .then(r => r.json())
  .then(data => {
    const firstNotification = data.notifications[0];
    if (firstNotification) {
      return fetch(`/api/notifications/${firstNotification.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
    }
  })
  .then(r => r.json())
  .then(data => console.log('Deleted:', data));
```

---

## ✅ **Testing Checklist**

### **Consistency Checks**

- [ ] **Desktop Client:** Bell works, shows real notifications
- [ ] **Mobile Client:** Bell works, shows real notifications
- [ ] **Desktop Provider:** Bell works, shows real notifications
- [ ] **Mobile Provider:** Bell works, shows real notifications (not mock data)

### **Functionality Checks**

- [ ] Bell icon displays unread count badge
- [ ] Clicking bell opens popup
- [ ] Notifications load from API (check network tab)
- [ ] "View Details" navigates to correct booking card
- [ ] Booking card is highlighted after navigation
- [ ] Mark as read works (notification disappears from unread)
- [ ] Delete notification works
- [ ] Mark all as read works
- [ ] Unread count updates in real-time

### **Visual Consistency**

- [ ] Badge styling matches across all devices
- [ ] Popup styling matches across all devices
- [ ] Badge shows actual count (not just "dot")
- [ ] Badge shows "99+" for counts > 99

### **Cross-Device Synchronization**

- [ ] Mark as read on desktop → Updates on mobile
- [ ] Mark as read on mobile → Updates on desktop
- [ ] Unread count syncs across devices

---

## 🐛 **Troubleshooting**

### **Test File Shows 401 Unauthorized**

**Problem:** Not logged in or session expired  
**Solution:**
1. Make sure you're logged in to the application
2. Open the test file in the same browser session
3. Or serve it via your dev server (see Method 1, Option B)

### **Test File Can't Connect to API**

**Problem:** Wrong base URL or CORS issues  
**Solution:**
1. Check that your dev server is running on `http://localhost:3000`
2. If using a different port, edit the `BASE_URL` in the HTML file
3. Make sure you're testing from the same origin (serve via dev server)

### **Notifications Don't Load**

**Problem:** API endpoint issues or no notifications exist  
**Solution:**
1. Check browser console for errors
2. Verify `/api/notifications` endpoint works
3. Create some test notifications (create a booking, etc.)
4. Check network tab for API responses

### **"View Details" Doesn't Navigate**

**Problem:** URL generation or navigation issue  
**Solution:**
1. Check browser console for navigation logs
2. Verify booking ID is extracted from notification message
3. Check URL parameters in the generated action URL
4. Verify dashboard component handles `bookingId` parameter

---

## 📊 **What to Look For**

### **Successful Test Results:**

✅ All API calls return status 200  
✅ Notifications are fetched successfully  
✅ Mark as read updates the notification  
✅ Delete removes the notification  
✅ Unread count decreases after marking as read  
✅ "View Details" navigates correctly  
✅ Badge displays actual unread count  
✅ Popup shows real notifications (not mock data on mobile)

### **Failed Test Results:**

❌ 401 Unauthorized → Login issue  
❌ 404 Not Found → Wrong endpoint URL  
❌ 500 Internal Server Error → Backend issue  
❌ Navigation doesn't work → URL generation issue  
❌ Mock data on mobile → Provider header not updated  

---

## 🎯 **Quick Test Command**

If you want to quickly verify the API is working, run this in your browser console (on your dashboard page):

```javascript
// Quick test
async function quickTest() {
  const res = await fetch('/api/notifications', { credentials: 'include' });
  const data = await res.json();
  console.log('✅ API Working:', res.ok);
  console.log('📊 Notifications:', data.notifications?.length || 0);
  console.log('🔔 Unread:', data.unreadCount || 0);
}
quickTest();
```

---

## 📝 **Next Steps After Testing**

1. **If all tests pass:** ✅ Implementation is complete and working!
2. **If tests fail:** Check the error messages and fix accordingly
3. **Report results:** Note any issues or improvements needed

---

**Happy Testing! 🚀**

