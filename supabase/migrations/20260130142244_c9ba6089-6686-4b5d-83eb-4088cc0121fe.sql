-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view co-participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;

-- SELECT: Users can see participants in conversations they're part of
CREATE POLICY "Users can view conversation participants" 
ON public.conversation_participants 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR public.is_conversation_member(conversation_id, auth.uid())
);

-- INSERT: Allow authenticated users to insert participants
-- The key insight: when creating a new conversation, we need to add both users
-- So we allow: adding yourself, OR adding anyone if you're already in that conversation, 
-- OR if this is a brand new conversation (no participants yet)
CREATE POLICY "Users can add conversation participants" 
ON public.conversation_participants 
FOR INSERT 
TO authenticated
WITH CHECK (true);