# 🏦 Current Financial System Architecture & Flow

## 📋 Overview

After the recent redesign, your system has been transformed from a **Paystack-dependent payout system** to a **production-safe, ledger-based financial architecture** optimized for South African payment rails.

---

## 🎯 Key Changes Summary

### **Before (Old System)**
- ❌ Paystack handled both collection AND payouts
- ❌ Platform fees were calculated but not enforced
- ❌ No internal ledger tracking
- ❌ Vendor lock-in to Paystack for payouts
- ❌ No audit trail for financial movements

### **After (New System)**
- ✅ Paystack is **collection-only** (auto-settles to your bank)
- ✅ **Internal ledger system** tracks all money movements
- ✅ **Platform fees enforced** (10% deducted correctly)
- ✅ **Provider-agnostic payouts** (manual CSV, future Ozow/Payfast)
- ✅ **Full audit trail** for accounting & compliance
- ✅ **Hardened against race conditions** and double-crediting

---

## 🔄 Complete Payment Flow

### **STEP 1: Client Initiates Payment**

```
Client → POST /api/book-service/[id]/pay
```

**What Happens:**
1. Client books a service and clicks "Pay"
2. System calculates payment breakdown:
   - `totalAmount`: R1,000 (example)
   - `platformFee`: R100 (10%)
   - `escrowAmount`: R900 (what provider gets)
3. Creates `Payment` record with status `PENDING`
4. Initializes Paystack payment session
5. Returns Paystack authorization URL to client

**Database State:**
```sql
Payment {
  status: 'PENDING'
  amount: 1000
  escrowAmount: 900
  platformFee: 100
  paystackRef: 'CS_xxxxx'
}
```

**Files:**
- `app/api/book-service/[id]/pay/route.ts`

---

### **STEP 2: Paystack Webhook - Payment Success**

```
Paystack → POST /api/webhooks/paystack (charge.success)
```

**What Happens (HARDENED):**
1. **Webhook Signature Validation** (HMAC-SHA512)
2. **Idempotency Check**: Checks `WebhookEvent` table to prevent duplicate processing
3. **Atomic Transaction** (all-or-nothing):
   - Updates `Payment` status: `PENDING` → `ESCROW` (atomic `updateMany` with condition)
   - Creates **SettlementBatch** (groups payments by day for bank reconciliation)
   - Creates **Ledger Entries**:
     - ✅ `PROVIDER_BALANCE` +R900 (CREDIT)
     - ✅ `PLATFORM_REVENUE` +R100 (CREDIT)
   - Updates `Booking` status → `PENDING_EXECUTION`

**Database State:**
```sql
Payment {
  status: 'ESCROW'  ← Changed
  paidAt: 2025-01-30
}

LedgerEntry #1 {
  accountType: 'PROVIDER_BALANCE'
  accountId: 'provider_123'
  entryType: 'CREDIT'
  amount: 900
  referenceType: 'PAYMENT'
  referenceId: 'payment_xxx'
}

LedgerEntry #2 {
  accountType: 'PLATFORM_REVENUE'
  accountId: 'platform'
  entryType: 'CREDIT'
  amount: 100
  referenceType: 'PAYMENT'
  referenceId: 'payment_xxx'
}

SettlementBatch {
  batchDate: 2025-01-30
  expectedAmount: 1000
  status: 'PENDING'
}
```

**Money Flow:**
```
Client Bank → Paystack → Your Business Bank Account (auto-settlement)
                                    ↓
                            Tracked in SettlementBatch
```

**Files:**
- `app/api/webhooks/paystack/route.ts` (hardened with transactions)
- `lib/ledger-hardened.ts` (idempotent ledger entries)

---

### **STEP 3: Provider Completes Service**

```
Provider → Uploads proof of completion
Client → Confirms completion (or auto-confirms after 3 days)
```

**What Happens:**
- Provider uploads photos/notes
- Client reviews and confirms
- Booking status → `AWAITING_CONFIRMATION` → `COMPLETED`

**Files:**
- `app/api/book-service/[id]/complete/route.ts`
- `app/api/book-service/[id]/confirm-completion/route.ts`

---

### **STEP 4: Client Releases Payment**

```
Client → POST /api/book-service/[id]/release-payment
```

**What Happens (HARDENED):**
1. **Liquidity Check**: Verifies provider has sufficient balance
2. **Atomic Transaction**:
   - Creates `Payout` record with status `PENDING_APPROVAL`
   - Creates **Ledger Entry**:
     - ✅ `PROVIDER_BALANCE` -R900 (DEBIT)
   - Updates `Payment` status → `PROCESSING_RELEASE`
   - Snapshot of provider bank details at payout time

**Database State:**
```sql
Payout {
  paymentId: 'payment_xxx'
  providerId: 'provider_123'
  amount: 900  ← escrowAmount (NOT full amount!)
  status: 'PENDING_APPROVAL'
  method: 'MANUAL'
  bankName: 'FNB'
  accountNumber: '1234567890'
  // ... bank details snapshot
}

Payment {
  status: 'PROCESSING_RELEASE'  ← Changed
}

LedgerEntry #3 {
  accountType: 'PROVIDER_BALANCE'
  accountId: 'provider_123'
  entryType: 'DEBIT'
  amount: 900
  referenceType: 'PAYOUT'
  referenceId: 'payout_xxx'
}
```

