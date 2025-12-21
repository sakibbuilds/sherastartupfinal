
-- Add category to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS category TEXT;

-- Add views to startups
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Create advertisements table
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link_url TEXT,
  title TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for advertisements
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Admins can manage advertisements
CREATE POLICY "Admins can manage advertisements" ON public.advertisements
  USING (public.has_role('admin', auth.uid()));

-- Everyone can view active advertisements
CREATE POLICY "Everyone can view active advertisements" ON public.advertisements
  FOR SELECT
  USING (active = true);
