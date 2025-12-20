-- Create video_pitches table for TikTok-style pitch videos
CREATE TABLE public.video_pitches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video_pitch_likes table
CREATE TABLE public.video_pitch_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.video_pitches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Create video_pitch_comments table
CREATE TABLE public.video_pitch_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.video_pitches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_pitch_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_pitch_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_pitches
CREATE POLICY "Video pitches are viewable by everyone"
  ON public.video_pitches FOR SELECT
  USING (true);

CREATE POLICY "Users can create own video pitches"
  ON public.video_pitches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video pitches"
  ON public.video_pitches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own video pitches"
  ON public.video_pitches FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for video_pitch_likes
CREATE POLICY "Likes are viewable by everyone"
  ON public.video_pitch_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like videos"
  ON public.video_pitch_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike videos"
  ON public.video_pitch_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for video_pitch_comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.video_pitch_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.video_pitch_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.video_pitch_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for pitch videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pitch-videos', 'pitch-videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime']);

-- Storage policies for pitch videos
CREATE POLICY "Pitch videos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pitch-videos');

CREATE POLICY "Users can upload pitch videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pitch-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own pitch videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pitch-videos' AND auth.uid()::text = (storage.foldername(name))[1]);