# 🛡️ PRODUCTION MUTATION CONTRACT

**IMMUTABLE RULES - NO EXCEPTIONS - NO BYPASSES**

This document defines the **FROZEN CONTRACT** for production database mutations. These rules are **PERMANENTLY ENFORCED** and **CANNOT BE WEAKENED** without breaking the test suite.

---

## 📋 **CONTRACT DEFINITION**

### **1. ALLOWED MUTATION SCRIPTS**

**ONLY** the following scripts are permitted to mutate production:

1. **`scripts/deploy-db.js`**
   - **Allowed Operation**: `prisma migrate deploy` ONLY
   - **Scope**: Schema migrations ONLY
   - **Forbidden**: Any data mutations, backups, verifications, or additional logic
   - **Enforcement**: CI-only execution, environment fingerprint validation

2. **`scripts/sync-dev-to-prod-services.ts`** (when NOT in dry-run)
   - **Allowed Operations**: 
     - Create/update service categories
     - Create/update services
     - Deactivate services (only if no bookings/providers)
   - **Scope**: Services and categories ONLY
   - **Forbidden**: Any other table mutations
   - **Enforcement**: CI-only execution, environment fingerprint validation

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

#### **4.1 CI-Only Execution (HARD GUARANTEE)**

- **Requirement**: `CI === "true"` MUST be set
- **Enforcement**: Scripts exit with code 1 if CI !== "true"
- **Location**: `lib/ci-enforcement.ts`
- **No Bypasses**: No environment variables, flags, or code paths can bypass this

#### **4.2 Environment Fingerprinting (MISCONFIGURATION-PROOF)**

- **Requirement**: Database MUST have `database_metadata` table with correct environment
- **Enforcement**: Validation happens BEFORE Prisma client initialization
- **Location**: `lib/env-fingerprint.ts`
- **Failure Mode**: Hard failure - no fallback, no warnings

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

**Proof**: Tests in `__tests__/production-safety/mutation-contract.test.ts`

### **4. Bypass Mechanisms**

**IMPOSSIBLE**: Adding bypass flags or escape hatches
- Tests scan for bypass patterns (SKIP_, BYPASS_, ALLOW_, etc.)
- CI pipeline fails if bypass mechanisms are detected
- Code review must reject any bypass attempts

**Proof**: Tests in `__tests__/production-safety/bypass-detection.test.ts`

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
   - `scripts/sync-dev-to-prod-services.ts` - Uses CI enforcement + fingerprint validation

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
2. Add CI enforcement: `validateMutationScript('script-name')`
3. Add fingerprint validation (if accessing production)
4. Add tests proving safety guarantees
5. Update this document
6. Get explicit approval from platform team

**IF ANY STEP FAILS**: Contract violation - CI will fail

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
- **FORBIDDEN**: Any additional logic, backups, verifications, data mutations
- **ENFORCEMENT**: Tests fail if script gains extra logic

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
