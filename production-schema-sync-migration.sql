-- Production Database Migration Script
-- Add missing enum values and ensure local schema elements are available in production
-- Run this directly on your Supabase production database

-- Step 1: Add missing BookingStatus enum values
DO $$ 
BEGIN
    -- Check if PAYMENT_PROCESSING already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PAYMENT_PROCESSING' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'BookingStatus'
        )
    ) THEN
        -- Add PAYMENT_PROCESSING enum value
        ALTER TYPE "BookingStatus" ADD VALUE 'PAYMENT_PROCESSING';
        RAISE NOTICE 'PAYMENT_PROCESSING enum value added successfully';
    ELSE
        RAISE NOTICE 'PAYMENT_PROCESSING enum value already exists';
    END IF;
    
    -- Check if DISPUTED already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'DISPUTED' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'BookingStatus'
        )
    ) THEN
        -- Add DISPUTED enum value
        ALTER TYPE "BookingStatus" ADD VALUE 'DISPUTED';
        RAISE NOTICE 'DISPUTED enum value added successfully';
    ELSE
        RAISE NOTICE 'DISPUTED enum value already exists';
    END IF;
END $$;

-- Step 2: Verify BookingStatus enum values
SELECT 'BookingStatus enum values:' as info;
SELECT enumlabel as booking_status_values 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')
ORDER BY enumsortorder;

-- Step 3: Check if we need to add any missing tables
-- Note: Most tables already exist in production, but let's verify the core ones

-- Check if all core tables exist
SELECT 'Core tables check:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN '✅ users'
        ELSE '❌ users'
    END as users_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'providers') THEN '✅ providers'
        ELSE '❌ providers'
    END as providers_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN '✅ services'
        ELSE '❌ services'
    END as services_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_categories') THEN '✅ service_categories'
        ELSE '❌ service_categories'
    END as service_categories_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN '✅ bookings'
        ELSE '❌ bookings'
    END as bookings_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN '✅ payments'
        ELSE '❌ payments'
    END as payments_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN '✅ reviews'
        ELSE '❌ reviews'
    END as reviews_table;

-- Step 4: Check if we need to add any missing columns to existing tables
-- Note: Most columns already exist, but let's check for any critical missing ones

-- Check payments table structure
SELECT 'Payments table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 5: Summary
SELECT 'Migration completed successfully!' as status;
