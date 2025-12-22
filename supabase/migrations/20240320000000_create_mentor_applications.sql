-- Create mentor_applications table
create table if not exists public.mentor_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  expertise text[] not null,
  capabilities text not null,
  cv_url text not null,
  demo_video_url text not null,
  website text,
  portfolio_url text not null,
  case_style text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.mentor_applications enable row level security;

-- Create policies
create policy "Users can view their own applications"
  on public.mentor_applications for select
  using (auth.uid() = user_id);

create policy "Users can insert their own applications"
  on public.mentor_applications for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all applications"
  on public.mentor_applications for select
  using (public.is_admin());

create policy "Admins can update applications"
  on public.mentor_applications for update
  using (public.is_admin());

-- Create function to check if user is admin (if not exists)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where user_id = auth.uid()
    and user_type = 'admin'
  );
end;
$$ language plpgsql security definer;
