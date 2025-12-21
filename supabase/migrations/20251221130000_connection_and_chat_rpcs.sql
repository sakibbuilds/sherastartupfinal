-- Function to safely send a connection request
CREATE OR REPLACE FUNCTION public.send_connection_request(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  existing_match RECORD;
  new_match_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if match already exists
  SELECT * INTO existing_match 
  FROM matches 
  WHERE (user_id = current_user_id AND matched_user_id = target_user_id)
     OR (user_id = target_user_id AND matched_user_id = current_user_id);
     
  IF FOUND THEN
    RETURN jsonb_build_object(
      'status', 'exists',
      'match_status', existing_match.status,
      'message', CASE 
        WHEN existing_match.status = 'accepted' THEN 'You are already connected.'
        WHEN existing_match.status = 'pending' THEN 'Connection request already sent.'
        WHEN existing_match.status = 'rejected' THEN 'Connection request was previously rejected.'
        ELSE 'Connection status: ' || existing_match.status
      END
    );
  END IF;

  -- Create new match request
  INSERT INTO matches (user_id, matched_user_id, status)
  VALUES (current_user_id, target_user_id, 'pending')
  RETURNING id INTO new_match_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'id', new_match_id,
    'message', 'Connection request sent successfully.'
  );
END;
$$;

-- Function to get conversation details by ID (bypassing RLS for participants)
CREATE OR REPLACE FUNCTION public.get_conversation_details(target_conversation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_record RECORD;
  participants_list JSONB;
  current_user_id UUID;
  is_participant BOOLEAN;
BEGIN
  current_user_id := auth.uid();

  -- Check if conversation exists
  SELECT * INTO conv_record FROM conversations WHERE id = target_conversation_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Check if current user is a participant
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = target_conversation_id AND user_id = current_user_id
  ) INTO is_participant;

  IF NOT is_participant THEN
    RETURN NULL; -- Deny access if not a participant
  END IF;

  -- Get participants with profile details
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', cp.user_id,
      'profiles', jsonb_build_object(
        'full_name', p.full_name,
        'avatar_url', p.avatar_url
      )
    )
  )
  INTO participants_list
  FROM conversation_participants cp
  LEFT JOIN profiles p ON cp.user_id = p.user_id
  WHERE cp.conversation_id = target_conversation_id;

  RETURN jsonb_build_object(
    'id', conv_record.id,
    'updated_at', conv_record.updated_at,
    'participants', participants_list
  );
END;
$$;
