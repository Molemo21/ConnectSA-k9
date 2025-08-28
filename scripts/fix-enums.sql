-- Fix missing enum types for escrow payment system

-- Create payment_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'PENDING',
        'ESCROW', 
        'PROCESSING_RELEASE',
        'RELEASED',
        'REFUNDED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create payout_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM (
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update payments table to use the new enum
ALTER TABLE payments 
ALTER COLUMN status TYPE payment_status 
USING status::text::payment_status;

-- Update payouts table to use the new enum  
ALTER TABLE payouts 
ALTER COLUMN status TYPE payout_status 
USING status::text::payout_status;

-- Verify the changes
SELECT 'Enums created successfully' as result;
