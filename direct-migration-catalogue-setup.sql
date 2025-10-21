-- Direct SQL Migration for Catalogue Setup Tracking
-- Run this directly in Supabase SQL Editor

-- Add catalogue setup tracking fields to providers table
ALTER TABLE "providers" 
ADD COLUMN IF NOT EXISTS "catalogueSetupCompleted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "providers" 
ADD COLUMN IF NOT EXISTS "catalogueSetupCompletedAt" TIMESTAMP(3);

-- Create index for performance
CREATE INDEX IF NOT EXISTS "providers_catalogue_setup_completed_idx" 
ON "providers"("catalogueSetupCompleted");

-- Update existing providers who already have catalogue items
UPDATE "providers" 
SET "catalogueSetupCompleted" = true, 
    "catalogueSetupCompletedAt" = NOW()
WHERE "id" IN (
  SELECT DISTINCT "providerId" 
  FROM "catalogue_items" 
  WHERE "isActive" = true
);

-- Verify the migration
SELECT 
  COUNT(*) as total_providers,
  COUNT(CASE WHEN "catalogueSetupCompleted" = true THEN 1 END) as completed_setup,
  COUNT(CASE WHEN "catalogueSetupCompletedAt" IS NOT NULL THEN 1 END) as has_completion_date
FROM "providers";

-- Show sample data
SELECT 
  "businessName",
  "catalogueSetupCompleted",
  "catalogueSetupCompletedAt"
FROM "providers" 
LIMIT 5;
