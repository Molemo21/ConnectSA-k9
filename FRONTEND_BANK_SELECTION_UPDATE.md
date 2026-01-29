# Frontend Bank Selection Update

## Summary

All frontend bank selection components have been updated to use the transfer-enabled banks endpoint (`/api/paystack/banks/payout`) instead of the general banks endpoint. This ensures providers can only select banks that support Paystack transfers.

## Changes Made

### 1. Updated Components

#### `components/provider/bank-details-form.tsx`
- ✅ Changed fetch URL from `/api/paystack/banks?country=ZA&currency=ZAR` to `/api/paystack/banks/payout?country=ZA`
- ✅ Removed fallback banks usage (empty array)
- ✅ Added Alert component with "Only transfer-enabled banks supported" notice
- ✅ Updated error handling to not use fallback banks
- ✅ Updated console logs to indicate transfer-enabled banks

#### `components/provider/steps/BankingStep.tsx`
- ✅ Changed fetch URL from `/api/paystack/banks?country=ZA&currency=ZAR` to `/api/paystack/banks/payout?country=ZA`
- ✅ Removed fallback banks usage (empty array)
- ✅ Added Alert component with "Only transfer-enabled banks supported" notice
- ✅ Updated error handling to not use fallback banks

#### `components/provider/provider-bank-details-content.tsx`
- ✅ Changed fetch URL from `/api/paystack/banks?country=ZA&currency=ZAR` to `/api/paystack/banks/payout?country=ZA`
- ✅ Removed fallback banks usage (empty array)
- ✅ Added Alert component with "Only transfer-enabled banks supported" notice
- ✅ Updated error handling to not use fallback banks
- ✅ Updated "Bank List Status" card to show "Transfer-Enabled Banks Status"
- ✅ Removed all references to fallback banks in UI

### 2. UI Improvements

- **Alert Notice**: All forms now display a clear notice that only transfer-enabled banks are supported
- **Error Messages**: Updated to be more specific about transfer-enabled banks
- **Status Cards**: Updated to reflect transfer-enabled banks status instead of fallback status

### 3. Code Quality

- ✅ No linting errors
- ✅ Consistent error handling across all components
- ✅ Proper TypeScript types maintained
- ✅ React best practices followed (useCallback, useEffect cleanup)

## Testing Guide

### Sandbox Mode Testing

1. **Set Environment Variables**:
```bash
PAYSTACK_TEST_MODE=true
NODE_ENV=development
```

2. **Test Bank Selection**:
   - Navigate to provider bank details form
   - Verify only transfer-enabled banks are shown
   - Verify "Only transfer-enabled banks supported" notice is displayed
   - Select a bank and save
   - Check backend logs for recipient creation

3. **Test Error Handling**:
   - Simulate API failure (disable network)
   - Verify error message is shown
   - Verify no fallback banks are used
   - Verify form is disabled when no banks are available

### Live Mode Testing

1. **Switch to Live Mode**:
```bash
PAYSTACK_TEST_MODE=false
NODE_ENV=production
```

2. **Test with Real Accounts**:
   - Test with Capitec (if supported)
   - Test with FNB
   - Test with ABSA
   - Test with Standard Bank

3. **Monitor Backend Logs**:
```bash
# Watch for transfer-enabled banks loading
grep "transfer-enabled banks" logs/app.log

# Watch for hard failures
grep "HARD FAILURE" logs/app.log

# Watch for cache refreshes
grep "Transfer-enabled banks refreshed" logs/app.log
```

## Expected Behavior

### Success Case
- ✅ Form loads with transfer-enabled banks from `/api/paystack/banks/payout`
- ✅ Alert notice is displayed: "Only transfer-enabled banks supported"
- ✅ Provider can select a bank and save successfully
- ✅ Backend validates bank code and creates recipient

### Error Cases
- ✅ If API fails: Error message shown, no fallback banks used
- ✅ If no banks returned: Error message shown, form disabled
- ✅ If bank not in list: Validation error shown

## Cache & Refresh

The transfer-enabled banks service:
- ✅ Caches results for 24 hours
- ✅ Auto-refreshes daily
- ✅ Returns stale cache if refresh fails (graceful degradation)

### Monitoring Cache Status

Check cache status via logs:
```bash
grep "Using cached transfer-enabled banks" logs/app.log
grep "Transfer-enabled banks refreshed" logs/app.log
```

## Next Steps

### Phase 1: Paystack (Current)
- ✅ Frontend uses transfer-enabled banks endpoint
- ✅ Backend validates against transfer-enabled banks
- ✅ Hard failure handling implemented

### Phase 2: Multi-Provider Support (Future)
- Plan for secondary provider (Ozow/Payfast)
- Update bank service to aggregate from multiple providers
- Update UI to show provider for each bank
- Update validation to try multiple providers

## Notes

- **No Fallback Banks**: Fallback banks are completely removed. Only transfer-enabled banks from the API are used.
- **Advisory Metadata**: Paystack metadata is advisory, not authoritative. Hard validation happens during recipient creation.
- **Provider Agnostic**: Architecture supports easy provider swap without breaking existing flows.
