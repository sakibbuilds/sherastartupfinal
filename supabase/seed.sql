-- Enable pgcrypto for password hashing
create extension if not exists "pgcrypto";

-- Create a function to generate random users if it doesn't exist
create or replace function create_demo_users()
returns void as $$
declare
  i integer;
  new_user_id uuid;
  user_type_val text;
  full_name_val text;
  title_val text;
  is_verified boolean;
  is_mentor_val boolean;
  avatar_url_val text;
  company_name text;
  user_email text;
begin
  for i in 1..20 loop
    -- Determine user type based on index to ensure variety
    if i <= 10 then
      user_type_val := 'founder';
      title_val := 'Founder & CEO';
      is_mentor_val := false;
    elsif i <= 15 then
      user_type_val := 'investor';
      title_val := 'Angel Investor';
      is_mentor_val := true; -- Investors can be mentors
    else
      user_type_val := 'member'; -- Some regular members who are just mentors
      title_val := 'Senior Product Designer';
      is_mentor_val := true;
    end if;

    -- Generate random verified status (70% chance)
    is_verified := (random() < 0.7);
    
    -- Generate fake user ID
    new_user_id := gen_random_uuid();
    
    -- Generate fake names
    full_name_val := 'User ' || i;
    
    -- Generate unique email
    user_email := 'user_' || floor(random() * 100000)::text || '_' || i || '@example.com';

    -- Insert into auth.users first (Required for foreign key constraint)
    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) values (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      user_email,
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now()
    );

    -- Insert into public.profiles
    -- We use ON CONFLICT because some Supabase setups have a trigger that automatically
    -- creates a profile when auth.users is inserted.
    insert into public.profiles (
      user_id,
      full_name,
      avatar_url,
      user_type,
      title,
      bio,
      verified,
      is_mentor,
      onboarding_completed,
      university,
      expertise
    ) values (
      new_user_id,
      case 
        when i = 1 then 'Sarah Chen'
        when i = 2 then 'Michael Ross'
        when i = 3 then 'Jessica Pearson'
        when i = 4 then 'David Kim'
        when i = 5 then 'Emily Blunt'
        when i = 6 then 'James Wilson'
        when i = 7 then 'Linda Chang'
        when i = 8 then 'Robert Ford'
        when i = 9 then 'Patricia Lee'
        when i = 10 then 'Thomas Anderson'
        when i = 11 then 'Jennifer Lawrence'
        when i = 12 then 'Chris Pratt'
        when i = 13 then 'Scarlett Johansson'
        when i = 14 then 'Robert Downey Jr.'
        when i = 15 then 'Chris Evans'
        when i = 16 then 'Mark Ruffalo'
        when i = 17 then 'Chris Hemsworth'
        when i = 18 then 'Jeremy Renner'
        when i = 19 then 'Tom Hiddleston'
        else 'Elizabeth Olsen'
      end,
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || i,
      user_type_val,
      title_val,
      'Passionate about technology and innovation. Building the future of ' || case when i % 2 = 0 then 'fintech.' else 'healthtech.' end,
      is_verified,
      is_mentor_val,
      true,
      'Stanford University',
      ARRAY['Marketing', 'Product', 'Sales']
    )
    on conflict (user_id) do update set
      full_name = excluded.full_name,
      avatar_url = excluded.avatar_url,
      user_type = excluded.user_type,
      title = excluded.title,
      bio = excluded.bio,
      verified = excluded.verified,
      is_mentor = excluded.is_mentor,
      onboarding_completed = excluded.onboarding_completed,
      university = excluded.university,
      expertise = excluded.expertise;

    -- If founder, create a startup
    if user_type_val = 'founder' then
      company_name := 'Startup ' || i;
      insert into public.startups (
        founder_id,
        name,
        description,
        industry,
        stage,
        logo_url
      ) values (
        new_user_id,
        company_name,
        'Revolutionizing the industry with AI-driven solutions.',
        'Technology',
        'early',
        'https://api.dicebear.com/7.x/shapes/svg?seed=' || i
      );
    end if;

    -- Create some posts
    insert into public.posts (
      user_id,
      content,
      media_url,
      created_at
    ) values (
      new_user_id,
      case 
        when i % 3 = 0 then 'Just closed our seed round! Huge thanks to everyone who supported us. 🚀 #startup #funding'
        when i % 3 = 1 then 'Looking for a co-founder with strong technical skills. DM me if interested! 💻 #hiring #cofounder'
        else 'Excited to announce our new product launch next week. Stay tuned! 🔥 #launch #product'
      end,
      case 
        when i % 2 = 0 then 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        else null
      end,
      now() - (i || ' days')::interval
    );

    -- Create pitch video (if founder)
    if user_type_val = 'founder' then
      insert into public.video_pitches (
        user_id,
        title,
        description,
        video_url,
        thumbnail_url,
        views_count
      ) values (
        new_user_id,
        'Pitch for ' || company_name,
        'Our vision for the future of ' || company_name || '. We are solving big problems.',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', -- Placeholder video
        'https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        floor(random() * 1000 + 100)
      );
    end if;

  end loop;
end;
$$ language plpgsql;

-- Execute the function
select create_demo_users();
