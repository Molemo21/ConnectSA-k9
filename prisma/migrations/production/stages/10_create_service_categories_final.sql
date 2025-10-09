-- Create service_categories table
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

-- Insert cleaning services category
INSERT INTO "service_categories" ("id", "name", "description", "icon", "createdAt", "updatedAt")
VALUES (
    'cat_cleaning',
    'Cleaning Services',
    'Professional cleaning services for homes and offices',
    '🧹',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;

-- Add categoryId column to services table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'categoryId') THEN
        ALTER TABLE "services" ADD COLUMN "categoryId" TEXT;
        
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
END $$;

-- Verify the changes
SELECT 'Service Categories:' as info;
SELECT id, name, description, icon, "isActive" FROM service_categories;

SELECT 'Services with Categories:' as info;
SELECT s.name, sc.name as category
FROM services s
JOIN service_categories sc ON s."categoryId" = sc.id;
