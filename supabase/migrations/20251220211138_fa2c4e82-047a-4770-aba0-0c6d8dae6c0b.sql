-- Enable realtime for notifications (replica identity only, already in publication)
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Create function to send notification when someone likes a video
CREATE OR REPLACE FUNCTION public.notify_video_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  video_owner_id uuid;
  video_title text;
  liker_name text;
BEGIN
  -- Get video owner and title
  SELECT user_id, title INTO video_owner_id, video_title
  FROM public.video_pitches
  WHERE id = NEW.video_id;

  -- Don't notify if user liked their own video
  IF video_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get liker's name
  SELECT full_name INTO liker_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
  VALUES (
    video_owner_id,
    'like',
    'New like on your pitch',
    COALESCE(liker_name, 'Someone') || ' liked your pitch "' || COALESCE(video_title, 'Untitled') || '"',
    NEW.video_id,
    'video_pitch'
  );

  RETURN NEW;
END;
$$;

-- Create function to send notification when someone comments on a video
CREATE OR REPLACE FUNCTION public.notify_video_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  video_owner_id uuid;
  video_title text;
  commenter_name text;
  parent_comment_user_id uuid;
BEGIN
  -- Get video owner and title
  SELECT user_id, title INTO video_owner_id, video_title
  FROM public.video_pitches
  WHERE id = NEW.video_id;

  -- Get commenter's name
  SELECT full_name INTO commenter_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- If this is a reply, notify the parent comment author
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO parent_comment_user_id
    FROM public.video_pitch_comments
    WHERE id = NEW.parent_id;

    -- Don't notify if replying to own comment
    IF parent_comment_user_id IS NOT NULL AND parent_comment_user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
      VALUES (
        parent_comment_user_id,
        'comment',
        'New reply to your comment',
        COALESCE(commenter_name, 'Someone') || ' replied: "' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END || '"',
        NEW.video_id,
        'video_pitch'
      );
    END IF;
  END IF;

  -- Notify video owner (if not commenting on own video and not already notified as parent comment author)
  IF video_owner_id != NEW.user_id AND (parent_comment_user_id IS NULL OR parent_comment_user_id != video_owner_id) THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      video_owner_id,
      'comment',
      'New comment on your pitch',
      COALESCE(commenter_name, 'Someone') || ' commented on "' || COALESCE(video_title, 'Untitled') || '": "' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END || '"',
      NEW.video_id,
      'video_pitch'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS notify_video_like_trigger ON public.video_pitch_likes;
CREATE TRIGGER notify_video_like_trigger
AFTER INSERT ON public.video_pitch_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_video_like();

DROP TRIGGER IF EXISTS notify_video_comment_trigger ON public.video_pitch_comments;
CREATE TRIGGER notify_video_comment_trigger
AFTER INSERT ON public.video_pitch_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_video_comment();