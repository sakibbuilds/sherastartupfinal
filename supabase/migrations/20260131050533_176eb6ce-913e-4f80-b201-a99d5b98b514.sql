-- Add meeting_link column to bookings table for mentors to share meeting URLs
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS meeting_link text;

-- Create mentor_applications table for users applying to become mentors
CREATE TABLE IF NOT EXISTS public.mentor_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  expertise text[] NOT NULL,
  bio text NOT NULL,
  experience_years integer,
  hourly_rate integer,
  linkedin_url text,
  motivation text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on mentor_applications
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

-- Users can create their own application
CREATE POLICY "Users can create mentor applications"
ON public.mentor_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own application
CREATE POLICY "Users can view their own application"
ON public.mentor_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their pending application
CREATE POLICY "Users can update their pending application"
ON public.mentor_applications
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can manage all applications
CREATE POLICY "Admins can manage all mentor applications"
ON public.mentor_applications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updating updated_at on mentor_applications
CREATE TRIGGER update_mentor_applications_updated_at
BEFORE UPDATE ON public.mentor_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();