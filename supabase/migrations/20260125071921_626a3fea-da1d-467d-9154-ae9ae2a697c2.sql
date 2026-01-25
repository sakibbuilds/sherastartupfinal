-- Add missing columns to startups table
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS funding_goal INTEGER;
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS funding_raised INTEGER;
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS team_size INTEGER;
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS looking_for TEXT[];
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS established_at DATE;

-- Add missing columns to profiles for mentors
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hourly_rate INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Add missing columns to verification_requests
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create startup_team_members table
CREATE TABLE IF NOT EXISTS public.startup_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (startup_id, user_id)
);

ALTER TABLE public.startup_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members are viewable by everyone"
ON public.startup_team_members FOR SELECT USING (true);

CREATE POLICY "Startup founders can manage team"
ON public.startup_team_members FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.startups
        WHERE id = startup_team_members.startup_id AND founder_id = auth.uid()
    )
);

-- Create startup_follows table (different from startup_followers)
CREATE TABLE IF NOT EXISTS public.startup_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (startup_id, user_id)
);

ALTER TABLE public.startup_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Startup follows are viewable by everyone"
ON public.startup_follows FOR SELECT USING (true);

CREATE POLICY "Users can follow startups via follows"
ON public.startup_follows FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow startups via follows"
ON public.startup_follows FOR DELETE USING (auth.uid() = user_id);

-- Add video_id column to video_pitch_comments for backward compatibility
ALTER TABLE public.video_pitch_comments ADD COLUMN IF NOT EXISTS video_id UUID REFERENCES public.video_pitches(id) ON DELETE CASCADE;

-- Add video_id column to pitch_reports if not exists (already has it from schema)
-- Already added in earlier migration

-- Add video_id to video_pitch_likes for backward compatibility
ALTER TABLE public.video_pitch_likes ADD COLUMN IF NOT EXISTS video_id UUID REFERENCES public.video_pitches(id) ON DELETE CASCADE;