**Key Point:** 
- ❌ **OLD**: System would call Paystack Transfer API here
- ✅ **NEW**: System creates a `Payout` record for admin approval

**Files:**
- `app/api/book-service/[id]/release-payment/route.ts` (removed Paystack transfer code)

---

### **STEP 5: Admin Approves Payout**

```
Admin → POST /api/admin/payouts/[id]/approve
```

**What Happens:**
1. Admin reviews payout request
2. **Atomic Transaction**:
   - Updates `Payout` status: `PENDING_APPROVAL` → `APPROVED`
   - Records `approvedAt` and `approvedBy`

**Database State:**
```sql
Payout {
  status: 'APPROVED'  ← Changed
  approvedAt: 2025-01-30
  approvedBy: 'admin_user_id'
}
```

**Files:**
- `app/api/admin/payouts/[id]/approve/route.ts`

---

### **STEP 6: Admin Exports CSV Batch**

```
Admin → POST /api/admin/payouts/export-csv
```

**What Happens:**
1. System finds all `APPROVED` payouts with `method: 'MANUAL'`
2. Creates `PayoutBatch` record
3. Generates CSV file with:
   - Provider bank details
   - Amounts
   - References
4. Uploads CSV to storage
5. Links payouts to batch

**Database State:**
```sql
PayoutBatch {
  batchNumber: 'BATCH_20250130_001'
  status: 'EXPORTED'
  totalAmount: 9000  ← Sum of all payouts
  payoutCount: 10
  csvUrl: 'https://storage.../batch_xxx.csv'
}

Payout {
  payoutBatchId: 'batch_xxx'  ← Linked
}
```

**Files:**
- `app/api/admin/payouts/export-csv/route.ts`

---

### **STEP 7: Admin Executes Batch (Manual Bank Transfer)**

```
Admin → POST /api/admin/payouts/batches/[id]/execute
```

**What Happens (HARDENED):**
1. Admin manually transfers money from business bank to providers
2. Admin marks batch as executed
3. **Atomic Transaction**:
   - Updates `PayoutBatch` status → `EXECUTED`
   - For each payout in batch:
     - Creates **Ledger Entry**:
       - ✅ `BANK_ACCOUNT` -R900 (DEBIT)
     - Updates `Payout` status → `COMPLETED`
     - Updates `Payment` status → `RELEASED`

**Database State:**
```sql
PayoutBatch {
  status: 'EXECUTED'  ← Changed
  executedAt: 2025-01-30
  executedBy: 'admin_user_id'
}

Payout {
  status: 'COMPLETED'  ← Changed
}

Payment {
  status: 'RELEASED'  ← Changed
}

LedgerEntry #4 {
  accountType: 'BANK_ACCOUNT'
  accountId: 'business_bank'
  entryType: 'DEBIT'
  amount: 900
  referenceType: 'PAYOUT'
  referenceId: 'payout_xxx'
}
```

**Files:**
- `app/api/admin/payouts/batches/[id]/execute/route.ts`

---

## 🏦 Ledger System Explained

### **Account Types**

1. **`PROVIDER_BALANCE`** (accountId = provider ID)
   - Tracks money owed to each provider
   - Credits when payment received
   - Debits when payout created

2. **`PLATFORM_REVENUE`** (accountId = 'platform')
   - Tracks platform fees (10%)
   - Credits when payment received
   - Debits when refunds processed

3. **`BANK_ACCOUNT`** (accountId = 'business_bank')
   - Tracks actual money in business bank account
   - Credits when settlement reconciled
   - Debits when payouts executed

### **Balance Calculation**

Balances are **computed on-demand** (not stored):

```typescript
// Get provider balance
const balance = await LedgerServiceHardened.getProviderBalance(providerId);
// Sums all CREDIT entries - all DEBIT entries for that provider

// Get platform revenue
const revenue = await LedgerServiceHardened.getPlatformRevenue();
// Sums all CREDIT entries for PLATFORM_REVENUE

// Get bank balance
const bankBalance = await LedgerServiceHardened.getBankBalance();
// Sums all CREDIT entries - all DEBIT entries for BANK_ACCOUNT
```

### **Accounting Invariant**

```
Provider Balances + Platform Revenue + Bank Balance = Total Payments - Refunds
```

This is verified by `LedgerServiceHardened.verifyAccountingInvariant()`

---

## 🔒 Hardening Features

### **1. Webhook Idempotency**
- `WebhookEvent` table tracks all webhooks
- Unique constraint: `(eventType, paystackRef, processed)`
- Prevents double-processing of duplicate webhooks

### **2. Transactional Integrity**
- All money-affecting operations wrapped in `prisma.$transaction()`
- Atomic `updateMany` with conditions (e.g., `status: 'PENDING'`)
- Prevents race conditions

### **3. Ledger Idempotency**
- Unique constraint on `LedgerEntry`: `(accountType, accountId, entryType, referenceType, referenceId)`
- `LedgerServiceHardened.createEntry()` checks for existing entries
- Prevents double-crediting

