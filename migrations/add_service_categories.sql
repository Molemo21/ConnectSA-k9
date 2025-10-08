-- Create enums first
DO $$ BEGIN
    CREATE TYPE "MainCategory" AS ENUM (
        'BEAUTY_AND_WELLNESS',
        'HOME_SERVICES',
        'TECHNICAL_SERVICES'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ServiceCategory" AS ENUM (
        'HAIR_SERVICES',
        'NAILS',
        'RESIDENTIAL_CLEANING',
        'PLUMBING',
        'ELECTRICAL',
        'IT_SUPPORT',
        'SECURITY_SYSTEMS'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to services table
ALTER TABLE services
    ADD COLUMN IF NOT EXISTS "mainCategory" "MainCategory",
    ADD COLUMN IF NOT EXISTS "category" "ServiceCategory",
    ADD COLUMN IF NOT EXISTS "duration" INTEGER DEFAULT 60,
    ADD COLUMN IF NOT EXISTS "features" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "services_mainCategory_idx" ON "services"("mainCategory");
CREATE INDEX IF NOT EXISTS "services_category_idx" ON "services"("category");

-- Update existing services with default categories
UPDATE services
SET 
    "mainCategory" = 'HOME_SERVICES',
    "category" = 'PLUMBING'
WHERE name ILIKE '%plumb%'
    AND "mainCategory" IS NULL;

UPDATE services
SET 
    "mainCategory" = 'HOME_SERVICES',
    "category" = 'ELECTRICAL'
WHERE name ILIKE '%electric%'
    AND "mainCategory" IS NULL;

UPDATE services
SET 
    "mainCategory" = 'TECHNICAL_SERVICES',
    "category" = 'IT_SUPPORT'
WHERE (name ILIKE '%IT%' OR name ILIKE '%computer%')
    AND "mainCategory" IS NULL;
