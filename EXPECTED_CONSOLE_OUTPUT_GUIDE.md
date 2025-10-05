# Expected Console Output Guide for Draft Preservation Flow

## 🎯 Overview

This guide provides the exact console output you should see at each step of the draft preservation flow. Use this to verify you're heading in the right direction and identify where the process might be failing.

## 📋 Step-by-Step Expected Console Output

### Step 1: Draft Creation (When user clicks "Sign up" in login modal)

**Expected Console Output:**
```
📝 Draft saved to localStorage: [draft-id]
✅ Draft saved to server successfully
```

**Network Tab - Expected Request:**
```
POST /api/bookings/drafts
Status: 200 OK
Request Body: {
  "id": "[draft-id]",
  "serviceId": "[service-id]",
  "date": "[date]",
  "time": "[time]",
  "address": "[address]",
  "notes": "[notes]",
  "expiresAt": "[expiration-date]"
}
```

**Network Tab - Expected Response:**
```
Status: 200 OK
Response Body: {
  "success": true,
  "draft": {
    "id": "[draft-id]",
    "serviceId": "[service-id]",
    "date": "[date]",
    "time": "[time]",
    "address": "[address]",
    "notes": "[notes]",
    "userId": null,
    "createdAt": "[timestamp]",
    "expiresAt": "[expiration-date]"
  }
}
```

**Server Console (if accessible):**
```
📝 Created new booking draft: [draft-id]
```

### Step 2: Email Verification (When user clicks verification link)

**Expected Console Output:**
```
🔍 Frontend: Starting verification for token: [token-prefix]...
🔍 Frontend: Verification response status: 200
🔍 Frontend: Verification response data: { success: true, message: "Email verified successfully", user: {...} }
✅ Frontend: Verification successful, setting success state
📝 Found pending booking draft, auto-logging in and redirecting to continue booking: [draft-id]
```

**Network Tab - Expected Request:**
```
GET /api/auth/verify-email?token=[token]
Status: 200 OK
```

**Network Tab - Expected Response:**
```
Status: 200 OK
Response Body: {
  "message": "Email verified successfully",
  "user": {
    "id": "[user-id]",
    "email": "[user-email]",
    "name": "[user-name]",
    "role": "[user-role]",
    "emailVerified": true
  },
  "autoLogin": true
}
```

### Step 3: Auto-Login (After email verification)

**Expected Console Output:**
```
✅ Auto-login successful: [user-email]
🔗 Attempting to merge draft [draft-id] with user [user-id]
✅ Successfully merged draft [draft-id] with user [user-id]
📝 Storing merged draft data for booking page: [draft-id]
📝 Draft data: {
  "id": "[draft-id]",
  "serviceId": "[service-id]",
  "date": "[date]",
  "time": "[time]",
  "address": "[address]",
  "notes": "[notes]",
  "userId": "[user-id]",
  "createdAt": "[timestamp]",
  "expiresAt": "[expiration-date]"
}
📝 Stored in sessionStorage as resumeBookingData
```

**Network Tab - Expected Request:**
```
POST /api/auth/auto-login
Status: 200 OK
Headers: {
  "Content-Type": "application/json",
  "x-draft-id": "[draft-id]"
}
Request Body: {
  "userId": "[user-id]",
  "email": "[user-email]"
}
```

**Network Tab - Expected Response:**
```
Status: 200 OK
Response Body: {
  "success": true,
  "user": {
    "id": "[user-id]",
    "email": "[user-email]",
    "name": "[user-name]",
    "role": "[user-role]",
    "emailVerified": true
  },
  "draft": {
    "id": "[draft-id]",
    "serviceId": "[service-id]",
    "date": "[date]",
    "time": "[time]",
    "address": "[address]",
    "notes": "[notes]",
    "userId": "[user-id]",
    "createdAt": "[timestamp]",
    "expiresAt": "[expiration-date]"
  }
}
```

**Server Console (if accessible):**
```
✅ Auto-login successful for user [user-email]
🔗 Attempting to merge draft [draft-id] with user [user-id]
🔗 Merged booking draft [draft-id] with user [user-id]
```

### Step 4: Draft Restoration (When booking page loads)

