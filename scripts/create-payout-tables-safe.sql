-- ============================================
-- Payment System Fixes - Safe Database Schema Creation
-- Handles existing tables and adds missing columns
-- ============================================

-- Step 1: Create PayoutStatus enum (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'PayoutStatus enum already exists';
END $$;

-- Step 2: Create or fix payouts table
DO $$ 
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'payouts'
    ) THEN
        -- Create table if it doesn't exist
        CREATE TABLE "payouts" (
            "id" TEXT NOT NULL,
            "paymentId" TEXT NOT NULL,
            "providerId" TEXT NOT NULL,
            "amount" DOUBLE PRECISION NOT NULL,
            "paystack_ref" TEXT NOT NULL,
            "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
            "transfer_code" TEXT,
            "recipient_code" TEXT,
            "error" TEXT,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
        );
        RAISE NOTICE 'Created payouts table';
    ELSE
        -- Table exists, add missing columns
        RAISE NOTICE 'payouts table exists, checking for missing columns...';
        
        -- Add missing columns one by one
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'id'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "id" TEXT;
            RAISE NOTICE 'Added id column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'paymentId'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "paymentId" TEXT;
            RAISE NOTICE 'Added paymentId column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'providerId'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "providerId" TEXT;
            RAISE NOTICE 'Added providerId column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'amount'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "amount" DOUBLE PRECISION;
            RAISE NOTICE 'Added amount column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'paystack_ref'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "paystack_ref" TEXT;
            RAISE NOTICE 'Added paystack_ref column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'status'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "status" "PayoutStatus" DEFAULT 'PENDING';
            RAISE NOTICE 'Added status column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'transfer_code'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "transfer_code" TEXT;
            RAISE NOTICE 'Added transfer_code column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'recipient_code'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "recipient_code" TEXT;
            RAISE NOTICE 'Added recipient_code column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'error'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "error" TEXT;
            RAISE NOTICE 'Added error column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
            RAISE NOTICE 'Added created_at column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
            RAISE NOTICE 'Added updated_at column';
        END IF;
        
        -- Add primary key if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE table_schema = 'public' 
            AND table_name = 'payouts' 
            AND constraint_name = 'payouts_pkey'
        ) THEN
            ALTER TABLE "payouts" ADD CONSTRAINT "payouts_pkey" PRIMARY KEY ("id");
            RAISE NOTICE 'Added primary key constraint';
        END IF;
    END IF;
END $$;

-- Step 3: Create or fix webhook_events table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'webhook_events'
    ) THEN
        CREATE TABLE "webhook_events" (
            "id" TEXT NOT NULL,
            "event_type" TEXT NOT NULL,
            "paystack_ref" TEXT NOT NULL,
            "payload" TEXT NOT NULL,
            "processed" BOOLEAN NOT NULL DEFAULT false,
            "retry_count" INTEGER NOT NULL DEFAULT 0,
            "error" TEXT,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "processed_at" TIMESTAMP(3),
            CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
        );
        RAISE NOTICE 'Created webhook_events table';
    ELSE
        RAISE NOTICE 'webhook_events table exists, checking for missing columns...';
        
        -- Add missing columns
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'webhook_events' AND column_name = 'paystack_ref'
        ) THEN
            ALTER TABLE "webhook_events" ADD COLUMN "paystack_ref" TEXT;
            RAISE NOTICE 'Added paystack_ref column to webhook_events';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'webhook_events' AND column_name = 'event_type'
        ) THEN
            ALTER TABLE "webhook_events" ADD COLUMN "event_type" TEXT;
            RAISE NOTICE 'Added event_type column';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'webhook_events' AND column_name = 'payload'
        ) THEN
            ALTER TABLE "webhook_events" ADD COLUMN "payload" TEXT;
            RAISE NOTICE 'Added payload column';
        END IF;
    END IF;
END $$;

-- Step 4: Create indexes (only after columns exist)
CREATE INDEX IF NOT EXISTS "payouts_providerId_idx" ON "payouts"("providerId");
CREATE INDEX IF NOT EXISTS "payouts_status_idx" ON "payouts"("status");
CREATE INDEX IF NOT EXISTS "webhook_events_paystack_ref_idx" ON "webhook_events"("paystack_ref");
CREATE INDEX IF NOT EXISTS "webhook_events_processed_idx" ON "webhook_events"("processed");
CREATE INDEX IF NOT EXISTS "webhook_events_event_type_idx" ON "webhook_events"("event_type");

-- Step 5: Create unique constraint on payout paymentId (only if column exists)
DO $$ BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'paymentId'
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS "payouts_paymentId_key" ON "payouts"("paymentId");
    END IF;
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Could not create unique index on paymentId: %', SQLERRM;
END $$;

-- Step 6: Create composite index for webhook_events (only if columns exist)
DO $$ BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'webhook_events' 
        AND column_name = 'event_type'
    ) AND EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'webhook_events' 
        AND column_name = 'paystack_ref'
    ) THEN
        CREATE INDEX IF NOT EXISTS "webhook_events_event_type_paystack_ref_processed_idx" 
            ON "webhook_events"("event_type", "paystack_ref", "processed");
    END IF;
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Could not create composite index: %', SQLERRM;
END $$;

-- Step 7: Add foreign key constraints (only if columns exist)
DO $$ BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'paymentId'
    ) AND EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'payments'
    ) THEN
        ALTER TABLE "payouts" ADD CONSTRAINT "payouts_paymentId_fkey" 
            FOREIGN KEY ("paymentId") REFERENCES "payments"("id") 
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Foreign key payouts_paymentId_fkey already exists';
    WHEN OTHERS THEN 
        RAISE NOTICE 'Could not create foreign key on paymentId: %', SQLERRM;
END $$;

DO $$ BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'providerId'
    ) AND EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'providers'
    ) THEN
        ALTER TABLE "payouts" ADD CONSTRAINT "payouts_providerId_fkey" 
            FOREIGN KEY ("providerId") REFERENCES "providers"("id") 
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Foreign key payouts_providerId_fkey already exists';
    WHEN OTHERS THEN 
        RAISE NOTICE 'Could not create foreign key on providerId: %', SQLERRM;
END $$;

-- Step 8: Add escrowAmount and platformFee to payments table
DO $$ BEGIN
    ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "escrow_amount" DOUBLE PRECISION;
    ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "platform_fee" DOUBLE PRECISION;
    RAISE NOTICE 'Verified escrow_amount and platform_fee columns in payments table';
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Could not add columns to payments table: %', SQLERRM;
END $$;

-- Step 9: Final verification
DO $$ 
DECLARE
    payout_cols INTEGER;
    webhook_cols INTEGER;
BEGIN
    SELECT COUNT(*) INTO payout_cols 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payouts';
    
    SELECT COUNT(*) INTO webhook_cols 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'webhook_events';
    
    RAISE NOTICE '✅ Verification complete';
    RAISE NOTICE '   payouts table has % columns', payout_cols;
    RAISE NOTICE '   webhook_events table has % columns', webhook_cols;
END $$;

