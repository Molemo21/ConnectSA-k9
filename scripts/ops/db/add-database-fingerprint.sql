-- ============================================================================
-- Add Database Environment Fingerprint
-- ============================================================================
-- This script adds the environment fingerprint record to the database_metadata
-- table. This is required for the environment fingerprint validation system
-- to work properly.
--
-- Expected Environment: dev (for development database)
-- ============================================================================

-- Check if database_metadata table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'database_metadata'
    ) THEN
        RAISE EXCEPTION 'database_metadata table does not exist. Please run migrations first.';
    END IF;
END $$;

-- Insert or update the fingerprint record
-- IMPORTANT: The id must be 'singleton' as the validation system expects this specific ID
-- Using 'dev' as the environment and a unique fingerprint
INSERT INTO database_metadata (id, environment, fingerprint, "createdAt", "updatedAt")
VALUES (
    'singleton',            -- MUST be 'singleton' - validation system expects this ID
    'dev',                  -- Environment: dev, staging, or prod
    'dev-environment-fingerprint-' || extract(epoch from now())::text,  -- Unique fingerprint
    NOW(),                  -- Created timestamp
    NOW()                   -- Updated timestamp
)
ON CONFLICT (id) DO UPDATE SET
    environment = EXCLUDED.environment,
    fingerprint = EXCLUDED.fingerprint,
    "updatedAt" = NOW();

-- Verify the fingerprint was inserted/updated
SELECT 
    id,
    environment,
    fingerprint,
    "createdAt",
    "updatedAt"
FROM database_metadata
WHERE id = 'singleton';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database fingerprint record added/updated successfully!';
    RAISE NOTICE 'Environment: dev';
    RAISE NOTICE 'Fingerprint ID: singleton';
    RAISE NOTICE 'The validation system will now recognize this database as a dev environment.';
END $$;
