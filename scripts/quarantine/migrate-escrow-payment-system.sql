-- Migration script for Escrow Payment System
-- Run this script to update your existing database

-- 1. Update existing payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS escrow_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'NGN',
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS authorization_url TEXT,
ADD COLUMN IF NOT EXISTS access_code VARCHAR(255);

-- 2. Update existing payment statuses to ESCROW if they were previously "PAID"
UPDATE payments 
SET status = 'ESCROW', escrow_amount = amount * 0.9, platform_fee = amount * 0.1
WHERE status = 'PAID' AND escrow_amount IS NULL;

-- 3. Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id VARCHAR(255) PRIMARY KEY,
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paystack_ref VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  transfer_code VARCHAR(255),
  recipient_code VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- 4. Create job_proofs table
CREATE TABLE IF NOT EXISTS job_proofs (
  id VARCHAR(255) PRIMARY KEY,
  booking_id VARCHAR(255) UNIQUE NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  photos TEXT[] NOT NULL,
  notes TEXT,
  completed_at TIMESTAMP,
  client_confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMP,
  auto_confirm_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paystack_ref ON payments(paystack_ref);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_paystack_ref ON payouts(paystack_ref);
CREATE INDEX IF NOT EXISTS idx_job_proofs_booking_id ON job_proofs(booking_id);
CREATE INDEX IF NOT EXISTS idx_job_proofs_provider_id ON job_proofs(provider_id);

-- 6. Update existing bookings status to reflect current payment state
UPDATE bookings 
SET status = 'PAID' 
WHERE id IN (
  SELECT booking_id 
  FROM payments 
  WHERE status = 'ESCROW'
);

-- 7. Add comments for documentation
COMMENT ON TABLE payouts IS 'Tracks provider payouts from escrow payments';
COMMENT ON TABLE job_proofs IS 'Stores job completion proof and client confirmation';
COMMENT ON COLUMN payments.escrow_amount IS 'Amount held in escrow (total - platform fee)';
COMMENT ON COLUMN payments.platform_fee IS 'Platform fee amount (10% of total)';
COMMENT ON COLUMN payments.status IS 'Payment status: PENDING, ESCROW, PROCESSING_RELEASE, RELEASED, REFUNDED, FAILED';

-- 8. Create a view for payment summary
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
LEFT JOIN payments p ON b.id = p.booking_id
LEFT JOIN payouts po ON p.id = po.payment_id
LEFT JOIN job_proofs jp ON b.id = jp.booking_id;

-- Migration completed successfully
SELECT 'Escrow Payment System migration completed successfully!' as status;
