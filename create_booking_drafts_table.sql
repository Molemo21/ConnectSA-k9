-- Create booking_drafts table manually
-- This script creates the table that would normally be created by Prisma migration

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

-- Insert a test record to verify the table works
INSERT INTO "booking_drafts" (
    "id", 
    "serviceId", 
    "date", 
    "time", 
    "address", 
    "notes", 
    "expiresAt"
) VALUES (
    'test-draft-123',
    'test-service-456',
    '2024-12-25',
    '14:00',
    '123 Test Street, Test City',
    'Test booking draft',
    NOW() + INTERVAL '7 days'
) ON CONFLICT ("id") DO NOTHING;

-- Verify the table was created
SELECT 'booking_drafts table created successfully' as status;
SELECT COUNT(*) as draft_count FROM "booking_drafts";
