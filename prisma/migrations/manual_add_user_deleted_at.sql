-- Migration: Add deletedAt to User model
-- Description: Adds deletedAt field for soft deletion (tombstone flag for anonymized users)
-- This migration is required to fix the login 500 error caused by schema mismatch

-- Add deletedAt column to users table
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Add comment to explain the field
COMMENT ON COLUMN "users"."deletedAt" IS 'Tombstone flag for anonymized users (soft delete)';

-- Create index for efficient filtering (as defined in Prisma schema)
CREATE INDEX IF NOT EXISTS "users_deletedAt_idx" ON "users"("deletedAt");
