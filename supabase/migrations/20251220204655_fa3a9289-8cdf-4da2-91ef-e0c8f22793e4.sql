-- Add parent_id to video_pitch_comments for nested replies
ALTER TABLE public.video_pitch_comments 
ADD COLUMN parent_id uuid REFERENCES public.video_pitch_comments(id) ON DELETE CASCADE;

-- Add index for faster parent lookups
CREATE INDEX idx_video_pitch_comments_parent_id ON public.video_pitch_comments(parent_id);

-- Create pitch_reports table for reporting violations
CREATE TABLE public.pitch_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id uuid NOT NULL REFERENCES public.video_pitches(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  category text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on pitch_reports
ALTER TABLE public.pitch_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
ON public.pitch_reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
ON public.pitch_reports
FOR SELECT
USING (auth.uid() = reporter_id);

-- Create trigger for updated_at
CREATE TRIGGER update_pitch_reports_updated_at
BEFORE UPDATE ON public.pitch_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for video_pitches
ALTER TABLE public.video_pitches REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_pitches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_pitch_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_pitch_comments;