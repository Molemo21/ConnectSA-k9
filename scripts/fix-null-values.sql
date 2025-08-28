-- Fix Null Values in Payment Table
-- Run this script directly against your database to fix the null escrow and platform fee values

-- Step 1: Check current state
SELECT 
  COUNT(*) as total_payments,
  COUNT(CASE WHEN "escrowAmount" IS NULL THEN 1 END) as null_escrow_count,
  COUNT(CASE WHEN "platformFee" IS NULL THEN 1 END) as null_platform_fee_count,
  COUNT(CASE WHEN currency IS NULL THEN 1 END) as null_currency_count
FROM payments;

-- Step 2: Show payments with null values
SELECT 
  id,
  amount,
  "escrowAmount",
  "platformFee",
  currency,
  status,
  "paystackRef"
FROM payments
WHERE "escrowAmount" IS NULL OR "platformFee" IS NULL OR currency IS NULL
ORDER BY "createdAt" DESC;

-- Step 3: Fix null values
-- Calculate 10% platform fee and 90% escrow amount
UPDATE payments 
SET 
  "escrowAmount" = ROUND((amount * 0.9)::numeric, 2),
  "platformFee" = ROUND((amount * 0.1)::numeric, 2),
  currency = 'ZAR',
  "updatedAt" = NOW()
WHERE "escrowAmount" IS NULL OR "platformFee" IS NULL OR currency IS NULL;

-- Step 4: Verify the fix
SELECT 
  COUNT(*) as total_payments,
  COUNT(CASE WHEN "escrowAmount" IS NULL THEN 1 END) as null_escrow_count,
  COUNT(CASE WHEN "platformFee" IS NULL THEN 1 END) as null_platform_fee_count,
  COUNT(CASE WHEN currency IS NULL THEN 1 END) as null_currency_count
FROM payments;

-- Step 5: Show sample of fixed payments
SELECT 
  id,
  amount,
  "escrowAmount",
  "platformFee",
  currency,
  status
FROM payments
ORDER BY "updatedAt" DESC
LIMIT 5;

-- Step 6: Check payment status distribution
SELECT 
  status,
  COUNT(*) as count
FROM payments
GROUP BY status
ORDER BY count DESC;
