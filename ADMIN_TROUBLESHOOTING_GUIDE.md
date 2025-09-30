# Admin Dashboard Troubleshooting Guide

## 🔍 "Error fetching users" / "Error fetching providers"

### ✅ What We've Verified:

1. **Database Connection** - ✅ Working (Revenue shows R4,731)
2. **User Data Query** - ✅ Working (18 users in database)
3. **Provider Data Query** - ✅ Working (9 providers in database)
4. **API Endpoints** - ✅ Exist at `/api/admin/users` and `/api/admin/providers`
5. **Code Changes** - ✅ All applied correctly

---

## 🚀 **Quick Fix Steps:**

### **Step 1: Restart Development Server** (CRITICAL)
The Next.js server needs to reload with the new changes:

```bash
# In your terminal where npm run dev is running:
# 1. Press Ctrl+C to stop the server
# 2. Restart it:
npm run dev

# Wait for "Ready" message before testing
```

### **Step 2: Hard Refresh Browser**
Clear cached JavaScript:
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`
- Or: `Ctrl + F5`

### **Step 3: Clear Browser Cache**
1. Open DevTools (F12)
2. Right-click on the refresh button
3. Select "Empty Cache and Hard Reload"

### **Step 4: Check Browser Console**
1. Open DevTools (F12)
2. Go to "Console" tab
3. Clear console
4. Click "Manage Users" button
5. Look for errors - share the error message with me

### **Step 5: Check Network Tab**
1. Open DevTools (F12)
2. Go to "Network" tab
3. Click "Manage Users" button
4. Look for request to `/api/admin/users`
5. Check:
   - Status code (should be 200, not 401 or 500)
   - Response body
   - Error message if any

---

## 🔧 **Common Issues & Solutions:**

### **Issue 1: 401 Unauthorized**
**Symptom:** API returns 401  
**Cause:** Not logged in as admin  
**Solution:**
- Make sure you're logged in
- Check your user role is "ADMIN"
- Check browser cookies

### **Issue 2: 500 Internal Server Error**
**Symptom:** API returns 500  
**Cause:** Database error or code issue  
**Solution:**
- Check terminal logs for error details
- Check database connection
- Verify Prisma schema is up to date

### **Issue 3: TypeScript Errors**
**Symptom:** Build errors or type errors  
**Cause:** Type mismatches  
**Solution:**
```bash
npm run build
# Check for TypeScript errors
```

### **Issue 4: Stale Cache**
**Symptom:** Old data or zero values  
**Cause:** 30-second cache in admin-data-service  
**Solution:**
- Wait 30 seconds
- Or restart server to clear cache

---

## 🧪 **Verification Commands:**

Run these to verify everything is working:

### **1. Check Database Connection:**
```bash
node scripts/test-admin-api.js
```
**Expected:** Should show R4731 revenue

### **2. Check Users API:**
```bash
node scripts/test-users-api.js
```
**Expected:** Should show 18 users with details

### **3. Check Providers API:**
```bash
node scripts/test-providers-api.js
```
**Expected:** Should show 9 providers with details

### **4. Run Quick Actions Tests:**
```bash
npx jest __tests__/admin/quick-actions-functionality.test.tsx --verbose
```
**Expected:** All 13 tests should pass

---

## 📊 **What Should Work:**

After restarting the server and refreshing the browser:

### **✅ Manage Users Button:**
- Click button → Navigates to Users section
- Shows "User Management" header
- Displays table with 18 users:
  1. Qhawe Yamkela Mlengana
  2. Asiphe Sikrenya
  3. System Administrator
  4. asiphe
  5. Noxolo Mjaks
  6. ... (13 more users)
- Search box works
- Filters work
- Pagination works

### **✅ Approve Providers Button:**
- Click button → Navigates to Providers section
- Shows "Provider Management" header
- Displays table with 9 providers:
  - 3 APPROVED (Dodo Adonis, Thabang Nakin, Keitumetse Faith Seroto)
  - 2 PENDING (asiphe, Noxolo)
  - 4 INCOMPLETE (others)
- Approve/Reject buttons appear for PENDING providers
- Actions work correctly

---

## 🔍 **Debug Information:**

If still not working, check your **Next.js terminal** for these messages:

### **When clicking Manage Users:**
```
Admin users API: Starting request for user: [user-id] page: 1
Admin users API: Successfully fetched users: [count]
GET /api/admin/users?page=1&limit=10... 200 in [time]ms
```

### **When clicking Approve Providers:**
```
Admin providers API: Starting request for user: [user-id] page: 1
Admin providers API: Successfully fetched providers: [count]
GET /api/admin/providers?page=1&limit=10... 200 in [time]ms
```

### **If you see errors instead:**
Share the error message and I'll help fix it!

---

## 🎯 **Most Likely Solution:**

**RESTART YOUR DEV SERVER!** 🔄

The changes we made require the server to reload. Simply:

1. Stop the server (Ctrl+C)
2. Start it again: `npm run dev`
3. Wait for "Ready"
4. Hard refresh browser (Ctrl+Shift+R)
5. Try the buttons again

This should fix it! 🎉

---

## 📞 **Still Not Working?**

If after restarting you still get errors, please share:

1. **Browser console error** (F12 → Console tab)
2. **Network request details** (F12 → Network tab → Click on failed request)
3. **Terminal error** from Next.js server

I'll help diagnose and fix it! 💪
