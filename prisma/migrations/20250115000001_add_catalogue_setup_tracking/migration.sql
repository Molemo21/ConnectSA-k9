-- Migration: Add Catalogue Setup Tracking
-- Created: 2025-01-15
-- Description: Adds completion tracking fields to Provider model for catalogue setup

-- Add catalogue setup tracking fields
ALTER TABLE "providers" ADD COLUMN "catalogueSetupCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "providers" ADD COLUMN "catalogueSetupCompletedAt" TIMESTAMP(3);

-- Create index for performance
CREATE INDEX "providers_catalogue_setup_completed_idx" ON "providers"("catalogueSetupCompleted");

-- Update existing providers who already have catalogue items
UPDATE "providers" 
SET "catalogueSetupCompleted" = true, 
    "catalogueSetupCompletedAt" = NOW()
WHERE "id" IN (
  SELECT DISTINCT "providerId" 
  FROM "catalogue_items" 
  WHERE "isActive" = true
);

