# Production Deployment Guide: Booking Drafts 500 Error Fix

## Overview
This guide will walk you through deploying the booking drafts fix to production, including database table creation, code deployment, and verification testing.

## Prerequisites
- Access to Supabase dashboard
- Production deployment access
- Test user account for verification

---

## Step 1: Create Database Table

### 1.1 Access Supabase SQL Editor
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your production project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### 1.2 Run the Table Creation Script
1. Copy the entire contents of `create-booking-drafts-table-production.sql`
2. Paste into the SQL Editor
3. Click **Run** (or press Ctrl+Enter)

### 1.3 Verify Table Creation
Run this verification query:
```sql
-- Verify table exists
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'booking_drafts'
ORDER BY ordinal_position;

-- Check if table has data
SELECT COUNT(*) as draft_count FROM booking_drafts;

-- Verify indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'booking_drafts';
```

**Expected Results:**
- Table should have 9 columns (id, serviceId, date, time, address, notes, userId, expiresAt, createdAt, updatedAt)
- draft_count should be 0 (empty table)
- 2 indexes should exist (userId and expiresAt)

### 1.4 Test Table Operations
Run this test to ensure the table works:
```sql
-- Test insert
INSERT INTO booking_drafts (
    id, serviceId, date, time, address, notes, expiresAt
) VALUES (
    'test-draft-' || extract(epoch from now())::text,
    'test-service-123',
    '2024-12-25',
    '14:00',
    '123 Test Street, Test City',
    'Test booking draft',
    NOW() + INTERVAL '24 hours'
);

-- Test select
SELECT * FROM booking_drafts WHERE id LIKE 'test-draft-%';

-- Clean up test data
DELETE FROM booking_drafts WHERE id LIKE 'test-draft-%';
```

---

## Step 2: Deploy Code Changes

### 2.1 Verify Code is Pushed
```bash
# Check if latest commit is on main branch
git log --oneline -5

# Should show: 8fed657 fix: resolve 500 error when saving booking drafts
```

### 2.2 Deploy to Production
**Option A: Vercel (if using Vercel)**
1. Go to Vercel dashboard
2. Select your project
3. Click **Deployments**
4. Click **Redeploy** on the latest deployment
5. Wait for deployment to complete

**Option B: Manual Deployment**
1. SSH into your production server
2. Navigate to project directory
3. Pull latest changes:
   ```bash
   git pull origin main
   npm install
   npm run build
   pm2 restart your-app-name
   ```

### 2.3 Verify Deployment
1. Check deployment logs for any errors
2. Verify the application is running
3. Test basic functionality (homepage loads)

---

## Step 3: Test the Booking Flow

### 3.1 Test Environment Setup
1. Open your production website in a **private/incognito window**
2. Clear browser cache and cookies
3. Ensure you're not logged in

### 3.2 Test Scenario 1: Basic Draft Saving
1. **Navigate to booking page**
   - Go to `/book-service`
   - Verify page loads correctly

2. **Fill booking form**
   - Select a service
   - Choose a date (today or future)
   - Select a time slot
   - Enter an address
   - Add optional notes
   - **Take a screenshot** of the filled form

3. **Trigger draft saving**
   - Click **Continue** button
   - **Expected**: Login modal appears (no 500 error)
   - **Check browser console** for: `📝 Booking draft saved before login: [draft-id]`

4. **Verify draft was saved**
   - Open browser DevTools → Application → Local Storage
   - Look for `booking_draft` key
   - Verify the data matches what you entered

### 3.3 Test Scenario 2: Signup Flow
1. **From the login modal**
   - Click **Sign up** link
   - **Expected**: Redirects to `/signup` (no error popup)
   - **Check console** for: `📝 Booking draft saved before signup redirect: [draft-id]`

2. **Complete signup**
   - Fill signup form with test email
   - Submit form
   - **Expected**: Redirects to `/verify-email`

3. **Check verification email**
   - Open email client
   - Find verification email
   - **Verify**: Email contains `draftId` parameter in the link
   - Link should look like: `https://your-domain.com/verify-email?token=xxx&draftId=yyy`

### 3.4 Test Scenario 3: Cross-Device Verification
1. **Open verification email on different device**
   - Use phone or different browser
   - Click verification link
   - **Expected**: Auto-redirect to booking page with countdown

