# 🛡️ PRODUCTION MUTATION CONTRACT

**IMMUTABLE RULES - NO EXCEPTIONS - NO BYPASSES**

This document defines the **FROZEN CONTRACT** for production database mutations. These rules are **PERMANENTLY ENFORCED** and **CANNOT BE WEAKENED** without breaking the test suite.

---

## 📋 **CONTRACT DEFINITION**

### **1. ALLOWED MUTATION SCRIPTS**

**ONLY** the following scripts are permitted to mutate production:

1. **`scripts/resolve-applied-migrations.js`**
   - **Allowed Operation**: `prisma migrate resolve` ONLY
   - **Scope**: Resolving partially-applied migrations BEFORE deploy-db.js runs
   - **Purpose**: Prevents P3009/P3018 errors by checking if failed migrations are actually applied
   - **Logic**: 
     - Detects failed migrations (finished_at IS NULL in _prisma_migrations)
     - Checks if migration objects (tables, enums, indexes, FKs) exist in database
     - If all objects exist: marks migration as APPLIED
     - If no objects exist: marks migration as ROLLED_BACK (allows re-run)
     - If partial (some exist, some missing): FAILS HARD (requires manual intervention)
   - **Forbidden**: Re-running migrations, creating objects, data mutations
   - **Enforcement**: CI-only execution, must run before deploy-db.js
   - **Execution Order**: Runs after backup, before deploy-db.js
   - **Safety**: Fails hard on partial application to prevent data corruption

2. **`scripts/resolve-failed-migrations.js`** (DEPRECATED - use resolve-applied-migrations.js)
   - **Status**: Kept for backward compatibility, but resolve-applied-migrations.js is preferred
   - **Purpose**: Simple resolution for known failed migrations
   - **Note**: Does not check database state - use resolve-applied-migrations.js instead

2. **`scripts/deploy-db.js`**
   - **Allowed Operation**: `prisma migrate deploy` ONLY
   - **Scope**: Schema migrations ONLY
   - **Forbidden**: Any data mutations, backups, verifications, failed migration resolution, or additional logic
   - **Enforcement**: CI-only execution, environment fingerprint validation
   - **Prerequisite**: Failed migrations MUST be resolved before this script runs

2. **`scripts/sync-reference-data-dev-to-prod.ts`** (when using --apply flag)
   - **Allowed Operations**: 
     - Create/update service categories (service_categories table)
     - Create/update services (services table)
   - **Scope**: Reference data ONLY (service_categories and services tables)
   - **Forbidden**: 
     - Any other table mutations
     - DELETE, TRUNCATE, or DROP operations
     - Modifying services with active bookings/providers
     - Any mutations outside the strict allowlist
   - **Enforcement**: 
     - CI-only execution (process.exit(1) if CI !== "true" BEFORE imports)
     - Environment fingerprint validation (DEV must be dev, PROD must be prod)
     - Strict table allowlist enforcement
     - Relationship safety checks
   - **Modes**:
     - `--dry-run` (default): Preview changes, always allowed
     - `--apply`: Apply changes, CI-only, requires typing YES
   - **Idempotent**: Re-running causes no drift
   - **No Deletions**: Services in prod not in dev are left unchanged

**DEPRECATED (HARD-BLOCKED)**:
- **`scripts/sync-dev-to-prod-services.ts`** - HARD-DEPRECATED, exits immediately with error
  - This script CANNOT mutate production
  - Exits with process.exit(1) before any imports
  - Error message directs to sync-reference-data-dev-to-prod.ts
  - This ensures there is only ONE mutation path

### **2. ALLOWED TABLES/COLUMNS**

**ONLY** the following tables may be mutated in production:

- **`services`**: name, description, categoryId, basePrice, isActive
- **`service_categories`**: name, description, icon, isActive
- **Schema tables**: Via `prisma migrate deploy` only

**ALL OTHER TABLES ARE FORBIDDEN FROM MUTATION**

### **3. FORBIDDEN OPERATIONS**

**PERMANENTLY FORBIDDEN** in production:

- ❌ DELETE operations (except deactivation via isActive flag)
- ❌ TRUNCATE operations
- ❌ DROP operations (except via migrations)
- ❌ Direct SQL execution outside migrations
- ❌ Bulk data imports
- ❌ Data transformations outside approved scripts
- ❌ Any mutation without CI=true
- ❌ Any mutation without environment fingerprint validation

### **4. ENFORCEMENT MECHANISMS**

