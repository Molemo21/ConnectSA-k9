-- ============================================
-- Payment System Fixes - Database Schema
-- Creates Payout and WebhookEvent tables
-- ============================================

-- Step 1: Create PayoutStatus enum (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'PayoutStatus enum already exists';
END $$;

-- Step 2: Drop existing tables if they exist (to avoid conflicts)
-- Uncomment these if you need to recreate tables:
-- DROP TABLE IF EXISTS "payouts" CASCADE;
-- DROP TABLE IF EXISTS "webhook_events" CASCADE;

-- Step 3: Create Payout table
CREATE TABLE IF NOT EXISTS "payouts" (
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

-- Step 4: Create WebhookEvent table
CREATE TABLE IF NOT EXISTS "webhook_events" (
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

-- Step 5: Create unique constraint on payout paymentId
DO $$ BEGIN
    CREATE UNIQUE INDEX "payouts_paymentId_key" ON "payouts"("paymentId");
EXCEPTION
    WHEN duplicate_table THEN 
        RAISE NOTICE 'Index payouts_paymentId_key already exists';
END $$;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS "payouts_providerId_idx" ON "payouts"("providerId");
CREATE INDEX IF NOT EXISTS "payouts_status_idx" ON "payouts"("status");
CREATE INDEX IF NOT EXISTS "webhook_events_paystack_ref_idx" ON "webhook_events"("paystack_ref");
CREATE INDEX IF NOT EXISTS "webhook_events_processed_idx" ON "webhook_events"("processed");
CREATE INDEX IF NOT EXISTS "webhook_events_event_type_idx" ON "webhook_events"("event_type");

-- Step 7: Create composite index for webhook_events (as per Prisma schema)
CREATE INDEX IF NOT EXISTS "webhook_events_event_type_paystack_ref_processed_idx" 
    ON "webhook_events"("event_type", "paystack_ref", "processed");

-- Step 8: Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "payouts" ADD CONSTRAINT "payouts_paymentId_fkey" 
        FOREIGN KEY ("paymentId") REFERENCES "payments"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Foreign key payouts_paymentId_fkey already exists';
END $$;

DO $$ BEGIN
    ALTER TABLE "payouts" ADD CONSTRAINT "payouts_providerId_fkey" 
        FOREIGN KEY ("providerId") REFERENCES "providers"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Foreign key payouts_providerId_fkey already exists';
END $$;

-- Step 9: Add escrowAmount and platformFee columns to payments if they don't exist
DO $$ BEGIN
    ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "escrow_amount" DOUBLE PRECISION;
    ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "platform_fee" DOUBLE PRECISION;
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'Columns escrow_amount or platform_fee already exist';
END $$;

-- Step 10: Verify tables were created
DO $$ 
DECLARE
    payout_count INTEGER;
    webhook_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO payout_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'payouts';
    
    SELECT COUNT(*) INTO webhook_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'webhook_events';
    
    IF payout_count > 0 AND webhook_count > 0 THEN
        RAISE NOTICE '✅ Successfully created payouts and webhook_events tables';
    ELSE
        RAISE WARNING '⚠️ Some tables may not have been created. Check errors above.';
    END IF;
END $$;

