-- First, let's add some demo universities if they don't exist
INSERT INTO public.universities (id, name, location, type) VALUES
  ('7f59bcba-3e7a-4042-8bde-d99de718e178', 'Daffodil International University', 'Dhaka', 'Private'),
  ('a1b2c3d4-1234-5678-9abc-def012345678', 'University of Dhaka', 'Dhaka', 'Public'),
  ('b2c3d4e5-2345-6789-abcd-ef0123456789', 'BRAC University', 'Dhaka', 'Private'),
  ('c3d4e5f6-3456-789a-bcde-f01234567890', 'North South University', 'Dhaka', 'Private'),
  ('d4e5f6a7-4567-89ab-cdef-012345678901', 'Bangladesh University of Engineering and Technology', 'Dhaka', 'Public'),
  ('e5f6a7b8-5678-9abc-def0-123456789012', 'Jahangirnagar University', 'Savar', 'Public'),
  ('f6a7b8c9-6789-abcd-ef01-234567890123', 'Chittagong University', 'Chittagong', 'Public'),
  ('a7b8c9d0-789a-bcde-f012-345678901234', 'Rajshahi University', 'Rajshahi', 'Public')
ON CONFLICT (id) DO NOTHING;

-- Create demo auth users and profiles
DO $$
DECLARE
  user_ids uuid[] := ARRAY[
    'aaaaaaaa-0001-4000-8000-000000000001'::uuid,
    'aaaaaaaa-0002-4000-8000-000000000002'::uuid,
    'aaaaaaaa-0003-4000-8000-000000000003'::uuid,
    'aaaaaaaa-0004-4000-8000-000000000004'::uuid,
    'aaaaaaaa-0005-4000-8000-000000000005'::uuid,
    'aaaaaaaa-0006-4000-8000-000000000006'::uuid,
    'aaaaaaaa-0007-4000-8000-000000000007'::uuid,
    'aaaaaaaa-0008-4000-8000-000000000008'::uuid,
    'aaaaaaaa-0009-4000-8000-000000000009'::uuid,
    'aaaaaaaa-0010-4000-8000-000000000010'::uuid,
    'aaaaaaaa-0011-4000-8000-000000000011'::uuid,
    'aaaaaaaa-0012-4000-8000-000000000012'::uuid
  ];
