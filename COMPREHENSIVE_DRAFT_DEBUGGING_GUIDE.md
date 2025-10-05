# Comprehensive Draft Preservation Debugging Guide

## 🚨 Issue Summary

**Problem**: Booking details are not preserved after auto-login, causing users to start over with empty forms.

**Status**: The `booking_drafts` table exists in Supabase, but the draft preservation flow is still failing.

## 🔍 Root Cause Analysis

Based on the investigation, the issue is likely in one of these areas:

1. **Draft Creation API** - 500 errors when saving drafts to server
2. **Database Connection** - Connection issues preventing draft saves
3. **Draft Merge Process** - Failure during auto-login draft merging
4. **Data Format Issues** - Schema validation or data type mismatches

## 🛠️ Step-by-Step Debugging Process

### Step 1: Verify Database Table Structure

**Run these SQL queries in Supabase SQL Editor:**

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'booking_drafts'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'booking_drafts';

-- Check recent drafts
SELECT * FROM booking_drafts
ORDER BY "createdAt" DESC
LIMIT 5;

-- Check draft statistics
SELECT
  COUNT(*) as total_drafts,
  COUNT(CASE WHEN "expiresAt" > NOW() THEN 1 END) as active_drafts,
  COUNT(CASE WHEN "expiresAt" <= NOW() THEN 1 END) as expired_drafts
FROM booking_drafts;
```

**Expected Results:**
- Table should have all required columns
- Indexes should exist on `userId` and `expiresAt`
- Recent drafts should be visible
- Statistics should show draft counts

### Step 2: Test Draft Creation API

**Manual Test:**
1. Open browser dev tools (F12)
2. Go to the booking page
3. Fill out the booking form
4. Click "Sign up" in the login modal
5. Check Network tab for `POST /api/bookings/drafts`

**Expected Results:**
- Request should return 200 OK
- Response should contain draft data
- No 500 errors in console

**If 500 Error Occurs:**
- Check browser console for error details
- Check server logs for database connection issues
- Verify table structure matches Prisma schema

### Step 3: Test Draft Retrieval API

**Manual Test:**
1. Copy the draft ID from Step 2
2. Test `GET /api/bookings/drafts/[id]` in browser or Postman
3. Verify draft data is returned

**Expected Results:**
- Request should return 200 OK
- Response should contain complete draft data
- No 404 errors

### Step 4: Test Draft Merge API

**Manual Test:**
1. Use the draft ID from Step 2
2. Test `POST /api/bookings/drafts/[id]/merge` with `{ "userId": "test-user-id" }`
3. Verify draft is merged successfully

**Expected Results:**
- Request should return 200 OK
- Response should contain merged draft data
- Draft should be associated with user

### Step 5: Test Complete Flow

**End-to-End Test:**
1. Fill booking form
2. Click "Sign up" in login modal
3. Complete signup process
4. Verify email
5. Check if draft is preserved
6. Verify form is pre-filled

**Expected Results:**
- Draft should be saved during signup
- Draft should be merged during auto-login
- Form should be pre-filled after verification

## 🔧 Common Issues and Solutions

### Issue 1: Database Connection Problems

**Symptoms:**
- 500 errors in API calls
- "Can't reach database server" errors
- Drafts not being saved

**Solutions:**
1. Check database connection string
2. Verify database is accessible
3. Check for connection pool issues
4. Restart database connection

### Issue 2: Schema Mismatch

**Symptoms:**
- Validation errors
- Data not saving correctly
- Column type mismatches

**Solutions:**
1. Compare table structure with Prisma schema
2. Update table to match expected schema
3. Check data types and constraints
4. Verify column names and formats

### Issue 3: Draft Expiration Issues

**Symptoms:**
- Drafts not found after short time
- 410 Gone errors
- Drafts expiring too quickly

**Solutions:**
1. Check expiration logic
2. Verify expiration time calculation
3. Extend expiration time if needed
4. Check for timezone issues

### Issue 4: Auto-Login Draft Merge Failure

**Symptoms:**
- Draft not merged with user
- Empty form after auto-login
- Draft data lost

**Solutions:**
1. Check auto-login API call
2. Verify draft ID is passed correctly
3. Check user existence and validation
4. Verify merge API functionality

## 📊 Debugging Checklist

### ✅ Database Verification
- [ ] `booking_drafts` table exists
- [ ] Table has correct schema
- [ ] Required indexes exist
- [ ] Database connection works
- [ ] Recent drafts are visible

### ✅ API Endpoint Testing
- [ ] Draft creation API works (200 OK)
- [ ] Draft retrieval API works (200 OK)
- [ ] Draft merge API works (200 OK)
- [ ] No 500 errors in any endpoint
- [ ] Data format is correct

### ✅ Application Flow Testing
- [ ] Draft saved during form submission
- [ ] Draft ID stored in cookie
- [ ] Draft included in verification email
- [ ] Auto-login merges draft successfully
- [ ] Form pre-filled after verification

### ✅ Error Handling
- [ ] No console errors
- [ ] No network errors
- [ ] Proper error messages
- [ ] Fallback mechanisms work
- [ ] User experience is smooth

## 🚀 Quick Fixes

### Fix 1: Database Connection
If database connection is failing:
```bash
# Check environment variables
echo $DATABASE_URL
echo $DIRECT_URL

# Test connection
npx prisma db pull
```

### Fix 2: Table Structure
If table structure is incorrect:
```sql
-- Run the table creation script
-- (Use create-booking-drafts-table-production.sql)
```

### Fix 3: API Endpoints
If API endpoints are failing:
1. Check server logs
2. Verify database connection
3. Test endpoints individually
4. Check data validation

### Fix 4: Draft Flow
If draft flow is broken:
1. Check console logs
2. Monitor network requests
3. Verify data at each step
4. Test each component separately

## 📞 Support and Troubleshooting

### If Issues Persist:
1. **Check Server Logs**: Look for error messages and stack traces
2. **Monitor Network Requests**: Check for failed API calls
3. **Verify Data Flow**: Ensure data is passed correctly between steps
4. **Test Components**: Test each part of the flow individually

### Common Error Messages:
- `P1001: Can't reach database server` → Database connection issue
- `500 Internal Server Error` → Server-side error, check logs
- `404 Not Found` → Draft not found or expired
- `400 Bad Request` → Invalid data format or validation failure

### Debugging Tools:
- Browser Dev Tools (Network tab, Console)
- Supabase SQL Editor
- Postman or similar API testing tool
- Server logs and error tracking

## 🎯 Success Criteria

The fix is successful when:
- ✅ Users can save booking drafts without errors
- ✅ Drafts are preserved across devices
- ✅ Auto-login restores the booking form correctly
- ✅ No more "starting over" after email verification
- ✅ All API endpoints return 200 OK
- ✅ Database contains draft records
- ✅ Form is pre-filled with original data

## 📋 Next Steps

1. **Run the debugging steps** in order
2. **Identify the specific issue** causing draft preservation failure
3. **Apply the appropriate fix** based on the issue found
4. **Test the complete flow** to verify the fix works
5. **Monitor for any remaining issues** and address them

---

**This guide provides a systematic approach to identifying and fixing the draft preservation issue. Follow the steps in order to pinpoint the exact problem and apply the correct solution.**
