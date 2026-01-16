-- ============================================
-- Diagnostic Script - Check Current Table Structure
-- Run this first to see what exists
-- ============================================

-- Check if payouts table exists and show its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'payouts'
ORDER BY ordinal_position;

-- Check if webhook_events table exists and show its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'webhook_events'
ORDER BY ordinal_position;

-- Check if PayoutStatus enum exists
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'PayoutStatus'
ORDER BY e.enumsortorder;

-- Check existing indexes on payouts
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'payouts';

-- Check existing indexes on webhook_events
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'webhook_events';

