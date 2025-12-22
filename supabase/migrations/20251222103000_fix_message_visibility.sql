-- Allow users to always see messages they sent, regardless of participant status lookup latency
-- This ensures optimistic UI updates that rely on 'RETURNING' clauses always work
CREATE POLICY "Users can view own sent messages" ON public.messages 
FOR SELECT USING (auth.uid() = sender_id);