-- Ensure users can ALWAYS see their own participant rows
-- This is critical for fetching the list of conversations a user belongs to
CREATE POLICY "Users can view own participant rows" 
ON public.conversation_participants 
FOR SELECT 
USING (user_id = auth.uid());

-- Ensure users can view conversations they are part of (redundant but safe backup)
CREATE POLICY "Users can view conversations they participate in" 
ON public.conversations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = id 
    AND user_id = auth.uid()
  )
);