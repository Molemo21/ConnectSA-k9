# 🧪 Notification "View Details" Feature - Comprehensive Test Guide

## 📋 Overview

This guide provides comprehensive testing instructions for the Notification "View Details" feature. The feature enables users to click a notification and be taken directly to the corresponding booking card on their dashboard.

---

## 🚀 Quick Start Testing

### Run Automated Tests

```bash
# 1. Run unit/logic tests (no server required)
node scripts/test-notification-view-details.js

# 2. Run with custom URL
node scripts/test-notification-view-details.js --url=http://localhost:3000

# 3. Run E2E browser tests (requires server running)
npm run test:e2e __tests__/e2e/notification-view-details.spec.ts

# 4. Run manual browser test guide
node scripts/test-notification-view-details-browser.js
```

---

## ✅ Test Checklist

### **Phase 1: Logic Tests (No Server Required)**

- [ ] Run `node scripts/test-notification-view-details.js`
- [ ] Verify all booking ID extraction tests pass
- [ ] Verify all URL generation tests pass
- [ ] Check database notifications (if database available)
- [ ] Review test summary output

### **Phase 2: API Tests (Server Required)**

- [ ] Start development server: `npm run dev`
- [ ] Run API tests section in test script
- [ ] Verify notifications API returns correct structure
- [ ] Check that notifications include all required fields

### **Phase 3: Browser Manual Testing**

#### **Test 1: Provider Dashboard - Booking Notification**

**Steps:**
1. Login as a PROVIDER user
2. Navigate to any page with notification bell icon
3. Click the notification bell icon
4. Verify notification popup opens
5. Find a notification about a booking (e.g., "New booking #abc123")
6. Click the "View Details" or "View Booking" button

**Expected Results:**
- ✅ Page navigates to `/provider/dashboard?tab=jobs&bookingId=[booking-id]`
- ✅ Dashboard opens in the "Jobs" section automatically
- ✅ Page scrolls to the specific booking card smoothly
- ✅ Booking card is highlighted with blue ring/background
- ✅ Highlight animation fades after ~3 seconds
- ✅ URL is cleaned (bookingId parameter removed after navigation)
- ✅ Browser console shows: `🔍 Booking ID detected in URL: [id]`
- ✅ Browser console shows: `✅ Successfully scrolled to booking card: [id]`

**Screenshots to Take:**
- Notification popup open
- URL with bookingId parameter
- Booking card highlighted
- Final URL (cleaned)

---

#### **Test 2: Client Dashboard - Booking Notification**

**Steps:**
1. Login as a CLIENT user
2. Navigate to any page with notification bell icon
3. Click the notification bell icon
4. Verify notification popup opens
5. Find a notification about a booking
6. Click the "View Details" or "View Booking" button

**Expected Results:**
- ✅ Page navigates to `/dashboard?bookingId=[booking-id]`
- ✅ Dashboard loads correctly
- ✅ Page scrolls to the specific booking card automatically
- ✅ Booking card is highlighted with blue ring/background
- ✅ Highlight disappears after ~3 seconds
- ✅ No errors in console

---

#### **Test 3: Different Notification Types**

Test each notification type and verify correct navigation:

| Notification Type | Expected Destination | BookingId Required? |
|------------------|---------------------|---------------------|
| BOOKING_CREATED | `/provider/dashboard?tab=jobs` or `/dashboard` | Yes |
| BOOKING_ACCEPTED | `/provider/dashboard?tab=jobs` or `/dashboard` | Yes |
| BOOKING_DECLINED | `/provider/dashboard?tab=jobs` or `/dashboard` | Yes |
| PAYMENT_RECEIVED | `/provider/dashboard?tab=earnings` | No |
| JOB_STARTED | `/dashboard` | Yes |
| JOB_COMPLETED | `/dashboard` | Yes |
| REVIEW_SUBMITTED | `/provider/dashboard?tab=reviews` | No |
| CATALOGUE_SETUP_COMPLETED | `/provider/dashboard?tab=catalogue` | No |

**Steps for each:**
1. Trigger the notification (or use existing notification)
2. Click notification bell
3. Find the notification of that type
4. Click "View Details"
5. Verify correct navigation

---

#### **Test 4: Edge Cases**

##### **4.1 Notification Without BookingId**

**Steps:**
1. Find or create a notification that doesn't reference a booking (e.g., catalogue, payment without booking context)
2. Click "View Details"

**Expected Results:**
- ✅ Navigates to appropriate dashboard section
- ✅ Does not attempt to scroll (no bookingId)
- ✅ No errors in console

---

##### **4.2 Deleted Booking**

