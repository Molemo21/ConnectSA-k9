# Auto-Login Draft Preservation Debugging Guide

## 🚨 Issue Summary

**Problem**: Booking drafts are not preserved after auto-login during email verification.

**Root Cause**: The auto-login process is likely failing to merge the draft with the user account, resulting in no draft data being returned and stored in sessionStorage.

## 🔍 Flow Analysis

### Expected Flow
1. User fills booking form
2. Clicks "Sign up" in login modal
3. Draft saved to localStorage + server
4. Draft ID stored in cookie
5. User redirected to signup page
6. Draft ID included in verification email
7. User clicks verification link
8. Auto-login called with draft ID
9. Draft merged with user account
10. Draft data returned and stored in sessionStorage
11. User redirected to booking page
12. Draft restored from sessionStorage

### Actual Flow (Problem)
1. User fills booking form
2. Clicks "Sign up" in login modal
3. Draft saved to localStorage + server
4. Draft ID stored in cookie
5. User redirected to signup page
6. Draft ID included in verification email
7. User clicks verification link
8. Auto-login called with draft ID
9. **Draft merge fails or returns no data**
10. **No draft data stored in sessionStorage**
11. User redirected to booking page
12. **Form starts empty (draft lost)**

## ⚠️ Potential Issues

### Issue 1: Draft Not Found During Merge
- **Problem**: Draft ID exists but draft not found in database
- **Cause**: Draft expired, deleted, or never saved to server
- **Solution**: Check draft existence and expiration

### Issue 2: Draft Merge API Failure
- **Problem**: `POST /api/bookings/drafts/[id]/merge` returns error
- **Cause**: User not found, draft already merged, or server error
- **Solution**: Check merge API response and error handling

### Issue 3: Draft Data Not Returned
- **Problem**: Auto-login succeeds but no draft data in response
- **Cause**: Merge succeeds but draft data not included in response
- **Solution**: Check auto-login API response structure

### Issue 4: sessionStorage Not Updated
- **Problem**: Draft data received but not stored in sessionStorage
- **Cause**: sessionStorage.setItem() fails or data format incorrect
- **Solution**: Check sessionStorage operations and data format

### Issue 5: Draft ID Not Passed Correctly
- **Problem**: Draft ID not included in auto-login request
- **Cause**: URL parameter extraction or cookie reading fails
- **Solution**: Check draft ID extraction and passing

## 🔧 Debugging Steps

### Step 1: Check Draft Creation
1. Fill booking form
2. Click "Sign up" in login modal
3. Check browser console for draft creation logs
4. Verify draft is saved to server (no 500 errors)
5. Check draft ID in cookie

**Expected Console Logs:**
```
📝 Draft saved to localStorage: [draft-id]
✅ Draft saved to server successfully
```

**Check Network Tab:**
- `POST /api/bookings/drafts` should return 200 OK
- Response should contain draft data

### Step 2: Check Verification Email
1. Complete signup process
2. Check verification email for draft ID in URL
3. Verify draft ID is included in verification link

**Expected URL Format:**
```
https://app.proliinkconnect.co.za/verify-email?token=[token]&draftId=[draft-id]
```

### Step 3: Check Auto-Login Request
1. Click verification link
2. Check Network tab for auto-login API call
3. Verify draft ID is in request headers
4. Check auto-login response for draft data

**Expected Request:**
```javascript
POST /api/auth/auto-login
Headers: {
  'Content-Type': 'application/json',
  'x-draft-id': '[draft-id]'
}
Body: {
  userId: '[user-id]',
  email: '[user-email]'
}
```

**Expected Response:**
```javascript
{
  success: true,
  user: { ... },
  draft: {
    id: '[draft-id]',
    serviceId: '[service-id]',
    date: '[date]',
    time: '[time]',
    address: '[address]',
    notes: '[notes]'
  }
}
```

### Step 4: Check Draft Merge
1. Check Network tab for draft merge API call
2. Verify merge request includes correct user ID
3. Check merge response for success and draft data

**Expected Request:**
```javascript
POST /api/bookings/drafts/[draft-id]/merge
Body: {
  userId: '[user-id]'
}
```

**Expected Response:**
```javascript
{
  success: true,
  draft: {
    id: '[draft-id]',
    serviceId: '[service-id]',
    date: '[date]',
    time: '[time]',
    address: '[address]',
    notes: '[notes]',
    userId: '[user-id]'
  }
}
```

