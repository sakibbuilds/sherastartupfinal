-- Clean up orphaned conversations (no participants)
DELETE FROM conversations 
WHERE id NOT IN (SELECT DISTINCT conversation_id FROM conversation_participants);

-- Clean up duplicate conversations between the same users
-- Keep only the most recent conversation for each pair
WITH ranked_conversations AS (
  SELECT 
    c.id,
    c.created_at,
    (
      SELECT array_agg(cp.user_id ORDER BY cp.user_id) 
      FROM conversation_participants cp 
      WHERE cp.conversation_id = c.id
    ) as sorted_participants,
    ROW_NUMBER() OVER (
      PARTITION BY (
        SELECT array_agg(cp.user_id ORDER BY cp.user_id) 
        FROM conversation_participants cp 
        WHERE cp.conversation_id = c.id
      )
      ORDER BY c.created_at DESC
    ) as rn
  FROM conversations c
  WHERE EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = c.id)
)
DELETE FROM conversations
WHERE id IN (
  SELECT id FROM ranked_conversations WHERE rn > 1
);