**Steps:**
1. Create a notification for a booking
2. Delete the booking from database (via admin panel or database)
3. Click "View Details" on the notification

**Expected Results:**
- ✅ Navigates to dashboard
- ✅ Console shows warning: `⚠️ Booking card not found for bookingId: [id]`
- ✅ Does not crash
- ✅ Still navigates to correct section

---

##### **4.3 Bookings Still Loading**

**Steps:**
1. Clear browser cache
2. Navigate directly to: `/dashboard?bookingId=[existing-booking-id]`
3. Watch console during page load

**Expected Results:**
- ✅ Console shows: `⏳ Bookings not loaded yet, bookingId will be handled when bookings are available`
- ✅ After bookings load, console shows: `🔍 Booking ID detected in URL`
- ✅ Card scrolls into view after bookings are loaded
- ✅ Retry mechanism works (check console for retry logs)

---

##### **4.4 Mobile Viewport**

**Steps:**
1. Open browser DevTools
2. Switch to mobile view (e.g., iPhone 12)
3. Login and click "View Details" on notification
4. Verify scroll behavior

**Expected Results:**
- ✅ Scroll works on mobile viewport
- ✅ Highlight is visible (not cut off)
- ✅ Smooth scrolling animation
- ✅ Card is centered in viewport

---

##### **4.5 Invalid BookingId**

**Steps:**
1. Manually navigate to: `/dashboard?bookingId=invalid-id-that-does-not-exist`
2. Watch console

**Expected Results:**
- ✅ Page loads normally
- ✅ Console shows: `⚠️ Booking card not found for bookingId: invalid-id`
- ✅ Console shows retry attempt after 1.5 seconds
- ✅ No errors or crashes
- ✅ URL is cleaned

---

#### **Test 5: Direct URL Access**

**Steps:**
1. Get a valid booking ID from database or notifications
2. Manually navigate to: `/provider/dashboard?tab=jobs&bookingId=[valid-id]`
3. Wait for page to load

**Expected Results:**
- ✅ Page loads correctly
- ✅ Automatically switches to "Jobs" section
- ✅ Scrolls to booking card
- ✅ Highlights card
- ✅ URL is cleaned after scroll

---

#### **Test 6: Browser Console Verification**

**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Perform any "View Details" action
4. Watch console logs

**Expected Logs:**
```
🔍 Booking ID detected in URL: [booking-id], attempting to scroll to card
✅ Successfully scrolled to booking card: [booking-id]
```

**No Errors Should Appear:**
- ❌ No JavaScript errors
- ❌ No React errors
- ❌ No navigation errors

---

#### **Test 7: URL Parameter Edge Cases**

##### **7.1 Multiple bookingId Parameters**

**Steps:**
1. Navigate to: `/dashboard?bookingId=abc123&bookingId=xyz789`

**Expected:**
- ✅ Uses first bookingId parameter
- ✅ Handles gracefully

---

##### **7.2 Special Characters in bookingId**

**Steps:**
1. Test with booking IDs containing:
   - Dashes: `abc-123`
   - Underscores: `abc_123`
   - Mixed case: `ABC123abc`

**Expected:**
- ✅ All formats work correctly
- ✅ URL encoding handles special characters

---

## 🔍 Debugging Tips

### **Check if Booking Cards Have data-booking-id Attributes**

Open browser console and run:
```javascript
// Count booking cards with data-booking-id
document.querySelectorAll('[data-booking-id]').length

// List all booking IDs
Array.from(document.querySelectorAll('[data-booking-id]')).map(el => el.getAttribute('data-booking-id'))

// Find specific booking card
document.querySelector('[data-booking-id="YOUR_BOOKING_ID"]')
```

### **Test Scroll Manually**

```javascript
// Find booking card
const card = document.querySelector('[data-booking-id="YOUR_BOOKING_ID"]')

// Scroll to it
card?.scrollIntoView({ behavior: 'smooth', block: 'center' })

// Add highlight manually
card?.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-75', 'bg-blue-50/30')
```

### **Monitor URL Changes**

```javascript
// Watch for URL parameter changes
let lastUrl = location.href
setInterval(() => {
  if (location.href !== lastUrl) {
    console.log('URL changed:', location.href)
    lastUrl = location.href
  }
}, 100)
```

### **Check Notification Data**

```javascript
// Fetch notifications
const response = await fetch('/api/notifications', { credentials: 'include' })
const data = await response.json()
console.log('Notifications:', data.notifications)

// Find booking notifications
const bookingNotifs = data.notifications.filter(n => 
  /booking/i.test(n.type) || /booking/i.test(n.message)
)
console.log('Booking notifications:', bookingNotifs)
```

---

## 📊 Test Results Template

### Test Run: [Date]

