# Step-by-Step Deployment Guide
## Booking Draft Preservation System

This guide will walk you through each step of deploying the booking draft preservation system to production.

---

## Step 1: Database Migration in Supabase

### 1.1 Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `ConnectSA-k9` (or your project name)

### 1.2 Navigate to SQL Editor
1. In the left sidebar, click **"SQL Editor"**
2. Click **"New query"** to create a new SQL script

### 1.3 Run the Migration Script
Copy and paste this SQL script into the editor:

```sql
-- Create booking_drafts table
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

### 1.4 Execute the Script
1. Click **"Run"** button (or press Ctrl+Enter)
2. Wait for the script to complete
3. Verify you see:
   - `booking_drafts table created successfully`
   - `draft_count: 0`

### 1.5 Verify Table Creation
1. Go to **"Table Editor"** in the left sidebar
2. Look for `booking_drafts` table
3. Click on it to verify the structure:
   - `id` (text, primary key)
   - `serviceId` (text)
   - `date` (text)
   - `time` (text)
   - `address` (text)
   - `notes` (text, nullable)
   - `userId` (text, nullable)
   - `expiresAt` (timestamp)
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

### 1.6 Check Indexes
1. In the table view, click **"Indexes"** tab
2. Verify you see:
   - `booking_drafts_userId_idx`
   - `booking_drafts_expiresAt_idx`

---

## Step 2: Manual Testing

### 2.1 Test Environment Setup
1. Open a **new incognito/private browser window**
2. Go to `https://app.proliinkconnect.co.za`
3. Clear any existing cookies/localStorage

### 2.2 Test Scenario 1: New User Signup Flow

#### Step 2.2.1: Start Booking
1. Navigate to `/book-service`
2. Fill out the booking form:
   - **Service**: Select any service
   - **Date**: Choose a future date
   - **Time**: Select any time
   - **Address**: Enter a test address
   - **Notes**: Add optional notes
3. Click **"Continue"** or proceed to provider selection

#### Step 2.2.2: Trigger Authentication
1. When prompted to log in, click **"Sign Up"**
2. Fill out the signup form:
   - **Name**: Test User
   - **Email**: Use a new email (e.g., `test+booking@example.com`)
   - **Password**: `testpassword123`
   - **Role**: Client
3. Click **"Sign Up"**

#### Step 2.2.3: Email Verification
1. Check your email for verification link
2. Click the verification link
3. **Expected Result**: You should be redirected to continue your booking

#### Step 2.2.4: Verify Data Preservation
1. Check if the booking form is pre-filled with your data
2. Verify all fields are preserved:
   - Service selection
   - Date and time
   - Address
   - Notes
3. **Expected Result**: All data should be preserved

### 2.3 Test Scenario 2: Existing User Login Flow

#### Step 2.3.1: Start New Booking
1. Open another incognito window
2. Go to `/book-service`
3. Fill out the booking form with different data
4. Click **"Continue"**

#### Step 2.3.2: Login with Existing User
1. When prompted to log in, click **"Sign In"**
2. Enter credentials for an existing user
3. Click **"Sign In"**

#### Step 2.3.3: Verify Data Preservation
1. Check if booking data is preserved
2. **Expected Result**: All data should be preserved

### 2.4 Test Scenario 3: Error Handling

#### Step 2.4.1: Network Failure Simulation
1. Start a booking
2. Disconnect internet
3. Try to continue
4. **Expected Result**: Graceful error handling

#### Step 2.4.2: Expired Draft Test
1. Create a draft
2. Wait for expiration (or manually set expiration)
3. Try to resume
4. **Expected Result**: Clear error message

### 2.5 Browser Console Monitoring
During testing, monitor the browser console for:
- `📝 Booking draft saved before login`
- `🔗 Attempting to merge draft`
- `✅ Successfully merged draft`
- `📖 Booking draft loaded`
- `🗑️ Booking draft cleared`

### 2.6 Test Results Documentation
Document your test results:
- [ ] New user signup flow works
- [ ] Existing user login flow works
- [ ] Data preservation works
- [ ] Error handling works
- [ ] No console errors
- [ ] Performance is acceptable

---

## Step 3: Production Deployment

### 3.1 Pre-Deployment Checklist
- [ ] Database migration completed
- [ ] Manual testing passed
- [ ] All code committed and pushed
- [ ] Dependencies installed
- [ ] Environment variables configured

### 3.2 Deploy to Production
1. **If using Vercel**:
   - Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project
   - Click **"Deploy"** or wait for automatic deployment

