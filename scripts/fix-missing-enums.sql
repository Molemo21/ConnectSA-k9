-- Fix missing enums and tables for ConnectSA database
-- This script adds the missing PaymentStatus, PayoutStatus, and DisputeStatus enums
-- as well as the payouts table that's referenced in the schema

-- 1. Create missing enums
DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM (
        'PENDING',
        'ESCROW', 
        'HELD_IN_ESCROW',
        'PROCESSING_RELEASE',
        'RELEASED',
        'REFUNDED',
        'FAILED'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PayoutStatus" AS ENUM (
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DisputeStatus" AS ENUM (
        'PENDING',
        'RESOLVED',
        'ESCALATED'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Create missing payouts table
CREATE TABLE IF NOT EXISTS "payouts" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paystackTransferCode" TEXT,
    "failureReason" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- 3. Add foreign key constraints
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS "payouts_providerId_idx" ON "payouts"("providerId");
CREATE INDEX IF NOT EXISTS "payouts_paymentId_idx" ON "payouts"("paymentId");
CREATE INDEX IF NOT EXISTS "payouts_status_idx" ON "payouts"("status");

-- 5. Add unique constraint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_paymentId_key" UNIQUE ("paymentId");

-- 6. Create missing webhook_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS "webhook_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "paystackRef" TEXT,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- 7. Create missing disputes table if it doesn't exist
CREATE TABLE IF NOT EXISTS "disputes" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "raisedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- 8. Add foreign key constraints for disputes
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_raisedBy_fkey" FOREIGN KEY ("raisedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 9. Create missing job_proofs table if it doesn't exist
CREATE TABLE IF NOT EXISTS "job_proofs" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "notes" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "clientConfirmed" BOOLEAN,
    "confirmedAt" TIMESTAMP(3),
    "autoConfirmAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_proofs_pkey" PRIMARY KEY ("id")
);

-- 10. Add foreign key constraints for job_proofs
ALTER TABLE "job_proofs" ADD CONSTRAINT "job_proofs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_proofs" ADD CONSTRAINT "job_proofs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 11. Create missing messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- 12. Add foreign key constraints for messages
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 13. Create missing notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- 14. Add foreign key constraints for notifications
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 15. Create missing password_reset_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- 16. Add foreign key constraints for password_reset_tokens
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 17. Create missing proposals table if it doesn't exist
CREATE TABLE IF NOT EXISTS "proposals" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "proposedAmount" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- 18. Add foreign key constraints for proposals
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 19. Create indexes for new tables
CREATE INDEX IF NOT EXISTS "disputes_bookingId_idx" ON "disputes"("bookingId");
CREATE INDEX IF NOT EXISTS "disputes_status_idx" ON "disputes"("status");
CREATE INDEX IF NOT EXISTS "job_proofs_bookingId_idx" ON "job_proofs"("bookingId");
CREATE INDEX IF NOT EXISTS "messages_senderId_idx" ON "messages"("senderId");
CREATE INDEX IF NOT EXISTS "messages_receiverId_idx" ON "messages"("receiverId");
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");
CREATE INDEX IF NOT EXISTS "proposals_providerId_idx" ON "proposals"("providerId");
CREATE INDEX IF NOT EXISTS "proposals_bookingId_idx" ON "proposals"("bookingId");

-- 20. Verify all enums exist
SELECT typname, typtype FROM pg_type WHERE typtype = 'e' AND typname IN ('PaymentStatus', 'PayoutStatus', 'DisputeStatus', 'ProviderStatus', 'BookingStatus', 'UserRole');

-- 21. Verify all tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
