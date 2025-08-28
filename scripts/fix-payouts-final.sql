-- Final Fix for Payouts Table Structure
-- This script ensures the payouts table exactly matches the Prisma schema

-- Step 1: Drop the existing payouts table completely
DROP TABLE IF EXISTS "payouts" CASCADE;

-- Step 2: Create the payouts table with exact structure matching Prisma schema
CREATE TABLE "payouts" (
  "id" TEXT PRIMARY KEY,
  "paymentId" TEXT UNIQUE NOT NULL,
  "providerId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "paystack_ref" TEXT NOT NULL,
  "status" TEXT DEFAULT 'PENDING',
  "transfer_code" TEXT,
  "recipient_code" TEXT,
  "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create indexes for performance
CREATE INDEX "idx_payouts_paymentId" ON "payouts"("paymentId");
CREATE INDEX "idx_payouts_providerId" ON "payouts"("providerId");
CREATE INDEX "idx_payouts_status" ON "payouts"("status");

-- Step 4: Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payouts'
ORDER BY ordinal_position;

-- Step 5: Test data insertion (optional - uncomment to test)
-- INSERT INTO "payouts" (
--   "id", "paymentId", "providerId", "amount", "paystack_ref", "status"
-- ) VALUES (
--   'test_payout_001',
--   'test_payment_id',
--   'test_provider_id',
--   25.00,
--   'TEST_REF_001',
--   'PENDING'
-- );

-- Step 6: Clean up test data (if inserted)
-- DELETE FROM "payouts" WHERE "id" = 'test_payout_001';
