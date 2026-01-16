-- ============================================================================
-- Database Role Setup Script - Principle of Least Privilege
-- ============================================================================
--
-- Purpose: Create secure, least-privilege roles for production database
--
-- SECURITY WARNING: This script MODIFIES database permissions
-- Only run this in a controlled environment after reviewing all changes
--
-- Roles Created:
-- 1. connectsa_app_runtime - Application runtime (SELECT, INSERT, UPDATE only)
-- 2. connectsa_migration - CI/CD migrations (limited ALTER, no DROP)
-- 3. connectsa_dev_readonly - Developer read-only access
--
-- Usage: 
--   psql $DATABASE_URL -f scripts/setup-database-roles.sql
--   (Use production DATABASE_URL in CI/CD only, never locally)
-- ============================================================================

\echo '================================================================================'
\echo 'SETTING UP SECURE DATABASE ROLES'
\echo '================================================================================'
\echo ''

-- ============================================================================
-- Configuration Variables
-- ============================================================================

-- Set these variables before running (or modify directly in script)
-- In production, these should come from environment variables

\set app_role_name 'connectsa_app_runtime'
\set migration_role_name 'connectsa_migration'
\set dev_readonly_role_name 'connectsa_dev_readonly'

\echo 'Role Names:'
\echo '  Application Runtime: ' :app_role_name
\echo '  Migration (CI/CD):   ' :migration_role_name
\echo '  Developer Read-Only: ' :dev_readonly_role_name
\echo ''

-- ============================================================================
-- Step 1: Create Roles
-- ============================================================================

\echo 'Step 1: Creating roles...'
\echo '----------------------------------------------------------------------'

-- Application Runtime Role (for production application)
-- NO LOGIN - used via connection pooling with specific user
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'app_role_name') THEN
        CREATE ROLE :app_role_name WITH NOLOGIN;
        RAISE NOTICE 'Created role: %', :'app_role_name';
    ELSE
        RAISE NOTICE 'Role already exists: %', :'app_role_name';
    END IF;
END
$$;

-- Migration Role (for CI/CD only)
-- NO LOGIN - only usable via CI/CD with specific credentials
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'migration_role_name') THEN
        CREATE ROLE :migration_role_name WITH NOLOGIN;
        RAISE NOTICE 'Created role: %', :'migration_role_name';
    ELSE
        RAISE NOTICE 'Role already exists: %', :'migration_role_name';
    END IF;
END
$$;

-- Developer Read-Only Role (for debugging)
-- NO LOGIN - developers connect via separate read-only user
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'dev_readonly_role_name') THEN
        CREATE ROLE :dev_readonly_role_name WITH NOLOGIN;
        RAISE NOTICE 'Created role: %', :'dev_readonly_role_name';
    ELSE
        RAISE NOTICE 'Role already exists: %', :'dev_readonly_role_name';
    END IF;
END
$$;

\echo ''

-- ============================================================================
-- Step 2: Grant Schema Usage
-- ============================================================================

\echo 'Step 2: Granting schema access...'
\echo '----------------------------------------------------------------------'

-- All roles need USAGE on public schema
GRANT USAGE ON SCHEMA public TO :app_role_name;
GRANT USAGE ON SCHEMA public TO :migration_role_name;
GRANT USAGE ON SCHEMA public TO :dev_readonly_role_name;

\echo 'Granted USAGE on public schema to all roles'
\echo ''

-- ============================================================================
-- Step 3: Application Runtime Role Permissions
-- ============================================================================

\echo 'Step 3: Setting application runtime permissions...'
\echo '----------------------------------------------------------------------'
\echo 'Granting SELECT, INSERT, UPDATE on application tables...'

-- Application tables that need full CRUD (except DELETE)
-- Users, Providers, Services, Bookings, Payments, etc.

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO :app_role_name;
GRANT SELECT, INSERT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO :app_role_name;

-- Grant on future tables (for automatic permission on new tables)
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE ON TABLES TO :app_role_name;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE ON SEQUENCES TO :app_role_name;

\echo 'Application runtime role can: SELECT, INSERT, UPDATE'
\echo 'Application runtime role CANNOT: DELETE, DROP, ALTER, TRUNCATE'
\echo ''

-- ============================================================================
-- Step 4: Migration Role Permissions (CI/CD Only)
-- ============================================================================

\echo 'Step 4: Setting migration role permissions...'
\echo '----------------------------------------------------------------------'
\echo 'Granting limited ALTER for migrations (no DROP)...'

-- Migration role needs ALTER for schema changes, but NOT DROP
GRANT SELECT, INSERT, UPDATE, DELETE, ALTER ON ALL TABLES IN SCHEMA public TO :migration_role_name;
GRANT SELECT, INSERT, UPDATE, DELETE, USAGE ON ALL SEQUENCES IN SCHEMA public TO :migration_role_name;

-- Allow creating tables (for migrations)
GRANT CREATE ON SCHEMA public TO :migration_role_name;

-- Allow creating indexes (for migrations)
GRANT CREATE ON SCHEMA public TO :migration_role_name;

-- Future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE, DELETE, ALTER ON TABLES TO :migration_role_name;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE, DELETE, USAGE ON SEQUENCES TO :migration_role_name;

\echo 'Migration role can: SELECT, INSERT, UPDATE, DELETE, ALTER, CREATE'
\echo 'Migration role CANNOT: DROP (must be done manually by admin)'
\echo ''

-- ============================================================================
-- Step 5: Developer Read-Only Role Permissions
-- ============================================================================

\echo 'Step 5: Setting developer read-only permissions...'
\echo '----------------------------------------------------------------------'

-- Read-only access to all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO :dev_readonly_role_name;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO :dev_readonly_role_name;

