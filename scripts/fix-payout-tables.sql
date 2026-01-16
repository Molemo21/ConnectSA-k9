-- ============================================
-- Fix Existing Payout Tables (if they exist with wrong structure)
-- Run this if you get "column does not exist" errors
-- ============================================

-- Check if payouts table exists and has correct columns
DO $$ 
BEGIN
    -- Check if payouts table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'payouts'
    ) THEN
        -- Check if paystack_ref column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payouts' 
            AND column_name = 'paystack_ref'
        ) THEN
            -- Add missing column
            ALTER TABLE "payouts" ADD COLUMN "paystack_ref" TEXT;
            RAISE NOTICE 'Added missing paystack_ref column to payouts table';
        END IF;
        
        -- Check other required columns
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payouts' 
            AND column_name = 'paymentId'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "paymentId" TEXT;
            RAISE NOTICE 'Added missing paymentId column to payouts table';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payouts' 
            AND column_name = 'providerId'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "providerId" TEXT;
            RAISE NOTICE 'Added missing providerId column to payouts table';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payouts' 
            AND column_name = 'amount'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "amount" DOUBLE PRECISION;
            RAISE NOTICE 'Added missing amount column to payouts table';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payouts' 
            AND column_name = 'status'
        ) THEN
            -- Create enum first if it doesn't exist
            DO $$ BEGIN
                CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;
            
            ALTER TABLE "payouts" ADD COLUMN "status" "PayoutStatus" DEFAULT 'PENDING';
            RAISE NOTICE 'Added missing status column to payouts table';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payouts' 
            AND column_name = 'transfer_code'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "transfer_code" TEXT;
            RAISE NOTICE 'Added missing transfer_code column to payouts table';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payouts' 
            AND column_name = 'recipient_code'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "recipient_code" TEXT;
            RAISE NOTICE 'Added missing recipient_code column to payouts table';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payouts' 
            AND column_name = 'created_at'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
            RAISE NOTICE 'Added missing created_at column to payouts table';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payouts' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE "payouts" ADD COLUMN "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
            RAISE NOTICE 'Added missing updated_at column to payouts table';
        END IF;
        
        RAISE NOTICE '✅ payouts table structure verified and fixed';
    ELSE
        RAISE NOTICE 'payouts table does not exist - run create-payout-tables.sql first';
    END IF;
END $$;

-- Check if webhook_events table exists and has correct columns
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'webhook_events'
    ) THEN
        -- Check if paystack_ref column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'webhook_events' 
            AND column_name = 'paystack_ref'
        ) THEN
            ALTER TABLE "webhook_events" ADD COLUMN "paystack_ref" TEXT;
            RAISE NOTICE 'Added missing paystack_ref column to webhook_events table';
        END IF;
        
        -- Check other required columns
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'webhook_events' 
            AND column_name = 'event_type'
        ) THEN
            ALTER TABLE "webhook_events" ADD COLUMN "event_type" TEXT;
            RAISE NOTICE 'Added missing event_type column to webhook_events table';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'webhook_events' 
            AND column_name = 'payload'
        ) THEN
            ALTER TABLE "webhook_events" ADD COLUMN "payload" TEXT;
            RAISE NOTICE 'Added missing payload column to webhook_events table';
        END IF;
        
        RAISE NOTICE '✅ webhook_events table structure verified and fixed';
    ELSE
        RAISE NOTICE 'webhook_events table does not exist - run create-payout-tables.sql first';
    END IF;
END $$;

