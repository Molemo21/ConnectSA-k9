-- Quick fix to add paymentMethod column if it doesn't exist
-- This ensures the database schema matches what the code expects

DO $$ 
BEGIN
    -- Check if column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'paymentMethod'
    ) THEN
        -- Add the paymentMethod column
        ALTER TABLE "bookings" 
        ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'ONLINE';
        
        -- Update existing bookings to have ONLINE as default
        UPDATE "bookings" 
        SET "paymentMethod" = 'ONLINE' 
        WHERE "paymentMethod" IS NULL OR "paymentMethod" = '';
        
        RAISE NOTICE 'paymentMethod column added successfully';
    ELSE
        RAISE NOTICE 'paymentMethod column already exists';
    END IF;
END $$;

-- Verify the column exists and show its properties
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'bookings' 
AND column_name = 'paymentMethod';














