-- Migration: Add Catalogue-based Pricing System
-- Created: 2025-01-15
-- Description: Adds CatalogueItem model and extends Booking model for catalogue-based pricing
-- Backward Compatibility: All new fields are nullable to maintain compatibility

-- CreateEnum for currency support
CREATE TYPE "Currency" AS ENUM ('ZAR', 'USD', 'EUR', 'GBP');

-- CreateTable: catalogue_items
CREATE TABLE "catalogue_items" (
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

-- Add new columns to bookings table (nullable for backward compatibility)
ALTER TABLE "bookings" ADD COLUMN "catalogueItemId" TEXT;
ALTER TABLE "bookings" ADD COLUMN "bookedPrice" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN "bookedCurrency" TEXT;
ALTER TABLE "bookings" ADD COLUMN "bookedDurationMins" INTEGER;

-- CreateIndexes for better performance
CREATE INDEX "catalogue_items_providerId_idx" ON "catalogue_items"("providerId");
CREATE INDEX "catalogue_items_serviceId_idx" ON "catalogue_items"("serviceId");
CREATE INDEX "catalogue_items_isActive_idx" ON "catalogue_items"("isActive");
CREATE INDEX "catalogue_items_price_idx" ON "catalogue_items"("price");
CREATE INDEX "bookings_catalogueItemId_idx" ON "bookings"("catalogueItemId");

-- AddForeignKeys
ALTER TABLE "catalogue_items" ADD CONSTRAINT "catalogue_items_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalogue_items" ADD CONSTRAINT "catalogue_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_catalogueItemId_fkey" FOREIGN KEY ("catalogueItemId") REFERENCES "catalogue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add constraints for data integrity
ALTER TABLE "catalogue_items" ADD CONSTRAINT "catalogue_items_price_positive" CHECK ("price" > 0);
ALTER TABLE "catalogue_items" ADD CONSTRAINT "catalogue_items_duration_positive" CHECK ("durationMins" > 0);
ALTER TABLE "catalogue_items" ADD CONSTRAINT "catalogue_items_title_not_empty" CHECK (LENGTH("title") > 0);
ALTER TABLE "catalogue_items" ADD CONSTRAINT "catalogue_items_shortDesc_not_empty" CHECK (LENGTH("shortDesc") > 0);

-- Add comments for documentation
COMMENT ON TABLE "catalogue_items" IS 'Service packages created by providers with specific pricing and duration';
COMMENT ON COLUMN "catalogue_items"."price" IS 'Price in the specified currency';
COMMENT ON COLUMN "catalogue_items"."durationMins" IS 'Duration in minutes';
COMMENT ON COLUMN "catalogue_items"."isActive" IS 'Whether this catalogue item is available for booking';

COMMENT ON COLUMN "bookings"."catalogueItemId" IS 'Reference to the catalogue item used for this booking (nullable for backward compatibility)';
COMMENT ON COLUMN "bookings"."bookedPrice" IS 'Snapshot of the catalogue item price at time of booking';
COMMENT ON COLUMN "bookings"."bookedCurrency" IS 'Snapshot of the catalogue item currency at time of booking';
COMMENT ON COLUMN "bookings"."bookedDurationMins" IS 'Snapshot of the catalogue item duration at time of booking';


