-- Update BookingStatus enum to include PAID
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PAID'; 