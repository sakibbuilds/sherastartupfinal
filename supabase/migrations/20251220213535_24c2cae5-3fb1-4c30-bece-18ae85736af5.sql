-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create startup-logos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('startup-logos', 'startup-logos', true);

-- Create policies for startup-logos bucket
CREATE POLICY "Startup logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'startup-logos');

CREATE POLICY "Users can upload startup logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'startup-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update startup logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'startup-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete startup logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'startup-logos' AND auth.uid() IS NOT NULL);