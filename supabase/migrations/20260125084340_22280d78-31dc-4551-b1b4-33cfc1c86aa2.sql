-- Fix conversations RLS policy to allow users to create conversations
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;

-- Allow users to create conversations
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

-- Allow users to view conversations they participate in
CREATE POLICY "Users can view conversations they participate in"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Allow users to update conversations they participate in
CREATE POLICY "Users can update conversations they participate in"
  ON conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Add seed mentors data
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES
  ('77777777-1111-1111-1111-111111111111', 'sarah.mentor@example.com', crypt('demo123456', gen_salt('bf')), now(), '{"full_name": "Sarah Khan"}'),
  ('77777777-2222-2222-2222-222222222222', 'john.mentor@example.com', crypt('demo123456', gen_salt('bf')), now(), '{"full_name": "John Williams"}'),
  ('77777777-3333-3333-3333-333333333333', 'priya.mentor@example.com', crypt('demo123456', gen_salt('bf')), now(), '{"full_name": "Priya Sharma"}'),
  ('77777777-4444-4444-4444-444444444444', 'david.mentor@example.com', crypt('demo123456', gen_salt('bf')), now(), '{"full_name": "David Chen"}'),
  ('77777777-5555-5555-5555-555555555555', 'aisha.mentor@example.com', crypt('demo123456', gen_salt('bf')), now(), '{"full_name": "Aisha Rahman"}'),
  ('77777777-6666-6666-6666-666666666666', 'robert.mentor@example.com', crypt('demo123456', gen_salt('bf')), now(), '{"full_name": "Robert Lee"}')
ON CONFLICT (id) DO NOTHING;

-- Add mentor profiles
INSERT INTO public.profiles (user_id, full_name, title, bio, expertise, is_mentor, verified, user_type, hourly_rate, is_available)
VALUES
  ('77777777-1111-1111-1111-111111111111', 'Sarah Khan', 'Startup Growth Expert', 'Former VP at TechCorp with 15+ years in scaling startups from seed to Series C. Helped 50+ companies achieve product-market fit.', ARRAY['Growth Strategy', 'Fundraising', 'Product-Market Fit', 'Team Building'], true, true, 'mentor', 150, true),
  ('77777777-2222-2222-2222-222222222222', 'John Williams', 'VC Partner & Angel Investor', 'Managing Partner at BlueSky Ventures. Invested in 100+ startups with 12 successful exits. Stanford MBA, ex-Goldman Sachs.', ARRAY['Venture Capital', 'Due Diligence', 'Pitch Deck', 'Valuation'], true, true, 'investor', 200, true),
  ('77777777-3333-3333-3333-333333333333', 'Priya Sharma', 'Product & UX Strategist', 'Led product at Google and Meta. Expert in user-centric design and agile methodologies. Passionate about helping early-stage founders.', ARRAY['Product Management', 'UX Design', 'Agile', 'User Research'], true, true, 'mentor', 120, true),
  ('77777777-4444-4444-4444-444444444444', 'David Chen', 'Tech CTO & Architect', 'Serial entrepreneur with 3 exits. Built engineering teams at Netflix and Airbnb. Specializes in scalable architecture and AI/ML.', ARRAY['Engineering', 'AI/ML', 'System Architecture', 'Technical Hiring'], true, true, 'founder', 175, true),
  ('77777777-5555-5555-5555-555555555555', 'Aisha Rahman', 'Marketing & Branding Expert', 'CMO with experience at Unilever and P&G. Built brand strategies for 200+ consumer startups. Expert in go-to-market execution.', ARRAY['Marketing', 'Branding', 'Go-to-Market', 'Customer Acquisition'], true, true, 'mentor', 130, true),
  ('77777777-6666-6666-6666-666666666666', 'Robert Lee', 'Legal & Compliance Advisor', 'Startup lawyer with 20 years experience. Partner at LegalTech LLP. Specializes in equity, contracts, and regulatory compliance.', ARRAY['Legal', 'Equity Structuring', 'Contracts', 'Compliance'], true, true, 'mentor', 180, true)
ON CONFLICT (user_id) DO UPDATE SET
  is_mentor = true,
  verified = true,
  expertise = EXCLUDED.expertise,
  hourly_rate = EXCLUDED.hourly_rate,
  is_available = true;