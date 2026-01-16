-- ============================================================================
-- Production Database Permissions Verification Script
-- ============================================================================
--
-- Purpose: Verify that production database permissions are hardened
-- 
-- SECURITY: This script is READ-ONLY and safe to run against production
-- It only queries metadata and permissions, does NOT modify anything
--
-- Usage: psql $DATABASE_URL -f scripts/verify-production-db-permissions.sql
-- ============================================================================

\echo '================================================================================'
\echo 'PRODUCTION DATABASE PERMISSIONS VERIFICATION'
\echo '================================================================================'
\echo ''
\echo 'This script verifies that production database permissions are hardened'
\echo 'All checks are READ-ONLY and safe to run against production'
\echo ''

-- ============================================================================
-- Configuration
-- ============================================================================

\set app_role_name 'connectsa_app_runtime'
\set migration_role_name 'connectsa_migration'
\set dev_readonly_role_name 'connectsa_dev_readonly'

-- ============================================================================
-- Test 1: List All Roles
-- ============================================================================

\echo '================================================================================'
\echo 'Test 1: Database Roles Inventory'
\echo '================================================================================'
\echo ''

SELECT 
    rolname AS role_name,
    rolsuper AS is_superuser,
    rolcreaterole AS can_create_roles,
    rolcreatedb AS can_create_databases,
    rolcanlogin AS can_login,
    CASE 
        WHEN rolsuper THEN '⚠️  SUPERUSER - CRITICAL'
        WHEN rolcreaterole THEN '⚠️  CAN CREATE ROLES'
        WHEN rolcreatedb THEN '⚠️  CAN CREATE DATABASES'
        ELSE '✅ Standard role'
    END AS security_level
FROM pg_roles
WHERE rolname NOT LIKE 'pg_%'
ORDER BY 
    CASE 
        WHEN rolsuper THEN 1
        WHEN rolcreaterole THEN 2
        WHEN rolcreatedb THEN 3
        ELSE 4
    END,
    rolname;

\echo ''

-- ============================================================================
-- Test 2: Verify Application Runtime Role Permissions
-- ============================================================================

\echo '================================================================================'
\echo 'Test 2: Application Runtime Role Permissions (connectsa_app_runtime)'
\echo '================================================================================'
\echo ''

-- Check if role exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'app_role_name') THEN
        RAISE NOTICE '⚠️  WARNING: Role % does not exist', :'app_role_name';
        RAISE NOTICE '   Run scripts/setup-database-roles.sql to create it';
    ELSE
        RAISE NOTICE '✅ Role % exists', :'app_role_name';
    END IF;
END
$$;

\echo ''

-- Check permissions on users table (representative of all tables)
\echo 'Permissions on users table (representative):'
SELECT 
    'SELECT' AS operation,
    has_table_privilege(:'app_role_name', 'users', 'SELECT') AS allowed,
    CASE 
        WHEN has_table_privilege(:'app_role_name', 'users', 'SELECT') THEN '✅ REQUIRED'
        ELSE '❌ MISSING - Application cannot read data'
    END AS status
UNION ALL
SELECT 
    'INSERT',
    has_table_privilege(:'app_role_name', 'users', 'INSERT'),
    CASE 
        WHEN has_table_privilege(:'app_role_name', 'users', 'INSERT') THEN '✅ REQUIRED'
        ELSE '❌ MISSING - Application cannot create records'
    END
UNION ALL
SELECT 
    'UPDATE',
    has_table_privilege(:'app_role_name', 'users', 'UPDATE'),
    CASE 
        WHEN has_table_privilege(:'app_role_name', 'users', 'UPDATE') THEN '✅ REQUIRED'
        ELSE '❌ MISSING - Application cannot update records'
    END
UNION ALL
SELECT 
    'DELETE',
    has_table_privilege(:'app_role_name', 'users', 'DELETE'),
    CASE 
        WHEN has_table_privilege(:'app_role_name', 'users', 'DELETE') THEN '❌ DANGEROUS - Should be blocked'
        ELSE '✅ SAFE - DELETE blocked'
    END
