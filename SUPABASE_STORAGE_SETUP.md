# 📸 Supabase Storage Setup Guide

This guide will help you set up Supabase Storage for catalogue image uploads.

## Prerequisites

- Supabase account and project
- Access to Supabase Dashboard
- Environment variables configured

---

## Step 1: Environment Variables

Add the following variables to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### How to Get These Values

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

---

## Step 2: Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click **New bucket**
3. Configure:
   - **Name**: `catalogue-images`
   - **Public bucket**: ✅ **Yes** (enables public read access)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`
4. Click **Create bucket**

---

## Step 3: Set Up Storage Policies

Go to **Storage** → **Policies** and create the following policies:

### Policy 1: Public Read Access

```sql
-- Allow public read access to catalogue images
CREATE POLICY "Public read access for catalogue images"
ON storage.objects FOR SELECT
USING (bucket_id = 'catalogue-images');
```

### Policy 2: Authenticated Upload

```sql
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload catalogue images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'catalogue-images' 
  AND auth.role() = 'authenticated'
);
```

### Policy 3: User Can Delete Own Files

```sql
-- Allow users to delete their own uploaded files
CREATE POLICY "Users can delete own catalogue images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'catalogue-images'
  AND (
    -- Users can delete files in their provider folder
    (storage.foldername(name))[1] = 'providers' 
    AND auth.uid()::text = (storage.foldername(name))[2]
  )
);
```

### Alternative: Using SQL Editor

If you prefer using the SQL Editor:

1. Go to **SQL Editor** in Supabase Dashboard
2. Create a new query
3. Paste the policies above
4. Run the query

---

## Step 4: Verify Setup

### Test Upload Endpoint

You can test the upload endpoint using curl:

```bash
curl -X POST http://localhost:3000/api/upload/catalogue-image \
  -H "Cookie: auth-token=your-auth-token" \
  -F "file=@/path/to/image.jpg"
```

### Check Storage

1. Go to **Storage** → **catalogue-images** bucket
2. Verify folder structure: `providers/{providerId}/catalogue/{itemId}/`
3. Verify images are accessible via public URLs

---

## File Structure

Images are stored in the following structure:

```
catalogue-images/
└── providers/
    └── {providerId}/
        └── catalogue/
            └── {catalogueItemId}/
                └── {timestamp}-{randomId}-{filename}
```

**Example:**
```
catalogue-images/
└── providers/
    └── clx1234567890abcdef/
        └── catalogue/
            └── clx9876543210fedcba/
                └── 1703123456789-abc123-service-photo.jpg
```

---

## Security Considerations

1. **Service Role Key**: Never expose this in client-side code. It's only used server-side.

2. **File Validation**: 
   - Allowed types: JPEG, PNG, WEBP
   - Max size: 5MB per file
   - Max images: 10 per catalogue item

3. **Authentication**: Only authenticated providers can upload images.

4. **Provider Verification**: API verifies that:
   - User is authenticated
   - User is a provider
   - Provider is approved
   - Catalogue item belongs to provider (if editing)

---

## Troubleshooting

### Upload Fails with 401

- Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Verify user is authenticated and is a provider

### Upload Fails with 403

- Verify provider status is `APPROVED`
- Check storage policies are correctly configured

### Images Not Displaying

- Verify bucket is set to **Public**
- Check public URL is correct
- Verify CORS settings (if applicable)

### Storage Quota Issues

- Check your Supabase plan limits
- Consider implementing image optimization/compression
- Set up automatic cleanup of unused images

---

## Next Steps

1. ✅ Set environment variables
2. ✅ Create storage bucket
3. ✅ Set up storage policies
4. ✅ Test upload functionality
5. ✅ Verify images display in catalogue

---

## Support

If you encounter issues:

1. Check Supabase Dashboard logs
2. Verify environment variables
3. Check browser console for errors
4. Review API route logs

For more information, see:
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)

