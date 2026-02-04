-- Safe script to fix PayoutStatus enum and add PENDING if missing
-- This script checks before adding anything to avoid duplicate errors

-- Step 1: Check current PayoutStatus enum values
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'PayoutStatus'
ORDER BY e.enumsortorder;

-- Step 2: Create PayoutStatus enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PayoutStatus') THEN
        CREATE TYPE "PayoutStatus" AS ENUM (
            'PENDING',
            'PROCESSING',
            'COMPLETED',
            'FAILED'
        );
        RAISE NOTICE 'Created PayoutStatus enum with all values';
    ELSE
        RAISE NOTICE 'PayoutStatus enum already exists';
    END IF;
END $$;

-- Step 3: Add PENDING value if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PENDING' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PayoutStatus')
    ) THEN
        ALTER TYPE "PayoutStatus" ADD VALUE 'PENDING';
        RAISE NOTICE 'Added PENDING to PayoutStatus enum';
    ELSE
        RAISE NOTICE 'PENDING already exists in PayoutStatus enum';
    END IF;
END $$;

-- Step 4: Add PROCESSING value if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PROCESSING' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PayoutStatus')
    ) THEN
        ALTER TYPE "PayoutStatus" ADD VALUE 'PROCESSING';
        RAISE NOTICE 'Added PROCESSING to PayoutStatus enum';
    ELSE
        RAISE NOTICE 'PROCESSING already exists in PayoutStatus enum';
    END IF;
END $$;

-- Step 5: Add COMPLETED value if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'COMPLETED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PayoutStatus')
    ) THEN
        ALTER TYPE "PayoutStatus" ADD VALUE 'COMPLETED';
        RAISE NOTICE 'Added COMPLETED to PayoutStatus enum';
    ELSE
        RAISE NOTICE 'COMPLETED already exists in PayoutStatus enum';
    END IF;
END $$;

-- Step 6: Add FAILED value if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'FAILED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PayoutStatus')
    ) THEN
        ALTER TYPE "PayoutStatus" ADD VALUE 'FAILED';
        RAISE NOTICE 'Added FAILED to PayoutStatus enum';
    ELSE
        RAISE NOTICE 'FAILED already exists in PayoutStatus enum';
    END IF;
END $$;

-- Step 7: Verify final enum values
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'PayoutStatus'
ORDER BY e.enumsortorder;
