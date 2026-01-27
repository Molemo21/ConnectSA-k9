# 🚀 Quick Fix: Enable RLS to Resolve Security Warnings

## The Problem

You're seeing **22 security warnings** in your Supabase dashboard about tables not having Row Level Security (RLS) enabled. This is a security risk.

## The Solution

Run the SQL script to enable RLS on all tables. This takes **2 minutes**.

## Steps

### 1. Open Supabase SQL Editor
- Go to your Supabase Dashboard
- Click **SQL Editor** (left sidebar)
- Click **New query**

### 2. Run the Script
- Open: `scripts/enable-rls-policies.sql`
- Copy the entire file contents
- Paste into SQL Editor
- Click **Run** (or press `Ctrl+Enter`)

### 3. Verify It Worked
Run this query:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

You should see all your tables listed.

## What This Does

✅ Enables RLS on all 22 tables  
✅ Creates security policies for each table  
✅ Protects sensitive data (passwords, tokens)  
✅ Allows users to access only their own data  
✅ Makes public data (services, categories) readable by all  
✅ Restricts financial data (payments, payouts) to owners  

## Important Notes

- **Your API will still work** - Prisma uses service role which bypasses RLS (this is correct)
- **RLS protects against** direct SQL access and Supabase REST API
- **You must still** exclude password fields in your API code (RLS doesn't hide columns)

## After Running

The security warnings in your Supabase dashboard should disappear. If they don't:
1. Refresh the dashboard
2. Check that all policies were created (see verification query above)
3. Review `RLS_SECURITY_SETUP.md` for detailed troubleshooting

## Need More Details?

See `RLS_SECURITY_SETUP.md` for:
- Detailed policy explanations
- Security best practices
- Troubleshooting guide
- Policy customization

---

**Time to fix**: ~2 minutes  
**Impact**: Resolves all 22 security warnings  
**Risk**: Low (your API uses service role, so it won't break)