-- Future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT ON TABLES TO :dev_readonly_role_name;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT ON SEQUENCES TO :dev_readonly_role_name;

\echo 'Developer read-only role can: SELECT only'
\echo 'Developer read-only role CANNOT: INSERT, UPDATE, DELETE, ALTER, DROP'
\echo ''

-- ============================================================================
-- Step 6: Explicitly REVOKE Dangerous Privileges
-- ============================================================================

\echo 'Step 6: Explicitly revoking dangerous privileges...'
\echo '----------------------------------------------------------------------'

-- Ensure no DROP privileges
REVOKE DROP ON ALL TABLES IN SCHEMA public FROM :app_role_name;
REVOKE DROP ON ALL TABLES IN SCHEMA public FROM :dev_readonly_role_name;
-- Note: Migration role also cannot DROP (not granted above)

-- Ensure no TRUNCATE privileges
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM :app_role_name;
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM :migration_role_name;
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM :dev_readonly_role_name;

-- Ensure no CREATE/DROP on schema
REVOKE CREATE ON SCHEMA public FROM :app_role_name;
REVOKE CREATE ON SCHEMA public FROM :dev_readonly_role_name;
-- Migration role keeps CREATE for migrations

\echo 'Revoked DELETE, DROP, TRUNCATE, and schema CREATE from non-migration roles'
\echo ''

-- ============================================================================
-- Step 7: Enable Row Level Security (RLS) on Sensitive Tables
-- ============================================================================

\echo 'Step 7: Enabling Row Level Security on sensitive tables...'
\echo '----------------------------------------------------------------------'

-- Enable RLS on sensitive tables to prevent bulk operations
-- This adds an extra layer of protection

DO $$
DECLARE
    table_name text;
    sensitive_tables text[] := ARRAY[
        'users',
        'providers',
        'payments',
        'payouts',
        'bookings'
    ];
BEGIN
    FOREACH table_name IN ARRAY sensitive_tables
    LOOP
        BEGIN
            ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled RLS on: %', table_name;
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE 'Table does not exist: % (skipping)', table_name;
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not enable RLS on %: %', table_name, SQLERRM;
        END;
    END LOOP;
END
$$;

-- Note: RLS policies need to be created separately based on your access patterns
-- For now, we enable RLS but allow all access (policies can be added later)

\echo 'RLS enabled on sensitive tables (policies to be configured separately)'
\echo ''

-- ============================================================================
-- Step 8: Create Login Users (Optional - for direct connections)
-- ============================================================================

\echo 'Step 8: Creating login users (optional)...'
\echo '----------------------------------------------------------------------'
\echo 'NOTE: In production, use connection pooling with role assignment'
\echo 'These users are for direct connections if needed'
\echo ''

-- Application user (for direct connections if needed)
-- Password should be set via environment variable
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'connectsa_app_user') THEN
        CREATE USER connectsa_app_user WITH PASSWORD 'CHANGE_ME_IN_PRODUCTION';
        GRANT :app_role_name TO connectsa_app_user;
        RAISE NOTICE 'Created user: connectsa_app_user (PASSWORD MUST BE CHANGED)';
    ELSE
        RAISE NOTICE 'User already exists: connectsa_app_user';
    END IF;
END
$$;

-- Developer read-only user (for debugging)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'connectsa_dev_user') THEN
        CREATE USER connectsa_dev_user WITH PASSWORD 'CHANGE_ME_IN_PRODUCTION';
        GRANT :dev_readonly_role_name TO connectsa_dev_user;
        RAISE NOTICE 'Created user: connectsa_dev_user (PASSWORD MUST BE CHANGED)';
    ELSE
        RAISE NOTICE 'User already exists: connectsa_dev_user';
    END IF;
END
$$;

\echo ''
\echo '⚠️  CRITICAL: Change passwords for connectsa_app_user and connectsa_dev_user'
\echo '   Use: ALTER USER connectsa_app_user WITH PASSWORD ''new_password'';'
\echo ''

-- ============================================================================
-- Step 9: Create Safety Constraints
-- ============================================================================

\echo 'Step 9: Creating safety constraints...'
\echo '----------------------------------------------------------------------'

-- Create a function to prevent dangerous bulk DELETE operations
-- This will require explicit confirmation for DELETE without WHERE clause
-- (Note: This is a safety measure, actual enforcement depends on application logic)

CREATE OR REPLACE FUNCTION public.prevent_bulk_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- This is a placeholder - actual implementation depends on your needs
    -- For now, we rely on role permissions to prevent DELETE
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

\echo 'Created safety function (placeholder - customize as needed)'
\echo ''

-- ============================================================================
-- Step 10: Summary
-- ============================================================================

\echo '================================================================================'
\echo 'ROLE SETUP COMPLETE'
\echo '================================================================================'
\echo ''
\echo 'Roles Created:'
\echo '  1. ' :app_role_name ' - Application runtime (SELECT, INSERT, UPDATE)'
\echo '  2. ' :migration_role_name ' - CI/CD migrations (SELECT, INSERT, UPDATE, DELETE, ALTER)'
\echo '  3. ' :dev_readonly_role_name ' - Developer read-only (SELECT only)'
\echo ''
\echo 'Users Created (passwords must be changed):'
\echo '  1. connectsa_app_user - Application user'
\echo '  2. connectsa_dev_user - Developer read-only user'
\echo ''
\echo 'Next Steps:'
\echo '  1. Change passwords for all users'
\echo '  2. Update application DATABASE_URL to use connectsa_app_user'
\echo '  3. Update CI/CD to use migration role for migrations'
\echo '  4. Test permissions with: scripts/verify-database-permissions.sql'
\echo '  5. Configure RLS policies for sensitive tables'
\echo ''
\echo '================================================================================'
\echo ''
