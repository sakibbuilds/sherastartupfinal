-- Create table to track video views by IP
CREATE TABLE public.video_view_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id uuid NOT NULL REFERENCES public.video_pitches(id) ON DELETE CASCADE,
  ip_address text NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(video_id, ip_address)
);

-- Enable RLS
ALTER TABLE public.video_view_logs ENABLE ROW LEVEL SECURITY;

-- Allow inserts from service role (edge function)
CREATE POLICY "Service role can manage view logs"
ON public.video_view_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_video_view_logs_lookup ON public.video_view_logs(video_id, ip_address, viewed_at);