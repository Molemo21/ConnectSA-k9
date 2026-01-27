# 🔒 Row Level Security (RLS) Setup Guide

## 📋 Overview

This guide explains how to enable Row Level Security (RLS) on your Supabase database to address the security warnings you're seeing. RLS is a PostgreSQL feature that controls access to individual rows in tables based on policies.

## ⚠️ Why This Matters

The warnings you're seeing indicate that:
1. **Sensitive data is exposed**: Tables like `users` (with passwords) and token tables are accessible without proper restrictions
2. **No access control**: Anyone with database access could potentially read/modify any data
3. **Compliance risk**: Without RLS, you may not meet security standards for handling user data

## 🎯 What RLS Does

RLS adds an extra layer of security by:
- **Restricting row access**: Users can only see/modify rows they're allowed to
- **Protecting sensitive data**: Prevents unauthorized access to passwords, tokens, financial data
- **Enforcing business rules**: Ensures users can only access their own bookings, payments, etc.
- **Defense in depth**: Even if your API has bugs, RLS provides database-level protection

## ⚙️ How It Works With Your Setup

**Important**: You're using **Prisma with direct database connections** (service role). This means:

1. **Your API routes bypass RLS** when using Prisma with service role key (this is expected and correct)
2. **RLS still protects** against:
   - Direct SQL access to your database
   - Supabase REST API access (if enabled)
   - Accidental exposure through Supabase dashboard
   - Future changes to your architecture

3. **Your application layer** (API routes) should still:
   - Never return password fields
   - Validate user permissions
   - Use service role key for backend operations

## 🚀 How to Apply RLS

### Step 1: Run the SQL Script

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New query**
4. Open the file: `scripts/enable-rls-policies.sql`
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click **Run** (or press `Ctrl+Enter`)

### Step 2: Verify RLS is Enabled

Run this query to check which tables have RLS enabled:

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

### Step 3: Verify Policies are Created

Run this query to see all policies:

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

You should see policies for all tables.

## 📊 Policy Summary

### 🔐 Sensitive Tables (Users, Tokens)

| Table | Policy | Access |
|-------|--------|--------|
| `users` | Users can view own profile | Users see only their own data |
| `users` | Public can view approved providers | Public can see provider user info (for discovery) |
| `VerificationToken` | Users manage own tokens | Users can only access their own tokens |
| `PasswordResetToken` | Users manage own tokens | Users can only access their own tokens |

### 💼 Business Logic Tables

| Table | Policy | Access |
|-------|--------|--------|
| `bookings` | Users view own bookings | Clients see their bookings, providers see assigned bookings |
| `payments` | Users view own payments | Users see payments for their bookings |
| `payouts` | Providers view own payouts | Providers see only their payouts |
| `reviews` | Public can view reviews | Reviews are public, but only users can create for own bookings |
| `notifications` | Users view own notifications | Users see only their notifications |

### 🌐 Public Tables

| Table | Policy | Access |
|-------|--------|--------|
| `services` | Public can view active services | Anyone can see active services |
| `service_categories` | Public can view active categories | Anyone can see active categories |
| `providers` | Public can view approved providers | Anyone can see approved providers |
| `catalogue_items` | Public can view active items | Anyone can see active catalogue items |

### 🔒 Admin-Only Tables

| Table | Policy | Access |
|-------|--------|--------|
| `webhook_events` | Service role only | Only backend (service role) can access |
| `database_metadata` | Service role only | Only backend (service role) can access |
| `_prisma_migrations` | Service role only | Only backend (service role) can access |
| `ProviderReview` | Service role only | Admin reviews accessible only via service role |

## 🛡️ Security Best Practices

### 1. Never Expose Passwords

Even with RLS, **your API routes must never return password fields**. RLS protects rows, but you should exclude sensitive columns in your application code:

```typescript
// ✅ CORRECT - Exclude password
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    name: true,
    // password: false - NEVER include
  }
})
```

### 2. Use Service Role for Backend Operations

Your API routes should use the service role key (which bypasses RLS) for backend operations:

```typescript
// ✅ CORRECT - Service role bypasses RLS for backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key
)
```

### 3. Validate Permissions in Application Layer

RLS is defense in depth, but you should still validate permissions in your API:

```typescript
// ✅ CORRECT - Validate permissions
if (booking.clientId !== userId && booking.provider.userId !== userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```

## 🔍 Troubleshooting

### Issue: "Permission denied" errors after enabling RLS

**Solution**: This is expected if you're trying to access data without proper authentication. Make sure:
1. Your API routes use service role key
2. Policies allow the access you need
3. User authentication is working correctly

### Issue: Can't see data in Supabase dashboard

**Solution**: The dashboard uses anon key, which is restricted by RLS. Use the SQL Editor with service role or adjust policies if needed for admin access.

### Issue: Policies are too restrictive

**Solution**: You can modify policies in the SQL Editor. The script includes comments explaining each policy.

## 📝 Policy Customization

If you need to modify policies:

1. **View existing policies**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

2. **Drop a policy**:
```sql
DROP POLICY "policy_name" ON public.your_table;
```

3. **Create a new policy**:
```sql
CREATE POLICY "policy_name" ON public.your_table
  FOR SELECT
  USING (your_condition);
```

## ✅ Verification Checklist

After applying RLS, verify:

- [ ] All tables show `rowsecurity = true`
- [ ] Policies are created for all tables
- [ ] Your API routes still work (they use service role)
- [ ] Users can only access their own data
- [ ] Public data (services, categories) is accessible
- [ ] Sensitive data (passwords, tokens) is protected
- [ ] No security warnings in Supabase dashboard

## 🎓 Understanding the Warnings

The original warnings you saw were:

1. **"Table exposed via API without RLS"**: Now fixed - RLS is enabled
2. **"Contains potentially sensitive column(s)"**: Policies restrict access, but you must also exclude these columns in your API
3. **"RLS has not been enabled"**: Now fixed - RLS is enabled on all tables

## 🔗 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Prisma + Supabase Best Practices](https://www.prisma.io/docs/guides/database/supabase)

## ⚠️ Important Notes

1. **RLS doesn't replace application-level security** - It's an additional layer
2. **Service role bypasses RLS** - This is intentional for backend operations
3. **Test thoroughly** - After enabling RLS, test all your API endpoints
4. **Monitor for issues** - Watch for permission errors in production
5. **Keep policies updated** - As your app grows, update policies accordingly

---

**Next Steps**: After applying RLS, the security warnings in your Supabase dashboard should disappear. If they persist, check that all policies were created successfully.
