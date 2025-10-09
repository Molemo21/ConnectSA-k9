/* Verify service sync between codebase and database */

/* First, create a temporary table with our expected services */
CREATE TEMP TABLE expected_services (
    name TEXT,
    description TEXT,
    category TEXT,
    "basePrice" FLOAT,
    "isActive" BOOLEAN
);

/* Insert our expected services */
INSERT INTO expected_services (name, description, category, "basePrice", "isActive") VALUES
    ('Carpet Cleaning', 'Professional carpet and upholstery cleaning services', 'CLEANING', 400, true),
    ('Cleaning Services', 'Professional cleaning services for homes and offices', 'CLEANING', 150, true),
    ('Deep Cleaning', 'Comprehensive deep cleaning for move-in/move-out or special occasions', 'CLEANING', 600, true),
    ('House Cleaning', 'Professional house cleaning services including dusting, vacuuming, and sanitizing', 'CLEANING', 350, true),
    ('Window Cleaning', 'Interior and exterior window cleaning services', 'CLEANING', 300, true);

/* Compare and show detailed results */
WITH comparison AS (
    SELECT 
        COALESCE(s.name, e.name) as service_name,
        s.category as db_category,
        e.category as expected_category,
        s."basePrice" as db_price,
        e."basePrice" as expected_price,
        s."isActive" as db_active,
        e."isActive" as expected_active,
        CASE 
            WHEN s.name IS NULL THEN 'Missing in DB'
            WHEN e.name IS NULL THEN 'Extra in DB'
            ELSE 'Present'
        END as status,
        CASE 
            WHEN s.name IS NULL OR e.name IS NULL THEN 'N/A'
            WHEN s.category != e.category OR s."basePrice" != e."basePrice" OR s."isActive" != e."isActive" 
            THEN 'Mismatch'
            ELSE 'Match'
        END as sync_status
    FROM services s
    FULL OUTER JOIN expected_services e ON s.name = e.name
)
SELECT 
    '=== Detailed Service Comparison ===' as section,
    service_name,
    status,
    sync_status,
    CASE 
        WHEN sync_status = 'Mismatch' THEN
            CONCAT_WS(', ',
                CASE WHEN db_category != expected_category 
                    THEN format('Category: DB=%s, Expected=%s', db_category, expected_category) 
                END,
                CASE WHEN db_price != expected_price 
                    THEN format('Price: DB=%.2f, Expected=%.2f', db_price, expected_price) 
                END,
                CASE WHEN db_active != expected_active 
                    THEN format('Active: DB=%s, Expected=%s', db_active, expected_active) 
                END
            )
        ELSE NULL
    END as differences
FROM comparison
ORDER BY 
    CASE status
        WHEN 'Missing in DB' THEN 1
        WHEN 'Extra in DB' THEN 2
        ELSE 3
    END,
    service_name;

/* Show summary in a separate query */
WITH comparison AS (
    SELECT 
        COALESCE(s.name, e.name) as service_name,
        s.category as db_category,
        e.category as expected_category,
        s."basePrice" as db_price,
        e."basePrice" as expected_price,
        s."isActive" as db_active,
        e."isActive" as expected_active,
        CASE 
            WHEN s.name IS NULL THEN 'Missing in DB'
            WHEN e.name IS NULL THEN 'Extra in DB'
            ELSE 'Present'
        END as status,
        CASE 
            WHEN s.name IS NULL OR e.name IS NULL THEN 'N/A'
            WHEN s.category != e.category OR s."basePrice" != e."basePrice" OR s."isActive" != e."isActive" 
            THEN 'Mismatch'
            ELSE 'Match'
        END as sync_status
    FROM services s
    FULL OUTER JOIN expected_services e ON s.name = e.name
)
SELECT 
    '=== Summary ===' as section,
    COUNT(*) FILTER (WHERE status = 'Present' AND sync_status = 'Match') as matching_services,
    COUNT(*) FILTER (WHERE status = 'Present' AND sync_status = 'Mismatch') as mismatched_services,
    COUNT(*) FILTER (WHERE status = 'Missing in DB') as missing_in_db,
    COUNT(*) FILTER (WHERE status = 'Extra in DB') as extra_in_db
FROM comparison;

/* Clean up */
DROP TABLE IF EXISTS expected_services;