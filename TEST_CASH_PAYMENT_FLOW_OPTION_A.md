# Testing Guide: Cash Payment Flow (Option A)

## 🎯 What We're Testing
The new cash payment flow where:
1. Provider accepts booking
2. Provider starts and completes job
3. Client pays (with "Pay" button)
4. Provider confirms cash received (with "Confirm Cash Received" button)
5. Booking completes

---

## 📋 Test Setup

### Step 1: Start the Development Server
```bash
npm run dev
```
Server should start at: `http://localhost:3000`

---

## 🧪 Test Scenarios

### Test 1: Complete Cash Payment Flow

#### As Client (Create Booking):
1. Navigate to service selection
2. Select a service (e.g., "Home Cleaning")
3. Choose **Cash Payment** method
4. Fill in address and details
5. Submit booking
6. ✅ Verify: Booking created with `status: PENDING`, `payment.status: CASH_PENDING`

#### As Provider (Accept Booking):
1. Navigate to Provider Dashboard: `http://localhost:3000/provider/dashboard`
2. Find the pending cash booking
3. Click **"Accept"** button
4. ✅ Verify: Booking status changes to `CONFIRMED`
5. ✅ Verify: Shows **"Start Job"** button immediately

#### As Provider (Start Job):
1. Click **"Start Job"** button
2. ✅ Verify: Booking status changes to `IN_PROGRESS`
3. ✅ Verify: Payment status remains `CASH_PENDING`

#### As Provider (Complete Job):
1. Click **"Complete Job"** button (or "Mark as Complete")
2. Upload completion photos/notes (optional)
3. ✅ Verify: Booking status changes to `AWAITING_CONFIRMATION`
4. ✅ Verify: Client receives notification

#### As Client (Pay Cash):
1. Navigate to Client Dashboard
2. Find booking in `AWAITING_CONFIRMATION` status
3. ✅ Verify: Shows **"Pay"** button (not "Confirm Completion")
4. Click **"Pay"** button
5. ✅ Verify: Payment status changes to `CASH_PAID`
6. ✅ Verify: Booking status remains `AWAITING_CONFIRMATION`
7. ✅ Verify: Provider receives notification: "Payment Claimed - Confirm Cash Received"

#### As Provider (Confirm Cash Received):
1. Navigate to Provider Dashboard
2. Find booking in `AWAITING_CONFIRMATION` status
3. ✅ Verify: Shows **"Confirm Cash Received"** button (green with Banknote icon)
4. Click **"Confirm Cash Received"** button
5. Enter amount validation
6. ✅ Verify: Payment status changes to `CASH_RECEIVED`
7. ✅ Verify: Booking status changes to `COMPLETED`
8. ✅ Verify: Both parties see completed status

---

### Test 2: Edge Case - Job Incomplete Button (Future)
- This button should appear alongside "Pay" button
- Currently commented out in code
- Will be implemented later

---

## 🔍 Expected Database States

### After Client Pays:
```sql
Payment: status = 'CASH_PAID', paidAt = <timestamp>
Booking: status = 'AWAITING_CONFIRMATION'
```

### After Provider Confirms:
```sql
Payment: status = 'CASH_RECEIVED', paidAt = <timestamp>
Booking: status = 'COMPLETED'
```

---

## 🐛 Debug Checklist

### If "Pay" button doesn't appear:
- [ ] Check booking status is `AWAITING_CONFIRMATION`
- [ ] Check `paymentMethod` is `CASH`
- [ ] Check payment status is `CASH_PENDING`
- [ ] Check browser console for errors

### If "Confirm Cash Received" button doesn't appear:
- [ ] Check booking status is `AWAITING_CONFIRMATION`
- [ ] Check payment status is `CASH_PAID`
- [ ] Check booking `paymentMethod` is `CASH`
- [ ] Verify provider is logged in as correct user

### If payment doesn't update:
- [ ] Check `/api/book-service/[id]/release-payment/route.ts` logs
- [ ] Verify payment status validation
- [ ] Check for transaction errors in console

---

## 📊 API Endpoints to Monitor

1. **Client pays**: `POST /api/book-service/[id]/release-payment`
   - Should return: `status: "AWAITING_CONFIRMATION"`
   - Should update: `payment.status: "CASH_PAID"`

2. **Provider confirms**: `POST /api/provider/cash-payment/confirm`
   - Should return: `status: "COMPLETED"`
   - Should update: `payment.status: "CASH_RECEIVED"`

---

## ✅ Success Criteria

- [ ] Provider can accept cash booking
- [ ] Provider can start job without payment
- [ ] Provider can complete job without payment
- [ ] Client sees "Pay" button in AWAITING_CONFIRMATION
- [ ] Client clicking "Pay" updates payment to CASH_PAID
- [ ] Booking stays AWAITING_CONFIRMATION after client pays
- [ ] Provider sees "Confirm Cash Received" button
- [ ] Provider clicking button completes booking
- [ ] Both parties see COMPLETED status
- [ ] No errors in console
- [ ] Notifications sent correctly

---

## 🎉 Ready to Test!

Follow these steps in order and report any issues you find.


