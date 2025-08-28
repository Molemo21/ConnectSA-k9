-- Fix existing bookings to be compatible with new escrow payment system
-- This script adds missing fields and updates existing data

-- 1. Add missing columns to existing bookings if they don't exist
DO $$ 
BEGIN
    -- Add duration column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'duration') THEN
        ALTER TABLE "bookings" ADD COLUMN "duration" INTEGER DEFAULT 60;
        RAISE NOTICE 'Added duration column to bookings table';
    END IF;
    
    -- Add platformFee column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'platformFee') THEN
        ALTER TABLE "bookings" ADD COLUMN "platformFee" DOUBLE PRECISION DEFAULT 0.00;
        RAISE NOTICE 'Added platformFee column to bookings table';
    END IF;
    
    -- Add address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'address') THEN
        ALTER TABLE "bookings" ADD COLUMN "address" TEXT DEFAULT 'Address not specified';
        RAISE NOTICE 'Added address column to bookings table';
    END IF;
END $$;

-- 2. Update existing bookings with default values
UPDATE "bookings" 
SET 
    "duration" = COALESCE("duration", 60),
    "platformFee" = COALESCE("platformFee", 0.00),
    "address" = COALESCE("address", 'Address not specified')
WHERE 
    "duration" IS NULL 
    OR "platformFee" IS NULL 
    OR "address" IS NULL;

-- 3. Add missing columns to payments table if they don't exist
DO $$ 
BEGIN
    -- Add escrowAmount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'escrowAmount') THEN
        ALTER TABLE "payments" ADD COLUMN "escrowAmount" DOUBLE PRECISION;
        RAISE NOTICE 'Added escrowAmount column to payments table';
    END IF;
    
    -- Add platformFee column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'platformFee') THEN
        ALTER TABLE "payments" ADD COLUMN "platformFee" DOUBLE PRECISION;
        RAISE NOTICE 'Added platformFee column to payments table';
    END IF;
    
    -- Add currency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'currency') THEN
        ALTER TABLE "payments" ADD COLUMN "currency" TEXT DEFAULT 'ZAR';
        RAISE NOTICE 'Added currency column to payments table';
    END IF;
    
    -- Add transactionId column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'transactionId') THEN
        ALTER TABLE "payments" ADD COLUMN "transactionId" TEXT;
        RAISE NOTICE 'Added transactionId column to payments table';
    END IF;
    
    -- Add authorizationUrl column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'authorizationUrl') THEN
        ALTER TABLE "payments" ADD COLUMN "authorizationUrl" TEXT;
        RAISE NOTICE 'Added authorizationUrl column to payments table';
    END IF;
    
    -- Add accessCode column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'accessCode') THEN
        ALTER TABLE "payments" ADD COLUMN "accessCode" TEXT;
        RAISE NOTICE 'Added accessCode column to payments table';
    END IF;
    
    -- Add paidAt column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'paidAt') THEN
        ALTER TABLE "payments" ADD COLUMN "paidAt" TIMESTAMP(3);
        RAISE NOTICE 'Added paidAt column to payments table';
    END IF;
END $$;

-- 4. Update existing payments with default values
UPDATE "payments" 
SET 
    "escrowAmount" = COALESCE("escrowAmount", "amount"),
    "platformFee" = COALESCE("platformFee", 0.00),
    "currency" = COALESCE("currency", 'ZAR'),
    "status" = CASE 
        WHEN "status" = 'paid' THEN 'ESCROW'
        WHEN "status" = 'completed' THEN 'ESCROW'
        ELSE COALESCE("status", 'PENDING')
    END
WHERE 
    "escrowAmount" IS NULL 
    OR "platformFee" IS NULL 
    OR "currency" IS NULL;

-- 5. Update existing booking statuses to match new enum
UPDATE "bookings" 
SET "status" = CASE 
    WHEN "status" = 'PAID' THEN 'PENDING_EXECUTION'
    WHEN "status" = 'paid' THEN 'PENDING_EXECUTION'
    ELSE "status"
END
WHERE "status" IN ('PAID', 'paid');

-- 6. Show summary of what was updated
SELECT 
    'Bookings updated' as table_name,
    COUNT(*) as records_updated
FROM "bookings" 
WHERE "duration" = 60 AND "platformFee" = 0.00

UNION ALL

SELECT 
    'Payments updated' as table_name,
    COUNT(*) as records_updated
FROM "payments" 
WHERE "currency" = 'ZAR';

-- 7. Show current booking statuses
SELECT 
    "status",
    COUNT(*) as count
FROM "bookings" 
GROUP BY "status" 
ORDER BY count DESC;

-- 8. Show current payment statuses
SELECT 
    "status",
    COUNT(*) as count
FROM "payments" 
GROUP BY "status" 
ORDER BY count DESC;
