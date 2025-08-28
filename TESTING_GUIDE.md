# 🧪 Complete Testing Guide for Paystack Integration

## 📋 Overview

This guide will walk you through testing the complete Paystack integration in test mode, from setup to end-to-end payment flow testing.

## 🚀 Prerequisites

### **1. Environment Setup**
- ✅ Node.js and npm/pnpm installed
- ✅ PostgreSQL database running
- ✅ Next.js development server ready
- ✅ Paystack test account created

### **2. Required Environment Variables**
Create `.env.local` with:
```bash
# Paystack Test Mode
PAYSTACK_TEST_MODE=true
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/connectsa_db"

# Next.js
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## 🔧 Step 1: Database Setup Verification

### **Run Database Migration Script**
```bash
node scripts/add-provider-bank-fields.js
```

**Expected Output:**
```
🔧 Adding Provider Bank Fields

✅ Database connection successful

No bank-related columns found

🔧 Adding bank details columns to providers table...

✅ Added bankName column
✅ Added bankCode column
✅ Added accountNumber column
✅ Added accountName column
✅ Added recipient_code column

🎉 Provider Bank Fields Addition Completed!
```

### **Verify Database Schema**
Check that your `providers` table now has:
- `bankName` (TEXT)
- `bankCode` (TEXT)
- `accountNumber` (TEXT)
- `accountName` (TEXT)
- `recipient_code` (TEXT)

## 🧪 Step 2: Paystack Integration Testing

### **Run Integration Test Script**
```bash
node scripts/test-paystack-integration.js
```

**Expected Output:**
```
🧪 Testing Paystack Integration (Test Mode)

✅ Database connection successful

🔍 Step 1: Finding provider with bank details...

❌ No provider found with bank details
💡 Please add bank details to a provider first using the frontend form
```

**Note**: This is expected at first since no provider has bank details yet.

## 🎯 Step 3: Frontend Testing

### **1. Start Development Server**
```bash
npm run dev
# or
pnpm dev
```

### **2. Login as a Provider**
1. Navigate to `http://localhost:3000/login`
2. Login with provider credentials
3. You should see the provider dashboard

### **3. Add Bank Details**
1. **Look for Bank Details Section**: It should appear below the stats cards
2. **Fill in the form**:
   - **Bank**: Select "ABSA Bank" (code: 044)
   - **Account Number**: Enter "1234567890"
   - **Account Holder Name**: Enter "Test Provider Account"
3. **Click "Save Details"**
4. **Verify Success**: You should see a success message

### **4. Verify Bank Details Display**
After saving, you should see:
- ✅ Bank details displayed in a card format
- ✅ Account number masked (****1234)
- ✅ "Edit Bank Details" button
- ✅ Green success alert

## 🔄 Step 4: Payment Flow Testing

### **1. Create Test Booking**
1. **Login as a client** in another browser/incognito window
2. **Create a booking** for the provider you just added bank details to
3. **Complete payment** (this should put payment in ESCROW status)
4. **Provider should mark job as complete**

### **2. Test Payment Release**
1. **Login as the client** for the completed booking
2. **Navigate to the booking** and click "Confirm Completion"
3. **Monitor the terminal/console** for payment release logs

### **Expected Logs:**
```
🚀 Starting payment release for booking: [booking-id]
🔍 Fetching booking data for [booking-id]...
🔍 Database query completed in [X]ms
🔍 Payment status validation for booking [booking-id]: { paymentId: 'xxx', currentStatus: 'ESCROW', expectedStatus: 'ESCROW', bookingStatus: 'AWAITING_CONFIRMATION', amount: 150 }
💰 Generated payout reference: PO_[timestamp]_[random]
💰 Payout record created in [X]ms
💳 Payment status updated to PROCESSING_RELEASE in [X]ms
📋 Booking status updated to PAYMENT_PROCESSING in [X]ms
🔄 Processing Paystack transfer for payout: [payout-id]
📋 Provider [provider-id] has no recipient_code, creating new recipient...
🏦 Creating Paystack transfer recipient with bank details: { bank: 'ABSA Bank', accountNumber: '1234567890', accountName: 'Test Provider Account' }
✅ Created transfer recipient with code: RCP_[code]
💾 Stored recipient_code RCP_[code] for provider [provider-id]
💸 Initiating Paystack transfer: { amount: 150, recipient: 'RCP_[code]', reason: 'Payment for [service] - Booking [booking-id]', reference: 'PO_[timestamp]_[random]' }
✅ Paystack transfer created successfully: { transferCode: 'TRF_[code]', amount: 15000, status: 'pending' }
🎉 Payment release completed successfully in [X]ms
```

### **3. Verify Database Changes**
Check your database for these status changes:

