-- Create startup_follows table for following startups
CREATE TABLE public.startup_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(startup_id, user_id)
);

-- Enable RLS
ALTER TABLE public.startup_follows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view follows count"
ON public.startup_follows
FOR SELECT
USING (true);

CREATE POLICY "Users can follow startups"
ON public.startup_follows
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow startups"
ON public.startup_follows
FOR DELETE
USING (auth.uid() = user_id);