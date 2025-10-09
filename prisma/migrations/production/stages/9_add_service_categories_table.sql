-- Create service_categories table if it doesn't exist
DO $$
BEGIN
    -- Create service_categories table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_categories') THEN
        CREATE TABLE "service_categories" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "icon" TEXT,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
        );

        -- Add comment
        COMMENT ON TABLE "service_categories" IS 'Service categories like Cleaning Services';
    END IF;

    -- Add categoryId to services table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'categoryId') THEN
        -- Add categoryId column
        ALTER TABLE "services" ADD COLUMN "categoryId" TEXT;

        -- Create cleaning services category
        INSERT INTO "service_categories" ("id", "name", "description", "icon", "createdAt", "updatedAt")
        VALUES (
            'cat_cleaning',
            'Cleaning Services',
            'Professional cleaning services for homes and offices',
            '🧹',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        -- Update existing services to use the cleaning category
        UPDATE "services"
        SET "categoryId" = 'cat_cleaning'
        WHERE "categoryId" IS NULL;

        -- Make categoryId required
        ALTER TABLE "services" ALTER COLUMN "categoryId" SET NOT NULL;

        -- Add foreign key constraint
        ALTER TABLE "services"
        ADD CONSTRAINT "services_categoryId_fkey"
        FOREIGN KEY ("categoryId")
        REFERENCES "service_categories"("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE;
    END IF;

    -- Drop old category column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'category') THEN
        ALTER TABLE "services" DROP COLUMN "category";
    END IF;

    -- Verify the changes
    RAISE NOTICE 'Current service categories:';
    SELECT name, description, icon, "isActive"
    FROM service_categories;

    RAISE NOTICE 'Services with categories:';
    SELECT s.name, sc.name as category
    FROM services s
    JOIN service_categories sc ON s."categoryId" = sc.id;

END $$;