#### **4.1 CI-Only Execution (PHYSICAL IMPOSSIBILITY)**

- **Requirement**: `CI === "true"` MUST be set
- **Enforcement**: 
  - Guards execute at TOP of file (BEFORE any imports)
  - Scripts exit with code 1 if CI !== "true"
  - Exit happens BEFORE Prisma import or database connection
- **Locations**: 
  - `scripts/resolve-failed-migrations.js` - Guards at top of file (before require statements)
  - `scripts/deploy-db.js` - Guards at top of file (before require statements)
  - `scripts/sync-reference-data-dev-to-prod.ts` - Guards at top of file (before imports, process.exit(1) if CI !== "true" when --apply)
  - `scripts/sync-dev-to-prod-services.ts` - HARD-DEPRECATED, exits immediately before any imports
  - `lib/prisma.ts` - Guards at module level (before Prisma import)
- **No Bypasses**: No environment variables, flags, or code paths can bypass this
- **Proof**: `__tests__/production-safety/misuse-tests.test.ts` - Tests actual execution

#### **4.4 Failed Migration Resolution (P3009 Prevention)**

- **Requirement**: Failed migrations MUST be resolved BEFORE `prisma migrate deploy`
- **Enforcement**: 
  - `scripts/resolve-failed-migrations.js` runs before `scripts/deploy-db.js` in CI/CD
  - `scripts/check-failed-migrations.js` runs in predeploy verification to block deployment if failed migrations exist
  - `scripts/deploy-db.js` is FORBIDDEN from resolving failed migrations (separation of concerns)
- **Execution Order** (MANDATORY):
  1. Pre-deployment verification (includes failed migration check)
  2. Backup
  3. Resolve failed migrations (`resolve-failed-migrations.js`)
  4. Deploy migrations (`deploy-db.js`)
- **Failure Mode**: Hard failure - deployment blocked if failed migrations exist
- **Rationale**: Prisma P3009 error blocks all migrations if any failed migration exists. Resolution must happen in separate step before migrate deploy.

#### **4.2 Environment Fingerprinting (MISCONFIGURATION-PROOF)**

- **Requirement**: Database MUST have `database_metadata` table with correct environment
- **Enforcement**: 
  - Validation happens in `PrismaWithRetry.connect()` BEFORE `super.$connect()`
  - Hard failure if fingerprint doesn't match expected environment
  - No fallback mechanisms
- **Location**: `lib/env-fingerprint.ts` + `lib/prisma.ts`
- **Failure Mode**: Hard failure - no fallback, no warnings
- **Proof**: `__tests__/production-safety/fingerprint-validation.test.ts` - Tests validation logic

#### **4.3 Mutation Contract Validation**

- **Requirement**: Tests MUST fail if contract is violated
- **Enforcement**: Automated test suite validates contract
- **Location**: `__tests__/production-safety/`
- **Failure Mode**: CI pipeline fails if contract is broken

---

## 🚫 **WHAT IS NOW IMPOSSIBLE**

### **1. Local Production Mutations**

**IMPOSSIBLE**: Running mutation scripts locally against production
- Scripts check `CI !== "true"` and exit immediately
- No bypass flags or environment variables
- Hard failure before any database connection

**Proof**: Tests in `__tests__/production-safety/ci-enforcement.test.ts`

### **2. Misconfigured Database Access**

**IMPOSSIBLE**: Using dev tooling against prod database (or vice versa)
- Environment fingerprint validation happens before Prisma init
- Hard failure if fingerprint doesn't match expected environment
- No warnings - only hard failures

**Proof**: Tests in `__tests__/production-safety/fingerprint-validation.test.ts`

### **3. Accidental Contract Violations**

**IMPOSSIBLE**: Adding new mutation scripts without tests failing
- Test suite scans for mutation scripts
- Fails if new scripts are added without contract approval
- Fails if `deploy-db.js` gains extra logic beyond `prisma migrate deploy`
- Fails if old sync script can still mutate production
- Fails if table allowlist is expanded without approval

**Proof**: Tests in `__tests__/production-safety/mutation-contract.test.ts`

### **4. Multiple Mutation Paths**

**IMPOSSIBLE**: Having two working mutation paths for reference data
- Old script (`sync-dev-to-prod-services.ts`) exits immediately before any imports
- Only new script (`sync-reference-data-dev-to-prod.ts`) can mutate production
- Tests fail if old script can still mutate production

