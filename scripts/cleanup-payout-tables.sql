-- ============================================
-- Cleanup Script - Remove problematic indexes/constraints
-- Run this FIRST if you're getting column errors
-- ============================================

-- Drop constraints first (including unique constraints that use indexes)
DO $$ 
DECLARE
    constraint_rec RECORD;
BEGIN
    -- Drop all constraints on payouts table (except primary key)
    FOR constraint_rec IN 
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public' 
        AND table_name = 'payouts'
        AND constraint_name != 'payouts_pkey'  -- Keep primary key
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE "payouts" DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_rec.constraint_name) || ' CASCADE';
            RAISE NOTICE 'Dropped constraint: %', constraint_rec.constraint_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop constraint %: %', constraint_rec.constraint_name, SQLERRM;
        END;
    END LOOP;
    
    -- Drop all constraints on webhook_events table (except primary key)
    FOR constraint_rec IN 
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events'
        AND constraint_name != 'webhook_events_pkey'  -- Keep primary key
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE "webhook_events" DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_rec.constraint_name) || ' CASCADE';
            RAISE NOTICE 'Dropped constraint: %', constraint_rec.constraint_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop constraint %: %', constraint_rec.constraint_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Now drop remaining indexes (that aren't constraints)
DO $$ 
DECLARE
    idx RECORD;
BEGIN
    -- Drop all indexes on payouts table
    FOR idx IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'payouts'
        AND indexname != 'payouts_pkey'  -- Keep primary key
    LOOP
        BEGIN
            EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(idx.indexname) || ' CASCADE';
            RAISE NOTICE 'Dropped index: %', idx.indexname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop index %: %', idx.indexname, SQLERRM;
        END;
    END LOOP;
    
    -- Drop all indexes on webhook_events table
    FOR idx IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'webhook_events'
        AND indexname != 'webhook_events_pkey'  -- Keep primary key
    LOOP
        BEGIN
            EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(idx.indexname) || ' CASCADE';
            RAISE NOTICE 'Dropped index: %', idx.indexname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop index %: %', idx.indexname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Drop foreign key constraints that might cause issues
DO $$ 
BEGIN
    ALTER TABLE "payouts" DROP CONSTRAINT IF EXISTS "payouts_paymentId_fkey" CASCADE;
    RAISE NOTICE 'Dropped foreign key: payouts_paymentId_fkey';
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Could not drop payouts_paymentId_fkey: %', SQLERRM;
END $$;

DO $$ 
BEGIN
    ALTER TABLE "payouts" DROP CONSTRAINT IF EXISTS "payouts_providerId_fkey" CASCADE;
    RAISE NOTICE 'Dropped foreign key: payouts_providerId_fkey';
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Could not drop payouts_providerId_fkey: %', SQLERRM;
END $$;

-- Show current table structure
DO $$ 
BEGIN
    RAISE NOTICE 'Cleanup complete. Current table structures:';
END $$;

-- Show payouts columns
SELECT 'payouts' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'payouts'
ORDER BY ordinal_position;

-- Show webhook_events columns
SELECT 'webhook_events' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'webhook_events'
ORDER BY ordinal_position;

