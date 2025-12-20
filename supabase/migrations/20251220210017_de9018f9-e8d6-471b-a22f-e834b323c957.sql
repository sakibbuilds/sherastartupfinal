-- Create function to update likes count on video_pitches
CREATE OR REPLACE FUNCTION public.update_video_pitch_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.video_pitches 
    SET likes_count = COALESCE(likes_count, 0) + 1 
    WHERE id = NEW.video_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.video_pitches 
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) 
    WHERE id = OLD.video_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create function to update comments count on video_pitches
CREATE OR REPLACE FUNCTION public.update_video_pitch_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.video_pitches 
    SET comments_count = COALESCE(comments_count, 0) + 1 
    WHERE id = NEW.video_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.video_pitches 
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) 
    WHERE id = OLD.video_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for likes count
DROP TRIGGER IF EXISTS update_video_pitch_likes_count_trigger ON public.video_pitch_likes;
CREATE TRIGGER update_video_pitch_likes_count_trigger
AFTER INSERT OR DELETE ON public.video_pitch_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_video_pitch_likes_count();

-- Create trigger for comments count
DROP TRIGGER IF EXISTS update_video_pitch_comments_count_trigger ON public.video_pitch_comments;
CREATE TRIGGER update_video_pitch_comments_count_trigger
AFTER INSERT OR DELETE ON public.video_pitch_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_video_pitch_comments_count();