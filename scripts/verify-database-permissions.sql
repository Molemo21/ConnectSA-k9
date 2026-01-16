-- ============================================================================
-- Database Permissions Verification Script
-- ============================================================================
--
-- Purpose: Verify that destructive operations are blocked for non-privileged roles
--
-- SECURITY: This script attempts destructive operations to verify they fail
-- It is SAFE to run - operations will fail due to permission restrictions
--
-- Usage: 
--   psql $DATABASE_URL -f scripts/verify-database-permissions.sql
--   (Use test/development database, NOT production)
-- ============================================================================

\echo '================================================================================'
\echo 'DATABASE PERMISSIONS VERIFICATION'
\echo '================================================================================'
\echo ''
\echo 'This script verifies that destructive operations are blocked'
\echo 'All operations should FAIL due to permission restrictions'
\echo ''

-- ============================================================================
-- Current Role Check
-- ============================================================================

\echo 'Current Role:'
SELECT current_user AS role_name, session_user AS session_role;
\echo ''

-- ============================================================================
-- Test 1: Application Role Cannot DELETE
-- ============================================================================

\echo '================================================================================'
\echo 'Test 1: Application Role Cannot DELETE'
\echo '================================================================================'
\echo ''

-- Switch to application role (if possible)
-- Note: This test assumes you're connected as a user with the app role
SET ROLE connectsa_app_runtime;

BEGIN;
    -- Attempt DELETE (should fail)
    DO $$
    BEGIN
        DELETE FROM users WHERE id = 'test-id-that-does-not-exist';
        RAISE EXCEPTION 'FAILED: DELETE operation succeeded (should have been blocked)';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE '✅ PASSED: DELETE operation correctly blocked';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️  DELETE failed with different error: %', SQLERRM;
    END
    $$;
ROLLBACK;

RESET ROLE;

\echo ''

-- ============================================================================
-- Test 2: Application Role Cannot DROP Tables
-- ============================================================================

\echo '================================================================================'
\echo 'Test 2: Application Role Cannot DROP Tables'
\echo '================================================================================'
\echo ''

SET ROLE connectsa_app_runtime;

BEGIN;
    -- Attempt DROP (should fail)
    DO $$
    BEGIN
        DROP TABLE IF EXISTS users;
        RAISE EXCEPTION 'FAILED: DROP operation succeeded (should have been blocked)';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE '✅ PASSED: DROP operation correctly blocked';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️  DROP failed with different error: %', SQLERRM;
    END
    $$;
ROLLBACK;

RESET ROLE;

\echo ''

-- ============================================================================
-- Test 3: Application Role Cannot TRUNCATE
-- ============================================================================

\echo '================================================================================'
\echo 'Test 3: Application Role Cannot TRUNCATE'
\echo '================================================================================'
\echo ''

SET ROLE connectsa_app_runtime;

BEGIN;
    -- Attempt TRUNCATE (should fail)
    DO $$
    BEGIN
        TRUNCATE TABLE users;
        RAISE EXCEPTION 'FAILED: TRUNCATE operation succeeded (should have been blocked)';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE '✅ PASSED: TRUNCATE operation correctly blocked';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️  TRUNCATE failed with different error: %', SQLERRM;
    END
    $$;
ROLLBACK;

RESET ROLE;

\echo ''

-- ============================================================================
-- Test 4: Application Role Cannot ALTER Tables
-- ============================================================================

\echo '================================================================================'
\echo 'Test 4: Application Role Cannot ALTER Tables'
\echo '================================================================================'
\echo ''

SET ROLE connectsa_app_runtime;

BEGIN;
    -- Attempt ALTER (should fail)
    DO $$
    BEGIN
        ALTER TABLE users ADD COLUMN test_column TEXT;
        RAISE EXCEPTION 'FAILED: ALTER operation succeeded (should have been blocked)';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE '✅ PASSED: ALTER operation correctly blocked';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️  ALTER failed with different error: %', SQLERRM;
    END
    $$;
ROLLBACK;

RESET ROLE;

\echo ''

-- ============================================================================
-- Test 5: Application Role CAN SELECT, INSERT, UPDATE
-- ============================================================================

\echo '================================================================================'
\echo 'Test 5: Application Role CAN Perform Safe Operations'
\echo '================================================================================'
\echo ''

SET ROLE connectsa_app_runtime;

-- Test SELECT (should succeed)
DO $$
BEGIN
    PERFORM 1 FROM users LIMIT 1;
    RAISE NOTICE '✅ PASSED: SELECT operation allowed';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE EXCEPTION 'FAILED: SELECT operation blocked (should be allowed)';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  SELECT failed: %', SQLERRM;
END
$$;

-- Test INSERT (should succeed if table exists and has required fields)
-- Note: This may fail due to constraints, not permissions
DO $$
BEGIN
    -- Try a safe INSERT that will fail on constraints, not permissions
    INSERT INTO users (id, email, name, role) 
    VALUES ('test-verify-' || gen_random_uuid()::text, 'test@example.com', 'Test User', 'CLIENT')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE '✅ PASSED: INSERT operation allowed';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE EXCEPTION 'FAILED: INSERT operation blocked (should be allowed)';
    WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️  INSERT result: % (may fail due to constraints, not permissions)', SQLERRM;
END
$$;

RESET ROLE;

\echo ''

-- ============================================================================
-- Test 6: Developer Read-Only Role Cannot Write
-- ============================================================================

\echo '================================================================================'
\echo 'Test 6: Developer Read-Only Role Cannot Write'
\echo '================================================================================'
\echo ''

SET ROLE connectsa_dev_readonly;

