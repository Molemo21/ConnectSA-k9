# Stress Test Suite - Quick Start

## 🚀 Run Tests (3 Steps)

### 1. Set Database URL
```bash
export DATABASE_URL="postgresql://user:password@host:5432/staging_db"
```

### 2. Install Dependencies (if needed)
```bash
npm install tsx --save-dev
# or
yarn add -D tsx
```

### 3. Run Tests
```bash
./scripts/run-stress-tests.sh
# or
npx tsx scripts/stress-test-financial-system.ts
```

## 📊 What Gets Tested

| Test | Concurrent Operations | Validates |
|------|----------------------|-----------|
| **Webhooks** | 100 simultaneous | Idempotency, no double-crediting |
| **Approvals** | 20 simultaneous | Atomic updates, no double-processing |
| **Batches** | 10 simultaneous | Transaction isolation, all-or-nothing |
| **Liquidity** | Edge cases | Marginal/insufficient liquidity handling |
| **Refunds** | Before/after payout | Negative balances, ledger correctness |
| **Crash Recovery** | Simulated failures | Rollback, no partial state |

## ✅ Success Criteria

- All 5 tests pass
- Accounting invariants valid
- No duplicate ledger entries
- No partial transactions
- Liquidity checks enforced

## 📝 Test Output

Each test shows:
- ✅ PASSED / ❌ FAILED
- Duration in milliseconds
- Errors (if any)
- Warnings (if any)
- Detailed results

## 🔧 Configuration

Edit `CONFIG` in `stress-test-financial-system.ts`:
- `CONCURRENT_WEBHOOKS`: 100 (default)
- `CONCURRENT_APPROVALS`: 20 (default)
- `CONCURRENT_BATCHES`: 10 (default)

## ⚠️ Important

- **Only run on staging/test databases**
- Tests create real financial data
- Ensure database backups before running

## 📚 Full Documentation

See `scripts/STRESS_TEST_README.md` for complete documentation.