BEGIN
  -- Insert demo users into auth.users
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    (user_ids[1], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah.chen@demo.com', crypt('demo123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Chen"}', now(), now()),
    (user_ids[2], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'michael.ross@demo.com', crypt('demo123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Michael Ross"}', now(), now()),
    (user_ids[3], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jessica.pearson@demo.com', crypt('demo123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jessica Pearson"}', now(), now()),
    (user_ids[4], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'david.kim@demo.com', crypt('demo123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"David Kim"}', now(), now()),
    (user_ids[5], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'emily.zhang@demo.com', crypt('demo123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Emily Zhang"}', now(), now()),
    (user_ids[6], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'james.wilson@demo.com', crypt('demo123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"James Wilson"}', now(), now()),
    (user_ids[7], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'linda.chang@demo.com', crypt('demo123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Linda Chang"}', now(), now()),
    (user_ids[8], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'robert.ford@demo.com', crypt('demo123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Robert Ford"}', now(), now()),
    (user_ids[9], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'patricia.lee@demo.com', crypt('demo123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Patricia Lee"}', now(), now()),
    (user_ids[10], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'thomas.anderson@demo.com', crypt('demo123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Thomas Anderson"}', now(), now()),
    (user_ids[11], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jennifer.wu@demo.com', crypt('demo123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jennifer Wu"}', now(), now()),
    (user_ids[12], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'chris.evans@demo.com', crypt('demo123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Chris Evans"}', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Insert profiles for demo users
  INSERT INTO public.profiles (user_id, full_name, avatar_url, user_type, title, bio, verified, is_mentor, onboarding_completed, university, expertise, university_id)
  VALUES
    -- Founders
    (user_ids[1], 'Sarah Chen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'founder', 'Founder & CEO at TechFlow', 'Building the future of fintech in Bangladesh. Y Combinator W24.', true, false, true, 'Daffodil International University', ARRAY['Fintech', 'AI', 'Product'], '7f59bcba-3e7a-4042-8bde-d99de718e178'),
    (user_ids[2], 'Michael Ross', 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael', 'founder', 'Co-founder at EduLearn', 'Democratizing education through technology. Former Google engineer.', true, true, true, 'BRAC University', ARRAY['EdTech', 'Engineering', 'Growth'], 'b2c3d4e5-2345-6789-abcd-ef0123456789'),
    (user_ids[3], 'Jessica Pearson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jessica', 'founder', 'CEO at HealthBridge', 'Making healthcare accessible to everyone. Forbes 30 Under 30.', true, false, true, 'University of Dhaka', ARRAY['HealthTech', 'Operations', 'Strategy'], 'a1b2c3d4-1234-5678-9abc-def012345678'),
    (user_ids[4], 'David Kim', 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', 'founder', 'Founder at GreenEnergy', 'Sustainable energy solutions for South Asia. Climate tech enthusiast.', false, false, true, 'BUET', ARRAY['CleanTech', 'Hardware', 'Sales'], 'd4e5f6a7-4567-89ab-cdef-012345678901'),
    (user_ids[5], 'Emily Zhang', 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily', 'founder', 'Co-founder at FoodConnect', 'Reducing food waste through technology. Impact-driven entrepreneur.', true, false, true, 'North South University', ARRAY['FoodTech', 'Sustainability', 'Marketing'], 'c3d4e5f6-3456-789a-bcde-f01234567890'),
    
    -- Mentors/Investors
    (user_ids[6], 'James Wilson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=james', 'investor', 'Partner at Dhaka Ventures', '10+ years in VC. Invested in 50+ startups across SEA. Looking for ambitious founders.', true, true, true, 'University of Dhaka', ARRAY['Investment', 'Strategy', 'Fundraising'], 'a1b2c3d4-1234-5678-9abc-def012345678'),
    (user_ids[7], 'Linda Chang', 'https://api.dicebear.com/7.x/avataaars/svg?seed=linda', 'investor', 'Angel Investor & Mentor', 'Exited 2 startups. Now helping the next generation of founders build great companies.', true, true, true, 'BRAC University', ARRAY['Product', 'Growth', 'Leadership'], 'b2c3d4e5-2345-6789-abcd-ef0123456789'),
    (user_ids[8], 'Robert Ford', 'https://api.dicebear.com/7.x/avataaars/svg?seed=robert', 'investor', 'Managing Director at Bengal Capital', 'Early-stage focus. Passionate about deep tech and AI startups.', true, true, true, 'BUET', ARRAY['AI', 'DeepTech', 'Engineering'], 'd4e5f6a7-4567-89ab-cdef-012345678901'),
    
    -- Regular members/mentors
    (user_ids[9], 'Patricia Lee', 'https://api.dicebear.com/7.x/avataaars/svg?seed=patricia', 'student', 'Product Designer & Mentor', 'Senior Designer at Meta. Helping early-stage startups with product design.', true, true, true, 'North South University', ARRAY['Design', 'UX', 'Product'], 'c3d4e5f6-3456-789a-bcde-f01234567890'),
    (user_ids[10], 'Thomas Anderson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=thomas', 'student', 'Software Engineer & Mentor', 'Staff Engineer at Stripe. Open source contributor. Love helping new developers.', false, true, true, 'Daffodil International University', ARRAY['Engineering', 'Backend', 'DevOps'], '7f59bcba-3e7a-4042-8bde-d99de718e178'),
    (user_ids[11], 'Jennifer Wu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jennifer', 'student', 'Marketing Lead & Advisor', 'Head of Growth at Grab. Helping startups scale their marketing efforts.', true, true, true, 'University of Dhaka', ARRAY['Marketing', 'Growth', 'Analytics'], 'a1b2c3d4-1234-5678-9abc-def012345678'),
    (user_ids[12], 'Chris Evans', 'https://api.dicebear.com/7.x/avataaars/svg?seed=chris', 'founder', 'Serial Entrepreneur', 'Built and sold 3 companies. Now building my 4th venture in AgriTech.', true, false, true, 'Rajshahi University', ARRAY['AgriTech', 'B2B', 'Sales'], 'a7b8c9d0-789a-bcde-f012-345678901234')
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    user_type = EXCLUDED.user_type,
    title = EXCLUDED.title,
    bio = EXCLUDED.bio,
    verified = EXCLUDED.verified,
    is_mentor = EXCLUDED.is_mentor,
    onboarding_completed = EXCLUDED.onboarding_completed,
    university = EXCLUDED.university,
    expertise = EXCLUDED.expertise;
END $$;

-- Insert startups
INSERT INTO public.startups (id, founder_id, name, description, tagline, industry, stage, logo_url, website, funding_goal, funding_raised, team_size, looking_for, views)
VALUES
  ('bbbbbbbb-0001-4000-8000-000000000001', 'aaaaaaaa-0001-4000-8000-000000000001', 'TechFlow', 'Building next-generation payment infrastructure for Bangladesh. Our platform enables seamless digital payments for millions of unbanked users.', 'Payments for everyone', 'Fintech', 'seed', 'https://api.dicebear.com/7.x/shapes/svg?seed=techflow', 'https://techflow.io', 500000, 150000, 8, ARRAY['CTO', 'Backend Engineer', 'Sales Lead'], 1250),
  ('bbbbbbbb-0002-4000-8000-000000000002', 'aaaaaaaa-0002-4000-8000-000000000002', 'EduLearn', 'Personalized learning platform powered by AI. Making quality education accessible to students across South Asia.', 'Learn smarter, not harder', 'EdTech', 'series-a', 'https://api.dicebear.com/7.x/shapes/svg?seed=edulearn', 'https://edulearn.com', 2000000, 800000, 25, ARRAY['Product Manager', 'ML Engineer'], 2100),
  ('bbbbbbbb-0003-4000-8000-000000000003', 'aaaaaaaa-0003-4000-8000-000000000003', 'HealthBridge', 'Telemedicine platform connecting rural patients with urban doctors. Bridging the healthcare gap in Bangladesh.', 'Healthcare without borders', 'HealthTech', 'seed', 'https://api.dicebear.com/7.x/shapes/svg?seed=healthbridge', 'https://healthbridge.bd', 750000, 200000, 12, ARRAY['Full Stack Developer', 'Operations Manager'], 890),
  ('bbbbbbbb-0004-4000-8000-000000000004', 'aaaaaaaa-0004-4000-8000-000000000004', 'GreenEnergy', 'Solar-powered solutions for rural electrification. Clean energy for communities that need it most.', 'Power the future', 'CleanTech', 'pre-seed', 'https://api.dicebear.com/7.x/shapes/svg?seed=greenenergy', 'https://greenenergy.co', 300000, 50000, 5, ARRAY['Hardware Engineer', 'Sales Representative'], 450),
  ('bbbbbbbb-0005-4000-8000-000000000005', 'aaaaaaaa-0005-4000-8000-000000000005', 'FoodConnect', 'Farm-to-table marketplace reducing food waste. Connecting farmers directly with restaurants and consumers.', 'Fresh from farm to you', 'FoodTech', 'seed', 'https://api.dicebear.com/7.x/shapes/svg?seed=foodconnect', 'https://foodconnect.io', 400000, 120000, 10, ARRAY['Mobile Developer', 'Marketing Manager'], 780),
  ('bbbbbbbb-0006-4000-8000-000000000006', 'aaaaaaaa-0012-4000-8000-000000000012', 'AgriSmart', 'AI-powered crop monitoring and yield prediction. Helping farmers maximize their harvest with data-driven insights.', 'Smart farming for all', 'AgriTech', 'seed', 'https://api.dicebear.com/7.x/shapes/svg?seed=agrismart', 'https://agrismart.bd', 600000, 180000, 7, ARRAY['Data Scientist', 'Field Operations'], 650)
ON CONFLICT (id) DO NOTHING;

-- Insert video pitches
INSERT INTO public.video_pitches (id, user_id, startup_id, title, description, video_url, thumbnail_url, motive, views_count, likes_count, comments_count)
VALUES
  ('cccccccc-0001-4000-8000-000000000001', 'aaaaaaaa-0001-4000-8000-000000000001', 'bbbbbbbb-0001-4000-8000-000000000001', 'TechFlow - Seed Round Pitch', 'We are revolutionizing payments in Bangladesh. Join us on our mission to bank the unbanked.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800', 'investment', 1520, 89, 23),
  ('cccccccc-0002-4000-8000-000000000002', 'aaaaaaaa-0002-4000-8000-000000000002', 'bbbbbbbb-0002-4000-8000-000000000002', 'EduLearn - Series A Pitch', 'Our AI-powered platform has helped 100,000+ students improve their grades. Here is our journey.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800', 'investment', 2340, 156, 45),
  ('cccccccc-0003-4000-8000-000000000003', 'aaaaaaaa-0003-4000-8000-000000000003', 'bbbbbbbb-0003-4000-8000-000000000003', 'HealthBridge - Looking for Co-founder', 'We need a technical co-founder to help scale our telemedicine platform across Bangladesh.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800', 'cofounder', 890, 67, 31),
  ('cccccccc-0004-4000-8000-000000000004', 'aaaaaaaa-0004-4000-8000-000000000004', 'bbbbbbbb-0004-4000-8000-000000000004', 'GreenEnergy - Seeking Mentorship', 'We are early-stage and looking for mentors with hardware and clean energy experience.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800', 'mentorship', 560, 34, 12),
  ('cccccccc-0005-4000-8000-000000000005', 'aaaaaaaa-0005-4000-8000-000000000005', 'bbbbbbbb-0005-4000-8000-000000000005', 'FoodConnect - Impact Story', 'How we reduced food waste by 30% in Dhaka. Our journey of building a sustainable food ecosystem.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800', 'general', 1200, 98, 28),
  ('cccccccc-0006-4000-8000-000000000006', 'aaaaaaaa-0012-4000-8000-000000000012', 'bbbbbbbb-0006-4000-8000-000000000006', 'AgriSmart - Pre-Seed Pitch', 'Using satellite imagery and AI to help farmers. Looking for investors who believe in AgriTech.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800', 'investment', 780, 52, 18)
ON CONFLICT (id) DO NOTHING;

-- Insert posts
INSERT INTO public.posts (id, user_id, content, media_url, category, created_at)
VALUES
  ('dddddddd-0001-4000-8000-000000000001', 'aaaaaaaa-0001-4000-8000-000000000001', '🚀 Excited to announce that TechFlow just closed our seed round! Thanks to all the amazing investors who believed in our vision. The journey to bank the unbanked in Bangladesh begins now! #fintech #startup #funding', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800', 'announcement', now() - interval '2 days'),
  ('dddddddd-0002-4000-8000-000000000002', 'aaaaaaaa-0002-4000-8000-000000000002', 'Just hit 100,000 students on EduLearn! 📚 Every day, I am reminded why we started this journey. Education should be a right, not a privilege. Thank you to our amazing team and community! #edtech #milestone', 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800', 'milestone', now() - interval '1 day'),
  ('dddddddd-0003-4000-8000-000000000003', 'aaaaaaaa-0006-4000-8000-000000000006', 'Looking for ambitious founders in the HealthTech space! 🏥 At Dhaka Ventures, we are opening our next cohort for health-focused startups. DM me if you are building something exciting. #investment #healthtech #vc', NULL, 'opportunity', now() - interval '3 hours'),
  ('dddddddd-0004-4000-8000-000000000004', 'aaaaaaaa-0003-4000-8000-000000000003', 'HealthBridge is hiring! We need passionate developers who want to make a difference in healthcare. Remote-friendly, equity included. Check out our careers page! 💼 #hiring #healthtech #jobs', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800', 'hiring', now() - interval '5 hours'),
  ('dddddddd-0005-4000-8000-000000000005', 'aaaaaaaa-0007-4000-8000-000000000007', 'Founders, here is my #1 advice after investing in 50+ startups: Focus on solving ONE problem really well before expanding. The best companies are built on deep understanding of customer pain points. 💡 #startupadvice #mentorship', NULL, 'advice', now() - interval '8 hours'),
  ('dddddddd-0006-4000-8000-000000000006', 'aaaaaaaa-0005-4000-8000-000000000005', 'We just partnered with 100 restaurants in Dhaka! 🍽️ FoodConnect is reducing food waste one meal at a time. If you run a restaurant, let us talk about how we can help you be more sustainable. #foodtech #sustainability', 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800', 'partnership', now() - interval '12 hours'),
  ('dddddddd-0007-4000-8000-000000000007', 'aaaaaaaa-0009-4000-8000-000000000009', 'Design tip of the day: Your product should feel intuitive on the first use. If users need a tutorial, you have already lost. Simplicity wins every time. 🎨 #design #ux #productdesign', NULL, 'advice', now() - interval '1 day'),
  ('dddddddd-0008-4000-8000-000000000008', 'aaaaaaaa-0010-4000-8000-000000000010', 'Just published a new open-source library for real-time data sync in React! 🔥 Perfect for collaborative apps. Check it out on GitHub and let me know what you think. Link in comments! #opensource #react #engineering', NULL, 'announcement', now() - interval '2 days'),
  ('dddddddd-0009-4000-8000-000000000009', 'aaaaaaaa-0012-4000-8000-000000000012', 'AgriSmart is live in 50 villages! 🌾 Our AI is helping farmers predict crop yields with 85% accuracy. This is just the beginning of smart farming in Bangladesh. #agritech #ai #farming', 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800', 'milestone', now() - interval '3 days'),
  ('dddddddd-0010-4000-8000-000000000010', 'aaaaaaaa-0004-4000-8000-000000000004', 'Installed our first solar panel system in a village school today! 🌞 The kids were so excited to have reliable electricity for their computers. This is why we do what we do. #cleantech #impact #solar', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800', 'milestone', now() - interval '4 days')
ON CONFLICT (id) DO NOTHING;

-- Add some post likes
INSERT INTO public.post_likes (post_id, user_id)
SELECT p.id, u.user_id
FROM public.posts p
CROSS JOIN public.profiles u
WHERE random() < 0.3
ON CONFLICT DO NOTHING;

-- Add some follows between users
INSERT INTO public.follows (follower_id, following_id)
SELECT f.user_id, t.user_id
FROM public.profiles f
CROSS JOIN public.profiles t
WHERE f.user_id != t.user_id AND random() < 0.25
ON CONFLICT DO NOTHING;

-- Add some startup followers
INSERT INTO public.startup_followers (startup_id, user_id)
SELECT s.id, p.user_id
FROM public.startups s
CROSS JOIN public.profiles p
WHERE s.founder_id != p.user_id AND random() < 0.3
ON CONFLICT DO NOTHING;