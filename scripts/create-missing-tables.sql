-- Create missing tables for escrow payment system if they don't exist

-- 1. Create payouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS "payouts" (
    "id" TEXT PRIMARY KEY,
    "paymentId" TEXT UNIQUE NOT NULL,
    "providerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paystackRef" TEXT NOT NULL,
    "status" TEXT DEFAULT 'PENDING',
    "transferCode" TEXT,
    "recipientCode" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create job_proofs table if it doesn't exist
CREATE TABLE IF NOT EXISTS "job_proofs" (
    "id" TEXT PRIMARY KEY,
    "bookingId" TEXT UNIQUE NOT NULL,
    "providerId" TEXT NOT NULL,
    "photos" TEXT[] DEFAULT '{}',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "clientConfirmed" BOOLEAN DEFAULT FALSE,
    "confirmedAt" TIMESTAMP(3),
    "autoConfirmAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create disputes table if it doesn't exist
CREATE TABLE IF NOT EXISTS "disputes" (
    "id" TEXT PRIMARY KEY,
    "bookingId" TEXT UNIQUE NOT NULL,
    "raisedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT DEFAULT 'PENDING',
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_payouts_paymentId" ON "payouts"("paymentId");
CREATE INDEX IF NOT EXISTS "idx_payouts_providerId" ON "payouts"("providerId");
CREATE INDEX IF NOT EXISTS "idx_payouts_status" ON "payouts"("status");

CREATE INDEX IF NOT EXISTS "idx_job_proofs_bookingId" ON "job_proofs"("bookingId");
CREATE INDEX IF NOT EXISTS "idx_job_proofs_providerId" ON "job_proofs"("providerId");

CREATE INDEX IF NOT EXISTS "idx_disputes_bookingId" ON "disputes"("bookingId");
CREATE INDEX IF NOT EXISTS "idx_disputes_raisedBy" ON "disputes"("raisedBy");
CREATE INDEX IF NOT EXISTS "idx_disputes_status" ON "disputes"("status");

-- 5. Show what tables were created
SELECT 
    schemaname,
    tablename,
    'Table exists' as status
FROM pg_tables 
WHERE tablename IN ('payouts', 'job_proofs', 'disputes')
ORDER BY tablename;
