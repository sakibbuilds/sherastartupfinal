-- Add motive column to video_pitches table
ALTER TABLE public.video_pitches 
ADD COLUMN motive TEXT DEFAULT 'general';

-- Create storage bucket for pitch thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pitch-thumbnails', 'pitch-thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Storage policies for pitch thumbnails
CREATE POLICY "Pitch thumbnails are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pitch-thumbnails');

CREATE POLICY "Users can upload pitch thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pitch-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own pitch thumbnails"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pitch-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);