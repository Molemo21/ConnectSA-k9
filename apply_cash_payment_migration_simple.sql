-- Cash Payment Migration (Simplified Version)
-- Run this in Supabase SQL Editor

-- Step 1: Add cash payment statuses to PaymentStatus enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CASH_PENDING' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_PENDING';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CASH_RECEIVED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_RECEIVED';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CASH_VERIFIED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_VERIFIED';
    END IF;
END $$;

-- Step 2: Add paymentMethod column (if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'paymentMethod') THEN
        ALTER TABLE "bookings" ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'ONLINE';
    END IF;
END $$;

-- Step 3: Set existing bookings to ONLINE
UPDATE "bookings" SET "paymentMethod" = 'ONLINE' WHERE "paymentMethod" IS NULL;

-- Done!
SELECT 'Cash payment migration completed!' as result;







