-- ============================================================================
-- Database Role Audit Script
-- ============================================================================
-- 
-- Purpose: Audit all database roles, their privileges, and access patterns
-- 
-- SECURITY: This script is READ-ONLY and safe to run against production
-- It only queries metadata, does not modify anything
--
-- Usage: psql $DATABASE_URL -f scripts/audit-database-roles.sql
-- ============================================================================

\echo '================================================================================'
\echo 'DATABASE ROLE AUDIT REPORT'
\echo '================================================================================'
\echo ''

-- ============================================================================
-- 1. List All Roles and Their Attributes
-- ============================================================================

\echo '1. ALL DATABASE ROLES'
\echo '================================================================================'
\echo ''

SELECT 
    rolname AS role_name,
    rolsuper AS is_superuser,
    rolcreaterole AS can_create_roles,
    rolcreatedb AS can_create_databases,
    rolcanlogin AS can_login,
    rolreplication AS can_replicate,
    rolconnlimit AS connection_limit,
    rolvaliduntil AS password_expires
FROM pg_roles
ORDER BY 
    rolsuper DESC,
    rolname;

\echo ''
\echo '================================================================================'
\echo ''

-- ============================================================================
-- 2. Role Membership (Role Hierarchies)
-- ============================================================================

\echo '2. ROLE MEMBERSHIPS (Role Hierarchies)'
\echo '================================================================================'
\echo ''

SELECT 
    r.rolname AS role,
    m.rolname AS member,
    a.rolname AS admin
FROM pg_roles r
JOIN pg_auth_members am ON r.oid = am.roleid
JOIN pg_roles m ON am.member = m.oid
LEFT JOIN pg_roles a ON am.admin = a.oid
ORDER BY r.rolname, m.rolname;

\echo ''
\echo '================================================================================'
\echo ''

-- ============================================================================
-- 3. Database-Level Privileges
-- ============================================================================

\echo '3. DATABASE-LEVEL PRIVILEGES'
\echo '================================================================================'
\echo ''

SELECT 
    d.datname AS database,
    r.rolname AS role,
    CASE 
        WHEN has_database_privilege(r.oid, d.oid, 'CONNECT') THEN 'CONNECT'
        ELSE 'NO ACCESS'
    END AS privileges
FROM pg_database d
CROSS JOIN pg_roles r
WHERE has_database_privilege(r.oid, d.oid, 'CONNECT')
ORDER BY d.datname, r.rolname;

\echo ''
\echo '================================================================================'
\echo ''

-- ============================================================================
-- 4. Schema-Level Privileges
-- ============================================================================

\echo '4. SCHEMA-LEVEL PRIVILEGES'
\echo '================================================================================'
\echo ''

SELECT 
    n.nspname AS schema,
    r.rolname AS role,
    CASE 
        WHEN has_schema_privilege(r.oid, n.oid, 'USAGE') THEN 'USAGE'
        ELSE 'NO ACCESS'
    END AS privileges
FROM pg_namespace n
CROSS JOIN pg_roles r
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND has_schema_privilege(r.oid, n.oid, 'USAGE')
ORDER BY n.nspname, r.rolname;

\echo ''
\echo '================================================================================'
\echo ''

-- ============================================================================
-- 5. Table-Level Privileges (Application Tables)
-- ============================================================================

\echo '5. TABLE-LEVEL PRIVILEGES (Application Tables)'
\echo '================================================================================'
\echo ''

SELECT 
    schemaname AS schema,
    tablename AS table,
    grantee AS role,
    string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.table_privileges
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
GROUP BY schemaname, tablename, grantee
ORDER BY tablename, grantee;

\echo ''
\echo '================================================================================'
\echo ''

-- ============================================================================
-- 6. Dangerous Privileges Check
-- ============================================================================

\echo '6. DANGEROUS PRIVILEGES CHECK'
\echo '================================================================================'
\echo ''
\echo 'Roles with SUPERUSER privilege (CRITICAL):'
\echo '-------------------------------------------'

SELECT rolname AS role_name
FROM pg_roles
WHERE rolsuper = true
ORDER BY rolname;

\echo ''
\echo 'Roles that can CREATE DATABASES:'
\echo '---------------------------------'

SELECT rolname AS role_name
FROM pg_roles
WHERE rolcreatedb = true
ORDER BY rolname;

\echo ''
\echo 'Roles that can CREATE ROLES:'
\echo '----------------------------'

SELECT rolname AS role_name
FROM pg_roles
WHERE rolcreaterole = true
ORDER BY rolname;

\echo ''
\echo 'Roles with DROP privileges on tables:'
\echo '------------------------------------'

SELECT DISTINCT grantee AS role_name
FROM information_schema.table_privileges
WHERE privilege_type = 'DROP'
  AND schemaname = 'public';

\echo ''
\echo 'Roles with ALTER privileges on tables:'
\echo '--------------------------------------'

SELECT DISTINCT grantee AS role_name
FROM information_schema.table_privileges
WHERE privilege_type = 'ALTER'
  AND schemaname = 'public';

\echo ''
\echo '================================================================================'
\echo ''

-- ============================================================================
-- 7. Connection Information
-- ============================================================================

\echo '7. CURRENT CONNECTION INFORMATION'
\echo '================================================================================'
\echo ''

SELECT 
    current_user AS current_role,
    session_user AS session_role,
    current_database() AS current_database,
    inet_server_addr() AS server_address,
    inet_server_port() AS server_port,
    inet_client_addr() AS client_address,
    inet_client_port() AS client_port;

\echo ''
\echo '================================================================================'
\echo ''

-- ============================================================================
-- 8. Application Tables List
-- ============================================================================

\echo '8. APPLICATION TABLES (for permission planning)'
\echo '================================================================================'
\echo ''

SELECT 
    schemaname AS schema,
    tablename AS table_name,
    tableowner AS owner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

\echo ''
\echo '================================================================================'
\echo ''

-- ============================================================================
-- 9. Row Level Security Status
-- ============================================================================

\echo '9. ROW LEVEL SECURITY (RLS) STATUS'
\echo '================================================================================'
\echo ''

SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

\echo ''
\echo '================================================================================'
\echo ''

-- ============================================================================
-- 10. Summary of Security Concerns
-- ============================================================================

\echo '10. SECURITY CONCERNS SUMMARY'
\echo '================================================================================'
\echo ''

\echo '⚠️  ROLES REQUIRING REVIEW:'
\echo ''

-- Find roles that might be over-privileged
SELECT 
    rolname AS role_name,
    CASE 
        WHEN rolsuper THEN 'SUPERUSER - CRITICAL'
        WHEN rolcreatedb THEN 'CAN CREATE DATABASES'
        WHEN rolcreaterole THEN 'CAN CREATE ROLES'
        ELSE 'Standard role'
    END AS security_concern
FROM pg_roles
WHERE rolsuper = true 
   OR rolcreatedb = true 
   OR rolcreaterole = true
ORDER BY 
    CASE 
        WHEN rolsuper THEN 1
        WHEN rolcreatedb THEN 2
        WHEN rolcreaterole THEN 3
        ELSE 4
    END,
    rolname;

\echo ''
\echo '================================================================================'
\echo 'AUDIT COMPLETE'
\echo '================================================================================'
\echo ''
\echo 'Next Steps:'
\echo '1. Review roles with SUPERUSER, CREATE DATABASE, or CREATE ROLE privileges'
\echo '2. Identify which roles are used by application vs. developers vs. CI/CD'
\echo '3. Plan role separation and least privilege implementation'
\echo '4. Run: scripts/setup-database-roles.sql to implement secure roles'
\echo ''
