-- Migration: Add featuredImageIndex to CatalogueItem
-- Created: 2025-01-XX
-- Description: Adds featuredImageIndex field to allow providers to choose which image represents their package

-- Add featuredImageIndex column to catalogue_items table
ALTER TABLE "catalogue_items" 
ADD COLUMN IF NOT EXISTS "featuredImageIndex" INTEGER;

-- Add comment to explain the field
COMMENT ON COLUMN "catalogue_items"."featuredImageIndex" IS 'Index of featured image (0-based), null = use first image';

-- Create index for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS "catalogue_items_featuredImageIndex_idx" ON "catalogue_items"("featuredImageIndex");
