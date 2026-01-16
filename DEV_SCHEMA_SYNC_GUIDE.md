# 🔄 Development Database Schema Sync Guide

## Overview

Your development Supabase database has empty tables, which is **correct and expected**. Development should have separate data from production.

However, you need the **schema** (table structure) to match production so your application works correctly.

---

## ✅ What This Does

This syncs the **schema** (structure) from production to development:
- ✅ Creates all tables
- ✅ Creates all columns
- ✅ Creates all relationships
- ✅ Creates all indexes and constraints
- ❌ Does NOT copy data (tables remain empty)

---

## 🚀 Quick Start

### Option 1: Use the Sync Script (Recommended)

```bash
# Make sure you're using development environment
NODE_ENV=development node scripts/sync-dev-schema.js
```

Or if `.env.development` is already loaded:

```bash
node scripts/sync-dev-schema.js
```

### Option 2: Use Prisma Migrate Directly

```bash
# Generate Prisma client
npm run db:generate

# Apply all migrations to development database
npm run db:migrate:deploy
```

---

## 📋 Step-by-Step Process

### Step 1: Verify Environment

The script will automatically check:
- ✅ `NODE_ENV=development`
- ✅ `DATABASE_URL` points to development database (not production)
- ✅ Database is accessible

### Step 2: Apply Migrations

The script will:
1. Generate Prisma client
2. Apply all pending migrations
3. Create all tables and schema

### Step 3: Verify Schema

The script will verify that:
- All tables exist
- Schema matches Prisma schema

---

## 🔍 What Gets Created

After running the sync, your development database will have:

### Core Tables
- `User` - User accounts
- `Provider` - Service providers
- `Service` - Available services
- `Booking` - Bookings
- `Payment` - Payment records
- `Review` - Provider reviews
- `Notification` - User notifications

### Supporting Tables
- `ServiceCategory` - Service categories
- `CatalogueItem` - Provider catalogue items
- `VerificationToken` - Email verification tokens
- `AdminAuditLog` - Admin action logs
- `Transfer` - Payment transfers
- `BookingDraft` - Draft bookings

### All Relationships
- Foreign keys
- Indexes
- Constraints
- Enums

---

## ⚠️ Important Notes

### 1. Empty Tables Are Correct

After syncing, your tables will be **empty**. This is correct:
- ✅ Development should have separate data
- ✅ You'll create test data as needed
- ✅ Production data stays in production

### 2. Schema Only, Not Data

This process:
- ✅ Creates table structure
- ✅ Creates columns and types
- ✅ Creates relationships
- ❌ Does NOT copy production data

### 3. Safe to Run Multiple Times

You can run this script multiple times:
- ✅ It only applies pending migrations
- ✅ Won't duplicate tables
- ✅ Won't affect existing data

---

## 🧪 After Schema Sync

### 1. Verify Tables Exist

```bash
# Open Prisma Studio to view tables
npx prisma studio
```

### 2. Create Test Data

You can:
- Use your application to create test data
- Use Prisma Studio to manually add data
- Create a seed script for test data

### 3. Test Your Application

```bash
npm run dev
```

Your application should now work with the development database.

---

## 🔧 Troubleshooting

### Issue: "Migration already applied"

**Solution**: This is normal. The script only applies pending migrations.

### Issue: "Cannot connect to database"

**Solution**: 
1. Verify `DATABASE_URL` in `.env.development`
2. Check database is accessible
3. Verify network connection

### Issue: "Permission denied"

**Solution**: 
1. Verify database user has CREATE TABLE permissions
2. Check Supabase project settings
3. Verify connection string is correct

### Issue: "Schema mismatch"

**Solution**:
1. Run `npx prisma db pull` to sync Prisma schema
2. Create new migration if needed: `npx prisma migrate dev`
3. Apply migration: `npx prisma migrate deploy`

---

## 📝 Manual Alternative

If the script doesn't work, you can manually sync:

```bash
# 1. Generate Prisma client
npx prisma generate

# 2. Push schema to database (creates tables)
npx prisma db push

# OR apply migrations
npx prisma migrate deploy
```

---

## ✅ Verification Checklist

After running the sync:

- [ ] All tables exist in development database
- [ ] Tables are empty (no data)
- [ ] Application connects to development database
- [ ] No errors when running `npm run dev`
- [ ] Can create test data in development

---

## 🎯 Summary

**What you have now:**
- ✅ Development database with correct schema
- ✅ Empty tables (ready for test data)
- ✅ Isolated from production data

**What to do next:**
1. ✅ Run your application: `npm run dev`
2. ✅ Create test data as needed
3. ✅ Develop and test features
4. ✅ Production data remains untouched

---

**Status**: Ready to sync schema
**Next Step**: Run `node scripts/sync-dev-schema.js`
