# 🧪 Forgot Password Manual Testing Guide

## 🎯 **What We're Testing**

The complete forgot password flow from UI interaction to email delivery.

---

## 📋 **Step-by-Step Manual Test**

### **Step 1: Access the Page**
1. Open browser
2. Go to: `https://app.proliinkconnect.co.za/forgot-password`
3. **Expected:** Page loads with email input form

### **Step 2: Test Email Validation**
1. Leave email field empty
2. Click "Send Reset Link"
3. **Expected:** 
   - ❌ Red error message appears
   - ❌ Toast notification shows "Please enter your email address"
   - 🔴 Input border turns red

### **Step 3: Test Invalid Email**
1. Enter: `invalid-email`
2. Click "Send Reset Link"
3. **Expected:**
   - ❌ Red error message appears
   - ❌ Toast notification shows "Please enter a valid email address"
   - 🔴 Input border turns red

### **Step 4: Test Valid Email**
1. Enter: `molemonakin21@gmail.com`
2. Click "Send Reset Link"
3. **Expected:**
   - ✅ Button shows "Sending..." with spinner
   - ✅ Toast notification appears (success or error)
   - ✅ Page changes to success screen OR error message appears

### **Step 5: Check Email Delivery**
1. Check your email inbox (`molemonakin21@gmail.com`)
2. Look for email from: `no-reply@app.proliinkconnect.co.za`
3. **Expected:**
   - ✅ Email arrives within 1-2 minutes
   - ✅ Subject: "Password Reset Request - Proliink Connect"
   - ✅ Professional HTML design with Proliink branding

### **Step 6: Test Reset Link**
1. Click the "Reset Password" button in the email
2. **Expected:**
   - ✅ Redirects to reset password page
   - ✅ Page shows password input fields
   - ✅ Token is valid (not expired)

### **Step 7: Complete Password Reset**
1. Enter new password: `NewTestPassword123!`
2. Confirm password: `NewTestPassword123!`
3. Click "Reset Password"
4. **Expected:**
   - ✅ Success message
   - ✅ Redirect to login page
   - ✅ Can login with new password

---

## 🔍 **What to Look For**

### **✅ Success Indicators:**
- Toast notifications appear
- Button shows loading state
- Success page displays
- Email arrives promptly
- Reset link works
- Password change succeeds

### **❌ Failure Indicators:**
- No visual feedback
- Button doesn't respond
- 500 error messages
- Email doesn't arrive
- Reset link doesn't work
- Password change fails

---

## 🐛 **Common Issues & Solutions**

### **Issue: Button appears broken**
- **Cause:** No error handling
- **Solution:** Check browser console for errors

### **Issue: Email doesn't arrive**
- **Cause:** Resend API issue
- **Solution:** Check spam folder, verify API key

### **Issue: 500 Internal Server Error**
- **Cause:** Database or API issue
- **Solution:** Check Vercel logs, verify database connection

### **Issue: Reset link doesn't work**
- **Cause:** Token expired or invalid
- **Solution:** Generate new reset request

---

## 📊 **Test Results Checklist**

- [ ] Page loads correctly
- [ ] Email validation works
- [ ] Button shows loading state
- [ ] Toast notifications appear
- [ ] Success/error messages display
- [ ] Email arrives in inbox
- [ ] Email has correct branding
- [ ] Reset link works
- [ ] Password reset completes
- [ ] Can login with new password

---

## 🎯 **Expected User Experience**

### **Happy Path:**
```
User enters email → Button shows "Sending..." → 
Toast appears "Email sent!" → Success page → 
Email arrives → Click link → Reset password → 
Success! → Login with new password
```

### **Error Path:**
```
User enters invalid email → Error message appears → 
Toast shows error → User corrects email → 
Retry → Success
```

---

## 📝 **Test Report Template**

**Date:** ___________
**Tester:** ___________
**Environment:** Production (https://app.proliinkconnect.co.za)

### **Results:**
- [ ] Page loads: ✅/❌
- [ ] Email validation: ✅/❌
- [ ] Button feedback: ✅/❌
- [ ] Toast notifications: ✅/❌
- [ ] Email delivery: ✅/❌
- [ ] Reset link: ✅/❌
- [ ] Password reset: ✅/❌

### **Issues Found:**
1. ________________
2. ________________
3. ________________

### **Overall Status:** ✅ PASS / ❌ FAIL

---

## 🚀 **Quick Test Commands**

```bash
# Test API directly
curl -X POST https://app.proliinkconnect.co.za/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"molemonakin21@gmail.com"}'

# Run automated test
node scripts/simple-forgot-password-test.js
```

---

**Last Updated:** October 2, 2025
