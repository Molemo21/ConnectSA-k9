-- Enhance payments table with additional tracking fields
-- This script adds fields for better error tracking and provider response storage

-- Add error_message field for tracking payment failures
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add provider_response field for storing full Paystack response
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS provider_response JSONB;

-- Add user_id field for easier querying (denormalized from booking)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Add index on status for faster status-based queries
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Add index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Update existing payments to set user_id from their bookings
UPDATE payments 
SET user_id = b.client_id 
FROM bookings b 
WHERE payments.booking_id = b.id 
AND payments.user_id IS NULL;

-- Add constraint to ensure user_id is not null for new payments
ALTER TABLE payments 
ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE payments 
ADD CONSTRAINT fk_payments_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add check constraint for amount
ALTER TABLE payments 
ADD CONSTRAINT chk_payments_amount_positive 
CHECK (amount > 0);

-- Add check constraint for escrow_amount
ALTER TABLE payments 
ADD CONSTRAINT chk_payments_escrow_amount_positive 
CHECK (escrow_amount >= 0);

-- Add check constraint for platform_fee
ALTER TABLE payments 
ADD CONSTRAINT chk_payments_platform_fee_positive 
CHECK (platform_fee >= 0);

COMMENT ON COLUMN payments.error_message IS 'Error message if payment failed';
COMMENT ON COLUMN payments.provider_response IS 'Full Paystack API response for debugging';
COMMENT ON COLUMN payments.user_id IS 'Client user ID for easier querying';
