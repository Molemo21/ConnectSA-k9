# Manual Testing Guide - Catalogue Booking Flow

## 🎯 **Testing Objective**
Verify that the catalogue booking flow works end-to-end without 401 Unauthorized errors.

## ✅ **Pre-Test Verification**
All automated tests have passed:
- ✅ Deployment: SUCCESS
- ✅ Legacy Endpoint: ACCESSIBLE  
- ✅ Enhanced Endpoint: ACCESSIBLE
- ✅ Catalogue API: ACCESSIBLE

## 🧪 **Manual Test Steps**

### **Step 1: Access Production Site**
1. Navigate to: `https://app.proliinkconnect.co.za`
2. Verify the site loads correctly
3. Log in with a test client account

### **Step 2: Start Booking Flow**
1. Click "Book a Service" or similar booking button
2. Select a service category (e.g., "Hair & Beauty")
3. Choose a specific service (e.g., "Hair Braiding")
4. Fill in booking details:
   - Date: Future date
   - Time: Available time slot
   - Address: Test address
   - Notes: Optional

### **Step 3: Provider Selection**
1. Review the list of available providers
2. Look for providers with "Services" button (indicates catalogue pricing)
3. Click "Services" on a provider card

### **Step 4: Package Selection**
1. Verify the catalogue modal opens
2. Check that packages are displayed with:
   - Package titles (Basic, Standard, Premium)
   - Prices in ZAR (R symbol, not $)
   - Duration in minutes/hours
   - "Select Package" buttons
3. Click "Select Package" on any package

### **Step 5: Booking Summary**
1. Verify the booking summary drawer appears
2. Check that it shows:
   - Selected package details
   - Provider information
   - Scheduled time and address
   - Total price
3. Click "Confirm & Book" button

### **Step 6: Success Verification**
1. **Expected Result**: Booking created successfully
2. **No 401 Errors**: Console should not show "Unauthorized" errors
3. **Success Message**: Should see confirmation message
4. **Redirect**: Should redirect to dashboard or booking confirmation page

## 🔍 **What to Look For**

### **✅ Success Indicators**
- Catalogue modal loads with packages
- Package selection works smoothly
- Booking summary shows correct details
- "Confirm & Book" button is clickable
- No 401 Unauthorized errors in console
- Booking created successfully

### **❌ Failure Indicators**
- 401 Unauthorized errors in console
- "Confirm & Book" button not responding
- Catalogue modal not loading
- Packages not displaying correctly
- Booking creation fails

## 🐛 **Troubleshooting**

### **If 401 Errors Persist**
1. Check browser console for specific error details
2. Verify authentication cookies are set
3. Clear browser cache and cookies
4. Try in incognito/private mode

### **If Catalogue Modal Doesn't Load**
1. Check if `NEXT_PUBLIC_CATALOGUE_PRICING_V1=true` is set
2. Verify provider has catalogue items
3. Check network tab for API call failures

### **If Packages Don't Display**
1. Verify catalogue items exist in database
2. Check if provider is approved and active
3. Ensure service has active packages

## 📊 **Test Results Template**

```
Test Date: ___________
Tester: ___________
Environment: Production (https://app.proliinkconnect.co.za)

Step 1 - Site Access: ✅ / ❌
Step 2 - Booking Start: ✅ / ❌  
Step 3 - Provider Selection: ✅ / ❌
Step 4 - Package Selection: ✅ / ❌
Step 5 - Booking Summary: ✅ / ❌
Step 6 - Success Verification: ✅ / ❌

Overall Result: ✅ PASS / ❌ FAIL

Issues Found:
- 

Console Errors:
- 

Notes:
- 
```

## 🎉 **Success Criteria**
The test is successful when:
1. Complete booking flow works without errors
2. Catalogue pricing is used correctly
3. No 401 Unauthorized errors occur
4. Booking is created successfully
5. User receives confirmation

## 📞 **Next Steps After Testing**
- If successful: Catalogue pricing is ready for production use
- If issues found: Document specific problems for further fixes
- If critical failures: Rollback may be necessary

