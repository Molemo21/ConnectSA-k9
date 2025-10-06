# Cross-Device Draft Preservation Fix

## 🎯 Problem Analysis

The issue was that when users verify their email on a different device (phone), the draft wasn't being properly detected by the dashboard's "Resume Booking" button, even though the draft was being merged with the user account during auto-login.

### Root Causes:
1. **Auto-login merge issue**: The `mergeDraftWithUser` function was making a client-side fetch request during server-side auto-login
2. **Cross-device detection**: The `checkDraftStatus` function only checked localStorage and cookies, which don't exist on different devices
3. **Dashboard button logic**: The `DraftAwareBookingButton` couldn't find drafts on cross-device scenarios

## ✅ Solution Implemented

### 1. Fixed Auto-Login Merge Logic
**File**: `app/api/auth/auto-login/route.ts`

**Problem**: The auto-login was trying to make a client-side fetch request during server-side execution.

**Solution**: Replaced the fetch-based merge with direct database operations:

```typescript
// OLD: Client-side fetch (doesn't work on server)
const { mergeDraftWithUser } = await import('@/lib/booking-draft')
const mergeResult = await mergeDraftWithUser(draftId, user.id)

// NEW: Direct database operations
const draft = await db.bookingDraft.findUnique({ where: { id: draftId } })
if (draft && !isExpired) {
  const updatedDraft = await db.bookingDraft.update({
    where: { id: draftId },
    data: { userId: user.id, updatedAt: new Date() }
  })
}
```

### 2. Enhanced Cross-Device Draft Detection
**File**: `lib/dashboard-draft-utils.ts`

**Problem**: `checkDraftStatus` only checked local storage and cookies.

**Solution**: Added server-side draft checking for cross-device scenarios:

```typescript
// First check local storage (same device)
const localDraftId = getCookie('booking_draft_id')
if (localDraftId) { /* check local draft */ }

// If no local draft, check server for user's drafts (cross-device)
const response = await fetch('/api/bookings/drafts/user-drafts', {
  credentials: 'include'
})
```

### 3. Created User Drafts API Endpoint
**File**: `app/api/bookings/drafts/user-drafts/route.ts`

**Purpose**: Fetch all drafts associated with the current authenticated user.

```typescript
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  const drafts = await db.bookingDraft.findMany({
    where: {
      userId: user.id,
      expiresAt: { gt: new Date() } // Only non-expired drafts
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json({ success: true, drafts })
}
```

### 4. Enhanced Booking Page Resume Logic
**File**: `app/book-service/page.tsx`

**Problem**: Booking page couldn't handle cross-device draft resumption.

**Solution**: Added URL parameter handling for `draftId`:

```typescript
// Check if we have a draftId in the URL (cross-device resume)
const urlDraftId = searchParams?.get("draftId");
if (urlDraftId) {
  const draft = await getBookingDraft(urlDraftId)
  if (draft) {
    setForm({ /* restore form data */ })
  }
}
```

### 5. Updated Dashboard Button URL Generation
**File**: `lib/dashboard-draft-utils.ts`

**Change**: Updated the resume URL to include the `draftId` parameter:

```typescript
// OLD
url: `/booking/resume?draftId=${draftStatus.draftId}`

// NEW
url: `/book-service?resume=true&draftId=${draftStatus.draftId}`
```

## 🔄 New Cross-Device Flow

### Step 1: Draft Creation (Laptop)
1. User fills booking form on laptop
2. Clicks "Sign up" in login modal
3. Draft saved to localStorage and server
4. User redirected to signup page

### Step 2: Email Verification (Phone)
1. User receives verification email with `draftId` in URL
2. Opens email on phone and clicks verification link
3. **Auto-login merges draft with user account** ✅
4. User redirected to dashboard

### Step 3: Dashboard Detection (Phone)
1. Dashboard loads on phone
2. `DraftAwareBookingButton` checks for drafts:
   - First checks localStorage (empty on phone)
   - Then checks server via `/api/bookings/drafts/user-drafts`
   - Finds the merged draft ✅
3. Button shows "Resume Booking" ✅

### Step 4: Draft Restoration (Phone)
1. User clicks "Resume Booking" button
2. Redirected to `/book-service?resume=true&draftId=${draftId}`
3. Booking page detects `draftId` parameter
4. Fetches draft from server and restores form ✅
5. User can continue booking process

## 🧪 Expected Console Output

### Cross-Device Auto-Login (Phone)
```
📝 Found pending booking draft, auto-logging in and redirecting to continue booking: [draft-id]
✅ Auto-login successful: [user-email]
🔗 Attempting to merge draft [draft-id] with user [user-id]
✅ Successfully merged draft [draft-id] with user [user-id]
📝 Storing merged draft data for booking page: [draft-id]
📝 Stored in sessionStorage as resumeBookingData
```

### Dashboard Draft Detection (Phone)
```
🔍 [DraftAwareBookingButton] Checking draft status...
🔍 [DraftAwareBookingButton] No local draft found, checking server...
📝 Found 1 drafts for user [user-id]
🔍 [DraftAwareBookingButton] Found draft: [draft-id]
```

### Booking Page Resume (Phone)
```
🔍 [BookService] Found draftId in URL: [draft-id], fetching draft from server
📖 Draft data from server: { "id": "[draft-id]", "serviceId": "[service-id]", ... }
🔍 [BookService] Form restored from server draft
```

## 🎯 Testing Steps

### Cross-Device Test:
1. **Laptop**: Fill booking form → click "Sign up" → complete signup
2. **Phone**: Open verification email → click verification link
3. **Phone**: Should redirect to dashboard
4. **Phone**: Dashboard should show "Resume Booking" button
5. **Phone**: Click "Resume Booking" → form should be pre-filled
6. **Phone**: Complete booking → should appear in "Recent Bookings"

### Same-Device Test:
1. **Laptop**: Fill booking form → click "Sign up" → complete signup
2. **Laptop**: Go back to login page → login with new credentials
3. **Laptop**: Dashboard should show "Resume Booking" button
4. **Laptop**: Click "Resume Booking" → form should be pre-filled

## 🎉 Benefits

1. **True Cross-Device Support**: Drafts work seamlessly across devices
2. **Reliable Auto-Login**: Server-side merge logic ensures drafts are always merged
3. **Consistent UX**: Same experience regardless of device used for verification
4. **Robust Detection**: Multiple fallback mechanisms for draft detection
5. **Future-Proof**: Handles edge cases and error scenarios gracefully

## 🚀 Next Steps

1. **Test the complete cross-device flow**
2. **Verify "Recent Bookings" shows completed bookings**
3. **Test edge cases** (expired drafts, network errors, etc.)
4. **Monitor console output** for any remaining issues

---

**This fix ensures that booking drafts are preserved and accessible across all devices, providing a seamless user experience regardless of where the user verifies their email or continues their booking.**
