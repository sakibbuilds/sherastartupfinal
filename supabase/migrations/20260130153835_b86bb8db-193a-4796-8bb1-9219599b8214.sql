-- Allow admins to manage (update, delete) all posts
CREATE POLICY "Admins can manage all posts"
ON public.posts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to create posts on behalf of others (for edge cases)
CREATE POLICY "Admins can create posts"
ON public.posts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));