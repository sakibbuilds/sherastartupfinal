import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Heart, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX,
  Play,
  Send,
  Flag,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import CommentTree, { Comment } from '@/components/pitches/CommentTree';
import ReportPitchDialog from '@/components/pitches/ReportPitchDialog';

interface VideoPitch {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  motive: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
    title: string | null;
  };
  isLiked?: boolean;
}

const ITEMS_PER_PAGE = 5;

const motiveLabels: Record<string, { label: string; color: string }> = {
  investment: { label: 'Raising Investment', color: 'bg-green-500/20 text-green-500' },
  mentorship: { label: 'Seeking Mentorship', color: 'bg-blue-500/20 text-blue-500' },
  cofounder: { label: 'Looking for Co-Founder', color: 'bg-purple-500/20 text-purple-500' },
  investor: { label: 'Investor', color: 'bg-amber-500/20 text-amber-500' },
  networking: { label: 'Networking', color: 'bg-pink-500/20 text-pink-500' },
  general: { label: 'General', color: 'bg-muted text-muted-foreground' },
};

const Pitches = () => {
  const { user } = useAuth();
  const [pitches, setPitches] = useState<VideoPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingPitch, setReportingPitch] = useState<VideoPitch | null>(null);

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const viewTrackedRef = useRef<Set<string>>(new Set());

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

  // Initial fetch
  useEffect(() => {
    fetchPitches(0);
  }, [fetchPitches]);

  // Realtime subscriptions for counts
  useEffect(() => {
    const channel = supabase
      .channel('pitch-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_pitches' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as VideoPitch;
            setPitches(prev => prev.map(p => 
              p.id === updated.id 
                ? { ...p, views_count: updated.views_count, likes_count: updated.likes_count, comments_count: updated.comments_count }
                : p
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'video_pitch_likes' },
        (payload) => {
          const like = payload.new as { video_id: string; user_id: string };
          setPitches(prev => prev.map(p => 
            p.id === like.video_id 
              ? { ...p, likes_count: p.likes_count + 1, isLiked: like.user_id === user?.id ? true : p.isLiked }
              : p
          ));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'video_pitch_likes' },
        (payload) => {
          const like = payload.old as { video_id: string; user_id: string };
          setPitches(prev => prev.map(p => 
            p.id === like.video_id 
              ? { ...p, likes_count: Math.max(0, p.likes_count - 1), isLiked: like.user_id === user?.id ? false : p.isLiked }
              : p
          ));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'video_pitch_comments' },
        (payload) => {
          const comment = payload.new as { video_id: string };
          setPitches(prev => prev.map(p => 
            p.id === comment.video_id 
              ? { ...p, comments_count: p.comments_count + 1 }
              : p
          ));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'video_pitch_comments' },
        (payload) => {
          const comment = payload.old as { video_id: string };
          setPitches(prev => prev.map(p => 
            p.id === comment.video_id 
              ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
              : p
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Track view when video is watched
  useEffect(() => {
    const currentPitch = pitches[currentIndex];
    if (!currentPitch || viewTrackedRef.current.has(currentPitch.id)) return;

    const timer = setTimeout(async () => {
      viewTrackedRef.current.add(currentPitch.id);
      
      await supabase
        .from('video_pitches')
        .update({ views_count: currentPitch.views_count + 1 })
        .eq('id', currentPitch.id);
    }, 3000); // Track view after 3 seconds

    return () => clearTimeout(timer);
  }, [currentIndex, pitches]);

  useEffect(() => {
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

    if (scrollTop + itemHeight * 2 >= container.scrollHeight && hasMore && !loading) {
      setPage(prev => {
        const newPage = prev + 1;
        fetchPitches(newPage, true);
        return newPage;
      });
    }
  }, [currentIndex, pitches.length, hasMore, loading, fetchPitches]);

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
      .order('created_at', { ascending: true });

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

  const handleReport = (pitch: VideoPitch) => {
    setReportingPitch(pitch);
    setReportDialogOpen(true);
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
                poster={pitch.thumbnail_url || undefined}
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
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-white text-lg">{pitch.title}</h3>
                    {pitch.motive && motiveLabels[pitch.motive] && (
                      <Badge className={cn(motiveLabels[pitch.motive].color)}>
                        {motiveLabels[pitch.motive].label}
                      </Badge>
                    )}
                  </div>
                  {pitch.description && (
                    <p className="text-white/80 text-sm line-clamp-2">{pitch.description}</p>
                  )}
                </div>

                {/* Right Side Actions */}
                <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5 pointer-events-auto">
                  {/* Views Count */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white">
                      <Eye className="h-6 w-6" />
                    </div>
                    <span className="text-white text-xs">{pitch.views_count}</span>
                  </div>

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

                  <button
                    className="flex flex-col items-center gap-1"
                    onClick={() => handleReport(pitch)}
                  >
                    <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white hover:text-destructive transition-colors">
                      <Flag className="h-5 w-5" />
                    </div>
                    <span className="text-white text-xs">Report</span>
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
              ) : (
                <CommentTree 
                  comments={comments} 
                  videoId={pitches[currentIndex]?.id || ''} 
                  onCommentAdded={() => {
                    fetchComments(pitches[currentIndex]?.id);
                    setPitches(prev => prev.map((p, i) => 
                      i === currentIndex 
                        ? { ...p, comments_count: p.comments_count + 1 }
                        : p
                    ));
                  }}
                />
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

      {/* Report Dialog */}
      {reportingPitch && (
        <ReportPitchDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          videoId={reportingPitch.id}
          videoTitle={reportingPitch.title}
        />
      )}
    </div>
  );
};

export default Pitches;