**Booking Status:**
```sql
-- Should change from AWAITING_CONFIRMATION to PAYMENT_PROCESSING to COMPLETED
SELECT id, status FROM bookings WHERE id = '[booking-id]';
```

**Payment Status:**
```sql
-- Should change from ESCROW to PROCESSING_RELEASE to RELEASED
SELECT id, status FROM payments WHERE "bookingId" = '[booking-id]';
```

**Payout Status:**
```sql
-- Should change from PENDING to PROCESSING
SELECT id, status FROM payouts WHERE "paymentId" = '[payment-id]';
```

**Provider Recipient Code:**
```sql
-- Should now have a recipient_code
SELECT "recipientCode" FROM providers WHERE id = '[provider-id]';
```

## 📊 Step 5: Monitoring & Validation

### **1. Check Frontend Status Updates**
- **Client Dashboard**: Booking should show "Completed" status
- **Provider Dashboard**: Should see the completed booking
- **Payment Status**: Should show payment released

### **2. Verify Error Handling**
Test these scenarios:

**Scenario 1: Missing Bank Details**
1. **Remove bank details** from a provider
2. **Try to release payment** for their booking
3. **Expected Result**: Error message about incomplete bank details

**Scenario 2: Invalid Payment Status**
1. **Try to release payment** for a booking not in ESCROW
2. **Expected Result**: Appropriate error message

**Scenario 3: Unauthorized Access**
1. **Try to release payment** as wrong user
2. **Expected Result**: 401 Unauthorized error

### **3. Check Logs for Errors**
Monitor your terminal for any error messages or failed operations.

## 🔍 Step 6: Advanced Testing

### **1. Test Recipient Code Reuse**
1. **Create another booking** for the same provider
2. **Release payment** for the new booking
3. **Verify**: Should use existing recipient code (no new recipient creation)

### **2. Test Multiple Providers**
1. **Add bank details** to another provider
2. **Create and complete bookings** for both providers
3. **Verify**: Each provider gets their own recipient code

### **3. Test Transfer Failure Scenarios**
1. **Use invalid bank details** (wrong account number)
2. **Try to release payment**
3. **Verify**: Proper rollback and error handling

## ❌ Troubleshooting Common Issues

### **Issue 1: "Bank Details Form Not Showing"**
**Solutions:**
- Check browser console for errors
- Verify the component is imported correctly
- Check if `currentProviderId` is being set

### **Issue 2: "API Error 500"**
**Solutions:**
- Check terminal logs for detailed error messages
- Verify database connection
- Check if all required environment variables are set

### **Issue 3: "Paystack API Error"**
**Solutions:**
- Verify API keys are correct (start with `sk_test_`)
- Check Paystack dashboard for account status
- Ensure you're using test mode

### **Issue 4: "Database Column Missing"**
**Solutions:**
- Run `node scripts/add-provider-bank-fields.js` again
- Check database schema manually
- Restart your development server

## 🎯 Success Criteria

Your Paystack integration is working correctly when:

✅ **Bank details form displays and saves correctly**
✅ **Provider can add/edit bank information**
✅ **Payment release flow completes without errors**
✅ **All status transitions work correctly**
✅ **Paystack recipient creation succeeds**
✅ **Transfer creation succeeds**
✅ **Database rollbacks work on failures**
✅ **Error handling provides clear messages**
✅ **No real money is transferred in test mode**

## 🚀 Next Steps After Successful Testing

1. **Monitor Performance**: Check response times and success rates
2. **Test Edge Cases**: Try various error scenarios
3. **Prepare for Production**: Update environment variables
4. **Implement Webhooks**: Handle transfer status updates
5. **Add Monitoring**: Track transfer success rates

## 📝 Test Data Examples

### **Valid Test Bank Details**
```json
{
  "bankCode": "044",
  "bankName": "ABSA Bank",
  "accountNumber": "1234567890",
  "accountName": "Test Provider Account"
}
```

### **Test Transfer Response**
```json
{
  "success": true,
  "payout": { /* payout details */ },
  "message": "Payment released successfully to provider. Transfer initiated.",
  "transferCode": "TRF_xxxxxxxxxxxxxxxxxxxxxxxx",
  "recipientCode": "RCP_xxxxxxxxxxxxxxxxxxxxxxxx",
  "amount": 150.00,
  "bookingStatus": "COMPLETED"
}
```

---

**Remember**: Test mode is completely safe - no real money will be transferred. Use this time to thoroughly test all payment flows before going live! 🎉

## 🔗 Quick Reference Commands

```bash
# Database setup
node scripts/add-provider-bank-fields.js

# Paystack integration test
node scripts/test-paystack-integration.js

# Start development server
npm run dev

# Check environment variables
echo $PAYSTACK_TEST_MODE
echo $PAYSTACK_SECRET_KEY
```
