-- Fix Database Schema - Add Missing payoutStatus Column
-- This script adds the missing payoutStatus column to the bookings table

-- Check if the column already exists
DO $$ 
BEGIN
    -- Add the payoutStatus column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'payoutStatus'
    ) THEN
        ALTER TABLE "bookings" ADD COLUMN "payoutStatus" TEXT;
        RAISE NOTICE 'Added payoutStatus column to bookings table';
    ELSE
        RAISE NOTICE 'payoutStatus column already exists in bookings table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'payoutStatus';