2. **Verify draft restoration**
   - After redirect, check if form is pre-filled
   - **Expected**: All previous data is restored
   - **Take screenshot** of restored form

### 3.5 Test Scenario 4: Complete Booking
1. **Continue from restored draft**
   - Verify all data is correct
   - Click **Continue** to proceed
   - Complete the booking flow
   - **Expected**: Booking completes successfully

---

## Step 4: Verify the Fix

### 4.1 Error Verification
**Before Fix (should not happen):**
- ❌ 500 error when clicking "Sign up"
- ❌ "Failed to save your booking" popup
- ❌ Draft data lost during signup

**After Fix (should work):**
- ✅ No 500 errors
- ✅ No error popups
- ✅ Draft data preserved
- ✅ Cross-device functionality works

### 4.2 Database Verification
Run these queries to verify drafts are being saved:
```sql
-- Check recent drafts
SELECT 
    id,
    serviceId,
    date,
    time,
    address,
    userId,
    createdAt,
    expiresAt
FROM booking_drafts 
ORDER BY createdAt DESC 
LIMIT 10;

-- Check draft expiration
SELECT 
    COUNT(*) as total_drafts,
    COUNT(CASE WHEN expiresAt > NOW() THEN 1 END) as active_drafts,
    COUNT(CASE WHEN expiresAt <= NOW() THEN 1 END) as expired_drafts
FROM booking_drafts;
```

### 4.3 API Endpoint Verification
Test the API endpoints directly:
```bash
# Test draft creation
curl -X POST https://your-domain.com/api/bookings/drafts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-draft-123",
    "serviceId": "test-service-456",
    "date": "2024-12-25",
    "time": "14:00",
    "address": "123 Test Street",
    "notes": "Test draft",
    "expiresAt": "2024-12-26T14:00:00Z"
  }'

# Expected: 200 OK with draft data
```

---

## Step 5: Monitoring and Cleanup

### 5.1 Monitor for Issues
1. **Check application logs** for any errors
2. **Monitor database performance** for the new table
3. **Watch for user reports** of booking issues

### 5.2 Cleanup Old Data
Set up automatic cleanup for expired drafts:
```sql
-- Create cleanup function (run once)
CREATE OR REPLACE FUNCTION cleanup_expired_drafts()
RETURNS void AS $$
BEGIN
    DELETE FROM booking_drafts 
    WHERE expiresAt < NOW();
    
    RAISE NOTICE 'Cleaned up expired booking drafts';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run daily)
-- You can set this up as a cron job or use Supabase Edge Functions
```

### 5.3 Performance Monitoring
Monitor these metrics:
- Draft creation success rate
- Draft retrieval success rate
- Average draft creation time
- Database query performance

---

## Troubleshooting

### Common Issues and Solutions

**Issue 1: Table creation fails**
- **Error**: Permission denied
- **Solution**: Ensure you're using the correct database user with CREATE TABLE permissions

**Issue 2: API still returns 500**
- **Error**: bookingDraft model not found
- **Solution**: Verify the deployment includes the updated `lib/db-utils.ts`

**Issue 3: Drafts not saving**
- **Error**: Database connection issues
- **Solution**: Check database connection string and network connectivity

**Issue 4: Cross-device not working**
- **Error**: Draft ID not in verification email
- **Solution**: Verify the signup API includes draft ID in the verification link

### Debug Commands
```bash
# Check if table exists
psql -h your-db-host -U your-user -d your-db -c "\dt booking_drafts"

# Check recent logs
tail -f /var/log/your-app.log | grep -i draft

# Test database connection
psql -h your-db-host -U your-user -d your-db -c "SELECT 1"
```

---

## Success Criteria

✅ **Deployment is successful when:**
1. Database table is created without errors
2. Code is deployed and running
3. No 500 errors when saving drafts
4. Drafts are preserved across devices
5. Complete booking flow works end-to-end
6. No user reports of data loss

---

## Rollback Plan

If issues occur, you can rollback by:
1. **Revert code changes**:
   ```bash
   git revert 8fed657
   git push origin main
   ```
2. **Drop the table** (if needed):
   ```sql
   DROP TABLE IF EXISTS booking_drafts;
   ```
3. **Redeploy** the previous version

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review application logs
3. Test with the provided verification scripts
4. Contact the development team with specific error messages

---

**🎉 Once all steps are completed successfully, the booking drafts 500 error will be resolved and users will have a seamless booking experience!**
