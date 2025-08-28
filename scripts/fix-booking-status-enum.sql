-- Fix BookingStatus Enum
-- Add PAYMENT_PROCESSING to the existing enum

-- Step 1: Add the new enum value
ALTER TYPE "BookingStatus" ADD VALUE 'PAYMENT_PROCESSING';

-- Step 2: Verify the enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'BookingStatus'
)
ORDER BY enumsortorder;

-- Step 3: Check if the enum was updated correctly
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'BookingStatus'
ORDER BY e.enumsortorder;
