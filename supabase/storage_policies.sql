/**
* IMPORTANT: RUN THIS SQL IN YOUR SUPABASE PROJECT'S SQL EDITOR
* 
* Go to https://supabase.com/dashboard/project/_/sql
* and paste the contents of this file.
*/

-- First, ensure the 'startup-logos' bucket exists.
-- This will not fail if the bucket already exists.
INSERT INTO storage.buckets (id, name, public)
VALUES ('startup-logos', 'startup-logos', true)
ON CONFLICT (id) DO NOTHING;


-- Next, drop any existing policies on the `storage.objects` table for the startup-logos bucket.
-- This cleans up any old or incorrect policies that might be conflicting.
DROP POLICY IF EXISTS "Allow public read access to logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow founders to upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow founders to update logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow founders to delete logos" ON storage.objects;


-- Create a policy to allow ANYONE to VIEW logos.
-- This is safe because the logo URLs are intended to be public.
CREATE POLICY "Allow public read access to logos"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'startup-logos' );


-- Create a policy to allow a user to UPLOAD a logo.
-- This policy checks that the user performing the upload is the founder of the startup.
-- It does this by extracting the startup ID from the file path (e.g., '[startup_id]/filename.jpg')
-- and matching it against the `founder_id` in the `public.startups` table.
CREATE POLICY "Allow founders to upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'startup-logos' AND
  auth.uid() = (
    SELECT founder_id
    FROM public.startups
    WHERE id = (string_to_array(name, '/'))[1]::uuid
  )
);


-- Create a policy to allow a user to UPDATE a logo.
-- This uses the same logic as the upload policy.
CREATE POLICY "Allow founders to update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'startup-logos' AND
  auth.uid() = (
    SELECT founder_id
    FROM public.startups
    WHERE id = (string_to_array(name, '/'))[1]::uuid
  )
);


-- Create a policy to allow a user to DELETE a logo.
-- This also uses the same logic, ensuring only the founder can delete their own startup's logo.
CREATE POLICY "Allow founders to delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'startup-logos' AND
  auth.uid() = (
    SELECT founder_id
    FROM public.startups
    WHERE id = (string_to_array(name, '/'))[1]::uuid
  )
);
