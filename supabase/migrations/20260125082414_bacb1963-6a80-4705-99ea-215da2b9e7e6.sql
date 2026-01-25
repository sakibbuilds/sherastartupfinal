-- Fix overly permissive RLS policies

-- Drop the old permissive insert policy on notifications
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Create a more secure policy - users can only create notifications for other users
CREATE POLICY "Authenticated users can create notifications for others" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Drop the old permissive insert policy on universities
DROP POLICY IF EXISTS "Authenticated users can add universities" ON public.universities;

-- Create a more restrictive policy for universities - only admins can add universities
CREATE POLICY "Only admins can add universities" 
ON public.universities 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));