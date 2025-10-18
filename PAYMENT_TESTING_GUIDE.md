# Payment Flow Testing Guide

## 🎯 Overview
This guide will help you test the complete payment flow from client to provider dashboards using the ConnectSA platform.

## ✅ Prerequisites
- ✅ Paystack API keys configured (TEST mode)
- ✅ Database connection working
- ✅ Payment routes enabled with real Paystack integration
- ✅ Webhook endpoint configured
- ✅ Provider and client accounts available

## 🧪 Test Data Available

### Client Account
- **Email**: `molemonakin21@gmail.com`
- **Bookings**: 5 bookings (mix of PENDING and CONFIRMED)
- **Amounts**: R150-R156 per booking

### Provider Account
- **Business**: "John's services" / "BBM cleaning"
- **Bookings**: 3 bookings assigned
- **Services**: Carpet Cleaning

## 📋 Step-by-Step Testing Process

### Step 1: Start Development Server
```bash
npm run dev
```
Wait for server to start on `http://localhost:3000`

### Step 2: Test Client Payment Flow

1. **Login as Client**
   - Navigate to `http://localhost:3000/login`
   - Login with: `molemonakin21@gmail.com`
   - Use appropriate password

2. **Navigate to Bookings**
   - Go to client dashboard
   - Find a CONFIRMED booking (e.g., booking `cmgowr0ig0001i304doyhjvf4`)
   - Amount: R150, Status: CONFIRMED

3. **Initiate Payment**
   - Click "Pay Now" button
   - Should redirect to Paystack checkout page
   - Use test card details:
     - **Card Number**: `4084084084084081`
     - **CVV**: `408`
     - **Expiry**: Any future date
     - **PIN**: `1234`

4. **Complete Payment**
   - Complete payment on Paystack
   - Should redirect back to dashboard
   - Check for success message

### Step 3: Test Provider Dashboard Updates

1. **Login as Provider**
   - Navigate to `http://localhost:3000/provider/login`
   - Login with provider credentials
   - Go to provider dashboard

2. **Check for Payment Notification**
   - Look for payment received notification
   - Booking status should show "PENDING_EXECUTION"
   - Payment status should show "ESCROW"

3. **Verify Booking Details**
   - Client name: "Molemo Nakin"
   - Service: "Carpet Cleaning"
   - Amount: "R150"
   - Address: Real client address

### Step 4: Test Webhook Processing

1. **Check Server Logs**
   - Look for webhook processing logs
   - Should see "charge.success" event
   - Payment status updated to "ESCROW"

2. **Verify Database Updates**
   - Payment record created with correct status
   - Booking status updated to "PENDING_EXECUTION"
   - Provider notification created

## 🔍 Expected Results

### Client Dashboard
- ✅ Payment button works
- ✅ Redirects to Paystack checkout
- ✅ Returns to dashboard after payment
- ✅ Shows payment success message
- ✅ Booking status updates

### Provider Dashboard
- ✅ Receives payment notification
- ✅ Booking shows "PENDING_EXECUTION" status
- ✅ Payment shows "ESCROW" status
- ✅ Real client data displayed correctly
- ✅ Service category shows properly

### Database
- ✅ Payment record created
- ✅ Booking status updated
- ✅ Notification created
- ✅ Webhook event logged

## 🐛 Troubleshooting

### Payment Initialization Fails
- Check Paystack API keys in `.env`
- Verify booking has valid amount > 0
- Check client email is valid

### Webhook Not Processing
- Verify webhook URL in Paystack dashboard
- Check server logs for webhook events
- Ensure PAYSTACK_SECRET_KEY is correct

### Provider Dashboard Not Updating
- Check if provider is logged in correctly
- Verify booking assignment to provider
- Check database for payment records

## 📊 Test Scenarios

### Scenario 1: Successful Payment
1. Client initiates payment
2. Completes Paystack checkout
3. Webhook processes payment
4. Provider receives notification
5. Both dashboards update correctly

### Scenario 2: Failed Payment
1. Client initiates payment
2. Payment fails on Paystack
3. Webhook processes failure
4. Booking remains in original status
5. Client sees failure message

### Scenario 3: Payment Verification
1. Use `/api/payment/verify` endpoint
2. Check payment status
3. Verify booking updates
4. Confirm provider notifications

## 🎉 Success Criteria

- ✅ Client can initiate payments
- ✅ Paystack checkout works
- ✅ Webhooks process correctly
- ✅ Provider dashboard updates
- ✅ Real data displays properly
- ✅ Payment status tracking works
- ✅ Notifications sent correctly

## 📝 Notes

- All payments are in TEST mode (no real money)
- Use test card details provided
- Check server logs for detailed debugging
- Webhook events are logged for audit trail
- Payment statuses: PENDING → ESCROW → RELEASED

---

**Ready to test!** 🚀
