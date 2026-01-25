-- Fix the permissive RLS policy on notifications table
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a more secure policy - only authenticated users can insert notifications for other users
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);