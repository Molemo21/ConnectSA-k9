-- Add CASH_PAID to PaymentStatus enum
-- This migration adds support for the intermediate cash payment state in Option A flow

DO $$ 
BEGIN
  -- Check if CASH_PAID already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'CASH_PAID' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
  ) THEN
    ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_PAID';
    RAISE NOTICE 'Added CASH_PAID to PaymentStatus enum';
  ELSE
    RAISE NOTICE 'CASH_PAID already exists in PaymentStatus enum';
  END IF;
END $$;

-- Verify the change
SELECT 'Migration completed: CASH_PAID added to PaymentStatus enum' as status;


