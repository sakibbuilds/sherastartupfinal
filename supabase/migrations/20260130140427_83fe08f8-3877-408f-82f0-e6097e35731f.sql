-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;

-- Create a new policy that allows users to add participants to conversations they're part of
-- This allows creating a conversation with another user
CREATE POLICY "Users can add participants to their conversations" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (
  -- User can add themselves
  auth.uid() = user_id
  OR
  -- Or user is already a participant in this conversation (for adding the other person)
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
  OR
  -- Or this is a new conversation being created (no participants yet)
  NOT EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
  )
);