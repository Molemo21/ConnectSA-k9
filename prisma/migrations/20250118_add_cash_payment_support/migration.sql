-- Migration: Add cash payment support
-- This migration adds the paymentMethod field to bookings and cash payment statuses to PaymentStatus enum

-- Step 1: Add cash payment statuses to PaymentStatus enum
DO $$ BEGIN
    -- Check if CASH_PENDING exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CASH_PENDING' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
    ) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_PENDING';
    END IF;
    
    -- Check if CASH_RECEIVED exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CASH_RECEIVED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
    ) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_RECEIVED';
    END IF;
    
    -- Check if CASH_VERIFIED exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CASH_VERIFIED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
    ) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_VERIFIED';
    END IF;
END $$;

-- Step 2: Add paymentMethod column to bookings table
ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'ONLINE';

-- Step 3: Update existing bookings to have ONLINE as default payment method
UPDATE "bookings" 
SET "paymentMethod" = 'ONLINE' 
WHERE "paymentMethod" IS NULL OR "paymentMethod" = '';

-- Done!
SELECT 'Migration completed: Cash payment support added' as status;








