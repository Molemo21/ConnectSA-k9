-- =====================================================
-- CATALOGUE-BASED PRICING MIGRATION SCRIPT
-- =====================================================
-- Run this script in Supabase SQL Editor
-- This creates the catalogue_items table and extends bookings table
-- for the new catalogue-based pricing system

-- =====================================================
-- STEP 1: Create Currency Enum
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Currency') THEN
        CREATE TYPE "Currency" AS ENUM ('ZAR', 'USD', 'EUR', 'GBP');
    END IF;
END $$;

-- =====================================================
-- STEP 2: Create catalogue_items Table
-- =====================================================
CREATE TABLE IF NOT EXISTS "catalogue_items" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "longDesc" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "durationMins" INTEGER NOT NULL,
    "images" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogue_items_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- STEP 3: Add New Columns to Bookings Table
-- =====================================================
-- Add new columns (nullable for backward compatibility)
ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "catalogueItemId" TEXT,
ADD COLUMN IF NOT EXISTS "bookedPrice" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "bookedCurrency" TEXT,
ADD COLUMN IF NOT EXISTS "bookedDurationMins" INTEGER;

-- =====================================================
-- STEP 4: Create Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS "catalogue_items_providerId_idx" ON "catalogue_items"("providerId");
CREATE INDEX IF NOT EXISTS "catalogue_items_serviceId_idx" ON "catalogue_items"("serviceId");
CREATE INDEX IF NOT EXISTS "catalogue_items_isActive_idx" ON "catalogue_items"("isActive");
CREATE INDEX IF NOT EXISTS "catalogue_items_price_idx" ON "catalogue_items"("price");
CREATE INDEX IF NOT EXISTS "bookings_catalogueItemId_idx" ON "bookings"("catalogueItemId");

-- =====================================================
-- STEP 5: Add Foreign Key Constraints
-- =====================================================
-- Add foreign key for catalogue_items -> providers
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'catalogue_items_providerId_fkey'
    ) THEN
        ALTER TABLE "catalogue_items" 
        ADD CONSTRAINT "catalogue_items_providerId_fkey" 
        FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add foreign key for catalogue_items -> services
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'catalogue_items_serviceId_fkey'
    ) THEN
        ALTER TABLE "catalogue_items" 
        ADD CONSTRAINT "catalogue_items_serviceId_fkey" 
        FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add foreign key for bookings -> catalogue_items
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_catalogueItemId_fkey'
    ) THEN
        ALTER TABLE "bookings" 
        ADD CONSTRAINT "bookings_catalogueItemId_fkey" 
        FOREIGN KEY ("catalogueItemId") REFERENCES "catalogue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- =====================================================
-- STEP 6: Add Data Integrity Constraints
-- =====================================================
-- Add constraints for data integrity
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'catalogue_items_price_positive'
    ) THEN
        ALTER TABLE "catalogue_items" 
        ADD CONSTRAINT "catalogue_items_price_positive" CHECK ("price" > 0);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'catalogue_items_duration_positive'
    ) THEN
        ALTER TABLE "catalogue_items" 
        ADD CONSTRAINT "catalogue_items_duration_positive" CHECK ("durationMins" > 0);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'catalogue_items_title_not_empty'
    ) THEN
        ALTER TABLE "catalogue_items" 
        ADD CONSTRAINT "catalogue_items_title_not_empty" CHECK (LENGTH("title") > 0);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'catalogue_items_shortDesc_not_empty'
    ) THEN
        ALTER TABLE "catalogue_items" 
        ADD CONSTRAINT "catalogue_items_shortDesc_not_empty" CHECK (LENGTH("shortDesc") > 0);
    END IF;
END $$;

-- =====================================================
-- STEP 7: Add Comments for Documentation
-- =====================================================
COMMENT ON TABLE "catalogue_items" IS 'Service packages created by providers with specific pricing and duration';
COMMENT ON COLUMN "catalogue_items"."price" IS 'Price in the specified currency';
COMMENT ON COLUMN "catalogue_items"."durationMins" IS 'Duration in minutes';
COMMENT ON COLUMN "catalogue_items"."isActive" IS 'Whether this catalogue item is available for booking';

COMMENT ON COLUMN "bookings"."catalogueItemId" IS 'Reference to the catalogue item used for this booking (nullable for backward compatibility)';
COMMENT ON COLUMN "bookings"."bookedPrice" IS 'Snapshot of the catalogue item price at time of booking';
COMMENT ON COLUMN "bookings"."bookedCurrency" IS 'Snapshot of the catalogue item currency at time of booking';
COMMENT ON COLUMN "bookings"."bookedDurationMins" IS 'Snapshot of the catalogue item duration at time of booking';

-- =====================================================
-- STEP 8: Verification Queries
-- =====================================================
-- Verify the migration was successful
SELECT 'Migration completed successfully!' as status;

-- Check if catalogue_items table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'catalogue_items') 
        THEN '✅ catalogue_items table created'
        ELSE '❌ catalogue_items table missing'
    END as table_check;

-- Check if new booking columns exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'catalogueItemId')
        THEN '✅ New booking columns added'
        ELSE '❌ New booking columns missing'
    END as columns_check;

-- Check current data counts
SELECT 
    (SELECT COUNT(*) FROM providers) as provider_count,
    (SELECT COUNT(*) FROM services) as service_count,
    (SELECT COUNT(*) FROM bookings) as booking_count;