UNION ALL
SELECT 
    'TRUNCATE',
    has_table_privilege(:'app_role_name', 'users', 'TRUNCATE'),
    CASE 
        WHEN has_table_privilege(:'app_role_name', 'users', 'TRUNCATE') THEN '❌ DANGEROUS - Should be blocked'
        ELSE '✅ SAFE - TRUNCATE blocked'
    END
UNION ALL
SELECT 
    'DROP',
    has_table_privilege(:'app_role_name', 'users', 'DROP'),
    CASE 
        WHEN has_table_privilege(:'app_role_name', 'users', 'DROP') THEN '❌ CRITICAL - Should be blocked'
        ELSE '✅ SAFE - DROP blocked'
    END
UNION ALL
SELECT 
    'ALTER',
    has_table_privilege(:'app_role_name', 'users', 'ALTER'),
    CASE 
        WHEN has_table_privilege(:'app_role_name', 'users', 'ALTER') THEN '❌ DANGEROUS - Should be blocked'
        ELSE '✅ SAFE - ALTER blocked'
    END;

\echo ''

-- ============================================================================
-- Test 3: Verify Migration Role Permissions
-- ============================================================================

\echo '================================================================================'
\echo 'Test 3: Migration Role Permissions (connectsa_migration)'
\echo '================================================================================'
\echo ''

-- Check if role exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'migration_role_name') THEN
        RAISE NOTICE '⚠️  WARNING: Role % does not exist', :'migration_role_name';
        RAISE NOTICE '   Run scripts/setup-database-roles.sql to create it';
    ELSE
        RAISE NOTICE '✅ Role % exists', :'migration_role_name';
    END IF;
END
$$;

\echo ''

\echo 'Migration role permissions (should have ALTER, but NOT DROP):'
SELECT 
    'SELECT' AS operation,
    has_table_privilege(:'migration_role_name', 'users', 'SELECT') AS allowed,
    CASE 
        WHEN has_table_privilege(:'migration_role_name', 'users', 'SELECT') THEN '✅ REQUIRED'
        ELSE '❌ MISSING'
    END AS status
UNION ALL
SELECT 
    'INSERT',
    has_table_privilege(:'migration_role_name', 'users', 'INSERT'),
    CASE 
        WHEN has_table_privilege(:'migration_role_name', 'users', 'INSERT') THEN '✅ REQUIRED'
        ELSE '❌ MISSING'
    END
UNION ALL
SELECT 
    'UPDATE',
    has_table_privilege(:'migration_role_name', 'users', 'UPDATE'),
    CASE 
        WHEN has_table_privilege(:'migration_role_name', 'users', 'UPDATE') THEN '✅ REQUIRED'
        ELSE '❌ MISSING'
    END
UNION ALL
SELECT 
    'DELETE',
    has_table_privilege(:'migration_role_name', 'users', 'DELETE'),
    CASE 
        WHEN has_table_privilege(:'migration_role_name', 'users', 'DELETE') THEN '✅ REQUIRED (for migrations)'
        ELSE '⚠️  May be needed for migration cleanup'
    END
UNION ALL
SELECT 
    'ALTER',
    has_table_privilege(:'migration_role_name', 'users', 'ALTER'),
    CASE 
        WHEN has_table_privilege(:'migration_role_name', 'users', 'ALTER') THEN '✅ REQUIRED (for migrations)'
        ELSE '❌ MISSING - Cannot run migrations'
    END
UNION ALL
SELECT 
    'DROP',
    has_table_privilege(:'migration_role_name', 'users', 'DROP'),
    CASE 
        WHEN has_table_privilege(:'migration_role_name', 'users', 'DROP') THEN '❌ DANGEROUS - Should be blocked'
        ELSE '✅ SAFE - DROP blocked'
    END
