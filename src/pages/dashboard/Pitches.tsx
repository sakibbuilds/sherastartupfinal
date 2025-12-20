import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Heart, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX,
  Play,
  Pause,
  Plus,
  X,
  Upload,
  ChevronUp,
  ChevronDown,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDistanceToNow } from 'date-fns';

interface VideoPitch {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
    title: string | null;
  };
  startup?: {
    name: string;
    industry: string | null;
  } | null;
  isLiked?: boolean;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
  };
}

const ITEMS_PER_PAGE = 5;

const Pitches = () => {
  const { user } = useAuth();
  const [pitches, setPitches] = useState<VideoPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const [newPitch, setNewPitch] = useState({
    title: '',
    description: '',
    video: null as File | null
  });

  const fetchPitches = useCallback(async (pageNum: number, append = false) => {
    const { data, error } = await supabase
      .from('video_pitches')
      .select('*')
      .order('created_at', { ascending: false })
      .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

    if (error) {
      console.error('Error fetching pitches:', error);
      return;
    }

    if (data) {
      if (data.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      // Fetch user profiles and likes
      const pitchesWithDetails = await Promise.all(
        data.map(async (pitch) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, title')
            .eq('user_id', pitch.user_id)
            .maybeSingle();

          let isLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('video_pitch_likes')
              .select('id')
              .eq('video_id', pitch.id)
              .eq('user_id', user.id)
              .maybeSingle();
            isLiked = !!likeData;
          }

          return { ...pitch, user: profile, isLiked };
        })
      );

      if (append) {
        setPitches(prev => [...prev, ...pitchesWithDetails]);
      } else {
        setPitches(pitchesWithDetails);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPitches(0);
  }, [fetchPitches]);

  useEffect(() => {
    // Play current video, pause others
    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (video) {
        const pitch = pitches[currentIndex];
        if (pitch && pitch.id === id) {
          if (playing) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentIndex, playing, pitches]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < pitches.length) {
      setCurrentIndex(newIndex);
      setPlaying(true);
    }

    // Load more when near bottom
    if (scrollTop + itemHeight * 2 >= container.scrollHeight && hasMore && !loading) {
      setPage(prev => {
        const newPage = prev + 1;
        fetchPitches(newPage, true);
        return newPage;
      });
    }
  }, [currentIndex, pitches.length, hasMore, loading, fetchPitches]);

  const scrollToIndex = (index: number) => {
    if (!containerRef.current || index < 0 || index >= pitches.length) return;
    
    const itemHeight = containerRef.current.clientHeight;
    containerRef.current.scrollTo({
      top: index * itemHeight,
      behavior: 'smooth'
    });
  };

  const handleLike = async (pitch: VideoPitch) => {
    if (!user) return;

    if (pitch.isLiked) {
      await supabase
        .from('video_pitch_likes')
        .delete()
        .eq('video_id', pitch.id)
        .eq('user_id', user.id);

      setPitches(prev => prev.map(p => 
        p.id === pitch.id 
          ? { ...p, isLiked: false, likes_count: p.likes_count - 1 }
          : p
      ));
    } else {
      await supabase
        .from('video_pitch_likes')
        .insert({ video_id: pitch.id, user_id: user.id });

      setPitches(prev => prev.map(p => 
        p.id === pitch.id 
          ? { ...p, isLiked: true, likes_count: p.likes_count + 1 }
          : p
      ));
    }
  };

  const fetchComments = async (videoId: string) => {
    setLoadingComments(true);
    const { data } = await supabase
      .from('video_pitch_comments')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });

    if (data) {
      const commentsWithUsers = await Promise.all(
        data.map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', comment.user_id)
            .maybeSingle();
          return { ...comment, user: profile };
        })
      );
      setComments(commentsWithUsers);
    }
    setLoadingComments(false);
  };

  const handleOpenComments = (pitch: VideoPitch) => {
    setCommentsOpen(true);
    fetchComments(pitch.id);
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim() || !pitches[currentIndex]) return;

    const { error } = await supabase
      .from('video_pitch_comments')
      .insert({
        video_id: pitches[currentIndex].id,
        user_id: user.id,
        content: newComment.trim()
      });

    if (!error) {
      setNewComment('');
      fetchComments(pitches[currentIndex].id);
      setPitches(prev => prev.map((p, i) => 
        i === currentIndex 
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));
    }
  };

  const handleUpload = async () => {
    if (!user || !newPitch.video || !newPitch.title.trim()) return;

    setUploading(true);

    try {
      const fileExt = newPitch.video.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pitch-videos')
        .upload(fileName, newPitch.video);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pitch-videos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('video_pitches')
        .insert({
          user_id: user.id,
          title: newPitch.title.trim(),
          description: newPitch.description || null,
          video_url: publicUrl
        });

      if (insertError) throw insertError;

      toast({ title: 'Success!', description: 'Your pitch video has been uploaded.' });
      setUploadDialogOpen(false);
      setNewPitch({ title: '', description: '', video: null });
      setPage(0);
      fetchPitches(0);
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Error', description: 'Failed to upload video', variant: 'destructive' });
    }

    setUploading(false);
  };

  const handleShare = async (pitch: VideoPitch) => {
    try {
      await navigator.share({
        title: pitch.title,
        text: pitch.description || 'Check out this pitch!',
        url: window.location.href
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied!', description: 'Share link copied to clipboard.' });
    }
  };

  if (loading && pitches.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] relative bg-black">
      {/* Upload Button */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="absolute top-4 right-4 z-20 rounded-full"
            size="icon"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Pitch Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newPitch.title}
                onChange={(e) => setNewPitch({ ...newPitch, title: e.target.value })}
                placeholder="Give your pitch a catchy title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newPitch.description}
                onChange={(e) => setNewPitch({ ...newPitch, description: e.target.value })}
                placeholder="Tell viewers about your startup..."
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Video *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                {newPitch.video ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate">{newPitch.video.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setNewPitch({ ...newPitch, video: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload video (MP4, WebM, MOV)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Max 100MB</p>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setNewPitch({ ...newPitch, video: file });
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={!newPitch.title.trim() || !newPitch.video || uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload Pitch
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Navigation Arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-black/30 text-white hover:bg-black/50"
          onClick={() => scrollToIndex(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-black/30 text-white hover:bg-black/50"
          onClick={() => scrollToIndex(currentIndex + 1)}
          disabled={currentIndex === pitches.length - 1}
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      </div>

      {/* Video Feed */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {pitches.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white">
            <Play className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No pitches yet</p>
            <p className="text-muted-foreground">Be the first to upload a pitch!</p>
          </div>
        ) : (
          pitches.map((pitch, index) => (
            <div
              key={pitch.id}
              className="h-full w-full snap-start snap-always relative flex items-center justify-center"
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Video */}
              <video
                ref={(el) => { videoRefs.current[pitch.id] = el; }}
                src={pitch.video_url}
                className="h-full w-full object-contain bg-black"
                loop
                muted={muted}
                playsInline
                onClick={() => setPlaying(!playing)}
              />

              {/* Play/Pause Indicator */}
              <AnimatePresence>
                {!playing && index === currentIndex && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
                      <Play className="h-10 w-10 text-white ml-1" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Overlay Content */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-3 mb-3 pointer-events-auto">
                    <Avatar className="h-10 w-10 border-2 border-white">
                      <AvatarImage src={pitch.user?.avatar_url || ''} />
                      <AvatarFallback>{pitch.user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-white">{pitch.user?.full_name || 'Anonymous'}</p>
                      <p className="text-xs text-white/70">{pitch.user?.title || 'Founder'}</p>
                    </div>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-1">{pitch.title}</h3>
                  {pitch.description && (
                    <p className="text-white/80 text-sm line-clamp-2">{pitch.description}</p>
                  )}
                </div>

                {/* Right Side Actions */}
                <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 pointer-events-auto">
                  <button
                    className="flex flex-col items-center gap-1"
                    onClick={() => handleLike(pitch)}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full bg-black/30 flex items-center justify-center",
                      pitch.isLiked && "text-red-500"
                    )}>
                      <Heart className={cn("h-6 w-6", pitch.isLiked && "fill-current")} />
                    </div>
                    <span className="text-white text-xs">{pitch.likes_count}</span>
                  </button>

                  <button
                    className="flex flex-col items-center gap-1"
                    onClick={() => handleOpenComments(pitch)}
                  >
                    <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <span className="text-white text-xs">{pitch.comments_count}</span>
                  </button>

                  <button
                    className="flex flex-col items-center gap-1"
                    onClick={() => handleShare(pitch)}
                  >
                    <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white">
                      <Share2 className="h-6 w-6" />
                    </div>
                    <span className="text-white text-xs">Share</span>
                  </button>

                  <button
                    className="flex flex-col items-center gap-1"
                    onClick={() => setMuted(!muted)}
                  >
                    <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white">
                      {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading More Indicator */}
        {hasMore && pitches.length > 0 && (
          <div className="h-20 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Comments Sheet */}
      <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Comments ({pitches[currentIndex]?.comments_count || 0})</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-[calc(100%-4rem)]">
            <ScrollArea className="flex-1 py-4">
              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No comments yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user?.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {comment.user?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.user?.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="flex gap-2 pt-4 border-t">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Pitches;