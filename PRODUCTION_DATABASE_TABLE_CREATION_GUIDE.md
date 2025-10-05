# Production Database Table Creation Guide

## 🚨 CRITICAL ISSUE IDENTIFIED

The booking details are not being preserved after auto-login because the `booking_drafts` table does not exist in the production database.

## 🔍 Root Cause Analysis

1. **Database Connection Error**: `P1001 Can't reach database server`
2. **Missing Table**: The `booking_drafts` table was never created in production
3. **500 Errors**: When users try to save drafts, the server returns 500 errors
4. **Local Storage Only**: Drafts are only saved locally, not on the server
5. **Cross-Device Failure**: When users verify email on different devices, the draft is lost

## 🛠️ Solution: Create the Missing Table

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query

### Step 2: Run the Table Creation Script

Copy and paste the following SQL script into the SQL Editor:

```sql
-- Create booking_drafts table for production
-- Run this script in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "booking_drafts" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "notes" TEXT,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_drafts_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "booking_drafts_userId_idx" ON "booking_drafts"("userId");
CREATE INDEX IF NOT EXISTS "booking_drafts_expiresAt_idx" ON "booking_drafts"("expiresAt");

-- Add trigger to automatically update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_booking_drafts_updated_at 
    BEFORE UPDATE ON "booking_drafts" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT 'booking_drafts table created successfully' as status;
SELECT COUNT(*) as draft_count FROM "booking_drafts";
```

### Step 3: Execute the Script

1. Click "Run" in the SQL Editor
2. Verify the output shows "booking_drafts table created successfully"
3. Check that the draft_count is 0 (no existing drafts)

### Step 4: Verify Table Creation

Run this verification query:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'booking_drafts' 
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'booking_drafts';
```

## 🧪 Testing After Table Creation

### Test 1: Draft Creation
1. Fill out the booking form
2. Click "Sign up" in the login modal
3. Check browser console for success messages
4. Verify no 500 errors in network tab

### Test 2: Cross-Device Flow
1. Start booking on laptop
2. Sign up and get verification email
3. Verify email on phone
4. Check if booking form is pre-filled on phone

### Test 3: Database Verification
Run this query to check if drafts are being saved:

```sql
SELECT * FROM booking_drafts ORDER BY "createdAt" DESC LIMIT 5;
```

## 🔧 Additional Verification

### Check Database Connection
The database connection should work after the table is created. Test with:

```bash
# This should work after table creation
npx prisma db pull
```

### Check API Endpoints
Test the draft API endpoints:

1. **Create Draft**: `POST /api/bookings/drafts`
2. **Get Draft**: `GET /api/bookings/drafts/[id]`
3. **Merge Draft**: `POST /api/bookings/drafts/[id]/merge`

## 📊 Expected Results

After creating the table:

1. ✅ Drafts save successfully to the server
2. ✅ No more 500 errors when saving drafts
3. ✅ Cross-device draft preservation works
4. ✅ Auto-login restores draft data correctly
5. ✅ Booking form pre-fills after verification

## 🚨 Important Notes

1. **Backup First**: Always backup your database before making changes
2. **Test Thoroughly**: Test the complete flow after table creation
3. **Monitor Logs**: Watch for any errors after deployment
4. **User Impact**: This fix will resolve the draft preservation issue

## 🎯 Success Criteria

The fix is successful when:
- Users can save booking drafts without 500 errors
- Drafts are preserved across devices
- Auto-login restores the booking form correctly
- No more "starting over" after email verification

## 📞 Support

If you encounter any issues:
1. Check the Supabase logs for errors
2. Verify the table structure matches the schema
3. Test the API endpoints individually
4. Check browser console for client-side errors

---

**This table creation is the critical missing piece that will resolve the draft preservation issue.**
