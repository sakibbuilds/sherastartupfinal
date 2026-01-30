-- Drop the old restrictive RLS policy
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversation_participants;

-- Create new policy that allows users to view ALL participants in conversations they're part of
CREATE POLICY "Users can view participants in their conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);