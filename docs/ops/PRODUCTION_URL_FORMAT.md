# 📋 Production Database URL Format Required

## What I Need From You

I need **TWO** connection strings from your **PRODUCTION** Supabase project:

---

## 1. **DATABASE_URL** (Connection Pooling)

**Where to find it:**
- Supabase Dashboard → Your **Production Project** → Settings → Database
- Look for **"Connection string"** or **"Connection pooling"**
- Select **"URI"** format (not JDBC or other formats)

**Format should look like:**
```
postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-X-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**OR:**
```
postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-X-eu-west-1.pooler.supabase.com:6543/postgres
```

**Key indicators:**
- Contains `pooler.supabase.com` or `pooler`
- Port is usually `6543` (pooler) or `5432` (direct)
- May have `?pgbouncer=true` parameter

---

## 2. **DIRECT_URL** (Direct Connection)

**Where to find it:**
- Same location: Supabase Dashboard → Production Project → Settings → Database
- Look for **"Direct connection"** or **"Connection string (direct)"**
- Select **"URI"** format

**Format should look like:**
```
postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-X-eu-west-1.pooler.supabase.com:5432/postgres
```

**OR:**
```
postgresql://postgres.xxxxx:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

**Key indicators:**
- Port is usually `5432` (direct connection)
- May have `db.xxxxx.supabase.co` instead of `pooler.supabase.com`
- NO `pgbouncer=true` parameter

---

## 📸 Visual Guide

In Supabase Dashboard, you should see something like:

```
Connection string
┌─────────────────────────────────────────────────────────┐
│ URI                                                     │
│ postgresql://postgres.xxxxx:password@host:port/db      │
│                                                         │
│ [Copy] button                                           │
└─────────────────────────────────────────────────────────┘

Connection pooling
┌─────────────────────────────────────────────────────────┐
│ URI                                                     │
│ postgresql://postgres.xxxxx:password@host:port/db      │
│                                                         │
│ [Copy] button                                           │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ What to Send Me

Please send me **BOTH** URLs in this format:

```
DATABASE_URL=postgresql://postgres.xxxxx:password@host:port/db?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxxxx:password@host:port/db
```

**OR** just the URLs themselves:
```
postgresql://postgres.xxxxx:password@host:port/db?pgbouncer=true
postgresql://postgres.xxxxx:password@host:port/db
```

---

## 🔒 Security Note

- These URLs contain your database password
- I will only use them for **READ-ONLY introspection** (safe)
- They will **NOT** be saved to any files
- They will only be used temporarily in environment variables

---

## ⚠️ Important

Make sure you're copying from your **PRODUCTION** project, not development!

**How to verify:**
- Production project name might be different (e.g., "Proliink-prod" vs "Proliink-dev")
- Production URL might have different host/region
- Check the project name in Supabase dashboard

---

## 📝 Example (Don't Use This - Get Your Own)

```
DATABASE_URL=postgresql://postgres.abc123:MyPassword123@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.abc123:MyPassword123@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

---

## 🎯 Once You Send These

I will:
1. ✅ Verify they're production (not dev)
2. ✅ Use them for READ-ONLY introspection
3. ✅ Pull production schema into `schema.prisma`
4. ✅ Continue with realignment

**Ready when you are!** 🚀
