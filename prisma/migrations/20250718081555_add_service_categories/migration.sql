-- CreateEnum
CREATE TYPE "MainCategory" AS ENUM (
  'BEAUTY_AND_WELLNESS',
  'HOME_SERVICES',
  'TECHNICAL_SERVICES'
);

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM (
  'HAIR_SERVICES',
  'NAILS',
  'RESIDENTIAL_CLEANING',
  'PLUMBING',
  'ELECTRICAL',
  'IT_SUPPORT',
  'SECURITY_SYSTEMS'
);

-- AlterTable
ALTER TABLE "services" 
ADD COLUMN "mainCategory" "MainCategory",
ADD COLUMN "category" "ServiceCategory",
ADD COLUMN "duration" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN "features" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update existing services
UPDATE "services"
SET 
  "mainCategory" = 'HOME_SERVICES',
  "category" = 'PLUMBING'
WHERE "name" ILIKE '%plumb%';

UPDATE "services"
SET 
  "mainCategory" = 'HOME_SERVICES',
  "category" = 'ELECTRICAL'
WHERE "name" ILIKE '%electric%';

UPDATE "services"
SET 
  "mainCategory" = 'TECHNICAL_SERVICES',
  "category" = 'IT_SUPPORT'
WHERE "name" ILIKE '%IT%' OR "name" ILIKE '%computer%';

-- Create indexes for better performance
CREATE INDEX "services_mainCategory_idx" ON "services"("mainCategory");
CREATE INDEX "services_category_idx" ON "services"("category");
