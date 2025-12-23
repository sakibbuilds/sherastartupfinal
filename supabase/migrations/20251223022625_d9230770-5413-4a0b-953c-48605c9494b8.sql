-- Add edited_at column to messages for tracking edits
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone DEFAULT NULL;

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Enable realtime for messages updates (for edit/delete sync)
ALTER TABLE public.messages REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;