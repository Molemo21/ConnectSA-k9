# Quick Deployment Checklist

## ✅ Pre-Deployment
- [ ] Code committed and pushed to main branch
- [ ] Database backup created (optional but recommended)
- [ ] Production environment access confirmed

## ✅ Step 1: Database Table Creation
- [ ] Open Supabase SQL Editor
- [ ] Run `create-booking-drafts-table-production.sql`
- [ ] Verify table creation with: `SELECT * FROM booking_drafts;`
- [ ] Test insert/select operations

## ✅ Step 2: Code Deployment
- [ ] Deploy latest code to production
- [ ] Verify deployment completed successfully
- [ ] Check application is running

## ✅ Step 3: Testing
- [ ] Test booking form (not logged in)
- [ ] Click "Continue" → Login modal appears
- [ ] Click "Sign up" → No 500 error
- [ ] Complete signup and verification
- [ ] Verify draft is preserved cross-device
- [ ] Complete full booking flow

## ✅ Step 4: Verification
- [ ] No 500 errors in browser console
- [ ] No "Failed to save" popups
- [ ] Draft data preserved across devices
- [ ] Database contains draft records
- [ ] API endpoints respond correctly

## ✅ Post-Deployment
- [ ] Monitor application logs
- [ ] Check for user reports
- [ ] Verify performance metrics
- [ ] Document any issues found

---

## 🚨 Emergency Rollback
If critical issues occur:
1. Revert code: `git revert 8fed657 && git push origin main`
2. Drop table: `DROP TABLE booking_drafts;`
3. Redeploy previous version

---

## 📞 Support
- Check logs: `tail -f /var/log/your-app.log`
- Database: `SELECT * FROM booking_drafts ORDER BY createdAt DESC LIMIT 5;`
- API test: `curl -X POST /api/bookings/drafts -H "Content-Type: application/json" -d '{"id":"test","serviceId":"test","date":"2024-12-25","time":"14:00","address":"test","expiresAt":"2024-12-26T14:00:00Z"}'`
