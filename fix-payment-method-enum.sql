-- Fix PaymentMethod enum to include CASH
-- This is a quick fix to add CASH to the PaymentMethod enum if it doesn't exist

DO $$ 
BEGIN
    -- Check if CASH exists in PaymentMethod enum, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CASH' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentMethod')
    ) THEN
        ALTER TYPE "PaymentMethod" ADD VALUE 'CASH';
        RAISE NOTICE 'Added CASH to PaymentMethod enum';
    ELSE
        RAISE NOTICE 'CASH already exists in PaymentMethod enum';
    END IF;
END $$;

-- Verify the fix
SELECT 
    unnest(enum_range(NULL::"PaymentMethod")) AS payment_method_value;







