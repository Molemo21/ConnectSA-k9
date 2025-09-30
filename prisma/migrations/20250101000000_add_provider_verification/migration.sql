-- Add verification status to providers table
-- This migration adds proper verification tracking separate from approval status

-- Add verification status enum
CREATE TYPE "VerificationStatus" AS ENUM (
    'PENDING',
    'VERIFIED', 
    'REJECTED',
    'EXPIRED'
);

-- Add verification fields to providers table
ALTER TABLE "providers" 
ADD COLUMN "verificationStatus" "VerificationStatus" DEFAULT 'PENDING',
ADD COLUMN "verificationDocuments" JSONB,
ADD COLUMN "phoneVerified" BOOLEAN DEFAULT FALSE,
ADD COLUMN "emailVerified" BOOLEAN DEFAULT FALSE,
ADD COLUMN "addressVerified" BOOLEAN DEFAULT FALSE,
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "verificationNotes" TEXT;

-- Update existing providers based on their current status
UPDATE "providers" 
SET 
    "verificationStatus" = CASE 
        WHEN "status" = 'APPROVED' THEN 'VERIFIED'
        WHEN "status" = 'REJECTED' THEN 'REJECTED' 
        ELSE 'PENDING'
    END,
    "emailVerified" = CASE 
        WHEN "status" = 'APPROVED' THEN TRUE
        ELSE FALSE
    END,
    "verifiedAt" = CASE 
        WHEN "status" = 'APPROVED' THEN "updatedAt"
        ELSE NULL
    END
WHERE "verificationStatus" IS NULL;

-- Add indexes for performance
CREATE INDEX "idx_providers_verification_status" ON "providers"("verificationStatus");
CREATE INDEX "idx_providers_status_verification" ON "providers"("status", "verificationStatus");
