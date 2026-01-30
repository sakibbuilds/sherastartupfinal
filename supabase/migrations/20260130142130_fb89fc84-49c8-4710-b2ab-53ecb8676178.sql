-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON public.conversation_participants;

-- Create a security definer function to check conversation membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id AND user_id = check_user_id
  );
$$;

-- Simple SELECT policy: users can see their own participant records
CREATE POLICY "Users can view their own participation" 
ON public.conversation_participants 
FOR SELECT 
USING (auth.uid() = user_id);

-- Additional SELECT policy: users can see other participants in their conversations
CREATE POLICY "Users can view co-participants" 
ON public.conversation_participants 
FOR SELECT 
USING (public.is_conversation_member(conversation_id, auth.uid()));

-- INSERT policy: allow adding self, or adding others to conversations you're in, or creating new conversations
CREATE POLICY "Users can add participants" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR public.is_conversation_member(conversation_id, auth.uid())
);