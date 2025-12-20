-- Create universities table
CREATE TABLE IF NOT EXISTS public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT CHECK (type IN ('public', 'private')) NOT NULL,
  location TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create startups table
CREATE TABLE IF NOT EXISTS public.startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  stage TEXT CHECK (stage IN ('idea', 'mvp', 'early', 'growth', 'scaling')),
  funding_goal DECIMAL(15, 2),
  funding_raised DECIMAL(15, 2) DEFAULT 0,
  team_size INTEGER DEFAULT 1,
  looking_for TEXT[],
  pitch_video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create startup_team_members table
CREATE TABLE IF NOT EXISTS public.startup_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (startup_id, user_id)
);

-- Update profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_type TEXT,
ADD COLUMN IF NOT EXISTS university_id UUID,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS investment_focus TEXT[],
ADD COLUMN IF NOT EXISTS investment_range_min DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS investment_range_max DECIMAL(15, 2);

-- Enable RLS
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_team_members ENABLE ROW LEVEL SECURITY;

-- Universities policies
CREATE POLICY "Universities are viewable by everyone" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add custom universities" ON public.universities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND is_custom = true);

-- Startups policies
CREATE POLICY "Startups are viewable by everyone" ON public.startups FOR SELECT USING (true);
CREATE POLICY "Founders can create startups" ON public.startups FOR INSERT WITH CHECK (auth.uid() = founder_id);
CREATE POLICY "Founders can update own startups" ON public.startups FOR UPDATE USING (auth.uid() = founder_id);
CREATE POLICY "Founders can delete own startups" ON public.startups FOR DELETE USING (auth.uid() = founder_id);

-- Startup team members policies
CREATE POLICY "Team members are viewable by everyone" ON public.startup_team_members FOR SELECT USING (true);
CREATE POLICY "Startup founders can manage team" ON public.startup_team_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.startups WHERE id = startup_id AND founder_id = auth.uid())
);
CREATE POLICY "Startup founders can update team" ON public.startup_team_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.startups WHERE id = startup_id AND founder_id = auth.uid())
);
CREATE POLICY "Startup founders can remove team members" ON public.startup_team_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.startups WHERE id = startup_id AND founder_id = auth.uid())
);

-- Trigger for startups updated_at
DROP TRIGGER IF EXISTS update_startups_updated_at ON public.startups;
CREATE TRIGGER update_startups_updated_at BEFORE UPDATE ON public.startups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Bangladeshi Universities
INSERT INTO public.universities (name, type, location, is_custom) VALUES
('University of Dhaka', 'public', 'Dhaka', false),
('Bangladesh University of Engineering and Technology (BUET)', 'public', 'Dhaka', false),
('University of Rajshahi', 'public', 'Rajshahi', false),
('University of Chittagong', 'public', 'Chittagong', false),
('Jahangirnagar University', 'public', 'Savar, Dhaka', false),
('Bangladesh Agricultural University', 'public', 'Mymensingh', false),
('Shahjalal University of Science and Technology', 'public', 'Sylhet', false),
('Khulna University', 'public', 'Khulna', false),
('Jagannath University', 'public', 'Dhaka', false),
('Comilla University', 'public', 'Comilla', false),
('Noakhali Science and Technology University', 'public', 'Noakhali', false),
('Jessore University of Science and Technology', 'public', 'Jessore', false),
('Mawlana Bhashani Science and Technology University', 'public', 'Tangail', false),
('Hajee Mohammad Danesh Science and Technology University', 'public', 'Dinajpur', false),
('Bangabandhu Sheikh Mujibur Rahman Science and Technology University', 'public', 'Gopalganj', false),
('Begum Rokeya University', 'public', 'Rangpur', false),
('Pabna University of Science and Technology', 'public', 'Pabna', false),
('Bangladesh University of Professionals', 'public', 'Dhaka', false),
('Sher-e-Bangla Agricultural University', 'public', 'Dhaka', false),
('Islamic University', 'public', 'Kushtia', false),
('National University', 'public', 'Gazipur', false),
('Bangladesh Open University', 'public', 'Gazipur', false),
('Dhaka University of Engineering and Technology', 'public', 'Gazipur', false),
('Rajshahi University of Engineering and Technology', 'public', 'Rajshahi', false),
('Khulna University of Engineering and Technology', 'public', 'Khulna', false),
('Chittagong University of Engineering and Technology', 'public', 'Chittagong', false),
('North South University', 'private', 'Dhaka', false),
('BRAC University', 'private', 'Dhaka', false),
('Independent University Bangladesh', 'private', 'Dhaka', false),
('American International University-Bangladesh', 'private', 'Dhaka', false),
('East West University', 'private', 'Dhaka', false),
('United International University', 'private', 'Dhaka', false),
('Daffodil International University', 'private', 'Dhaka', false),
('Southeast University', 'private', 'Dhaka', false),
('University of Liberal Arts Bangladesh', 'private', 'Dhaka', false),
('University of Asia Pacific', 'private', 'Dhaka', false),
('Ahsanullah University of Science and Technology', 'private', 'Dhaka', false),
('Bangladesh University of Business and Technology', 'private', 'Dhaka', false),
('Stamford University Bangladesh', 'private', 'Dhaka', false),
('Green University of Bangladesh', 'private', 'Dhaka', false),
('City University', 'private', 'Dhaka', false),
('Northern University Bangladesh', 'private', 'Dhaka', false),
('Primeasia University', 'private', 'Dhaka', false),
('State University of Bangladesh', 'private', 'Dhaka', false),
('World University of Bangladesh', 'private', 'Dhaka', false),
('Premier University', 'private', 'Chittagong', false),
('International Islamic University Chittagong', 'private', 'Chittagong', false),
('Southern University Bangladesh', 'private', 'Chittagong', false),
('Varendra University', 'private', 'Rajshahi', false),
('Leading University', 'private', 'Sylhet', false),
('Metropolitan University', 'private', 'Sylhet', false),
('Asian University of Bangladesh', 'private', 'Dhaka', false),
('Manarat International University', 'private', 'Dhaka', false),
('Canadian University of Bangladesh', 'private', 'Dhaka', false),
('Shanto-Mariam University of Creative Technology', 'private', 'Dhaka', false),
('BGMEA University of Fashion and Technology', 'private', 'Dhaka', false)
ON CONFLICT (name) DO NOTHING;