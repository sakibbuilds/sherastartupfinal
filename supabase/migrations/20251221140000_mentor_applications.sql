CREATE TABLE IF NOT EXISTS public.mentor_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    expertise TEXT[],
    capabilities TEXT,
    cv_url TEXT,
    demo_video_url TEXT,
    website TEXT,
    portfolio_url TEXT,
    case_style TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own application" ON public.mentor_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own application" ON public.mentor_applications
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for admins to view all applications
CREATE POLICY "Admins can view all applications" ON public.mentor_applications
    FOR SELECT USING (public.has_role('admin', auth.uid()));

-- Policy for admins to update applications
CREATE POLICY "Admins can update applications" ON public.mentor_applications
    FOR UPDATE USING (public.has_role('admin', auth.uid()));
