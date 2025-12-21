create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  actor_id uuid references auth.users not null,
  type text not null, -- 'mention', 'like', 'comment', 'follow'
  resource_id uuid not null,
  resource_type text not null, -- 'post', 'comment', 'user'
  content text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS policies
alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Anyone can insert notifications (system or other users triggering them)
create policy "Anyone can insert notifications"
  on public.notifications for insert
  with check (true);
