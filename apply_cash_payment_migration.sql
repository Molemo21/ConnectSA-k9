-- Cash Payment Migration
-- This migration adds paymentMethod field to bookings table and cash payment statuses to PaymentStatus enum
-- Run this script against your production database

-- IMPORTANT: Make sure to backup your database before running this migration

-- Step 1: Add cash payment statuses to PaymentStatus enum
-- Note: ALTER TYPE ... ADD VALUE cannot be run inside a transaction block
-- These need to be run separately

-- Add CASH_PENDING status
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CASH_PENDING' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
    ) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_PENDING';
        RAISE NOTICE 'Added CASH_PENDING to PaymentStatus enum';
    ELSE
        RAISE NOTICE 'CASH_PENDING already exists in PaymentStatus enum';
    END IF;
END $$;

-- Add CASH_RECEIVED status
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CASH_RECEIVED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
    ) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_RECEIVED';
        RAISE NOTICE 'Added CASH_RECEIVED to PaymentStatus enum';
    ELSE
        RAISE NOTICE 'CASH_RECEIVED already exists in PaymentStatus enum';
    END IF;
END $$;

-- Add CASH_VERIFIED status
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CASH_VERIFIED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
    ) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_VERIFIED';
        RAISE NOTICE 'Added CASH_VERIFIED to PaymentStatus enum';
    ELSE
        RAISE NOTICE 'CASH_VERIFIED already exists in PaymentStatus enum';
    END IF;
END $$;

-- Step 2: Add paymentMethod column to bookings table
-- Check if column already exists before adding
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'paymentMethod'
    ) THEN
        -- Use TEXT type instead of enum for simplicity and compatibility
        ALTER TABLE "bookings" ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'ONLINE';
        RAISE NOTICE 'Added paymentMethod column to bookings table';
    ELSE
        RAISE NOTICE 'paymentMethod column already exists in bookings table';
    END IF;
END $$;

-- Step 3: Update existing bookings to ensure they have ONLINE as default
-- Handle NULL values only (avoid empty string comparison)
UPDATE "bookings" 
SET "paymentMethod" = 'ONLINE' 
WHERE "paymentMethod" IS NULL;

-- Step 4: Verify the migration
SELECT 
    'Migration Status' as status,
    (SELECT count(*) FROM pg_enum WHERE enumlabel IN ('CASH_PENDING', 'CASH_RECEIVED', 'CASH_VERIFIED') 
     AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')) as cash_statuses_added,
    (SELECT count(*) FROM information_schema.columns 
     WHERE table_name = 'bookings' AND column_name = 'paymentMethod') as payment_method_column_exists,
    (SELECT count(*) FROM "bookings" WHERE "paymentMethod" IS NOT NULL) as bookings_with_payment_method;

-- Done
SELECT 'Migration completed successfully! Cash payment support has been added.' as result;

