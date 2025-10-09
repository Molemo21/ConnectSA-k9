-- Stage 7: Add Service Categories (Safe Migration)
DO $$
DECLARE
    cleaning_category_id TEXT;
    service_count INT;
    updated_count INT;
BEGIN
    RAISE NOTICE 'Starting Stage 7: Adding Service Categories...';

    -- 1. Create Backup
    RAISE NOTICE 'Creating backup of services table...';
    CREATE TABLE IF NOT EXISTS services_backup_categories AS 
    SELECT * FROM services;

    -- 2. Create service_categories table
    RAISE NOTICE 'Creating service_categories table...';
    CREATE TABLE IF NOT EXISTS "service_categories" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "icon" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
    );

    -- 3. Insert cleaning services category
    RAISE NOTICE 'Adding cleaning services category...';
    cleaning_category_id := 'cat_cleaning_' || REPLACE(gen_random_uuid()::text, '-', '');
    
    INSERT INTO "service_categories" ("id", "name", "description", "icon", "isActive", "createdAt", "updatedAt")
    VALUES (
        cleaning_category_id,
        'Cleaning Services',
        'Professional cleaning services for homes and offices',
        '🧹',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    -- 4. Add categoryId column to services table
    RAISE NOTICE 'Adding categoryId column to services table...';
    ALTER TABLE "services" 
    ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

    -- 5. Update existing services
    RAISE NOTICE 'Updating existing services...';
    WITH updated AS (
        UPDATE "services"
        SET "categoryId" = cleaning_category_id
        WHERE category = 'CLEANING'
        RETURNING *
    )
    SELECT COUNT(*) INTO updated_count FROM updated;
    
    RAISE NOTICE '% services updated with new category ID', updated_count;

    -- 6. Verify all services have a category
    SELECT COUNT(*) INTO service_count
    FROM "services"
    WHERE "categoryId" IS NULL;

    IF service_count > 0 THEN
        RAISE EXCEPTION 'Found % services without a category ID', service_count;
    END IF;

    -- 7. Add foreign key constraint
    RAISE NOTICE 'Adding foreign key constraint...';
    ALTER TABLE "services"
    ALTER COLUMN "categoryId" SET NOT NULL,
    ADD CONSTRAINT "services_categoryId_fkey"
    FOREIGN KEY ("categoryId")
    REFERENCES "service_categories"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

    -- 8. Drop old category column
    RAISE NOTICE 'Removing old category column...';
    ALTER TABLE "services" DROP COLUMN IF EXISTS "category";

    -- 9. Verify final state
    RAISE NOTICE 'Verifying final state...';
    
    -- Check service categories
    SELECT COUNT(*) INTO service_count FROM "service_categories";
    RAISE NOTICE 'Service categories created: %', service_count;
    
    -- Check services with categories
    SELECT COUNT(*) INTO service_count FROM "services" WHERE "categoryId" IS NOT NULL;
    RAISE NOTICE 'Services with categories: %', service_count;

    RAISE NOTICE 'Migration completed successfully!';

EXCEPTION WHEN OTHERS THEN
    -- If anything fails, provide detailed error info
    RAISE NOTICE 'Migration failed: %', SQLERRM;
    RAISE NOTICE 'Rolling back changes...';
    
    -- Drop new constraint if it exists
    ALTER TABLE IF EXISTS "services" 
    DROP CONSTRAINT IF EXISTS "services_categoryId_fkey";
    
    -- Restore services table from backup if needed
    DROP TABLE IF EXISTS "services_temp";
    ALTER TABLE IF EXISTS "services_backup_categories" 
    RENAME TO "services_temp";
    ALTER TABLE IF EXISTS "services" 
    RENAME TO "services_failed";
    ALTER TABLE IF EXISTS "services_temp" 
    RENAME TO "services";
    DROP TABLE IF EXISTS "services_failed";
    
    -- Drop new tables
    DROP TABLE IF EXISTS "service_categories";
    
    RAISE EXCEPTION 'Migration failed and was rolled back. Error: %', SQLERRM;
END $$;

-- Verification query (run separately after migration)
SELECT 
    sc.name as category_name,
    COUNT(s.id) as service_count,
    MIN(s.name) as sample_service
FROM service_categories sc
LEFT JOIN services s ON s."categoryId" = sc.id
GROUP BY sc.id, sc.name
ORDER BY sc.name;
