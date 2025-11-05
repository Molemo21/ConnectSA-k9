# 🚀 Supabase Storage Setup Walkthrough

Follow this step-by-step guide to set up Supabase Storage for catalogue image uploads.

---

## Step 1: Get Your Supabase Credentials

### 1.1 Go to Supabase Dashboard
1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Log in to your account
3. Select your project (the one you're using for ConnectSA)

### 1.2 Get API Keys
1. In your project dashboard, click **Settings** (gear icon in left sidebar)
2. Click **API** in the settings menu
3. You'll see several sections:

#### Copy These Values:

**Project URL:**
- Located under "Project URL"
- Example: `https://abcdefghijklmnop.supabase.co`
- Copy this → `NEXT_PUBLIC_SUPABASE_URL`

**anon/public key:**
- Located under "Project API keys" → **anon public**
- This is a long string starting with `eyJ...`
- Copy this → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**service_role key:**
- Located under "Project API keys" → **service_role**
- ⚠️ **SECRET KEY** - Keep this private!
- Copy this → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Add Environment Variables

### 2.1 Create/Edit .env.local
1. In your project root, create or open `.env.local`
2. Add these three lines (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 Restart Your Dev Server
After adding the variables:
```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
# or
pnpm dev
```

---

## Step 3: Create Storage Bucket

### 3.1 Navigate to Storage
1. In Supabase Dashboard, click **Storage** in the left sidebar
2. You should see a list of buckets (might be empty)

### 3.2 Create New Bucket
1. Click **New bucket** button (top right)
2. Fill in the form:
   - **Name**: `catalogue-images` (exactly this name)
   - **Public bucket**: ✅ **Toggle ON** (this is important!)
   - **File size limit**: Leave default or set to 5242880 (5MB)
   - **Allowed MIME types**: Leave empty (or add: `image/jpeg,image/jpg,image/png,image/webp`)
3. Click **Create bucket**

### 3.3 Verify Bucket Created
- You should now see `catalogue-images` in your buckets list
- The bucket should show a "Public" badge

---

## Step 4: Set Up Storage Policies

### Option A: Using SQL Editor (Recommended)

1. In Supabase Dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Paste the following SQL:

```sql
-- Policy 1: Public read access
CREATE POLICY "Public read access for catalogue images"
ON storage.objects FOR SELECT
USING (bucket_id = 'catalogue-images');

-- Policy 2: Authenticated upload
CREATE POLICY "Authenticated users can upload catalogue images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'catalogue-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: User delete own files
CREATE POLICY "Users can delete own catalogue images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'catalogue-images'
  AND (
    (storage.foldername(name))[1] = 'providers' 
    AND auth.uid()::text = (storage.foldername(name))[2]
  )
);
```

4. Click **Run** (or press Ctrl+Enter)
5. You should see "Success. No rows returned"

### Option B: Using Policy Editor (Visual)

1. Go to **Storage** → **Policies**
2. Select `catalogue-images` bucket
3. Click **New Policy**
4. For each policy:
   - **Policy 1 (Read)**: 
     - Name: "Public read access for catalogue images"
     - Allowed operation: SELECT
     - Target roles: public
     - USING expression: `bucket_id = 'catalogue-images'`
   
   - **Policy 2 (Insert)**:
     - Name: "Authenticated users can upload catalogue images"
     - Allowed operation: INSERT
     - Target roles: authenticated
     - WITH CHECK expression: `bucket_id = 'catalogue-images' AND auth.role() = 'authenticated'`
   
   - **Policy 3 (Delete)**:
     - Name: "Users can delete own catalogue images"
     - Allowed operation: DELETE
     - Target roles: authenticated
     - USING expression: (see SQL above)

---

## Step 5: Verify Setup

### 5.1 Run Verification Script

```bash
# Using tsx (if installed)
npx tsx scripts/verify-supabase-storage-setup.ts

# Or using ts-node
npx ts-node scripts/verify-supabase-storage-setup.ts
```

### 5.2 Manual Test

1. **Start your dev server** (if not running)
2. **Log in as a provider**
3. **Go to Dashboard** → **Catalogue**
4. **Create or edit a service package**
5. **Try uploading an image**:
   - Drag and drop an image
   - Or click to select a file
6. **Check if upload succeeds**:
   - You should see upload progress
   - Image should appear in preview grid
   - No error messages

### 5.3 Check Storage

1. Go to Supabase Dashboard → **Storage** → **catalogue-images**
2. After uploading, you should see:
   - Folder structure: `providers/` → `{providerId}/` → `catalogue/` → `{itemId}/` → `images`
3. Click on an image to verify it's accessible

---

## Step 6: Test in Client Discovery

1. **Log out** of provider account
2. **Go to book-service page**
3. **Select a service** that has catalogue items with images
4. **Browse providers** - you should see:
   - ✅ Images in provider cards
   - ✅ Thumbnails in service selector
   - ✅ Images in catalogue modal
   - ✅ Images in portfolio/work tab

---

## Troubleshooting

### ❌ "NEXT_PUBLIC_SUPABASE_URL environment variable is required"
- **Fix**: Add the environment variables to `.env.local`
- **Verify**: Restart your dev server after adding

### ❌ "Bucket not found" or Upload fails
- **Fix**: Create the bucket named exactly `catalogue-images`
- **Verify**: Bucket is set to Public

### ❌ "Unauthorized" when uploading
- **Fix**: Check storage policies are set correctly
- **Verify**: Provider is logged in and approved

### ❌ Images not displaying
- **Fix**: Verify bucket is Public
- **Check**: Image URLs in database are correct
- **Verify**: CORS settings (usually not needed for public buckets)

### ❌ "File too large"
- **Fix**: Upload images under 5MB
- **Note**: This is the default limit

---

## Success Checklist

- [ ] Environment variables added to `.env.local`
- [ ] Dev server restarted
- [ ] `catalogue-images` bucket created
- [ ] Bucket set to Public
- [ ] Storage policies created (3 policies)
- [ ] Verification script passes
- [ ] Can upload images in catalogue form
- [ ] Images visible in Supabase Storage
- [ ] Images display in client discovery

---

## Next Steps After Setup

Once everything is working:

1. ✅ **Test with multiple images**
2. ✅ **Test editing existing catalogue items**
3. ✅ **Verify images display correctly in all discovery views**
4. ✅ **Test with different image formats (JPG, PNG, WEBP)**

---

## Need Help?

- Check `SUPABASE_STORAGE_SETUP.md` for detailed documentation
- Check `CATALOGUE_IMAGE_UPLOAD_IMPLEMENTATION.md` for technical details
- Review Supabase Storage docs: https://supabase.com/docs/guides/storage

---

**You're all set! 🎉**

Once setup is complete, providers can upload images and they'll automatically display in the client discovery flow.

