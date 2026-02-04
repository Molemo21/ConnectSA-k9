-- Check what values are in the PayoutStatus enum
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'PayoutStatus'
ORDER BY e.enumsortorder;