**Expected Console Output:**
```
🔍 [BookService] Component mounted, checking for booking draft
🔍 [BookService] Authentication status determined, checking for booking draft
🔍 [BookService] Checking for resume booking data in sessionStorage...
🔍 [BookService] Found resume booking data, restoring form
📖 Resume data from sessionStorage: {"id":"[draft-id]","serviceId":"[service-id]",...}
📖 Parsed draft data: {
  "id": "[draft-id]",
  "serviceId": "[service-id]",
  "date": "[date]",
  "time": "[time]",
  "address": "[address]",
  "notes": "[notes]",
  "userId": "[user-id]",
  "createdAt": "[timestamp]",
  "expiresAt": "[expiration-date]"
}
🔍 [BookService] Form restored and resume data cleared
```

## ❌ Common Error Scenarios and Expected Output

### Error 1: Draft Not Saved to Server

**Console Output:**
```
📝 Draft saved to localStorage: [draft-id]
❌ Failed to save draft to server: Error: Internal server error
Failed to save booking draft: Error: Failed to save booking draft: Internal server error
```

**Network Tab:**
```
POST /api/bookings/drafts
Status: 500 Internal Server Error
```

### Error 2: Draft Merge Fails

**Console Output:**
```
✅ Auto-login successful: [user-email]
🔗 Attempting to merge draft [draft-id] with user [user-id]
⚠️ Failed to merge draft [draft-id]: Draft not found
⚠️ No draft data received from auto-login
```

**Network Tab:**
```
POST /api/bookings/drafts/[draft-id]/merge
Status: 404 Not Found
Response Body: {
  "success": false,
  "error": "Draft not found"
}
```

### Error 3: Draft Expired

**Console Output:**
```
⏰ Draft expired, removing from localStorage
```

### Error 4: No Draft ID in Auto-Login

**Console Output:**
```
✅ Auto-login successful: [user-email]
⚠️ No draft data received from auto-login
```

## 🔍 Debugging Commands

### Check localStorage
```javascript
// In browser console
console.log('Draft in localStorage:', JSON.parse(localStorage.getItem('booking_draft')));
```

### Check sessionStorage
```javascript
// In browser console
console.log('Resume data in sessionStorage:', JSON.parse(sessionStorage.getItem('resumeBookingData')));
```

### Check Cookies
```javascript
// In browser console
console.log('Draft ID cookie:', document.cookie.split(';').find(c => c.includes('booking_draft_id')));
```

### Check Database (if accessible)
```sql
-- In Supabase SQL Editor
SELECT * FROM booking_drafts ORDER BY "createdAt" DESC LIMIT 5;
```

## 🧪 Testing Checklist

### ✅ Step 1: Draft Creation
- [ ] `📝 Draft saved to localStorage: [draft-id]` appears
- [ ] `✅ Draft saved to server successfully` appears
- [ ] `POST /api/bookings/drafts` returns 200 OK
- [ ] Draft ID is stored in cookie

### ✅ Step 2: Email Verification
- [ ] `📝 Found pending booking draft` appears
- [ ] `GET /api/auth/verify-email` returns 200 OK
- [ ] Verification response includes user data

### ✅ Step 3: Auto-Login
- [ ] `✅ Auto-login successful` appears
- [ ] `🔗 Attempting to merge draft` appears
- [ ] `✅ Successfully merged draft` appears
- [ ] `📝 Storing merged draft data` appears
- [ ] `📝 Stored in sessionStorage` appears

### ✅ Step 4: Draft Restoration
- [ ] `🔍 Found resume booking data` appears
- [ ] `📖 Resume data from sessionStorage` appears
- [ ] `📖 Parsed draft data` appears
- [ ] `🔍 Form restored` appears

## 🎯 Success Criteria

The flow is working correctly when you see:

1. **Draft Creation**: Draft saved to both localStorage and server
2. **Email Verification**: Verification succeeds and draft ID is found
3. **Auto-Login**: Auto-login succeeds and draft is merged
4. **Draft Restoration**: Draft data is restored to the form

## 🚨 Red Flags

Watch out for these error messages:

- `❌ Failed to save draft to server`
- `⚠️ Failed to merge draft`
- `⚠️ No draft data received from auto-login`
- `⏰ Draft expired`
- `🔍 No resume booking data found in sessionStorage`

## 📊 Summary

Use this guide to verify each step of the draft preservation flow. If you see the expected console output at each step, the flow is working correctly. If you see any of the error messages, use the debugging commands to identify and fix the issue.

---

**This guide provides the exact console output you should see for a successful draft preservation flow.**
