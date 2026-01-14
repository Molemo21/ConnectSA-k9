# 🔒 Production Safety Contract

## Non-Negotiable Rules

This document codifies invariants that **MUST NEVER** be violated. These rules are enforced technically, not procedurally.

## Contract Invariants

### 1. Prisma CLI Direct Execution is Impossible

**Rule:** `npx prisma migrate deploy` **CANNOT** run directly, even with `CI=true` and `NODE_ENV=production`.

**Enforcement:**
- `scripts/prisma-wrapper-hardened.js` blocks all direct Prisma CLI execution
- `migrate deploy` requires `PRISMA_DEPLOYMENT_APPROVED=true` flag
- Flag is ONLY set by `scripts/deploy-db.js` after all guards pass

**Proof:** `npm run test:production-safety-hardened`

### 2. Local Deployment is Impossible

**Rule:** `node scripts/deploy-db.js` **CANNOT** run locally, even with `NODE_ENV=production`.

**Enforcement:**
- Requires `CI=true` (no bypass)
- Checks parent process context
- Fails immediately if not in CI

**Proof:** `npm run test:production-safety-hardened`

### 3. DATABASE_URL Misuse Fails Before Prisma Initializes

**Rule:** If `DATABASE_URL` points to production in development/test context, process exits **BEFORE** any Prisma client is created.

**Enforcement:**
- `validateDatabaseUrlEarly()` in `prisma-wrapper-hardened.js`
- `validateDatabaseUrlEarly()` in `lib/prisma.ts`
- Both run before Prisma client instantiation

**Proof:** `npm run test:production-safety-hardened`

### 4. Deployment Steps are Order-Locked

**Rule:** It is **IMPOSSIBLE** to:
- Run deployment before verification
- Run deployment without backup

**Enforcement:**
- State files in `.deployment-state/`
- `deploy-db.js` requires verification and backup state files
- State files are created by respective scripts

**Proof:** `npm run test:production-safety-hardened`

### 5. Promotion-Only Workflow

**Rule:** Production mutation **ONLY** possible via:
- Single command: `npm run deploy`
- In CI (`CI=true`)
- From clean git state (enforced by CI)

**Enforcement:**
- `npm run deploy` = `predeploy && backup:production && deploy:db`
- Each step requires previous step's state file
- All steps require `CI=true`

**Proof:** `npm run test:production-safety-hardened`

### 6. Frozen Contract (No Regression)

**Rule:** These invariants **MUST NEVER** be violated:
- Only `deploy-db.js` may call `prisma migrate deploy`
- No script except migrations may mutate production
- No bypass flags allowed (ever)
- No destructive SQL outside migrations

**Enforcement:**
- Static analysis in test suite
- CI checks prevent regression
- Test assertions fail if rules violated

**Proof:** `npm run test:production-safety-hardened`

## Technical Enforcement

### Files

1. **`scripts/prisma-wrapper-hardened.js`**
   - Blocks direct Prisma CLI execution
   - Early DATABASE_URL validation
   - Enforces approved deployment path

2. **`scripts/deployment-state.js`**
   - Order-locked state management
   - Prevents out-of-order execution

3. **`scripts/deploy-db.js`**
   - Sets `PRISMA_DEPLOYMENT_APPROVED=true`
   - Requires verification and backup state
   - Acquires deployment lock

4. **`lib/prisma.ts`**
   - Early DATABASE_URL validation
   - Fails before Prisma client initialization

5. **`scripts/test-production-safety-hardened.js`**
   - Proves all guarantees
   - Fails if invariants violated

## Default to Deny

- **No environment variable bypasses** - Guards check actual conditions
- **No "temporary" flags** - All guards are permanent
- **No manual steps** - Everything is automated and enforced

## If Safety Depends on Human Discipline

**It is unacceptable.**

Every safety rule is enforced technically. If a guarantee cannot be enforced technically, it must be explicitly stated why and an alternative proposed.

## Testing

Run the comprehensive test suite:

```bash
npm run test:production-safety-hardened
```

This proves:
- ✅ Direct Prisma CLI execution fails
- ✅ Local deployment fails
- ✅ DATABASE_URL misuse fails early
- ✅ Out-of-order deployment fails
- ✅ Contract invariants are enforced

## Violation Response

If any test fails, the system is **UNSAFE** and deployment is **BLOCKED** until fixed.

## Last Updated

This contract is enforced by code. Any changes to enforcement logic must:
1. Update this document
2. Update tests
3. Prove all guarantees still hold

---

**This contract is non-negotiable. Safety is not optional.**
