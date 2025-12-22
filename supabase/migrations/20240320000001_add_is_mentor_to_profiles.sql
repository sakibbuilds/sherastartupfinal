-- Add is_mentor column to profiles table if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_mentor') then
    alter table public.profiles add column is_mentor boolean default false;
  end if;
end $$;
