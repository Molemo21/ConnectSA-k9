-- Manual Database Migration Script
-- Add PENDING_EXECUTION to BookingStatus enum in production database
-- Run this directly on your Supabase production database

-- First, check if PENDING_EXECUTION already exists
DO $$ 
BEGIN
    -- Check if the enum value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PENDING_EXECUTION' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'BookingStatus'
        )
    ) THEN
        -- Add the enum value
        ALTER TYPE "BookingStatus" ADD VALUE 'PENDING_EXECUTION';
        RAISE NOTICE 'PENDING_EXECUTION enum value added successfully';
    ELSE
        RAISE NOTICE 'PENDING_EXECUTION enum value already exists';
    END IF;
END $$;

-- Verify the enum values
SELECT enumlabel as booking_status_values 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')
ORDER BY enumsortorder;
