-- =====================================================
-- CATALOGUE ITEMS BACKFILL SCRIPT
-- =====================================================
-- Run this AFTER the main migration script
-- This creates starter catalogue items for existing providers

-- =====================================================
-- STEP 1: Create Starter Catalogue Items
-- =====================================================
-- Insert catalogue items for providers with hourly rates
INSERT INTO "catalogue_items" (
    "id",
    "providerId", 
    "serviceId",
    "title",
    "shortDesc", 
    "longDesc",
    "price",
    "currency",
    "durationMins",
    "images",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT 
    -- Generate unique IDs (using cuid-like format)
    'cat_' || substr(md5(random()::text), 1, 22) as "id",
    p."id" as "providerId",
    ps."serviceId",
    -- Create title based on service name
    s."name" || ' Service' as "title",
    -- Create short description
    'Professional ' || LOWER(s."name") || ' service by ' || COALESCE(p."businessName", u."name") as "shortDesc",
    -- Create long description
    COALESCE(s."description", 'High-quality ' || LOWER(s."name") || ' service with professional expertise.') as "longDesc",
    -- Use hourly rate as price
    p."hourlyRate" as "price",
    'ZAR' as "currency",
    60 as "durationMins", -- Default 1 hour
    ARRAY[]::TEXT[] as "images", -- Empty array
    true as "isActive",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "providers" p
JOIN "users" u ON p."userId" = u."id"
JOIN "provider_services" ps ON p."id" = ps."providerId"
JOIN "services" s ON ps."serviceId" = s."id"
WHERE 
    p."hourlyRate" IS NOT NULL 
    AND p."hourlyRate" > 0
    AND p."status" = 'APPROVED'
    -- Only create if provider doesn't already have catalogue items
    AND NOT EXISTS (
        SELECT 1 FROM "catalogue_items" ci 
        WHERE ci."providerId" = p."id"
    );

-- =====================================================
-- STEP 2: Verification Queries
-- =====================================================
-- Check how many catalogue items were created
SELECT 
    COUNT(*) as catalogue_items_created,
    COUNT(DISTINCT "providerId") as providers_with_items
FROM "catalogue_items";

-- Check providers with hourly rates vs catalogue items
SELECT 
    'Providers with hourly rates' as category,
    COUNT(*) as count
FROM "providers" 
WHERE "hourlyRate" IS NOT NULL AND "hourlyRate" > 0 AND "status" = 'APPROVED'

UNION ALL

SELECT 
    'Providers with catalogue items' as category,
    COUNT(DISTINCT "providerId") as count
FROM "catalogue_items";

-- Sample of created catalogue items
SELECT 
    ci."title",
    ci."price",
    ci."currency",
    ci."durationMins",
    p."businessName",
    s."name" as service_name
FROM "catalogue_items" ci
JOIN "providers" p ON ci."providerId" = p."id"
JOIN "services" s ON ci."serviceId" = s."id"
ORDER BY ci."createdAt" DESC
LIMIT 5;

-- =====================================================
-- STEP 3: Update Prisma Migration History
-- =====================================================
-- Insert migration record into Prisma's migration table
INSERT INTO "_prisma_migrations" (
    "id",
    "checksum", 
    "finished_at",
    "migration_name",
    "logs",
    "rolled_back_at",
    "started_at",
    "applied_steps_count"
) VALUES (
    '20250115000000_add_catalogue_pricing',
    'catalogue_pricing_migration',
    NOW(),
    'add_catalogue_pricing',
    'Manual migration applied via SQL',
    NULL,
    NOW(),
    1
) ON CONFLICT ("id") DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Backfill completed successfully! Catalogue items created for existing providers.' as status;