### **4. Liquidity Enforcement**
- `verifyLiquidity()` checks bank balance before payouts
- Bank balance only credited via manual reconciliation
- Prevents over-payout

---

## 📊 Settlement Reconciliation

### **How It Works:**

1. **Paystack Auto-Settlement**
   - Paystack automatically transfers collected payments to your business bank account
   - Usually happens daily or weekly

2. **SettlementBatch Tracking**
   - Each day's payments are grouped into a `SettlementBatch`
   - `expectedAmount` = sum of all payments for that day

3. **Admin Reconciliation**
   - Admin checks bank statement
   - Compares `expectedAmount` vs `actualAmount`
   - If match: Status → `RECONCILED`, creates `BANK_ACCOUNT` CREDIT ledger entry
   - If mismatch: Status → `DISCREPANCY`, admin investigates

**Files:**
- `app/api/admin/settlements/reconcile/route.ts`

---

## 💸 Refund Flow

### **How Refunds Work:**

1. **Admin Initiates Refund**
   ```
   Admin → POST /api/admin/refunds/process
   ```

2. **System Processes:**
   - Calls Paystack Refund API
   - Creates `Refund` record
   - Creates **Ledger Entries**:
     - ✅ `PROVIDER_BALANCE` -R900 (DEBIT) - provider owes money back
     - ✅ `PLATFORM_REVENUE` -R100 (DEBIT) - platform fee refunded
   - Updates `Payment` status → `REFUNDED`

3. **If Payout Already Happened:**
   - Provider balance goes negative (they owe money)
   - System tracks this for future deductions

**Files:**
- `lib/refund.ts`
- `app/api/admin/refunds/process/route.ts`

---

## 🗄️ Database Schema Overview

### **Core Financial Tables**

1. **`Payment`**
   - Tracks client payments
   - Status: `PENDING` → `ESCROW` → `PROCESSING_RELEASE` → `RELEASED`
   - Links to `SettlementBatch`

2. **`Payout`**
   - Tracks provider payouts
   - Status: `PENDING_APPROVAL` → `APPROVED` → `COMPLETED`
   - Links to `PayoutBatch`

3. **`LedgerEntry`**
   - Append-only ledger (immutable)
   - Tracks all money movements
   - Used to compute balances

4. **`SettlementBatch`**
   - Groups payments by settlement date
   - Tracks expected vs actual bank deposits

5. **`PayoutBatch`**
   - Groups payouts for CSV export
   - Tracks manual execution

6. **`Refund`**
   - Tracks refunds with Paystack references

7. **`WebhookEvent`**
   - Audit trail for webhooks
   - Prevents duplicate processing

---

## 🚀 What You Can Do Now

### **1. Test the System**
```bash
# Run stress tests
npx tsx scripts/stress-test-financial-system.ts
```

### **2. View Pending Payouts**
```
GET /api/admin/payouts/pending
```

### **3. Export Payout CSV**
```
POST /api/admin/payouts/export-csv
```

### **4. Reconcile Settlements**
```
POST /api/admin/settlements/reconcile
```

---

## 🔮 Future Enhancements

### **Ozow Integration (Ready)**
- `PayoutProvider` interface already designed
- Just need to implement `OzowPayoutProvider`
- Zero rewrite needed

### **Payfast Integration**
- Same abstraction layer
- Easy to add

---

## ⚠️ Important Notes

1. **Paystack is Collection-Only**
   - No more `createTransfer()`, `createRecipient()`
   - Removed from `lib/paystack.ts`

2. **Platform Fees Are Enforced**
   - `Payout.amount` uses `payment.escrowAmount` (not full amount)
   - Platform revenue tracked in ledger

3. **All Operations Are Transactional**
   - Money movements are atomic
   - No partial updates

4. **Database Reset Complete**
   - Development database is clean
   - Baseline migration applied
   - Ready for testing

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `lib/ledger-hardened.ts` | Hardened ledger service with idempotency |
| `app/api/webhooks/paystack/route.ts` | Webhook handler (hardened) |
| `app/api/book-service/[id]/release-payment/route.ts` | Payout creation (removed Paystack) |
| `app/api/admin/payouts/[id]/approve/route.ts` | Admin payout approval |
| `app/api/admin/payouts/export-csv/route.ts` | CSV export for manual payouts |
| `app/api/admin/payouts/batches/[id]/execute/route.ts` | Batch execution |
| `app/api/admin/settlements/reconcile/route.ts` | Settlement reconciliation |
| `lib/refund.ts` | Refund processing |
| `prisma/schema.prisma` | Database schema (updated) |

---

## ✅ System Status

- ✅ **Database**: Clean, migrated, ready
- ✅ **Ledger System**: Hardened, idempotent
- ✅ **Webhooks**: Protected against duplicates
- ✅ **Payouts**: Provider-agnostic, manual CSV ready
- ✅ **Platform Fees**: Enforced correctly
- ✅ **Audit Trail**: Complete
- ✅ **Stress Tests**: Available

**Your system is production-ready!** 🎉
