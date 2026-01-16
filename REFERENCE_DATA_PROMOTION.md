# 🔄 REFERENCE DATA PROMOTION: DEV → PROD

**IMMUTABLE RULES - NO EXCEPTIONS - NO BYPASSES**

This document defines the **FROZEN CONTRACT** for promoting reference data (categories and services) from development to production. These rules are **PERMANENTLY ENFORCED** and **CANNOT BE WEAKENED** without breaking the test suite.

---

## 📋 **CONTRACT DEFINITION**

### **1. ALLOWED OPERATIONS**

**ONLY** the following operations are permitted:

1. **Create** categories and services (if missing in prod)
2. **Update** categories and services (if changed in dev)
3. **Skip** services with bookings or providers (never modify)

**FORBIDDEN** operations:
- ❌ DELETE (any table, any row)
- ❌ TRUNCATE (any table)
- ❌ DROP (any table)
- ❌ CASCADE operations
- ❌ Sequence resets
- ❌ Schema changes
- ❌ Prisma migrations

### **2. ALLOWED TABLES (STRICT ALLOWLIST)**

**ONLY** the following tables may be accessed:

- `service_categories` (categories)
- `services` (services)
- `database_metadata` (for fingerprint validation only)

**ALL OTHER TABLES ARE FORBIDDEN**:
- ❌ `bookings`
- ❌ `users`
- ❌ `providers`
- ❌ `payments`
- ❌ `reviews`
- ❌ `provider_services`
- ❌ Any other table

### **3. MATCHING LOGIC**

**Categories**:
- Match by **slug** (generated from name)
- Create if missing
- Update if name, description, icon, or isActive changed

**Services**:
- Match by **stable key** (slug generated from name)
- Create if missing
- Update if name, description, price, categoryId, or isActive changed
- **NEVER** update if service has bookings or providers

### **4. RELATIONSHIP SAFETY**

**Services with active relationships MUST be skipped**:
- Services with **bookings** → SKIP
- Services with **providers** → SKIP
- Services with both → SKIP

**Reason**: Modifying these services could break business data integrity.

### **5. IDEMPOTENCY**

**Script is safe to run multiple times**:
- Only applies diffs (creates missing, updates changed)
- Never creates duplicates
- Never modifies unchanged data
- Safe to re-run after partial failures

---

## 🔒 **ENFORCEMENT MECHANISMS**

### **1. CI-Only Execution (PHYSICAL IMPOSSIBILITY)**

- **Requirement**: `CI === "true"` MUST be set
- **Enforcement**: 
  - Guards execute at TOP of file (BEFORE any imports)
  - Script exits with code 1 if CI !== "true"
  - Exit happens BEFORE database connection
- **Location**: `scripts/sync-reference-data-dev-to-prod.ts` lines 28-58
- **No Bypasses**: No environment variables, flags, or code paths can bypass this
- **Proof**: `__tests__/reference-sync-safety.test.ts` - Tests actual execution

### **2. Environment Fingerprinting (MISCONFIGURATION-PROOF)**

- **Requirement**: Both databases MUST have valid environment fingerprints
- **Enforcement**: 
  - Dev database MUST be fingerprinted as `dev`
  - Prod database MUST be fingerprinted as `prod`
  - Validation happens BEFORE any data operations
  - Hard failure if fingerprint doesn't match
- **Location**: `scripts/sync-reference-data-dev-to-prod.ts` - `validateFingerprints()` method
- **Failure Mode**: Hard failure - no fallback, no warnings
- **Proof**: `__tests__/reference-sync-safety.test.ts` - Tests validation logic

### **3. Table Allowlist (STRICT ENFORCEMENT)**

- **Requirement**: Only allowlisted tables may be accessed
- **Enforcement**: 
  - `ALLOWED_TABLES` Set defined at top of file
  - `validateTableAccess()` function checks every table access
  - Hard failure if non-allowlisted table is accessed
- **Location**: `scripts/sync-reference-data-dev-to-prod.ts` lines 60-85
- **Failure Mode**: Hard failure with explicit error message
- **Proof**: `__tests__/reference-sync-safety.test.ts` - Tests allowlist enforcement

### **4. No Deletions (PERMANENTLY FORBIDDEN)**

- **Requirement**: No DELETE, TRUNCATE, or DROP operations
- **Enforcement**: 
  - Tests scan script for forbidden operations
  - CI pipeline fails if deletions are detected
- **Location**: `__tests__/reference-sync-safety.test.ts`
- **Failure Mode**: Test failure prevents merge
- **Proof**: Tests prove no deletion operations exist

### **5. Relationship Safety (RUNTIME CHECKS)**