UNION ALL
SELECT 
    'TRUNCATE',
    has_table_privilege(:'migration_role_name', 'users', 'TRUNCATE'),
    CASE 
        WHEN has_table_privilege(:'migration_role_name', 'users', 'TRUNCATE') THEN '❌ DANGEROUS - Should be blocked'
        ELSE '✅ SAFE - TRUNCATE blocked'
    END;

\echo ''

-- ============================================================================
-- Test 4: Verify Developer Read-Only Role
-- ============================================================================

\echo '================================================================================'
\echo 'Test 4: Developer Read-Only Role Permissions (connectsa_dev_readonly)'
\echo '================================================================================'
\echo ''

-- Check if role exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'dev_readonly_role_name') THEN
        RAISE NOTICE '⚠️  WARNING: Role % does not exist', :'dev_readonly_role_name';
    ELSE
        RAISE NOTICE '✅ Role % exists', :'dev_readonly_role_name';
    END IF;
END
$$;

\echo ''

\echo 'Developer read-only role permissions (should be SELECT only):'
SELECT 
    'SELECT' AS operation,
    has_table_privilege(:'dev_readonly_role_name', 'users', 'SELECT') AS allowed,
    CASE 
        WHEN has_table_privilege(:'dev_readonly_role_name', 'users', 'SELECT') THEN '✅ REQUIRED'
        ELSE '❌ MISSING'
    END AS status
UNION ALL
SELECT 
    'INSERT',
    has_table_privilege(:'dev_readonly_role_name', 'users', 'INSERT'),
    CASE 
        WHEN has_table_privilege(:'dev_readonly_role_name', 'users', 'INSERT') THEN '❌ DANGEROUS - Should be blocked'
        ELSE '✅ SAFE - INSERT blocked'
    END
UNION ALL
SELECT 
    'UPDATE',
    has_table_privilege(:'dev_readonly_role_name', 'users', 'UPDATE'),
    CASE 
        WHEN has_table_privilege(:'dev_readonly_role_name', 'users', 'UPDATE') THEN '❌ DANGEROUS - Should be blocked'
        ELSE '✅ SAFE - UPDATE blocked'
    END
UNION ALL
SELECT 
    'DELETE',
    has_table_privilege(:'dev_readonly_role_name', 'users', 'DELETE'),
    CASE 
        WHEN has_table_privilege(:'dev_readonly_role_name', 'users', 'DELETE') THEN '❌ DANGEROUS - Should be blocked'
        ELSE '✅ SAFE - DELETE blocked'
    END;

\echo ''

-- ============================================================================
-- Test 5: Check All Application Tables
-- ============================================================================

\echo '================================================================================'
\echo 'Test 5: Application Tables Permission Summary'
\echo '================================================================================'
\echo ''

-- Get list of application tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE '_prisma%'
ORDER BY tablename;

\echo ''

-- Check permissions on all application tables
\echo 'Application role permissions across all tables:'
SELECT 
    t.tablename,
    has_table_privilege(:'app_role_name', t.tablename, 'SELECT') AS can_select,
    has_table_privilege(:'app_role_name', t.tablename, 'INSERT') AS can_insert,
    has_table_privilege(:'app_role_name', t.tablename, 'UPDATE') AS can_update,
    has_table_privilege(:'app_role_name', t.tablename, 'DELETE') AS can_delete,
    has_table_privilege(:'app_role_name', t.tablename, 'TRUNCATE') AS can_truncate,
    has_table_privilege(:'app_role_name', t.tablename, 'DROP') AS can_drop,
    has_table_privilege(:'app_role_name', t.tablename, 'ALTER') AS can_alter,
    CASE 
        WHEN has_table_privilege(:'app_role_name', t.tablename, 'DELETE') THEN '❌ UNSAFE'
        WHEN has_table_privilege(:'app_role_name', t.tablename, 'DROP') THEN '❌ UNSAFE'
        WHEN has_table_privilege(:'app_role_name', t.tablename, 'TRUNCATE') THEN '❌ UNSAFE'
        WHEN has_table_privilege(:'app_role_name', t.tablename, 'ALTER') THEN '❌ UNSAFE'
        ELSE '✅ SAFE'
    END AS security_status
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE '_prisma%'
ORDER BY 
    CASE 
        WHEN has_table_privilege(:'app_role_name', t.tablename, 'DELETE') THEN 1
        WHEN has_table_privilege(:'app_role_name', t.tablename, 'DROP') THEN 1
        WHEN has_table_privilege(:'app_role_name', t.tablename, 'TRUNCATE') THEN 1
        WHEN has_table_privilege(:'app_role_name', t.tablename, 'ALTER') THEN 1
        ELSE 2
    END,
    t.tablename;

