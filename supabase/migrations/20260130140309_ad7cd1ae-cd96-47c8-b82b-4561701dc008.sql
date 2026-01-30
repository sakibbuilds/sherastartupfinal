-- Allow users to update messages they sent (for editing)
CREATE POLICY "Users can update their own messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- Allow users to mark messages as read in their conversations
CREATE POLICY "Users can mark messages as read" 
ON public.messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
  AND sender_id != auth.uid()
);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = sender_id);