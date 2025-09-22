-- Fix missing content column in notifications table
-- This addresses the webhook processing failures

-- Check if the content column exists, if not add it
DO $$
BEGIN
    -- Check if the 'content' column exists in the notifications table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'content'
        AND table_schema = 'public'
    ) THEN
        -- Add the content column
        ALTER TABLE notifications 
        ADD COLUMN content TEXT;
        
        -- Update existing records to use content instead of message
        UPDATE notifications 
        SET content = message 
        WHERE content IS NULL AND message IS NOT NULL;
        
        RAISE NOTICE 'Added content column to notifications table';
    ELSE
        RAISE NOTICE 'Content column already exists in notifications table';
    END IF;
END $$;

-- Check if the 'message' column exists and is redundant
DO $$
BEGIN
    -- Check if the 'message' column exists in the notifications table
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'message'
        AND table_schema = 'public'
    ) THEN
        -- Check if all data has been migrated to content column
        IF NOT EXISTS (
            SELECT 1 
            FROM notifications 
            WHERE message IS NOT NULL AND content IS NULL
        ) THEN
            -- Safe to drop the message column
            ALTER TABLE notifications DROP COLUMN message;
            RAISE NOTICE 'Dropped redundant message column from notifications table';
        ELSE
            RAISE NOTICE 'Message column still has data, keeping both columns for now';
        END IF;
    ELSE
        RAISE NOTICE 'Message column does not exist in notifications table';
    END IF;
END $$;

-- Verify the fix
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;
