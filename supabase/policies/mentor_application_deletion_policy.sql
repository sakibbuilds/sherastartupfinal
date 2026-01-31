/**
* IMPORTANT: RUN THIS SQL IN YOUR SUPABASE PROJECT'S SQL EDITOR
* 
* Go to https://supabase.com/dashboard/project/_/sql
* and paste the contents of this file.
*/

-- Drop the existing policy if it exists to ensure a clean slate.
DROP POLICY IF EXISTS "Allow users to delete their own applications" ON public.mentor_applications;

-- Create a policy that allows a user to delete an application
-- if the application's user_id matches their own authenticated user ID.
CREATE POLICY "Allow users to delete their own applications"
ON public.mentor_applications FOR DELETE
TO authenticated
USING ( auth.uid() = user_id );
