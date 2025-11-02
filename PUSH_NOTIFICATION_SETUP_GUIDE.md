# 🚀 Push Notification Setup - Manual Migration Guide

## ✅ **Completed Steps**

1. ✅ VAPID keys generated
2. ✅ Environment variables documented (see below)
3. ✅ Manual SQL migration file created

---

## 📋 **Quick Setup Checklist**

### **Step 1: Add Environment Variables**

Add these to your `.env` file (since you use it for both local and production):

```bash
# Push Notification Configuration (VAPID Keys)
VAPID_PUBLIC_KEY=BI8FXYUY-ou7O-jA_09Hr3sFSGqtv8otywbd__8oOzK1qoH_HKLwD_vCdUg7B2C9RFMttH9tqtC7cB4VCdIUjmE
VAPID_PRIVATE_KEY=8bJEFcSVkoCfIok3oYjVh29oqQLOkozttuotsqYDCvI
VAPID_SUBJECT=mailto:support@app.proliinkconnect.co.za

# Application URL (for email/push notification links)
# For local development:
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production, update to:
# NEXT_PUBLIC_APP_URL=https://app.proliinkconnect.co.za
```

**Note:** Since `.env*` files are gitignored, it's safe to add secrets here. For production deployment, make sure to:
- Set these same variables in your deployment platform (Vercel, etc.)
- Update `NEXT_PUBLIC_APP_URL` to your production URL in the platform's environment variables

---

### **Step 2: Run Manual Database Migration**

#### **Option A: Supabase SQL Editor** (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → SQL Editor
2. Open `migrations/manual-add-push-subscriptions.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click "Run" or press `Ctrl+Enter`

#### **Option B: Direct psql Connection**

```bash
psql $DATABASE_URL < migrations/manual-add-push-subscriptions.sql
```

Or if using DIRECT_URL:
```bash
psql $DIRECT_URL < migrations/manual-add-push-subscriptions.sql
```

---

### **Step 3: Verify & Regenerate Prisma Client**

```bash
# Verify table was created correctly
node scripts/verify-push-subscriptions-table.js

# Mark migration as applied & regenerate Prisma client
node scripts/mark-push-migration-applied.js
```

The second script will automatically:
- ✅ Check table exists
- ✅ Mark migration in Prisma history
- ✅ Regenerate Prisma client with `PushSubscription` model

---

### **Step 4: Test the System**

#### **Test Email Notifications:**
1. Start dev server: `pnpm dev`
2. Visit `http://localhost:3000/health`
3. Use the test email form
4. Check your inbox

#### **Test Push Notifications:**
1. Visit `http://localhost:3000`
2. Wait 3 seconds for push notification prompt
3. Click "Enable Notifications"
4. Grant browser permission
5. Trigger a booking event (e.g., accept booking)
6. Check for push notification

#### **Test In-App Notifications:**
- Already working! Check the bell icon (🔔) in header

---

## 🔍 **Verification**

### **Check Database Table:**
```sql
-- Verify table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'push_subscriptions';

-- Check structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'push_subscriptions';
```

### **Check Prisma Client:**
```bash
pnpm exec prisma studio
# Navigate to PushSubscription model
```

---

## 📁 **Files Created**

- ✅ `migrations/manual-add-push-subscriptions.sql` - SQL migration
- ✅ `scripts/verify-push-subscriptions-table.js` - Verification script
- ✅ `scripts/mark-push-migration-applied.js` - Mark migration as applied

---

## 🎯 **What's Next?**

After completing these steps:

1. **All 3 notification channels will be active:**
   - ✅ In-app notifications (working)
   - ✅ Email notifications (working)
   - ✅ Push notifications (ready after migration)

2. **All 9 booking endpoints will send multi-channel notifications:**
   - Booking created
   - Booking accepted
   - Booking declined
   - Payment received
   - Job started
   - Job completed
   - Payment released
   - Review submitted
   - Dispute created

---

## 🆘 **Troubleshooting**

### **"Table already exists" error:**
- Safe to ignore if using `CREATE TABLE IF NOT EXISTS`
- Table is already created, skip to Step 3

### **"Prisma client not recognizing PushSubscription":**
- Run: `pnpm exec prisma generate`
- Restart dev server: `pnpm dev`

### **"Migration taking too long":**
- You're already using manual approach ✅
- Just run the SQL directly

---

## ✅ **Success Criteria**

You're done when:
- ✅ `.env` file has VAPID keys added
- ✅ Database has `push_subscriptions` table created
- ✅ Prisma client regenerated (includes `PushSubscription` model)
- ✅ `/health` page shows all services OK
- ✅ Test email received successfully
- ✅ Push notification prompt appears on site (after 3 seconds)

**That's it! The notification system is production-ready! 🎉**

---

## 🚀 **Production Deployment Reminder**

Before deploying to production:

1. **Set environment variables in your deployment platform:**
   - Vercel: Project Settings → Environment Variables
   - Add all 4 variables: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_APP_URL`

2. **Update `NEXT_PUBLIC_APP_URL` to your production domain:**
   ```
   NEXT_PUBLIC_APP_URL=https://app.proliinkconnect.co.za
   ```

3. **Run the SQL migration in your production database** (if not already done)

4. **Verify push notifications work** on production domain (HTTPS required for push)

