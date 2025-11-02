# 🚀 Quick Start: Test Notification Bell

## **Fastest Way to Test**

### **1. Start Your Dev Server**
```bash
npm run dev
```

### **2. Log In**
- Open `http://localhost:3000`
- Log in with your account
- Make sure you have some notifications (create a booking if needed)

### **3. Open Test File**
**Option A (Recommended):** Serve via your dev server
```bash
# Copy to public folder
cp test-notification-bell-frontend.html public/test-notifications.html
# Then visit: http://localhost:3000/test-notifications.html
```

**Option B:** Open directly
- Double-click `test-notification-bell-frontend.html` in your file explorer
- ⚠️ **Make sure you're logged in first!**

### **4. Run Tests**
1. Open browser console (F12)
2. Click **"Run All Tests"** button
3. Review results in the test page

---

## **What the Test File Tests**

✅ Fetches notifications from API  
✅ Marks notification as read  
✅ Marks all as read  
✅ Deletes notification  
✅ Refreshes notifications  
✅ Checks navigation URLs  

---

## **Manual Testing (In Your App)**

### **Desktop:**
1. Go to `/dashboard` or `/provider/dashboard`
2. Click bell icon → Should open popup
3. Click "View Details" → Should navigate to booking card

### **Mobile (Resize browser < 1024px):**
1. Go to same dashboard URLs
2. Click bell icon in mobile header
3. Verify it works the same as desktop

---

**For detailed instructions, see: `TEST_NOTIFICATION_BELL_GUIDE.md`**

