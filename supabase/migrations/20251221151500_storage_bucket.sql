
-- Create post_media bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('post_media', 'post_media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage.objects (if not already enabled, usually it is)
-- We need specific policies for this bucket

-- Public read access
CREATE POLICY "Public Access post_media"
ON storage.objects FOR SELECT
USING ( bucket_id = 'post_media' );

-- Authenticated upload access
CREATE POLICY "Authenticated Upload post_media"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'post_media' AND auth.role() = 'authenticated' );

-- Authenticated delete access (users can delete their own media)
CREATE POLICY "Authenticated Delete post_media"
ON storage.objects FOR DELETE
USING ( bucket_id = 'post_media' AND auth.uid() = owner );