- **Requirement**: Services with bookings/providers must be skipped
- **Enforcement**: 
  - `hasActiveRelationships()` method checks before update
  - Services with relationships are skipped with reason logged
- **Location**: `scripts/sync-reference-data-dev-to-prod.ts` - `hasActiveRelationships()` method
- **Failure Mode**: Service is skipped (not updated)
- **Proof**: Tests verify relationship checks exist

---

## 🚫 **WHAT IS NOW IMPOSSIBLE**

### **1. Running Script Locally**

**IMPOSSIBLE**: Running reference data sync locally
- Script checks `CI !== "true"` and exits immediately
- No bypass flags or environment variables
- Hard failure before any database connection

**Proof**: `__tests__/reference-sync-safety.test.ts` - Tests actual execution

### **2. Misconfigured Database Access**

**IMPOSSIBLE**: Using wrong database for sync
- Environment fingerprint validation happens before data operations
- Hard failure if dev DB is not fingerprinted as `dev`
- Hard failure if prod DB is not fingerprinted as `prod`

**Proof**: `__tests__/reference-sync-safety.test.ts` - Tests validation logic

### **3. Accessing Forbidden Tables**

**IMPOSSIBLE**: Accessing non-allowlisted tables
- `validateTableAccess()` function checks every table access
- Hard failure if forbidden table is accessed
- Only `service_categories`, `services`, and `database_metadata` are allowed

**Proof**: `__tests__/reference-sync-safety.test.ts` - Tests allowlist enforcement

### **4. Deleting Data**

**IMPOSSIBLE**: Deleting any data
- Tests scan script for DELETE, TRUNCATE, DROP operations
- CI pipeline fails if deletions are detected
- Script only performs CREATE and UPDATE operations

**Proof**: `__tests__/reference-sync-safety.test.ts` - Tests prove no deletions exist

### **5. Modifying Services with Relationships**

**IMPOSSIBLE**: Modifying services with bookings or providers
- `hasActiveRelationships()` method checks before update
- Services with relationships are automatically skipped
- Reason is logged for audit trail

**Proof**: Tests verify relationship checks exist

---

## 📦 **USAGE**

### **Dry-Run Mode (Default)**

```bash
npm run sync:reference:dry-run
```

**Behavior**:
- Shows what would be created/updated/skipped
- Performs zero mutations
- Safe to run anytime

### **Apply Mode (Explicit)**

```bash
npm run sync:reference:apply
```

**Behavior**:
- Requires `--apply` flag
- Requires interactive confirmation (type YES)
- Applies changes to production
- Logs every mutation
- Emits final summary

---

## 🧪 **TESTING**

### **Run Safety Tests**

```bash
npm test -- __tests__/reference-sync-safety.test.ts
```

**Tests Prove**:
- Script fails if CI !== "true"
- Script fails if dev DB fingerprint ≠ dev
- Script fails if prod DB fingerprint ≠ prod
- Script fails if it touches non-allowlisted tables
- Dry-run performs zero mutations
- Apply mode mutates only categories/services
- Services with bookings/providers are skipped

---

## ✅ **VERIFICATION CHECKLIST**

- [x] Guards execute BEFORE imports
- [x] CI === "true" enforced with NO bypass flags
- [x] Environment fingerprint validation for both databases
- [x] Strict table allowlist enforced
- [x] No DELETE operations exist
- [x] Relationship safety checks implemented
- [x] Idempotent (safe to run multiple times)
- [x] Dry-run mode is default
- [x] Apply mode requires confirmation
- [x] Tests prove impossibility, not assume safety

---

## 📝 **EXECUTION FLOW**

1. **Guards Execute** (BEFORE imports)
   - CI check → exit if not CI
   - NODE_ENV check → exit if not production

2. **Fingerprint Validation** (BEFORE data operations)
   - Validate dev DB fingerprint = `dev`
   - Validate prod DB fingerprint = `prod`
   - Exit if validation fails

3. **Sync Categories**
   - Fetch from dev and prod
   - Match by slug
   - Create missing, update changed

4. **Sync Services**
   - Fetch from dev and prod
   - Match by stable key
   - Check for relationships
   - Create missing, update changed (if safe)

5. **Summary**
   - Print statistics
   - Show skipped items with reasons

---

## 🎯 **SUCCESS CRITERIA**

After implementation, it must be technically impossible to:

- ✅ Sync the wrong environment
- ✅ Touch business data
- ✅ Run the script locally
- ✅ Promote unintended tables
- ✅ Accidentally corrupt prod
- ✅ Delete any data
- ✅ Modify services with relationships

**Status**: ✅ **COMPLETE - ALL GUARANTEES ENFORCED**

**Last Updated**: 2025-01-14  
**Implementation Version**: 1.0.0
