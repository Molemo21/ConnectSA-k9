-- Fix all nullable fields that are causing Prisma errors
-- This script updates existing records to have default values instead of NULL

-- Fix escrow_amount in payments table
UPDATE payments 
SET escrow_amount = COALESCE(escrow_amount, 0.0)
WHERE escrow_amount IS NULL;

-- Fix platform_fee in payments table
UPDATE payments 
SET platform_fee = COALESCE(platform_fee, 0.0)
WHERE platform_fee IS NULL;

-- Fix platform_fee in bookings table
UPDATE bookings 
SET platform_fee = COALESCE(platform_fee, 0.0)
WHERE platform_fee IS NULL;

-- Fix total_amount in bookings table
UPDATE bookings 
SET total_amount = COALESCE(total_amount, 0.0)
WHERE total_amount IS NULL;

-- Verify the fixes
SELECT 
    'payments.escrow_amount' as field,
    COUNT(*) as null_count
FROM payments 
WHERE escrow_amount IS NULL
UNION ALL
SELECT 
    'payments.platform_fee' as field,
    COUNT(*) as null_count
FROM payments 
WHERE platform_fee IS NULL
UNION ALL
SELECT 
    'bookings.platform_fee' as field,
    COUNT(*) as null_count
FROM bookings 
WHERE platform_fee IS NULL
UNION ALL
SELECT 
    'bookings.total_amount' as field,
    COUNT(*) as null_count
FROM bookings 
WHERE total_amount IS NULL;
