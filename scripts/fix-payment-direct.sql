-- Fix Payment Status for Specific Booking
-- This script manually updates the payment status from PENDING to ESCROW
-- for the booking that is stuck in AWAITING_CONFIRMATION status

-- First, let's see the current status
SELECT 
    b.id as booking_id,
    b.status as booking_status,
    p.id as payment_id,
    p.status as payment_status,
    p.amount,
    p."paystackRef",
    p."createdAt"
FROM bookings b
JOIN payments p ON b.id = p."bookingId"
WHERE b.id = 'cmeicsny20001s7bslnapppkp';

-- Update the payment status to ESCROW
UPDATE payments 
SET 
    status = 'ESCROW',
    "paidAt" = NOW()
WHERE "bookingId" = 'cmeicsny20001s7bslnapppkp' 
AND status = 'PENDING';

-- Verify the update
SELECT 
    b.id as booking_id,
    b.status as booking_status,
    p.id as payment_id,
    p.status as payment_status,
    p.amount,
    p."paystackRef",
    p."paidAt"
FROM bookings b
JOIN payments p ON b.id = p."bookingId"
WHERE b.id = 'cmeicsny20001s7bslnapppkp';

-- Optional: Update all pending payments that should be in escrow
-- This fixes the root cause for all similar cases
UPDATE payments 
SET 
    status = 'ESCROW',
    "paidAt" = NOW()
WHERE status = 'PENDING' 
AND EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id = payments."bookingId" 
    AND b.status IN ('PENDING_EXECUTION', 'AWAITING_CONFIRMATION')
);

-- Show summary of all payments
SELECT 
    p.status as payment_status,
    COUNT(*) as count,
    STRING_AGG(b.id, ', ') as booking_ids
FROM payments p
JOIN bookings b ON p."bookingId" = b.id
GROUP BY p.status
ORDER BY p.status;
