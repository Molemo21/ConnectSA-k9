-- Create booking_drafts table for production
-- Run this script in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "booking_drafts" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "notes" TEXT,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_drafts_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "booking_drafts_userId_idx" ON "booking_drafts"("userId");
CREATE INDEX IF NOT EXISTS "booking_drafts_expiresAt_idx" ON "booking_drafts"("expiresAt");

-- Add trigger to automatically update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_booking_drafts_updated_at 
    BEFORE UPDATE ON "booking_drafts" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT 'booking_drafts table created successfully' as status;
SELECT COUNT(*) as draft_count FROM "booking_drafts";
