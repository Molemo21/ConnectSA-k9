# 🧪 Test Onboarding Document Upload

## Quick Test Guide

Follow these steps to verify the upload functionality is working:

---

## ✅ Pre-Test Checklist

- [x] Environment variables set (verified ✓)
- [ ] `provider-documents` bucket created
- [ ] Storage policies set up
- [ ] Dev server running

---

## 🧪 Test Steps

### Step 1: Restart Dev Server

If your dev server is running, restart it to ensure new environment variables are loaded:

```bash
# Stop server (Ctrl+C)
npm run dev
# or
pnpm dev
```

### Step 2: Test Document Upload

1. **Log in as a provider** (or sign up as provider)
2. **Navigate to Provider Onboarding**
   - URL: `/provider/onboarding` or `/become-provider`
3. **Go to Documents step** (Step 4)
4. **Upload ID Document**:
   - Click "Choose File" or drag & drop
   - Select an image (JPEG/PNG) or PDF
   - Wait for upload progress
   - ✅ Should see "File uploaded successfully"
   - ✅ Green checkmark should appear

5. **Upload Proof of Address**:
   - Same process as above
   - ✅ Should upload successfully

6. **Upload Certification** (optional):
   - Click "Add Certification"
   - Upload a file
   - ✅ Should upload successfully

7. **Upload Profile Image** (optional):
   - Click "Add Profile Image"
   - Upload an image
   - ✅ Should upload successfully

### Step 3: Verify in Supabase

1. Go to Supabase Dashboard → **Storage** → **provider-documents**
2. You should see:
   - Folder: `providers/`
   - Inside: `{providerId}/`
   - Inside: `onboarding/`
   - Inside: `id-document/`, `proof-of-address/`, etc.
   - Your uploaded files

### Step 4: Test Form Submission

1. Complete the onboarding form
2. Submit the form
3. ✅ Should submit successfully
4. ✅ Documents should be saved in database

---

## 🔍 What to Look For

### ✅ Success Indicators:
- Upload progress shows (spinner/loading)
- "File uploaded successfully" toast message
- Green checkmark appears after upload
- File appears in form state
- No errors in browser console
- Files visible in Supabase Storage

### ❌ Error Indicators:
- "Upload failed" message
- Error in browser console
- 500 status in Network tab
- Files not appearing in Supabase Storage

---

## 🐛 Common Issues & Fixes

### Issue: "Provider record not found"
**Fix:** Provider record is auto-created, but if it persists:
- Complete onboarding step by step
- Ensure you're logged in as provider

### Issue: "Unauthorized"
**Fix:**
- Check you're logged in
- Verify user role is PROVIDER
- Check auth token in cookies

### Issue: "Bucket not found"
**Fix:**
- Verify bucket name is exactly `provider-documents`
- Check bucket exists in Supabase Dashboard

### Issue: Upload fails silently
**Fix:**
- Check browser console for errors
- Check Network tab for API response
- Verify storage policies are set correctly

---

## 📊 Expected Results

### Network Tab (Browser DevTools)
- **Request**: `POST /api/upload/onboarding-document`
- **Status**: `200 OK`
- **Response**: 
```json
{
  "success": true,
  "url": "https://...signed-url...",
  "signedUrl": "https://...signed-url...",
  "path": "providers/{providerId}/onboarding/...",
  "expiresAt": "2024-..."
}
```

### Supabase Storage
- Files stored in `provider-documents` bucket
- Folder structure matches expected pattern
- Files are accessible (not publicly, but via signed URLs)

---

## ✅ Test Complete When:

- [x] Can upload ID document
- [x] Can upload proof of address
- [x] Can upload certifications (multiple)
- [x] Can upload profile images (multiple)
- [x] Files appear in Supabase Storage
- [x] Form submission works
- [x] No errors in console
- [x] Upload progress shows correctly

---

## 🎉 Success!

If all tests pass, your onboarding document upload is fully functional!

**Next:** You can now use the onboarding flow with real document uploads.

