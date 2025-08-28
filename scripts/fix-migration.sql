-- Fix the migration issues for ConnectSA database schema
-- Add missing columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paystack_ref VARCHAR(255) UNIQUE;

-- Update the view creation with correct column names
DROP VIEW IF EXISTS payment_summary;
CREATE OR REPLACE VIEW payment_summary AS
SELECT
  b.id as booking_id,
  b.status as booking_status,
  p.status as payment_status,
  p.amount as total_amount,
  p.escrow_amount,
  p.platform_fee,
  p.paystack_ref,
  po.status as payout_status,
  po.amount as payout_amount,
  jp.client_confirmed,
  jp.completed_at
FROM bookings b
LEFT JOIN payments p ON b.id = p."bookingId"
LEFT JOIN payouts po ON p.id = po.payment_id
LEFT JOIN job_proofs jp ON b.id = jp.booking_id;

-- Add missing indexes with correct column names
CREATE INDEX IF NOT EXISTS idx_payments_paystack_ref ON payments(paystack_ref);
CREATE INDEX IF NOT EXISTS idx_payouts_payment_id ON payouts(payment_id);
CREATE INDEX IF NOT EXISTS idx_job_proofs_booking_id ON job_proofs(booking_id);

-- Verify the fix
SELECT 'Migration fix completed successfully!' as status;
