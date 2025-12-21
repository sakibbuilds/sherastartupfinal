create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  target_id uuid not null, -- can be post_id, user_id, etc.
  target_type text not null, -- 'post', 'user', 'comment'
  reason text not null,
  status text default 'pending', -- 'pending', 'resolved', 'dismissed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS policies
alter table public.reports enable row level security;

create policy "Users can insert their own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
      and profiles.user_type = 'admin'
    )
  );

create policy "Admins can update reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
      and profiles.user_type = 'admin'
    )
  );