**Proof**: Tests in `__tests__/production-safety/mutation-contract.test.ts`

### **5. Bypass Mechanisms**

**IMPOSSIBLE**: Adding bypass flags or escape hatches
- Tests scan for bypass patterns (SKIP_, BYPASS_, ALLOW_, etc.)
- CI pipeline fails if bypass mechanisms are detected
- Code review must reject any bypass attempts

**Proof**: Tests in `__tests__/production-safety/bypass-detection.test.ts`

### **6. Table Allowlist Violations**

**IMPOSSIBLE**: Mutating tables outside the strict allowlist
- Reference data script enforces allowlist at runtime
- Only `service_categories` and `services` tables are allowed
- Any attempt to access other tables causes process.exit(1)

**Proof**: Tests in `__tests__/production-safety/reference-data-promotion.test.ts`

---

## 🔒 **TECHNICAL ENFORCEMENT**

### **Code Locations**

1. **CI Enforcement**: `lib/ci-enforcement.ts`
   - `enforceCIOnlyExecution()` - Blocks non-CI execution
   - `blockProductionDatabaseLocally()` - Blocks prod DB access locally
   - `validateMutationScript()` - Combined validation

2. **Environment Fingerprinting**: `lib/env-fingerprint.ts`
   - `validateEnvironmentFingerprint()` - Validates fingerprint before Prisma init
   - `initializeEnvironmentFingerprint()` - Sets fingerprint during setup
   - `getExpectedEnvironment()` - Determines expected environment

3. **Prisma Integration**: `lib/prisma.ts`
   - Validates fingerprint before connection
   - Blocks production database locally
   - Hard failures only - no warnings

4. **Mutation Scripts**:
   - `scripts/deploy-db.js` - Uses CI enforcement
   - `scripts/sync-reference-data-dev-to-prod.ts` - Uses CI enforcement (before imports) + fingerprint validation + strict allowlist
   - `scripts/sync-dev-to-prod-services.ts` - HARD-DEPRECATED, exits immediately

### **Test Suite**

All guarantees are proven by automated tests:

- `__tests__/production-safety/ci-enforcement.test.ts` - Proves CI-only execution
- `__tests__/production-safety/fingerprint-validation.test.ts` - Proves fingerprint validation
- `__tests__/production-safety/mutation-contract.test.ts` - Proves contract enforcement
- `__tests__/production-safety/bypass-detection.test.ts` - Proves no bypasses exist

---

## 📊 **CONTRACT COMPLIANCE**

### **How to Verify Compliance**

1. **Run Test Suite**:
   ```bash
   npm test -- __tests__/production-safety/
   ```

2. **Check for Bypasses**:
   ```bash
   npm run test:production-safety-hardened
   ```

3. **Validate Fingerprints**:
   ```bash
   npx tsx scripts/verify-fingerprints.ts
   ```

### **Contract Violations**

If any test fails, the contract has been violated. The CI pipeline will:
1. Fail the build
2. Block deployment
3. Require contract compliance before merge

---

## 🎯 **WHY HUMAN ERROR CAN NO LONGER CAUSE DAMAGE**

### **Before This Contract**

- ❌ Developers could run mutation scripts locally
- ❌ Misconfigured environment variables could point to wrong database
- ❌ New mutation scripts could be added without safety checks
- ❌ Bypass flags could be introduced accidentally

### **After This Contract**

- ✅ **IMPOSSIBLE** to run mutation scripts locally (CI enforcement)
- ✅ **IMPOSSIBLE** to misconfigure database access (fingerprint validation)
- ✅ **IMPOSSIBLE** to add unsafe mutation scripts (contract tests)
- ✅ **IMPOSSIBLE** to introduce bypasses (bypass detection tests)

### **Failure Modes**

All failure modes are **HARD FAILURES**:
- Scripts exit with code 1
- No warnings or soft failures
- No fallback mechanisms
- No "just this once" exceptions

---

## 📝 **MAINTAINING THE CONTRACT**

### **Adding New Mutation Scripts**

**REQUIRED STEPS** (all must pass):

1. Add script to `ALLOWED_MUTATION_SCRIPTS` in contract
2. Add CI enforcement: Guards at TOP of file (BEFORE imports), process.exit(1) if CI !== "true"
3. Add fingerprint validation (if accessing production)
4. Add strict allowlist enforcement (if mutating reference data)
5. Add tests proving safety guarantees
6. Update this document
7. Get explicit approval from platform team

