-- Allow users to update their own sent match requests (e.g. to resend after rejection or cancellation)
CREATE POLICY "Users can update own matches" ON public.matches FOR UPDATE USING (auth.uid() = user_id);

-- Function to create a conversation and add participants atomically
-- This bypasses RLS issues where a user creates a conversation but can't see it yet
CREATE OR REPLACE FUNCTION public.create_new_conversation(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_conv_id UUID;
BEGIN
  -- Check if conversation already exists (optional, but good practice)
  -- For now, we rely on the frontend to check, but we could add logic here.
  -- We'll just create a new one as requested.

  -- Create conversation
  INSERT INTO conversations (created_at, updated_at)
  VALUES (now(), now())
  RETURNING id INTO new_conv_id;

  -- Add participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES
    (new_conv_id, auth.uid()),
    (new_conv_id, other_user_id);

  RETURN new_conv_id;
END;
$$;
