# 📝 Add Supabase Storage Environment Variables

## Quick Setup

You need to add **3 new environment variables** to your `.env` file for image uploads to work.

---

## Step 1: Get Your Supabase Credentials

### Go to Supabase Dashboard:

1. Visit: https://supabase.com/dashboard
2. Select your project (the one with database `qdrktzqfeewwcktgltzy`)
3. Click **Settings** (gear icon) → **API**
4. Copy these values:

---

## Step 2: Add to .env File

Add these **3 lines** to your `.env` file:

```env
# Supabase Storage Configuration
NEXT_PUBLIC_SUPABASE_URL=https://qdrktzqfeewwcktgltzy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Where to Find:

**NEXT_PUBLIC_SUPABASE_URL:**
- In Supabase Dashboard → Settings → API
- Look for "Project URL"
- Format: `https://[project-ref].supabase.co`
- Your project ref appears to be: `qdrktzqfeewwcktgltzy`

**NEXT_PUBLIC_SUPABASE_ANON_KEY:**
- In Settings → API → "Project API keys"
- Find the **anon public** key
- Long string starting with `eyJ...`

**SUPABASE_SERVICE_ROLE_KEY:**
- In Settings → API → "Project API keys"
- Find the **service_role** key
- ⚠️ **SECRET** - Keep this private!
- Long string starting with `eyJ...`

---

## Step 3: Verify Format

Your `.env` should now have something like:

```env
# Existing database variables
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# New Supabase Storage variables
NEXT_PUBLIC_SUPABASE_URL=https://qdrktzqfeewwcktgltzy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmt0enFmZWV3d2NrdGdseHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDExMjM0NTYsImV4cCI6MjAxNjcwOTQ1Nn0...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmt0enFmZWV3d2NrdGdseHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMTEyMzQ1NiwiZXhwIjoyMDE2NzA5NDU2fQ...
```

---

## Step 4: Restart Dev Server

After adding the variables:

```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
# or
pnpm dev
```

---

## Step 5: Verify

Run the verification script:

```bash
npx tsx scripts/verify-supabase-storage-setup.ts
```

Or test manually:
1. Log in as provider
2. Go to Catalogue → Create/Edit item
3. Try uploading an image

---

## Next: Create Storage Bucket

After adding environment variables, you'll need to:
1. Create `catalogue-images` bucket in Supabase
2. Set up storage policies

See `SUPABASE_SETUP_WALKTHROUGH.md` for complete instructions.