2. **If using other platforms**:
   - Follow your platform's deployment process
   - Ensure all files are deployed
   - Verify environment variables are set

### 3.3 Verify Deployment
1. Check deployment logs for errors
2. Verify all endpoints are accessible:
   - `https://app.proliinkconnect.co.za/api/bookings/drafts`
   - `https://app.proliinkconnect.co.za/booking/resume`
3. Test basic functionality

### 3.4 Environment Variables Check
Verify these environment variables are set in production:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

---

## Step 4: Verification and Monitoring

### 4.1 End-to-End Flow Verification

#### Step 4.1.1: Complete New User Flow
1. Open incognito window
2. Go to `https://app.proliinkconnect.co.za/book-service`
3. Complete the entire flow:
   - Fill booking form
   - Sign up
   - Verify email
   - Continue booking
   - Complete booking
4. **Expected Result**: Seamless experience with no data loss

#### Step 4.1.2: Complete Existing User Flow
1. Open incognito window
2. Go to `https://app.proliinkconnect.co.za/book-service`
3. Complete the entire flow:
   - Fill booking form
   - Sign in
   - Continue booking
   - Complete booking
4. **Expected Result**: Seamless experience with no data loss

### 4.2 Performance Monitoring
Monitor these metrics:
- **Page load times**: Should not increase significantly
- **API response times**: Should be under 500ms
- **Error rates**: Should be minimal
- **User completion rates**: Should improve

### 4.3 Database Monitoring
Check Supabase dashboard for:
- **Table usage**: `booking_drafts` table activity
- **Query performance**: Index usage
- **Storage usage**: Table size growth
- **Error logs**: Any database errors

### 4.4 User Experience Monitoring
Track these metrics:
- **Booking completion rate**: Should improve
- **User abandonment rate**: Should decrease
- **Support tickets**: Should decrease
- **User feedback**: Should be positive

### 4.5 Error Monitoring
Set up alerts for:
- **API errors**: 4xx/5xx responses
- **Database errors**: Connection issues
- **User flow failures**: Draft creation/retrieval failures
- **Performance issues**: Slow response times

---

## Step 5: Post-Deployment Tasks

### 5.1 Cleanup
1. Remove test data from database
2. Clean up any temporary files
3. Update documentation

### 5.2 Monitoring Setup
1. Set up monitoring dashboards
2. Configure alerts
3. Schedule regular health checks

### 5.3 Team Communication
1. Notify team of deployment
2. Share testing results
3. Update documentation
4. Schedule follow-up review

### 5.4 Success Metrics
Track these KPIs:
- **Booking completion rate**: Target 95%+
- **User satisfaction**: Monitor feedback
- **System reliability**: 99.9% uptime
- **Performance**: Response times under 500ms

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Database Connection Failed
**Symptoms**: Migration script fails
**Solutions**:
- Check database URL
- Verify network connectivity
- Check Supabase status

#### Issue: Draft Not Saved
**Symptoms**: User loses data after signup
**Solutions**:
- Check browser console for errors
- Verify API endpoints are working
- Check database connectivity

#### Issue: Draft Not Restored
**Symptoms**: User returns but form is empty
**Solutions**:
- Check draft ID in cookies
- Verify draft exists in database
- Check expiration status

#### Issue: Performance Issues
**Symptoms**: Slow page loads
**Solutions**:
- Check database indexes
- Monitor API response times
- Optimize queries

### Emergency Rollback
If issues occur:
1. **Disable draft system**: Comment out draft saving
2. **Revert to sessionStorage**: Use existing fallback
3. **Database cleanup**: Remove table if needed
4. **Code rollback**: Revert to previous version

---

## Success Criteria

The deployment is successful when:
- [ ] Database migration completed
- [ ] All test scenarios pass
- [ ] No errors in logs
- [ ] Performance is acceptable
- [ ] User experience is seamless
- [ ] Monitoring is in place
- [ ] Team is notified

---

## Support and Resources

### Documentation
- `BOOKING_DRAFT_PRESERVATION_IMPLEMENTATION_SUMMARY.md`
- `BOOKING_DRAFT_PRESERVATION_TEST_GUIDE.md`
- `DEPLOYMENT_CHECKLIST.md`

### Test Scripts
- `test-booking-draft-implementation.js`
- `scripts/test-booking-draft-flow.js`

### Database Scripts
- `create_booking_drafts_table.sql`
- `prisma/migrations/20250120000000_add_booking_drafts_table/migration.sql`

### Contact
For issues or questions, refer to the implementation documentation or contact the development team.
