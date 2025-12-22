-- Add attachment support to messages
ALTER TABLE public.messages 
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_type TEXT CHECK (attachment_type IN ('image', 'file'));

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Give public access to view files (since we use public URLs)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat-attachments' );

-- Policy: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  auth.role() = 'authenticated'
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING ( auth.uid() = owner )
WITH CHECK ( bucket_id = 'chat-attachments' );

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING ( auth.uid() = owner AND bucket_id = 'chat-attachments' );