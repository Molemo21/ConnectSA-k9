# Financial System Stress Test Suite

## Overview

Comprehensive stress-test suite for the hardened financial system, validating:
- Webhook idempotency and double-credit protection
- Concurrent payout approvals
- Multi-batch execution with transaction isolation
- Edge-case liquidity and refund scenarios
- Crash and recovery simulation

## Prerequisites

1. **Staging Database**: Set `DATABASE_URL` to your staging database
2. **Prisma Schema**: Ensure schema is migrated with all hardening constraints
3. **Dependencies**: Install required packages

```bash
npm install
# or
yarn install
```

## Running the Tests

### Option 1: Using the Shell Script (Recommended)

```bash
export DATABASE_URL="postgresql://user:password@host:5432/staging_db"
./scripts/run-stress-tests.sh
```

### Option 2: Direct Execution

```bash
export DATABASE_URL="postgresql://user:password@host:5432/staging_db"
npx tsx scripts/stress-test-financial-system.ts
```

## Test Scenarios

### 1. Concurrent Webhooks (100 simultaneous)
- **Purpose**: Test idempotency and ledger uniqueness constraints
- **Validates**: 
  - No double-crediting of ledger entries
  - Payment status updated atomically
  - Database constraints prevent duplicates

### 2. Concurrent Payout Approvals (20 simultaneous)
- **Purpose**: Test atomic updates and prevent double-processing
- **Validates**:
  - Only one approval succeeds
  - Payout status updated atomically
  - Liquidity checks within transaction

### 3. Multi-Batch Execution (10 simultaneous batches)
- **Purpose**: Test Serializable isolation and all-or-nothing guarantees
- **Validates**:
  - All batches execute correctly
  - No partial state
  - Accounting remains correct

### 4. Edge-Case Liquidity & Refunds
- **Purpose**: Test marginal liquidity and refund scenarios
- **Validates**:
  - Marginal liquidity handled correctly
  - Insufficient liquidity rejected
  - Refunds before payout
  - Refunds after payout (negative balances)

### 5. Crash and Recovery
- **Purpose**: Simulate process crash mid-transaction
- **Validates**:
  - Transactions rollback completely
  - No partial ledger entries
  - Safe recovery after crash

## Test Configuration

Edit `CONFIG` object in `stress-test-financial-system.ts`:

```typescript
const CONFIG = {
  CONCURRENT_WEBHOOKS: 100,      // Number of simultaneous webhooks
  CONCURRENT_APPROVALS: 20,       // Number of simultaneous approvals
  CONCURRENT_BATCHES: 10,         // Number of simultaneous batches
  PAYOUT_AMOUNT: 1000.00,         // Test payout amount
  PLATFORM_FEE_RATE: 0.10,        // Platform fee percentage
};
```

## Expected Output

```
🚀 Starting Financial System Stress Test Suite
================================================================================

🧪 TEST 1: Concurrent Webhooks (Idempotency)
   Simulating 100 simultaneous webhooks...
   ✅ PASSED (1234ms)

🧪 TEST 2: Concurrent Payout Approvals (Atomic Updates)
   Simulating 20 simultaneous approvals...
   ✅ PASSED (567ms)

🧪 TEST 3: Multi-Batch Execution (Transaction Isolation)
   Simulating 10 simultaneous batch executions...
   ✅ PASSED (2345ms)

🧪 TEST 4: Edge-Case Liquidity & Refunds
   Testing marginal liquidity and refund scenarios...
   4.1: Testing marginal liquidity...
     ✅ Marginal liquidity test passed
   4.2: Testing insufficient liquidity...
     ✅ Insufficient liquidity correctly rejected
   4.3: Testing refund before payout...
     ✅ Refund before payout handled correctly
   4.4: Testing refund after payout...
     ✅ Refund after payout handled correctly (negative balance allowed)
   ✅ PASSED (3456ms)

🧪 TEST 5: Crash and Recovery Simulation
   Testing transaction rollback and recovery...
   5.1: Simulating crash mid-transaction...
     ✅ Transaction rolled back correctly
   5.2: Verifying no partial ledger entries...
     ✅ No partial ledger entries created
   5.3: Testing recovery after crash...
     ✅ Recovery successful
   ✅ PASSED (1234ms)

🔍 Validating Accounting Invariants...
   ✅ Accounting invariant valid

================================================================================
STRESS TEST SUMMARY REPORT
================================================================================

Total Tests: 5
Passed: 5 ✅
Failed: 0

...
```

## Interpreting Results

### ✅ PASSED
- All assertions passed
- No errors detected
- Accounting invariants valid

### ❌ FAILED
- Check error messages for specific failures
- Review ledger entries for inconsistencies
- Verify database constraints are in place

### Warnings
- Non-critical issues that don't cause test failure
- May indicate performance concerns or edge cases

## Troubleshooting

### "Payment not found" errors
- Ensure test users are created correctly
- Check database connection

### "Unique constraint violation"
- This is expected for duplicate webhook tests
- Should be handled gracefully

### "Insufficient liquidity" errors
- Expected for liquidity edge-case tests
- Verify bank balance is set correctly

### Transaction timeout errors
- Increase timeout in test configuration
- Check database performance

## Database Cleanup

The test suite creates test data. To clean up:

```sql
-- Delete test users and related data
DELETE FROM users WHERE email LIKE 'stress-test-%@test.com';

-- Or reset entire database (CAUTION: Only on staging!)
npx prisma migrate reset
```

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/stress-tests.yml
name: Stress Tests
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  stress-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: |
          export DATABASE_URL="${{ secrets.STAGING_DATABASE_URL }}"
          ./scripts/run-stress-tests.sh
```

## Performance Benchmarks

Expected performance (may vary by database):

- Concurrent Webhooks (100): ~1-3 seconds
- Concurrent Approvals (20): ~0.5-1 second
- Multi-Batch Execution (10): ~2-5 seconds
- Edge-Case Tests: ~3-6 seconds
- Crash Recovery: ~1-2 seconds

**Total**: ~8-17 seconds

## Security Notes

⚠️ **IMPORTANT**: 
- Only run on staging/test databases
- Never run on production
- Test data includes real financial operations
- Ensure proper database backups

## Support

For issues or questions:
1. Check test output for specific error messages
2. Review `FINANCIAL_HARDENING_AUDIT_REPORT.md`
3. Verify database schema matches `prisma/schema.prisma`
