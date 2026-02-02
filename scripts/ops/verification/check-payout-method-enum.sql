-- Check what enum type the method column uses
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payouts' AND column_name = 'method';

-- Check what values are in that enum
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = (SELECT udt_name FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'method')
ORDER BY e.enumsortorder;