-- Test INSERT (should fail)
DO $$
BEGIN
    INSERT INTO users (id, email, name, role) 
    VALUES ('test-verify-' || gen_random_uuid()::text, 'test@example.com', 'Test User', 'CLIENT');
    RAISE EXCEPTION 'FAILED: INSERT operation succeeded (should have been blocked)';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE '✅ PASSED: INSERT operation correctly blocked for read-only role';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  INSERT failed with different error: %', SQLERRM;
END
$$;

-- Test UPDATE (should fail)
DO $$
BEGIN
    UPDATE users SET name = 'Updated' WHERE id = 'non-existent';
    RAISE EXCEPTION 'FAILED: UPDATE operation succeeded (should have been blocked)';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE '✅ PASSED: UPDATE operation correctly blocked for read-only role';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  UPDATE failed with different error: %', SQLERRM;
END
$$;

-- Test SELECT (should succeed)
DO $$
BEGIN
    PERFORM 1 FROM users LIMIT 1;
    RAISE NOTICE '✅ PASSED: SELECT operation allowed for read-only role';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE EXCEPTION 'FAILED: SELECT operation blocked (should be allowed)';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  SELECT failed: %', SQLERRM;
END
$$;

RESET ROLE;

\echo ''

-- ============================================================================
-- Test 7: Migration Role Cannot DROP
-- ============================================================================

\echo '================================================================================'
\echo 'Test 7: Migration Role Cannot DROP'
\echo '================================================================================'
\echo ''

SET ROLE connectsa_migration;

-- Test DROP (should fail)
DO $$
BEGIN
    DROP TABLE IF EXISTS users;
    RAISE EXCEPTION 'FAILED: DROP operation succeeded (should have been blocked)';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE '✅ PASSED: DROP operation correctly blocked for migration role';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  DROP failed with different error: %', SQLERRM;
END
$$;

-- Test ALTER (should succeed - needed for migrations)
DO $$
BEGIN
    -- Try a safe ALTER that won't actually change anything
    ALTER TABLE users ADD COLUMN IF NOT EXISTS test_verify_column TEXT;
    ALTER TABLE users DROP COLUMN IF EXISTS test_verify_column;
    RAISE NOTICE '✅ PASSED: ALTER operation allowed for migration role';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE EXCEPTION 'FAILED: ALTER operation blocked (should be allowed for migrations)';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  ALTER failed: %', SQLERRM;
END
$$;

RESET ROLE;

\echo ''

-- ============================================================================
-- Test 8: Verify Role Permissions Summary
-- ============================================================================

\echo '================================================================================'
\echo 'Test 8: Role Permissions Summary'
\echo '================================================================================'
\echo ''

\echo 'Application Runtime Role (connectsa_app_runtime):'
SELECT 
    'SELECT' AS operation,
    has_table_privilege('connectsa_app_runtime', 'users', 'SELECT') AS allowed
UNION ALL
SELECT 
    'INSERT',
    has_table_privilege('connectsa_app_runtime', 'users', 'INSERT')
UNION ALL
SELECT 
    'UPDATE',
    has_table_privilege('connectsa_app_runtime', 'users', 'UPDATE')
UNION ALL
SELECT 
    'DELETE',
    has_table_privilege('connectsa_app_runtime', 'users', 'DELETE')
UNION ALL
SELECT 
    'TRUNCATE',
    has_table_privilege('connectsa_app_runtime', 'users', 'TRUNCATE')
UNION ALL
SELECT 
    'DROP',
    has_table_privilege('connectsa_app_runtime', 'users', 'DROP');

\echo ''
\echo 'Developer Read-Only Role (connectsa_dev_readonly):'
SELECT 
    'SELECT' AS operation,
    has_table_privilege('connectsa_dev_readonly', 'users', 'SELECT') AS allowed
UNION ALL
SELECT 
    'INSERT',
    has_table_privilege('connectsa_dev_readonly', 'users', 'INSERT')
UNION ALL
SELECT 
    'UPDATE',
    has_table_privilege('connectsa_dev_readonly', 'users', 'UPDATE')
UNION ALL
SELECT 
    'DELETE',
    has_table_privilege('connectsa_dev_readonly', 'users', 'DELETE');

\echo ''
\echo 'Migration Role (connectsa_migration):'
SELECT 
    'SELECT' AS operation,
    has_table_privilege('connectsa_migration', 'users', 'SELECT') AS allowed
UNION ALL
SELECT 
    'INSERT',
    has_table_privilege('connectsa_migration', 'users', 'INSERT')
UNION ALL
SELECT 
    'UPDATE',
    has_table_privilege('connectsa_migration', 'users', 'UPDATE')
UNION ALL
SELECT 
    'DELETE',
    has_table_privilege('connectsa_migration', 'users', 'DELETE')
UNION ALL
SELECT 
    'ALTER',
    has_table_privilege('connectsa_migration', 'users', 'ALTER')
UNION ALL
SELECT 
    'DROP',
    has_table_privilege('connectsa_migration', 'users', 'DROP');

\echo ''

-- ============================================================================
-- Summary
-- ============================================================================

\echo '================================================================================'
\echo 'VERIFICATION COMPLETE'
\echo '================================================================================'
\echo ''
\echo 'Expected Results:'
\echo '  ✅ Application role: SELECT, INSERT, UPDATE allowed; DELETE, DROP, TRUNCATE blocked'
\echo '  ✅ Developer role: SELECT allowed; INSERT, UPDATE, DELETE blocked'
\echo '  ✅ Migration role: SELECT, INSERT, UPDATE, DELETE, ALTER allowed; DROP blocked'
\echo ''
\echo 'If any destructive operations succeeded, review role permissions immediately.'
\echo ''
