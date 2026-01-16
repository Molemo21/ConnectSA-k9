-- CreateTable: database_metadata
-- This table stores environment fingerprints to prevent misconfiguration
-- It MUST exist in every database and MUST be initialized with correct environment

CREATE TABLE IF NOT EXISTS "database_metadata" (
    "id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "database_metadata_pkey" PRIMARY KEY ("id")
);

-- Insert initial fingerprint based on environment
-- NOTE: This will be set during database initialization
-- For existing databases, run: npm run db:init-fingerprint <environment>

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "database_metadata_environment_idx" ON "database_metadata"("environment");
