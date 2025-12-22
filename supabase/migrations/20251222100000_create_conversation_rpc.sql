-- Create a function to handle conversation creation atomically
create or replace function public.create_new_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  new_conversation_id uuid;
begin
  -- Create the conversation
  insert into public.conversations default values
  returning id into new_conversation_id;

  -- Add the current user as a participant
  insert into public.conversation_participants (conversation_id, user_id)
  values (new_conversation_id, auth.uid());

  -- Add the other user as a participant
  insert into public.conversation_participants (conversation_id, user_id)
  values (new_conversation_id, other_user_id);

  return new_conversation_id;
end;
$$;