**Environment:**
- Server URL: `_________________`
- Browser: `_________________`
- User Role: `_________________`

**Test Results:**

| Test # | Description | Status | Notes |
|--------|-------------|--------|-------|
| 1 | Provider Dashboard Booking | ⬜ Pass / ⬜ Fail | |
| 2 | Client Dashboard Booking | ⬜ Pass / ⬜ Fail | |
| 3.1 | BOOKING_CREATED | ⬜ Pass / ⬜ Fail | |
| 3.2 | BOOKING_ACCEPTED | ⬜ Pass / ⬜ Fail | |
| 3.3 | BOOKING_DECLINED | ⬜ Pass / ⬜ Fail | |
| 3.4 | PAYMENT_RECEIVED | ⬜ Pass / ⬜ Fail | |
| 4.1 | Notification Without BookingId | ⬜ Pass / ⬜ Fail | |
| 4.2 | Deleted Booking | ⬜ Pass / ⬜ Fail | |
| 4.3 | Bookings Loading | ⬜ Pass / ⬜ Fail | |
| 4.4 | Mobile Viewport | ⬜ Pass / ⬜ Fail | |
| 4.5 | Invalid BookingId | ⬜ Pass / ⬜ Fail | |
| 5 | Direct URL Access | ⬜ Pass / ⬜ Fail | |
| 6 | Console Verification | ⬜ Pass / ⬜ Fail | |
| 7.1 | Multiple bookingId Params | ⬜ Pass / ⬜ Fail | |
| 7.2 | Special Characters | ⬜ Pass / ⬜ Fail | |

**Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Screenshots:**
- [ ] Attached to test report

---

## 🐛 Common Issues and Solutions

### **Issue: Notification "View Details" doesn't navigate**

**Possible Causes:**
- URL generation failed
- Missing bookingId in notification message
- Notification type not recognized

**Solutions:**
1. Check browser console for errors
2. Verify notification message contains booking reference
3. Check URL generation in `safe-user-menu.tsx`

---

### **Issue: Page navigates but doesn't scroll to card**

**Possible Causes:**
- Booking card doesn't have `data-booking-id` attribute
- Booking card not rendered yet
- bookingId doesn't match

**Solutions:**
1. Check if booking card has attribute: `document.querySelector('[data-booking-id]')`
2. Verify bookingId in URL matches booking card attribute
3. Check console for retry logs

---

### **Issue: Highlight doesn't appear**

**Possible Causes:**
- CSS classes not applied
- Highlight faded too quickly
- Tailwind CSS not loaded

**Solutions:**
1. Check if classes are added: Inspect element and look for `ring-4`, `ring-blue-500`
2. Check Tailwind CSS is loaded
3. Manually add classes to test

---

### **Issue: URL parameter not cleaned**

**Possible Causes:**
- setTimeout not executing
- Error in URL cleanup code
- Navigation happening too fast

**Solutions:**
1. Check console for errors
2. Verify URL cleanup code in dashboard components
3. Add delay to see URL before cleanup

---

## 📝 Notes for Developers

### **Files to Check if Issues Occur:**

1. `components/ui/safe-user-menu.tsx` - URL generation
2. `components/provider/provider-dashboard-unified.tsx` - Provider dashboard scroll logic
3. `components/dashboard/mobile-client-dashboard.tsx` - Client dashboard scroll logic
4. `components/dashboard/dashboard-content.tsx` - Client dashboard scroll logic
5. `components/provider/provider-booking-card.tsx` - data-booking-id attribute
6. `components/ui/notification-popup.tsx` - Notification click handler

### **Key Code Locations:**

- **URL Generation:** `safe-user-menu.tsx` lines 113-170
- **Booking ID Extraction:** `safe-user-menu.tsx` line 119
- **Provider Scroll Logic:** `provider-dashboard-unified.tsx` lines 3703-3765
- **Client Scroll Logic:** `mobile-client-dashboard.tsx` lines 1164-1228

---

## ✅ Success Criteria

All tests pass when:
- ✅ All automated tests pass
- ✅ Manual tests on both provider and client dashboards work
- ✅ Edge cases handled gracefully
- ✅ No console errors
- ✅ Smooth user experience
- ✅ Works on mobile devices
- ✅ Works with direct URL access

---

## 🎯 Next Steps After Testing

1. ✅ Document any issues found
2. ✅ Fix critical issues before production
3. ✅ Re-test after fixes
4. ✅ Deploy to staging
5. ✅ Run smoke tests in staging
6. ✅ Deploy to production
7. ✅ Monitor production for errors

---

**Last Updated:** [Date]
**Tested By:** [Name]
**Version:** 1.0

