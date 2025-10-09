-- Create service_categories table
CREATE TABLE IF NOT EXISTS "service_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- Insert cleaning services category
INSERT INTO "service_categories" ("id", "name", "description", "icon", "isActive", "createdAt", "updatedAt")
VALUES (
    'cat_cleaning',
    'Cleaning Services',
    'Professional cleaning services for homes and offices',
    '🧹',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Add categoryId column to services table
ALTER TABLE "services" 
ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

-- Set all existing services to cleaning category
UPDATE "services"
SET "categoryId" = 'cat_cleaning'
WHERE "category" = 'CLEANING';

-- Make categoryId required and add foreign key
ALTER TABLE "services"
ALTER COLUMN "categoryId" SET NOT NULL,
ADD CONSTRAINT "services_categoryId_fkey"
FOREIGN KEY ("categoryId")
REFERENCES "service_categories"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Drop old category enum and column
ALTER TABLE "services" DROP COLUMN "category";
