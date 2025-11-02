# 🚀 Notification "View Details" - Quick Test Start

## ⚡ Quick Commands

```bash
# 1. Run all logic tests (no server needed)
npm run test:notification-view-details

# 2. Run with custom URL
npm run test:notification-view-details:url=http://localhost:3000

# 3. Show browser testing checklist
npm run test:notification-view-details:browser

# 4. Run E2E browser tests (requires server running)
npm run test:notification-view-details:e2e

# 5. Run E2E with UI mode (visual debugging)
npm run test:e2e:ui __tests__/e2e/notification-view-details.spec.ts
```

## 📋 Quick Test Checklist

### ✅ Automated Tests (Run First)
- [ ] `npm run test:notification-view-details` - All tests pass

### ✅ Manual Browser Tests (Run Second)
1. [ ] Login as PROVIDER → Click notification → Click "View Details"
   - ✅ Navigates to `/provider/dashboard?tab=jobs&bookingId=[id]`
   - ✅ Scrolls to booking card
   - ✅ Highlights card

2. [ ] Login as CLIENT → Click notification → Click "View Details"
   - ✅ Navigates to `/dashboard?bookingId=[id]`
   - ✅ Scrolls to booking card
   - ✅ Highlights card

3. [ ] Check browser console for errors
   - ✅ No JavaScript errors
   - ✅ Success logs appear

## 🐛 Quick Debug

```javascript
// In browser console - Check booking cards
document.querySelectorAll('[data-booking-id]').length

// Check if specific card exists
document.querySelector('[data-booking-id="YOUR_ID"]')

// Test scroll manually
const card = document.querySelector('[data-booking-id="YOUR_ID"]')
card?.scrollIntoView({ behavior: 'smooth', block: 'center' })
```

## 📖 Full Documentation

- **Complete Test Guide:** `NOTIFICATION_VIEW_DETAILS_TEST_GUIDE.md`
- **Test Scripts:** `scripts/test-notification-view-details*.js`
- **E2E Tests:** `__tests__/e2e/notification-view-details.spec.ts`

## ✅ Success Criteria

All tests pass when:
- ✅ Automated tests pass
- ✅ Manual browser tests work
- ✅ No console errors
- ✅ Smooth scrolling works
- ✅ Highlight animation works

---

**Start Testing:** `npm run test:notification-view-details`

