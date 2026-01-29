# Transfer-Enabled Banks Architecture

## Overview

Production-grade architecture for handling transfer-enabled banks in a payment system. Uses Paystack's advisory metadata (`pay_with_bank_transfer=true`) to identify banks that support transfers, with hard failure handling during actual recipient and transfer creation.

## Key Principles

1. **No Hardcoded Lists**: All bank data comes from Paystack API
2. **Advisory vs Authoritative**: Paystack metadata is advisory; hard validation happens during API calls
3. **Hard Failure Handling**: Comprehensive error handling for recipient and transfer creation
4. **Provider Agnostic**: Architecture supports easy provider swap
5. **Zero Fake Operations**: No test recipients, no probing, no API abuse

## Architecture Components

### 1. Transfer-Enabled Banks Service
**File**: `lib/services/transfer-enabled-banks-service.ts`

- Fetches banks using Paystack's `pay_with_bank_transfer=true` parameter
- Caches results for 24 hours
- Auto-refreshes daily
- Returns only banks that Paystack indicates support transfers (advisory)

**Key Methods**:
- `getTransferEnabledBanks(country)`: Get cached or fresh transfer-enabled banks
- `refreshTransferEnabledBanks(country)`: Force refresh from Paystack
- `isTransferEnabled(bankCode, country)`: Check if bank code is in list
- `getCacheStatus(country)`: Get cache status for monitoring

### 2. Bank Validation Service
**File**: `lib/services/bank-validation-service.ts`

- **Advisory Validation**: Checks if bank is in transfer-enabled list
- **Hard Failure Handling**: Processes errors from recipient/transfer creation
- Provides structured error responses with actionable guidance

**Key Methods**:
- `validateForTransfer(bankCode, country)`: Advisory check (returns `isAdvisory: true`)
- `handleRecipientCreationFailure(error)`: Hard failure handler for recipient creation
- `handleTransferCreationFailure(error)`: Hard failure handler for transfer creation

### 3. API Endpoints

#### `/api/paystack/banks/payout`
**Purpose**: Transfer-enabled banks only (for provider onboarding and bank details)

- Returns only banks that support transfers
- Uses Paystack's `pay_with_bank_transfer=true` parameter
- Cached for performance
- Used by frontend for bank selection

#### `/api/paystack/banks/ui`
**Purpose**: All banks for display (if needed for UI purposes)

- Returns all active banks from Paystack
- May include banks that don't support transfers
- Use only for display, not for bank selection

#### `/api/paystack/banks` (Deprecated)
**Purpose**: Backward compatibility

- Now redirects to transfer-enabled banks service
- Maintained for existing frontend code
- Will be removed in future version

## Flow Diagrams

### Provider Bank Details Save Flow

```
1. Provider selects bank from /api/paystack/banks/payout
   ↓
2. Frontend sends bank code to /api/provider/[id]/bank-details
   ↓
3. Backend: Advisory validation (BankValidationService.validateForTransfer)
   - Checks if bank is in transfer-enabled list
   - Returns warning if not (but doesn't fail)
   ↓
4. Backend: Create Paystack recipient (hard validation)
   - Paystack API validates bank code authoritatively
   - If invalid: Hard failure handler provides structured error
   ↓
5. Success: Recipient code stored, bank details saved
```

### Payment Release Flow

```
1. Client confirms completion
   ↓
2. Backend: Advisory validation (optional warning)
   ↓
3. Backend: Create/use recipient (hard validation)
   - If recipient creation fails: Hard failure handler
   ↓
4. Backend: Create transfer (hard validation)
   - If transfer creation fails: Hard failure handler
   ↓
5. Success: Payment released, status updated
```

## Hard Failure Handling

### Recipient Creation Failures

**Error Types**:
- `invalid_bank_code`: Bank code rejected by payment provider
- `invalid_account_number`: Account number invalid
- `invalid_account_name`: Account name mismatch
- `API error`: Payment provider API error

**Response Structure**:
```typescript
{
  isHardFailure: true,
  error: string,
  details: string,
  recoverable: boolean,
  actionRequired: string // e.g., "PROVIDER_UPDATE_BANK_DETAILS"
}
```

### Transfer Creation Failures

**Error Types**:
- `Insufficient funds`: Account doesn't have funds
- `Invalid recipient`: Recipient code invalid/deleted
- `Transfer limit exceeded`: Amount exceeds limit
- `API error`: Payment provider API error

**Response Structure**: Same as recipient creation failures

## Advisory vs Authoritative Validation

### Advisory (Pre-validation)
- **When**: Before creating recipient/transfer
- **Source**: Transfer-enabled banks service (Paystack metadata)
- **Purpose**: Early warning, user guidance
- **Failure Action**: Warning logged, but doesn't block operation

### Authoritative (Hard Validation)
- **When**: During actual API calls (createRecipient, createTransfer)
- **Source**: Payment provider API response
- **Purpose**: Final validation, actual rejection
- **Failure Action**: Hard failure, structured error response, operation blocked

## Provider Swap Considerations

The architecture is designed for easy provider swap:

1. **Abstraction Layer**: Services use payment provider client interface
2. **No Hardcoded Logic**: All provider-specific logic in client layer
3. **Error Handling**: Generic error handling, provider-specific in client
4. **Bank Service**: Can be swapped to use different provider's bank list API

**To Swap Providers**:
1. Implement new payment provider client (same interface)
2. Update transfer-enabled banks service to use new provider's API
3. Update error handling in validation service (if needed)
4. No changes needed to API endpoints or frontend

## Monitoring & Observability

### Cache Status
- Check cache freshness: `getCacheStatus(country)`
- Monitor cache hits/misses
- Track refresh failures

### Hard Failures
- All hard failures logged with structured data
- Error types tracked for monitoring
- Actionable error messages for users

### Advisory Warnings
- Logged but don't block operations
- Useful for identifying potential issues early

## Best Practices

1. **Always use `/payout` endpoint** for bank selection
2. **Trust hard validation** over advisory checks
3. **Handle hard failures gracefully** with user-friendly messages
4. **Monitor cache status** to ensure fresh data
5. **Log all failures** for debugging and monitoring

## Security & Compliance

- ✅ No fake financial operations
- ✅ No API abuse (no probing/test recipients)
- ✅ Compliant with payment provider terms
- ✅ No hardcoded bank lists
- ✅ All validation via official APIs

## Future Enhancements

1. **Redis Caching**: Move from in-memory to Redis for multi-instance deployments
2. **Webhook Integration**: Update bank list when Paystack notifies of changes
3. **Provider Abstraction**: Full provider abstraction layer for easy swap
4. **Monitoring Dashboard**: Real-time monitoring of bank list freshness and failures
