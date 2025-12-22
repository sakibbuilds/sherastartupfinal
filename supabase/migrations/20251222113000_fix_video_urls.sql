-- Fix invalid video URLs in video_pitches
UPDATE public.video_pitches
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
WHERE video_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';