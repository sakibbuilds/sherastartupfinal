-- Add established_at field to startups table
ALTER TABLE public.startups 
ADD COLUMN established_at DATE DEFAULT NULL;