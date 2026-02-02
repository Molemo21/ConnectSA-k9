-- Fix PayoutStatus enum to include PENDING value
-- This script checks the current enum values and adds PENDING if it doesn't exist

-- First, check what values currently exist
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'PayoutStatus'
ORDER BY e.enumsortorder;

-- Add PENDING value if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PENDING' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PayoutStatus')
    ) THEN
        ALTER TYPE "PayoutStatus" ADD VALUE 'PENDING' BEFORE 'PROCESSING';
        RAISE NOTICE 'Added PENDING to PayoutStatus enum';
    ELSE
        RAISE NOTICE 'PENDING already exists in PayoutStatus enum';
    END IF;
END $$;

-- Verify the enum values after update
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'PayoutStatus'
ORDER BY e.enumsortorder;
