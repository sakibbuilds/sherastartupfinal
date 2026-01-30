-- Create advertisements table
CREATE TABLE public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image', 'gif', 'video'
  link_url TEXT,
  placement TEXT NOT NULL DEFAULT 'sidebar', -- 'sidebar', 'feed', 'left_sidebar', 'right_sidebar'
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Policies: Everyone can view active ads, only admins can manage
CREATE POLICY "Advertisements are viewable by everyone"
  ON public.advertisements
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all advertisements"
  ON public.advertisements
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for ad media
INSERT INTO storage.buckets (id, name, public)
VALUES ('advertisements', 'advertisements', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for advertisements bucket
CREATE POLICY "Advertisement media is publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'advertisements');

CREATE POLICY "Admins can upload advertisement media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'advertisements' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update advertisement media"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'advertisements' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete advertisement media"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'advertisements' AND has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();