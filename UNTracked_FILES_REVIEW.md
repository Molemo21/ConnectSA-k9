# Untracked Files Review & Categorization

**Branch**: `feature/multi-channel-notifications`  
**Date**: $(date)

## 📋 File Categorization

### ✅ **PRODUCTION-READY CODE** (Should Commit)

#### API Endpoints
- ✅ `app/api/health/route.ts` - Production health check endpoint
- ✅ `app/api/push/subscribe/route.ts` - Push notification subscription
- ✅ `app/api/push/unsubscribe/route.ts` - Push notification unsubscribe
- ✅ `app/api/push/vapid-public-key/route.ts` - VAPID key endpoint

#### Components & Hooks
- ✅ `components/ui/push-notification-prompt.tsx` - Push notification UI
- ✅ `components/system/ServiceWorkerRegistrar.tsx` - Service worker registration
- ✅ `components/system/NotificationRealtimeToaster.tsx` - Real-time notifications
- ✅ `hooks/use-push-notifications.ts` - Push notifications hook

#### Services & Libraries
- ✅ `lib/push-notification-service.ts` - Push notification service
- ✅ `lib/email-templates.ts` - Email templates
- ✅ `lib/notification-service-enhanced.ts` - Enhanced notification service

#### PWA Files
- ✅ `public/manifest.json` - PWA manifest
- ✅ `public/sw.js` - Service worker

#### Migration Scripts
- ✅ `migrations/manual-add-push-subscriptions.sql` - Database migration

#### Configuration
- ✅ `docker-compose.dev.yml` - Development Docker setup

---

### 📚 **DOCUMENTATION** (Evaluate for Commit)

#### Production Documentation (Important)
- ✅ `PRODUCTION_ENV_VARIABLES.md` - **COMMIT** - Important production config
- ✅ `PRODUCTION_READINESS_REPORT.md` - **COMMIT** - Production status

#### Process Documentation
- ⚠️ `MERGE_COMPLETE_SUMMARY.md` - Historical record, optional
- ⚠️ `FIXES_COMPLETE_SUMMARY.md` - Historical record, optional
- ⚠️ `CURRENT_STATUS.md` - Temporary status, consider removing
- ⚠️ `ERROR_FIX_SUMMARY.md` - Historical, optional

#### Feature Documentation
- ⚠️ `NOTIFICATION_SYSTEM_IMPLEMENTATION_COMPLETE.md` - Feature docs
- ⚠️ `PUSH_NOTIFICATION_SETUP_GUIDE.md` - Setup guide
- ⚠️ Multiple notification-related docs - Consider consolidating

#### Debug/Fix Documentation
- ❌ `FIX_ONEDRIVE_*` - Development-specific fixes
- ❌ `ONEDRIVE_*` - OneDrive-specific issues
- ❌ `MOVE_PROJECT_OUTSIDE_ONEDRIVE_GUIDE.md` - Development-specific

---

### 🛠️ **SCRIPTS** (Review for Utility)

#### Useful Scripts
- ✅ `scripts/clean-next-build.js` - Useful build cleanup
- ✅ `scripts/generate-vapid-keys.js` - VAPID key generation
- ✅ `scripts/verify-push-subscriptions-table.js` - Database verification
- ⚠️ `scripts/create-test-notification.js` - Testing script
- ⚠️ `scripts/diagnose-provider-dashboard.js` - Debug script

#### OneDrive-Specific Scripts (Development Only)
- ❌ `scripts/move-project-outside-onedrive.js` - Dev-specific
- ❌ `scripts/suppress-onedrive-errors.js` - Dev-specific
- ❌ `scripts/unlock-file.js` - Dev-specific

#### Test Scripts
- ⚠️ `scripts/test-notification-*.js` - Testing utilities
- ⚠️ `scripts/test-notification-view-details-*.js` - Testing utilities

---

### ❌ **SHOULD NOT COMMIT**

#### Debug/Test Endpoints
- ❌ `app/api/debug/provider-dashboard-test/` - Debug endpoint
- ❌ `test-notification-bell-frontend.html` - Test file
- ❌ `test-notification-bell-functionality.js` - Empty test file

#### System Files
- ❌ `nul` - Windows artifact file

#### Test Files
- ⚠️ `__tests__/e2e/notification-view-details.spec.ts` - Should be in proper test location

---

### ⚠️ **NEEDS REVIEW**

#### API Collections
- ⚠️ `collections/` - Postman/Thunder collections
  - Decision: Keep in .gitignore or commit for team sharing?

#### Unknown Files
- ⚠️ `app/health/` - Need to check contents
- ⚠️ `collections/` - API testing collections

---

## 🎯 Recommendation

### Commit These Categories:

1. **Production Code** (All marked ✅ above)
2. **Essential Documentation**:
   - `PRODUCTION_ENV_VARIABLES.md`
   - `PRODUCTION_READINESS_REPORT.md`
3. **Useful Scripts**:
   - `scripts/clean-next-build.js`
   - `scripts/generate-vapid-keys.js`
   - `scripts/verify-push-subscriptions-table.js`

### Add to .gitignore:
- `nul`
- `app/api/debug/`
- `test-notification-*.html`
- `test-notification-*.js`
- OneDrive-specific scripts

### Document but Don't Commit:
- Development-specific fix documentation
- Historical status reports (unless valuable)
- Temporary debugging files

