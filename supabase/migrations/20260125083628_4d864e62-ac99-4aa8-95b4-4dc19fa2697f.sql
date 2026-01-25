-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable realtime for messages table  
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for video_pitches table
ALTER PUBLICATION supabase_realtime ADD TABLE video_pitches;

-- Enable realtime for video_pitch_comments table
ALTER PUBLICATION supabase_realtime ADD TABLE video_pitch_comments;

-- Enable realtime for video_pitch_likes table
ALTER PUBLICATION supabase_realtime ADD TABLE video_pitch_likes;

-- Enable realtime for posts table
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- Enable realtime for post_likes table
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;

-- Enable realtime for comments table
ALTER PUBLICATION supabase_realtime ADD TABLE comments;