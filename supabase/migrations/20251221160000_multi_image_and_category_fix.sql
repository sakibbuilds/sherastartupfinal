-- Ensure category column exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'category') THEN
        ALTER TABLE posts ADD COLUMN category text DEFAULT 'General';
    END IF;
END $$;

-- Add media_urls column for multiple images
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'media_urls') THEN
        ALTER TABLE posts ADD COLUMN media_urls text[];
    END IF;
END $$;