**IF ANY STEP FAILS**: Contract violation - CI will fail

### **Reference Data Promotion Rules**

**STRICT REQUIREMENTS** (all must hold):

1. **CI-Only Execution**: Script exits with process.exit(1) if CI !== "true" when --apply is used (BEFORE imports)
2. **Environment Fingerprint Validation**: 
   - DEV database MUST fingerprint as "dev"
   - PROD database MUST fingerprint as "prod"
   - Missing/corrupted fingerprint → hard fail
3. **Strict Allowlist**: 
   - ONLY `service_categories` and `services` tables
   - Runtime validation with process.exit(1) if other tables accessed
4. **No Deletions**: 
   - No DELETE, TRUNCATE, or DROP operations
   - Services in prod not in dev are left unchanged
5. **Relationship Safety**: 
   - Services with bookings/providers are skipped
   - No modifications to protected services
6. **Idempotent**: Re-running causes no drift
7. **Explicit Modes**: 
   - `--dry-run` (default): Preview changes
   - `--apply`: Apply changes, requires typing YES, CI-only

**NO TEMPORARY EXCEPTIONS**: These rules are permanent and enforced by tests.

### **Modifying Existing Scripts**

**REQUIRED CHECKS**:

1. Does modification violate allowed operations?
2. Does modification add forbidden logic?
3. Do tests still pass?
4. Is contract documentation updated?

**IF ANY CHECK FAILS**: Contract violation - CI will fail

### **Modifying deploy-db.js**

**STRICT RULES**:

- **ONLY** allowed operation: `prisma migrate deploy`
- **FORBIDDEN**: Any additional logic, backups, verifications, data mutations, failed migration resolution
- **ENFORCEMENT**: Tests fail if script gains extra logic
- **PREREQUISITE**: Failed migrations MUST be resolved by `resolve-failed-migrations.js` before this script runs

**IF RULES VIOLATED**: Contract violation - CI will fail

### **Prisma P3009/P3018 Error Handling**

**MANDATORY RULES**:

- **Prisma P3009/P3018** (failed/partially-applied migrations) is a deployment gate, not recoverable during deploy
- **Resolution** MUST occur in separate step (`resolve-applied-migrations.js`) BEFORE `deploy-db.js`
- **`deploy-db.js`** is FORBIDDEN from resolving failed migrations
- **Regression Protection**: `check-failed-migrations.js` runs in predeploy to block deployment if failed migrations exist
- **Execution Order**: Predeploy → Backup → Resolve Applied Migrations → Deploy Migrations

**Partially-Applied Migration Resolution**:

- **`resolve-applied-migrations.js`** intelligently checks database state:
  1. Detects failed migrations (finished_at IS NULL in _prisma_migrations)
  2. Parses migration SQL to identify objects (tables, enums, indexes, FKs)
  3. Checks if objects exist in production database
  4. **If all objects exist**: Marks migration as APPLIED (migration succeeded, Prisma just marked it failed)
  5. **If no objects exist**: Marks migration as ROLLED_BACK (allows safe re-run)
  6. **If partial (some exist, some missing)**: FAILS HARD (requires manual intervention)

- **Safety**: Partial application detection prevents data corruption by blocking deployment
- **Idempotency**: Migrations must be idempotent (use IF NOT EXISTS, DO $$ BEGIN ... EXCEPTION blocks)

**IF RULES VIOLATED**: Contract violation - CI will fail

---

## ✅ **VERIFICATION CHECKLIST**

Before considering the contract complete, verify:

- [ ] All mutation scripts enforce CI-only execution
- [ ] All mutation scripts validate environment fingerprints
- [ ] Prisma client validates fingerprint before initialization
- [ ] Test suite proves all guarantees
- [ ] No bypass mechanisms exist
- [ ] Contract documentation is complete
- [ ] CI pipeline enforces contract compliance

---

## 🚨 **NO EXCEPTIONS**

This contract has **ZERO EXCEPTIONS**:
- No "temporary" bypasses
- No "just this once" exceptions
- No "emergency" overrides
- No environment variable escape hatches

**If you need to violate the contract, you must:**
1. Update the contract first
2. Add tests proving the new behavior is safe
3. Get explicit platform team approval
4. Update all documentation

**The contract is the source of truth - code must comply.**

---

**Last Updated**: 2025-01-14  
**Contract Version**: 1.0.0  
**Status**: ACTIVE - ENFORCED
