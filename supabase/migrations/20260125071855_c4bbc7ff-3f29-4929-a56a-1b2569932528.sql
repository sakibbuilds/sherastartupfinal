-- Add missing columns to video_pitches table
ALTER TABLE public.video_pitches ADD COLUMN IF NOT EXISTS motive TEXT;
ALTER TABLE public.video_pitches ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.video_pitches ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE public.video_pitches ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Create video_pitch_likes table
CREATE TABLE IF NOT EXISTS public.video_pitch_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pitch_id UUID REFERENCES public.video_pitches(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (pitch_id, user_id)
);

ALTER TABLE public.video_pitch_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Video pitch likes are viewable by everyone"
ON public.video_pitch_likes FOR SELECT USING (true);

CREATE POLICY "Users can like video pitches"
ON public.video_pitch_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike video pitches"
ON public.video_pitch_likes FOR DELETE USING (auth.uid() = user_id);

-- Add missing columns to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Add missing columns to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Add video_id column to video_pitch_comments if needed (rename pitch_id)
-- Actually the column is pitch_id which is correct, but some code might use video_id
-- Let's check and handle in code

-- Add university_id to profiles for backward compatibility
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id);

-- Add investment columns to profiles for investors
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS investment_range_min INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS investment_range_max INTEGER;