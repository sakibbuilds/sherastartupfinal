-- Create universities table
CREATE TABLE public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    location TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universities are viewable by everyone"
ON public.universities FOR SELECT USING (true);

-- Create video_pitches table (for pitch videos)
CREATE TABLE public.video_pitches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_pitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Video pitches are viewable by everyone"
ON public.video_pitches FOR SELECT USING (true);

CREATE POLICY "Users can create video pitches"
ON public.video_pitches FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their video pitches"
ON public.video_pitches FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their video pitches"
ON public.video_pitches FOR DELETE USING (auth.uid() = user_id);

-- Create video_pitch_comments table
CREATE TABLE public.video_pitch_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pitch_id UUID REFERENCES public.video_pitches(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.video_pitch_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_pitch_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Video pitch comments are viewable by everyone"
ON public.video_pitch_comments FOR SELECT USING (true);

CREATE POLICY "Users can comment on video pitches"
ON public.video_pitch_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments"
ON public.video_pitch_comments FOR DELETE USING (auth.uid() = user_id);

-- Create pitch_reports table
CREATE TABLE public.pitch_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES public.video_pitches(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pitch_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their reports"
ON public.pitch_reports FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports"
ON public.pitch_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reports"
ON public.pitch_reports FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS investment_focus TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS investment_stage TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_companies TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS check_size TEXT;

-- Add missing columns to startups
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;