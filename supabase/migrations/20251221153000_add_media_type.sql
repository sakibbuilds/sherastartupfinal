
-- Add media_type to posts if it doesn't exist
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_type TEXT;
