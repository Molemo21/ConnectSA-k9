# Booking Draft Preservation - Manual Test Guide

This guide provides step-by-step instructions to manually test the booking draft preservation feature.

## 🎯 Test Objective

Verify that booking progress is preserved when users:
1. Start a booking while not logged in
2. Are prompted to sign up
3. Complete email verification
4. Return to continue their booking

## 📋 Prerequisites

- Development server running (`npm run dev`)
- Database connection working
- Email verification system functional
- Clean browser session (no existing login)

## 🧪 Test Scenarios

### Scenario 1: New User Signup Flow

**Steps:**
1. Open browser in incognito/private mode
2. Navigate to `http://localhost:3000`
3. Click "Book Service" or go to `/book-service`
4. Fill out the booking form:
   - Select a service
   - Choose a date (future date)
   - Select a time
   - Enter an address
   - Add optional notes
5. Click "Continue" or proceed to provider selection
6. When prompted to log in, click "Sign Up"
7. Fill out the signup form with a new email
8. Submit the signup form
9. Check your email for verification link
10. Click the verification link
11. **Expected Result**: You should be redirected to continue your booking with all data preserved

**Verification Points:**
- ✅ Booking form data is preserved
- ✅ User is redirected to continue booking after verification
- ✅ No data loss occurs during the signup process
- ✅ Draft is cleared after successful restoration

### Scenario 2: Existing User Login Flow

**Steps:**
1. Open browser in incognito/private mode
2. Navigate to `http://localhost:3000/book-service`
3. Fill out the booking form with test data
4. When prompted to log in, click "Sign In"
5. Enter credentials for an existing user
6. **Expected Result**: You should be redirected to continue your booking with all data preserved

**Verification Points:**
- ✅ Booking form data is preserved
- ✅ User is redirected to continue booking after login
- ✅ Draft is merged with user account
- ✅ No data loss occurs during the login process

### Scenario 3: Draft Expiration Test

**Steps:**
1. Create a booking draft
2. Wait for the draft to expire (7 days) or manually set expiration
3. Try to resume the booking
4. **Expected Result**: User should see "Draft expired" message and be prompted to start a new booking

**Verification Points:**
- ✅ Expired drafts are properly cleaned up
- ✅ User gets appropriate error message
- ✅ System gracefully handles expired drafts

### Scenario 4: Multiple Drafts Test

**Steps:**
1. Start a booking and create a draft
2. Start another booking and create another draft
3. Log in and check which draft is restored
4. **Expected Result**: The most recent draft should be restored

**Verification Points:**
- ✅ System handles multiple drafts correctly
- ✅ Most recent draft takes precedence
- ✅ Old drafts are properly cleaned up

## 🔍 Debugging Tips

### Check Browser Storage
```javascript
// Check localStorage for draft
console.log('LocalStorage draft:', localStorage.getItem('booking_draft'));

// Check cookies for draft ID
console.log('Draft ID cookie:', document.cookie.split('; ').find(row => row.startsWith('booking_draft_id=')));

// Check sessionStorage for legacy data
console.log('SessionStorage booking:', sessionStorage.getItem('bookingDetails'));
```

### Check Network Requests
1. Open browser DevTools
2. Go to Network tab
3. Look for requests to:
   - `/api/bookings/drafts`
   - `/api/auth/login`
   - `/api/auth/signup`
   - `/api/auth/verify-email`

### Check Console Logs
Look for these log messages:
- `📝 Booking draft saved before login`
- `🔗 Attempting to merge draft`
- `✅ Successfully merged draft`
- `📖 Booking draft loaded`
- `🗑️ Booking draft cleared`

## 🐛 Common Issues and Solutions

### Issue: Draft not saved
**Symptoms:** User loses booking data after signup/login
**Solutions:**
- Check if `saveBookingDraft` is called before showing login modal
- Verify draft API endpoints are working
- Check browser console for errors

### Issue: Draft not restored
**Symptoms:** User returns but booking form is empty
**Solutions:**
- Check if draft ID is preserved in cookies
- Verify draft retrieval API is working
- Check if draft has expired
- Look for errors in browser console

### Issue: Draft merge fails
**Symptoms:** Login succeeds but draft is not associated with user
**Solutions:**
- Check if user ID is correctly passed to merge API
- Verify draft exists in database
- Check server logs for merge errors

### Issue: Redirect loop
**Symptoms:** User gets stuck in redirect loop
**Solutions:**
- Check if draft is properly cleared after restoration
- Verify redirect logic in resume page
- Check for conflicting redirects

## 📊 Success Criteria

The test is considered successful if:

1. **Data Preservation**: All booking form data is preserved throughout the signup/login process
2. **Seamless Flow**: User can continue booking without re-entering information
3. **Error Handling**: System gracefully handles edge cases (expired drafts, network errors)
4. **Cleanup**: Drafts are properly cleaned up after successful restoration
5. **Performance**: No significant performance impact on booking flow

## 🔧 Manual Database Checks

If needed, you can manually check the database:

```sql
-- Check for booking drafts
SELECT * FROM booking_drafts ORDER BY created_at DESC LIMIT 10;

-- Check for expired drafts
SELECT * FROM booking_drafts WHERE expires_at < NOW();

-- Check for user-associated drafts
SELECT * FROM booking_drafts WHERE user_id IS NOT NULL;
```

## 📝 Test Report Template

For each test scenario, document:

- **Test Date**: [Date]
- **Browser**: [Browser and version]
- **Test Result**: [PASS/FAIL]
- **Issues Found**: [List any issues]
- **Screenshots**: [Attach screenshots if needed]
- **Notes**: [Additional observations]

## 🚀 Production Readiness Checklist

Before deploying to production:

- [ ] All test scenarios pass
- [ ] Draft expiration is working (7 days)
- [ ] Error handling is robust
- [ ] Performance is acceptable
- [ ] Database cleanup job is scheduled
- [ ] Monitoring is in place
- [ ] Documentation is updated

## 📞 Support

If you encounter issues during testing:

1. Check the browser console for errors
2. Review server logs
3. Verify database connectivity
4. Test with a clean browser session
5. Check if all dependencies are installed

For additional help, refer to the implementation documentation or contact the development team.