\echo ''

-- ============================================================================
-- Test 6: Check for Dangerous Privileges
-- ============================================================================

\echo '================================================================================'
\echo 'Test 6: Dangerous Privileges Check'
\echo '================================================================================'
\echo ''

-- Find tables where app role has DELETE
\echo 'Tables where application role has DELETE (should be NONE):'
SELECT 
    tablename,
    'DELETE' AS dangerous_privilege
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND has_table_privilege(:'app_role_name', tablename, 'DELETE')
ORDER BY tablename;

-- Find tables where app role has DROP
\echo ''
\echo 'Tables where application role has DROP (should be NONE):'
SELECT 
    tablename,
    'DROP' AS dangerous_privilege
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND has_table_privilege(:'app_role_name', tablename, 'DROP')
ORDER BY tablename;

-- Find tables where app role has TRUNCATE
\echo ''
\echo 'Tables where application role has TRUNCATE (should be NONE):'
SELECT 
    tablename,
    'TRUNCATE' AS dangerous_privilege
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND has_table_privilege(:'app_role_name', tablename, 'TRUNCATE')
ORDER BY tablename;

-- Find tables where app role has ALTER
\echo ''
\echo 'Tables where application role has ALTER (should be NONE):'
SELECT 
    tablename,
    'ALTER' AS dangerous_privilege
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND has_table_privilege(:'app_role_name', tablename, 'ALTER')
ORDER BY tablename;

\echo ''

-- ============================================================================
-- Test 7: Row Level Security (RLS) Status
-- ============================================================================

\echo '================================================================================'
\echo 'Test 7: Row Level Security (RLS) Status'
\echo '================================================================================'
\echo ''

SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '⚠️  NOT ENABLED (consider enabling for sensitive tables)'
    END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename IN ('users', 'providers', 'payments', 'payouts', 'bookings')
ORDER BY tablename;

\echo ''

-- ============================================================================
-- Test 8: Schema-Level Permissions
-- ============================================================================

\echo '================================================================================'
\echo 'Test 8: Schema-Level Permissions'
\echo '================================================================================'
\echo ''

SELECT 
    nspname AS schema_name,
    r.rolname AS role_name,
    CASE 
        WHEN has_schema_privilege(r.oid, n.oid, 'USAGE') THEN 'USAGE'
        ELSE 'NO ACCESS'
    END AS privileges,
    CASE 
        WHEN has_schema_privilege(r.oid, n.oid, 'CREATE') THEN '⚠️  CAN CREATE'
        ELSE '✅ Cannot create'
    END AS create_privilege
FROM pg_namespace n
CROSS JOIN pg_roles r
WHERE n.nspname = 'public'
  AND r.rolname IN (:app_role_name, :migration_role_name, :dev_readonly_role_name)
  AND has_schema_privilege(r.oid, n.oid, 'USAGE')
ORDER BY r.rolname;

\echo ''

-- ============================================================================
-- Test 9: Current Connection Role
-- ============================================================================

\echo '================================================================================'
\echo 'Test 9: Current Connection Information'
\echo '================================================================================'
\echo ''

SELECT 
    current_user AS current_role,
    session_user AS session_role,
    current_database() AS current_database,
    inet_server_addr() AS server_address,
    CASE 
        WHEN current_user = 'postgres' THEN '⚠️  Connected as superuser'
        WHEN current_user LIKE '%admin%' THEN '⚠️  Connected as admin role'
        ELSE '✅ Connected as standard role'
    END AS security_note;

