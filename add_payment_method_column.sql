-- Add paymentMethod column to Booking table
-- This migration adds support for cash payments in the booking system

-- First, ensure the PaymentMethod enum exists
DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'CASH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add the paymentMethod column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'ONLINE';
EXCEPTION
    WHEN duplicate_column THEN
        RAISE NOTICE 'Column paymentMethod already exists';
END $$;

-- Add cash payment statuses to PaymentStatus enum if they don't exist
DO $$ BEGIN
    -- Check if CASH_PENDING exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CASH_PENDING' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
    ) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_PENDING';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CASH_RECEIVED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
    ) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_RECEIVED';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CASH_VERIFIED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
    ) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_VERIFIED';
    END IF;
END $$;



-- This migration adds support for cash payments in the booking system

-- First, ensure the PaymentMethod enum exists
DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'CASH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add the paymentMethod column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'ONLINE';
EXCEPTION
    WHEN duplicate_column THEN
        RAISE NOTICE 'Column paymentMethod already exists';
END $$;

-- Add cash payment statuses to PaymentStatus enum if they don't exist
DO $$ BEGIN
    -- Check if CASH_PENDING exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CASH_PENDING' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
    ) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_PENDING';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CASH_RECEIVED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
    ) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_RECEIVED';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CASH_VERIFIED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
    ) THEN
        ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_VERIFIED';
    END IF;
END $$;