### Step 5: Check sessionStorage
1. Check browser console for sessionStorage logs
2. Verify `resumeBookingData` is stored
3. Check data format and completeness

**Expected Console Logs:**
```
📝 Storing merged draft data for booking page: [draft-id]
📝 Draft data: { ... }
📝 Stored in sessionStorage as resumeBookingData
```

**Check sessionStorage:**
```javascript
// In browser console
JSON.parse(sessionStorage.getItem('resumeBookingData'))
```

## 🧪 Testing Checklist

### ✅ Draft Creation
- [ ] Form data captured correctly
- [ ] Draft saved to localStorage
- [ ] Draft saved to server (no 500 error)
- [ ] Draft ID stored in cookie
- [ ] User redirected to signup page

### ✅ Verification Email
- [ ] Draft ID included in verification link
- [ ] Email sent successfully
- [ ] Link works and includes draft ID

### ✅ Auto-Login
- [ ] Auto-login API called
- [ ] Draft ID passed in headers
- [ ] Auto-login succeeds
- [ ] Draft merge API called
- [ ] Draft merge succeeds
- [ ] Draft data returned

### ✅ Draft Restoration
- [ ] Draft data stored in sessionStorage
- [ ] User redirected to booking page
- [ ] Draft restored from sessionStorage
- [ ] Form pre-filled with draft data

## 🔧 Quick Fixes

### Fix 1: Check Database Connection
```sql
-- Check if booking_drafts table exists
SELECT * FROM booking_drafts LIMIT 5;

-- Check recent drafts
SELECT * FROM booking_drafts 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

### Fix 2: Check Draft Expiration
```javascript
// In browser console
const draft = JSON.parse(localStorage.getItem('booking_draft'));
console.log('Draft expires at:', new Date(draft.expiresAt));
console.log('Current time:', new Date());
console.log('Is expired:', new Date(draft.expiresAt) < new Date());
```

### Fix 3: Check Auto-Login Response
```javascript
// In browser console after auto-login
// Check if draft data is in the response
console.log('Auto-login response:', autoLoginData);
console.log('Draft data:', autoLoginData.draft);
```

### Fix 4: Check sessionStorage Operations
```javascript
// In browser console
console.log('sessionStorage keys:', Object.keys(sessionStorage));
console.log('resumeBookingData:', sessionStorage.getItem('resumeBookingData'));
```

## 🚀 Next Steps

### 1. Run Manual Tests
- Test the complete flow step by step
- Check browser console for errors
- Monitor network requests and responses

### 2. Check Database
- Verify booking_drafts table exists
- Check if drafts are being saved
- Look for any constraint violations

### 3. Debug API Endpoints
- Test draft creation API
- Test draft merge API
- Check for 500 errors or validation issues

### 4. Fix Identified Issues
- Address any 500 errors
- Fix data format issues
- Resolve database connection problems

## 🎯 Common Error Scenarios

### Scenario 1: Draft Not Saved to Server
- **Error**: 500 error when saving draft
- **Cause**: Database connection or table issues
- **Result**: Draft only exists locally, lost on cross-device

### Scenario 2: Draft Expired
- **Error**: Draft not found or expired
- **Cause**: Draft expiration time too short
- **Result**: Draft deleted before user returns

### Scenario 3: Draft Merge Fails
- **Error**: Merge API returns error
- **Cause**: User not found or draft already merged
- **Result**: No draft data returned to frontend

### Scenario 4: Draft ID Not Passed
- **Error**: No draft ID in auto-login request
- **Cause**: URL parameter extraction fails
- **Result**: Auto-login succeeds but no draft merge

## 📊 Expected Results

After fixing the issues:
- ✅ Drafts save successfully to the server
- ✅ Auto-login merges draft with user account
- ✅ Draft data is returned in auto-login response
- ✅ Draft data is stored in sessionStorage
- ✅ Form is pre-filled after verification
- ✅ No more "starting over" after email verification

## 🎯 Summary

The auto-login process is likely the cause of draft loss. The most probable issues are:

1. **Draft not saved to server during creation**
2. **Draft merge fails during auto-login**
3. **Draft data not returned in auto-login response**
4. **sessionStorage not updated with draft data**

**Next step**: Run the debugging steps to identify the specific point of failure in the auto-login flow.

---

**This guide provides a systematic approach to identifying and fixing the auto-login draft preservation issue.**