\echo ''

-- ============================================================================
-- Test 10: Permission Summary and Verdict
-- ============================================================================

\echo '================================================================================'
\echo 'Test 10: Security Verdict'
\echo '================================================================================'
\echo ''

-- Count dangerous permissions
DO $$
DECLARE
    delete_count INTEGER;
    drop_count INTEGER;
    truncate_count INTEGER;
    alter_count INTEGER;
    unsafe_tables INTEGER;
    verdict TEXT;
BEGIN
    -- Count tables with dangerous permissions
    SELECT COUNT(*) INTO delete_count
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND has_table_privilege(:'app_role_name', tablename, 'DELETE');
    
    SELECT COUNT(*) INTO drop_count
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND has_table_privilege(:'app_role_name', tablename, 'DROP');
    
    SELECT COUNT(*) INTO truncate_count
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND has_table_privilege(:'app_role_name', tablename, 'TRUNCATE');
    
    SELECT COUNT(*) INTO alter_count
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND has_table_privilege(:'app_role_name', tablename, 'ALTER');
    
    unsafe_tables := delete_count + drop_count + truncate_count + alter_count;
    
    IF unsafe_tables = 0 THEN
        verdict := '✅ SAFE';
        RAISE NOTICE '';
        RAISE NOTICE '================================================================================';
        RAISE NOTICE 'VERDICT: PRODUCTION DB PERMISSIONS: SAFE';
        RAISE NOTICE '================================================================================';
        RAISE NOTICE '';
        RAISE NOTICE 'Application role has safe permissions:';
        RAISE NOTICE '  ✅ Can SELECT, INSERT, UPDATE (required operations)';
        RAISE NOTICE '  ✅ Cannot DELETE (blocked)';
        RAISE NOTICE '  ✅ Cannot DROP (blocked)';
        RAISE NOTICE '  ✅ Cannot TRUNCATE (blocked)';
        RAISE NOTICE '  ✅ Cannot ALTER (blocked)';
        RAISE NOTICE '';
        RAISE NOTICE 'Destructive operations are prevented.';
    ELSE
        verdict := '❌ UNSAFE';
        RAISE NOTICE '';
        RAISE NOTICE '================================================================================';
        RAISE NOTICE 'VERDICT: PRODUCTION DB PERMISSIONS: UNSAFE';
        RAISE NOTICE '================================================================================';
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  SECURITY ISSUES DETECTED:';
        IF delete_count > 0 THEN
            RAISE NOTICE '  ❌ Application role has DELETE on % table(s)', delete_count;
        END IF;
        IF drop_count > 0 THEN
            RAISE NOTICE '  ❌ Application role has DROP on % table(s)', drop_count;
        END IF;
        IF truncate_count > 0 THEN
            RAISE NOTICE '  ❌ Application role has TRUNCATE on % table(s)', truncate_count;
        END IF;
        IF alter_count > 0 THEN
            RAISE NOTICE '  ❌ Application role has ALTER on % table(s)', alter_count;
        END IF;
        RAISE NOTICE '';
        RAISE NOTICE 'ACTION REQUIRED:';
        RAISE NOTICE '  Run: psql $DATABASE_URL -f scripts/setup-database-roles.sql';
        RAISE NOTICE '  This will revoke dangerous permissions from application role';
    END IF;
    
    RAISE NOTICE '================================================================================';
    RAISE NOTICE '';
END
$$;

\echo ''

-- ============================================================================
-- Summary
-- ============================================================================

\echo '================================================================================'
\echo 'VERIFICATION COMPLETE'
\echo '================================================================================'
\echo ''
\echo 'Next Steps:'
\echo '  1. Review the verdict above'
\echo '  2. If UNSAFE: Run scripts/setup-database-roles.sql to fix permissions'
\echo '  3. If SAFE: Permissions are correctly hardened'
\echo '  4. Verify migration role is only usable in CI/CD (application-level check)'
\echo ''
