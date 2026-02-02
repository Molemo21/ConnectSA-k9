-- Add missing columns to payouts table if they don't exist
-- Run this script directly in your PostgreSQL database

-- Add paystack_ref column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payouts' AND column_name = 'paystack_ref'
    ) THEN
        ALTER TABLE "payouts" ADD COLUMN "paystack_ref" TEXT;
        RAISE NOTICE 'Added column paystack_ref';
    ELSE
        RAISE NOTICE 'Column paystack_ref already exists';
    END IF;
END $$;

-- Add transfer_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payouts' AND column_name = 'transfer_code'
    ) THEN
        ALTER TABLE "payouts" ADD COLUMN "transfer_code" TEXT;
        RAISE NOTICE 'Added column transfer_code';
    ELSE
        RAISE NOTICE 'Column transfer_code already exists';
    END IF;
END $$;

-- Add recipient_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payouts' AND column_name = 'recipient_code'
    ) THEN
        ALTER TABLE "payouts" ADD COLUMN "recipient_code" TEXT;
        RAISE NOTICE 'Added column recipient_code';
    ELSE
        RAISE NOTICE 'Column recipient_code already exists';
    END IF;
END $$;

-- Add error column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payouts' AND column_name = 'error'
    ) THEN
        ALTER TABLE "payouts" ADD COLUMN "error" TEXT;
        RAISE NOTICE 'Added column error';
    ELSE
        RAISE NOTICE 'Column error already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payouts'
ORDER BY ordinal_position;
